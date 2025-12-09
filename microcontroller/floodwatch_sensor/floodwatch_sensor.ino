/*
 * FloodWatch ESP32 Water Level Sensor
 * Version: 1.0.0
 *
 * A BLE-enabled water level monitoring system using ESP32 and ultrasonic sensors.
 * Connects to the FloodWatch PWA for real-time flood monitoring.
 *
 * Hardware Requirements:
 * - ESP32 DevKit V1 (or compatible: ESP32-WROOM, ESP32-S3, etc.)
 * - JSN-SR04T Waterproof Ultrasonic Sensor (recommended) or HC-SR04
 * - Optional: 3.7V LiPo Battery + TP4056 charging module
 * - Optional: DS18B20 waterproof temperature sensor
 * - Optional: BME280 for atmospheric pressure (flood prediction)
 *
 * Wiring (Default Pins):
 * ┌─────────────────────────────────────────────────────────┐
 * │  ESP32          Ultrasonic       Battery    Temp Sensor │
 * │  ------         ----------       -------    ----------- │
 * │  GPIO 5   ───── TRIG                                    │
 * │  GPIO 18  ───── ECHO                                    │
 * │  GPIO 34  ─────────────────────  V+ (via divider)       │
 * │  GPIO 4   ─────────────────────────────────  DATA       │
 * │  3.3V     ───── VCC              VCC         VCC        │
 * │  GND      ───── GND              GND         GND        │
 * └─────────────────────────────────────────────────────────┘
 *
 * Author: Nathan G
 * License: MIT
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Preferences.h>

// ============================================================================
// CONFIGURATION - Modify these values for your setup
// ============================================================================

// Device identification
#define DEVICE_NAME "FloodWatch-001"    // Change for multiple sensors
#define FIRMWARE_VERSION "1.0.0"

// Pin assignments
#define TRIG_PIN 5                      // Ultrasonic trigger pin
#define ECHO_PIN 18                     // Ultrasonic echo pin
#define BATTERY_PIN 34                  // ADC pin for battery monitoring
#define TEMP_PIN 4                      // OneWire temperature sensor (optional)
#define LED_PIN 2                       // Built-in LED for status

// Sensor configuration
#define SENSOR_HEIGHT_CM 200.0          // Height of sensor above ground/riverbed
#define MIN_DISTANCE_CM 20.0            // Minimum valid distance reading
#define MAX_DISTANCE_CM 400.0           // Maximum valid distance reading
#define READINGS_FOR_AVERAGE 10         // Number of readings to average
#define OUTLIER_THRESHOLD 10.0          // Reject readings this far from median (cm)

// Timing configuration
#define MEASUREMENT_INTERVAL_MS 1000    // How often to take measurements
#define BLE_UPDATE_INTERVAL_MS 1000     // How often to send BLE updates
#define DEEP_SLEEP_INTERVAL_US 300000000 // 5 minutes in microseconds (battery mode)
#define BATTERY_CHECK_INTERVAL_MS 60000 // Check battery every minute

// Battery configuration
#define BATTERY_MIN_V 3.0               // Empty battery voltage
#define BATTERY_MAX_V 4.2               // Full battery voltage
#define LOW_BATTERY_THRESHOLD 20        // Warn at this percentage

// Alert thresholds (in cm)
#define ALERT_LEVEL_WATCH 50.0          // Yellow alert
#define ALERT_LEVEL_WARNING 100.0       // Orange alert
#define ALERT_LEVEL_CRITICAL 150.0      // Red alert
#define RAPID_RISE_THRESHOLD 5.0        // cm/hour considered rapid rise

// BLE UUIDs - Must match web app configuration
#define SERVICE_UUID        "12345678-1234-5678-1234-56789abcdef0"
#define WATER_LEVEL_UUID    "12345678-1234-5678-1234-56789abcdef1"
#define RISE_RATE_UUID      "12345678-1234-5678-1234-56789abcdef2"
#define BATTERY_UUID        "12345678-1234-5678-1234-56789abcdef3"
#define STATUS_UUID         "12345678-1234-5678-1234-56789abcdef4"

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

// BLE objects
BLEServer* pServer = NULL;
BLECharacteristic* pWaterLevelChar = NULL;
BLECharacteristic* pRiseRateChar = NULL;
BLECharacteristic* pBatteryChar = NULL;
BLECharacteristic* pStatusChar = NULL;

// Connection state
bool deviceConnected = false;
bool oldDeviceConnected = false;
uint32_t connectionCount = 0;

// Measurement data
float readings[READINGS_FOR_AVERAGE];
int readIndex = 0;
bool readingsInitialized = false;

float currentWaterLevel = 0;
float lastWaterLevel = 0;
float riseRate = 0;                     // cm per hour
float maxWaterLevel = 0;                // Peak level since boot
float minWaterLevel = 999;              // Minimum level since boot

// Battery monitoring
float batteryVoltage = 0;
float batteryPercent = 100.0;
bool lowBatteryWarning = false;

// Timing
unsigned long lastMeasurementTime = 0;
unsigned long lastBLEUpdateTime = 0;
unsigned long lastBatteryCheckTime = 0;
unsigned long bootTime = 0;

// Status
enum SensorStatus {
  STATUS_OK,
  STATUS_INITIALIZING,
  STATUS_NO_ECHO,
  STATUS_OUT_OF_RANGE,
  STATUS_LOW_BATTERY,
  STATUS_ERROR
};
SensorStatus currentStatus = STATUS_INITIALIZING;

// Preferences for persistent storage
Preferences preferences;

// ============================================================================
// BLE CALLBACKS
// ============================================================================

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    connectionCount++;
    Serial.println(">>> Client connected");
    blinkLED(3, 100);  // Quick triple blink on connect
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("<<< Client disconnected");
    blinkLED(1, 500);  // Long single blink on disconnect
  }
};

// ============================================================================
// SETUP
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(100);

  printBanner();

  // Initialize pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BATTERY_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);

  // Initial LED state
  digitalWrite(LED_PIN, HIGH);

  // Initialize readings array
  for (int i = 0; i < READINGS_FOR_AVERAGE; i++) {
    readings[i] = 0;
  }

  // Load saved preferences
  loadPreferences();

  // Initialize BLE
  initBLE();

  // Record boot time
  bootTime = millis();

  // Take initial readings
  Serial.println("Taking initial readings...");
  for (int i = 0; i < READINGS_FOR_AVERAGE; i++) {
    float dist = measureDistance();
    if (dist > 0) {
      readings[i] = SENSOR_HEIGHT_CM - dist;
    }
    delay(100);
  }
  readingsInitialized = true;

  // Update initial water level
  currentWaterLevel = calculateFilteredWaterLevel();
  lastWaterLevel = currentWaterLevel;

  currentStatus = STATUS_OK;
  digitalWrite(LED_PIN, LOW);

  Serial.println("=== Sensor Ready ===");
  Serial.println();
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  unsigned long currentMillis = millis();

  // Take measurements at regular intervals
  if (currentMillis - lastMeasurementTime >= MEASUREMENT_INTERVAL_MS) {
    lastMeasurementTime = currentMillis;

    // Measure distance and calculate water level
    float distance = measureDistance();

    if (distance > 0) {
      // Update readings array with new value
      float newLevel = SENSOR_HEIGHT_CM - distance;
      readings[readIndex] = newLevel;
      readIndex = (readIndex + 1) % READINGS_FOR_AVERAGE;

      // Calculate filtered water level
      currentWaterLevel = calculateFilteredWaterLevel();

      // Update min/max
      if (currentWaterLevel > maxWaterLevel) maxWaterLevel = currentWaterLevel;
      if (currentWaterLevel < minWaterLevel) minWaterLevel = currentWaterLevel;

      // Calculate rise rate
      calculateRiseRate();

      currentStatus = STATUS_OK;
    } else {
      currentStatus = (distance == -1) ? STATUS_NO_ECHO : STATUS_OUT_OF_RANGE;
    }
  }

  // Check battery periodically
  if (currentMillis - lastBatteryCheckTime >= BATTERY_CHECK_INTERVAL_MS) {
    lastBatteryCheckTime = currentMillis;
    updateBatteryLevel();

    if (batteryPercent < LOW_BATTERY_THRESHOLD) {
      currentStatus = STATUS_LOW_BATTERY;
      lowBatteryWarning = true;
    }
  }

  // Send BLE updates
  if (deviceConnected && (currentMillis - lastBLEUpdateTime >= BLE_UPDATE_INTERVAL_MS)) {
    lastBLEUpdateTime = currentMillis;
    sendBLEData();
  }

  // Handle BLE connection state changes
  handleBLEStateChange();

  // Print debug info every 5 seconds
  static unsigned long lastDebugPrint = 0;
  if (currentMillis - lastDebugPrint >= 5000) {
    lastDebugPrint = currentMillis;
    printDebugInfo();
  }

  // Status LED indication
  updateStatusLED();
}

// ============================================================================
// MEASUREMENT FUNCTIONS
// ============================================================================

float measureDistance() {
  // Send ultrasonic pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure echo duration with timeout
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);  // 30ms timeout (~5m range)

  if (duration == 0) {
    return -1;  // No echo received
  }

  // Calculate distance in cm
  // Speed of sound = 343 m/s at 20°C = 0.0343 cm/µs
  // Distance = duration * speed / 2 (round trip)
  float distance = duration * 0.0343 / 2.0;

  // Validate reading
  if (distance < MIN_DISTANCE_CM || distance > MAX_DISTANCE_CM) {
    return -2;  // Out of range
  }

  return distance;
}

float calculateFilteredWaterLevel() {
  if (!readingsInitialized) return 0;

  // Copy readings for sorting
  float sorted[READINGS_FOR_AVERAGE];
  for (int i = 0; i < READINGS_FOR_AVERAGE; i++) {
    sorted[i] = readings[i];
  }

  // Simple bubble sort for median calculation
  for (int i = 0; i < READINGS_FOR_AVERAGE - 1; i++) {
    for (int j = 0; j < READINGS_FOR_AVERAGE - i - 1; j++) {
      if (sorted[j] > sorted[j + 1]) {
        float temp = sorted[j];
        sorted[j] = sorted[j + 1];
        sorted[j + 1] = temp;
      }
    }
  }

  // Get median
  float median = sorted[READINGS_FOR_AVERAGE / 2];

  // Calculate average excluding outliers
  float sum = 0;
  int count = 0;
  for (int i = 0; i < READINGS_FOR_AVERAGE; i++) {
    if (abs(readings[i] - median) <= OUTLIER_THRESHOLD) {
      sum += readings[i];
      count++;
    }
  }

  return (count > 0) ? sum / count : median;
}

void calculateRiseRate() {
  static unsigned long lastRateCalcTime = 0;
  static float lastRateLevel = 0;

  unsigned long currentTime = millis();
  unsigned long timeDiff = currentTime - lastRateCalcTime;

  // Calculate rate every 10 seconds for stability
  if (timeDiff >= 10000) {
    if (lastRateCalcTime > 0) {
      float levelDiff = currentWaterLevel - lastRateLevel;
      // Convert to cm per hour: (cm / ms) * 3600000 ms/hr
      riseRate = (levelDiff / timeDiff) * 3600000.0;
    }

    lastRateCalcTime = currentTime;
    lastRateLevel = currentWaterLevel;
  }
}

// ============================================================================
// BATTERY FUNCTIONS
// ============================================================================

void updateBatteryLevel() {
  // Read ADC value (12-bit: 0-4095)
  int rawValue = analogRead(BATTERY_PIN);

  // ESP32 ADC with voltage divider (2x 10k resistors)
  // Actual voltage = (rawValue / 4095) * 3.3V * 2
  batteryVoltage = (rawValue / 4095.0) * 3.3 * 2.0;

  // Calculate percentage
  batteryPercent = ((batteryVoltage - BATTERY_MIN_V) / (BATTERY_MAX_V - BATTERY_MIN_V)) * 100.0;
  batteryPercent = constrain(batteryPercent, 0, 100);
}

// ============================================================================
// BLE FUNCTIONS
// ============================================================================

void initBLE() {
  Serial.println("Initializing BLE...");

  BLEDevice::init(DEVICE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  // Create service
  BLEService* pService = pServer->createService(SERVICE_UUID);

  // Water level characteristic (notifiable)
  pWaterLevelChar = pService->createCharacteristic(
    WATER_LEVEL_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pWaterLevelChar->addDescriptor(new BLE2902());

  // Rise rate characteristic (notifiable)
  pRiseRateChar = pService->createCharacteristic(
    RISE_RATE_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pRiseRateChar->addDescriptor(new BLE2902());

  // Battery characteristic (notifiable)
  pBatteryChar = pService->createCharacteristic(
    BATTERY_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pBatteryChar->addDescriptor(new BLE2902());

  // Status characteristic (read only)
  pStatusChar = pService->createCharacteristic(
    STATUS_UUID,
    BLECharacteristic::PROPERTY_READ
  );

  // Start service
  pService->start();

  // Start advertising
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("BLE advertising started");
  Serial.print("Device name: ");
  Serial.println(DEVICE_NAME);
}

void sendBLEData() {
  // Pack water level data: level (float) + rise rate (float) = 8 bytes
  uint8_t levelData[8];
  float levelCm = currentWaterLevel;  // Already in cm
  memcpy(levelData, &levelCm, 4);
  memcpy(levelData + 4, &riseRate, 4);
  pWaterLevelChar->setValue(levelData, 8);
  pWaterLevelChar->notify();

  // Send rise rate separately
  uint8_t rateData[4];
  memcpy(rateData, &riseRate, 4);
  pRiseRateChar->setValue(rateData, 4);
  pRiseRateChar->notify();

  // Send battery level (0-100)
  uint8_t batteryByte = (uint8_t)batteryPercent;
  pBatteryChar->setValue(&batteryByte, 1);
  pBatteryChar->notify();

  // Update status string
  const char* statusStr = getStatusString();
  pStatusChar->setValue(statusStr);
}

void handleBLEStateChange() {
  // Disconnection handling
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);  // Give BLE stack time
    pServer->startAdvertising();
    Serial.println("Restarted BLE advertising");
    oldDeviceConnected = deviceConnected;
  }

  // New connection
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const char* getStatusString() {
  switch (currentStatus) {
    case STATUS_OK: return "ok";
    case STATUS_INITIALIZING: return "initializing";
    case STATUS_NO_ECHO: return "no_echo";
    case STATUS_OUT_OF_RANGE: return "out_of_range";
    case STATUS_LOW_BATTERY: return "low_battery";
    case STATUS_ERROR: return "error";
    default: return "unknown";
  }
}

const char* getAlertLevel() {
  if (currentWaterLevel >= ALERT_LEVEL_CRITICAL) return "CRITICAL";
  if (currentWaterLevel >= ALERT_LEVEL_WARNING) return "WARNING";
  if (currentWaterLevel >= ALERT_LEVEL_WATCH) return "WATCH";
  return "NORMAL";
}

void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    if (i < times - 1) delay(delayMs);
  }
}

void updateStatusLED() {
  static unsigned long lastBlink = 0;
  static bool ledState = false;
  unsigned long currentMillis = millis();

  int blinkInterval;

  switch (currentStatus) {
    case STATUS_OK:
      blinkInterval = deviceConnected ? 2000 : 5000;  // Slow blink when OK
      break;
    case STATUS_LOW_BATTERY:
      blinkInterval = 500;  // Fast blink for low battery
      break;
    case STATUS_NO_ECHO:
    case STATUS_OUT_OF_RANGE:
    case STATUS_ERROR:
      blinkInterval = 200;  // Very fast for errors
      break;
    default:
      blinkInterval = 1000;
  }

  if (currentMillis - lastBlink >= blinkInterval) {
    lastBlink = currentMillis;
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
  }
}

void loadPreferences() {
  preferences.begin("floodwatch", true);  // Read-only
  // Future: load calibration values, alert thresholds, etc.
  preferences.end();
}

void savePreferences() {
  preferences.begin("floodwatch", false);  // Read-write
  // Future: save calibration values, alert thresholds, etc.
  preferences.end();
}

// ============================================================================
// DEBUG FUNCTIONS
// ============================================================================

void printBanner() {
  Serial.println();
  Serial.println("╔════════════════════════════════════════════╗");
  Serial.println("║         FloodWatch Water Sensor            ║");
  Serial.println("║                                            ║");
  Serial.print("║  Version: ");
  Serial.print(FIRMWARE_VERSION);
  Serial.println("                          ║");
  Serial.print("║  Device:  ");
  Serial.print(DEVICE_NAME);
  Serial.println("                    ║");
  Serial.println("╚════════════════════════════════════════════╝");
  Serial.println();
}

void printDebugInfo() {
  Serial.println("┌──────────────────────────────────────────┐");
  Serial.print("│ Water Level: ");
  Serial.print(currentWaterLevel, 1);
  Serial.print(" cm");
  Serial.print("  [");
  Serial.print(getAlertLevel());
  Serial.println("]");

  Serial.print("│ Rise Rate:   ");
  Serial.print(riseRate, 2);
  Serial.print(" cm/hr");
  if (abs(riseRate) > RAPID_RISE_THRESHOLD) {
    Serial.print(" ⚠ RAPID");
  }
  Serial.println();

  Serial.print("│ Min/Max:     ");
  Serial.print(minWaterLevel, 1);
  Serial.print(" / ");
  Serial.print(maxWaterLevel, 1);
  Serial.println(" cm");

  Serial.print("│ Battery:     ");
  Serial.print(batteryPercent, 0);
  Serial.print("% (");
  Serial.print(batteryVoltage, 2);
  Serial.print("V)");
  if (lowBatteryWarning) Serial.print(" ⚠ LOW");
  Serial.println();

  Serial.print("│ Status:      ");
  Serial.println(getStatusString());

  Serial.print("│ BLE:         ");
  Serial.print(deviceConnected ? "Connected" : "Advertising");
  Serial.print(" (");
  Serial.print(connectionCount);
  Serial.println(" total)");

  Serial.print("│ Uptime:      ");
  printUptime();

  Serial.println("└──────────────────────────────────────────┘");
  Serial.println();
}

void printUptime() {
  unsigned long uptime = (millis() - bootTime) / 1000;
  unsigned long hours = uptime / 3600;
  unsigned long minutes = (uptime % 3600) / 60;
  unsigned long seconds = uptime % 60;

  if (hours > 0) {
    Serial.print(hours);
    Serial.print("h ");
  }
  Serial.print(minutes);
  Serial.print("m ");
  Serial.print(seconds);
  Serial.println("s");
}
