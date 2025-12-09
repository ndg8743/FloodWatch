/*
 * FloodWatch ESP32 Water Level Sensor
 *
 * Hardware Requirements:
 * - ESP32 DevKit (or compatible board)
 * - JSN-SR04T Waterproof Ultrasonic Sensor (or HC-SR04)
 * - 3.7V LiPo Battery (optional, for portable operation)
 * - TP4056 Charging Module (if using battery)
 *
 * Wiring:
 * - Ultrasonic TRIG -> GPIO 5
 * - Ultrasonic ECHO -> GPIO 18
 * - VCC -> 3.3V (or 5V for HC-SR04)
 * - GND -> GND
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Pin definitions
#define TRIG_PIN 5
#define ECHO_PIN 18
#define BATTERY_PIN 34  // ADC pin for battery monitoring

// BLE UUIDs - must match the web app constants
#define SERVICE_UUID        "12345678-1234-5678-1234-56789abcdef0"
#define WATER_LEVEL_UUID    "12345678-1234-5678-1234-56789abcdef1"
#define RISE_RATE_UUID      "12345678-1234-5678-1234-56789abcdef2"
#define BATTERY_UUID        "12345678-1234-5678-1234-56789abcdef3"
#define STATUS_UUID         "12345678-1234-5678-1234-56789abcdef4"

// Device configuration
#define DEVICE_NAME "FloodWatch-001"
#define MEASUREMENT_INTERVAL_MS 1000
#define READINGS_FOR_AVERAGE 5
#define SENSOR_HEIGHT_CM 200.0  // Height of sensor above ground/riverbed

// BLE objects
BLEServer* pServer = NULL;
BLECharacteristic* pWaterLevelChar = NULL;
BLECharacteristic* pRiseRateChar = NULL;
BLECharacteristic* pBatteryChar = NULL;
BLECharacteristic* pStatusChar = NULL;

bool deviceConnected = false;
bool oldDeviceConnected = false;

// Measurement variables
float lastWaterLevel = 0;
float currentWaterLevel = 0;
float riseRate = 0;  // cm per hour
unsigned long lastMeasurementTime = 0;
float readings[READINGS_FOR_AVERAGE];
int readIndex = 0;

// Battery monitoring
float batteryPercent = 100.0;
const float BATTERY_MIN_V = 3.0;
const float BATTERY_MAX_V = 4.2;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("Client connected");
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("Client disconnected");
  }
};

void setup() {
  Serial.begin(115200);
  Serial.println("FloodWatch Sensor Starting...");

  // Initialize ultrasonic sensor pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BATTERY_PIN, INPUT);

  // Initialize readings array
  for (int i = 0; i < READINGS_FOR_AVERAGE; i++) {
    readings[i] = 0;
  }

  // Initialize BLE
  BLEDevice::init(DEVICE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  // Create BLE Service
  BLEService* pService = pServer->createService(SERVICE_UUID);

  // Create BLE Characteristics
  pWaterLevelChar = pService->createCharacteristic(
    WATER_LEVEL_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pWaterLevelChar->addDescriptor(new BLE2902());

  pRiseRateChar = pService->createCharacteristic(
    RISE_RATE_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pRiseRateChar->addDescriptor(new BLE2902());

  pBatteryChar = pService->createCharacteristic(
    BATTERY_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pBatteryChar->addDescriptor(new BLE2902());

  pStatusChar = pService->createCharacteristic(
    STATUS_UUID,
    BLECharacteristic::PROPERTY_READ
  );

  // Start the service
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

  // Set initial status
  pStatusChar->setValue("ready");
}

float measureDistance() {
  // Send ultrasonic pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure echo duration
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);  // 30ms timeout

  if (duration == 0) {
    return -1;  // No echo received
  }

  // Calculate distance in cm (speed of sound = 343 m/s)
  float distance = duration * 0.0343 / 2.0;

  return distance;
}

float calculateWaterLevel() {
  float distance = measureDistance();

  if (distance < 0 || distance > SENSOR_HEIGHT_CM) {
    return lastWaterLevel;  // Return last valid reading
  }

  // Water level = sensor height - distance to water surface
  float waterLevel = SENSOR_HEIGHT_CM - distance;

  // Add to rolling average
  readings[readIndex] = waterLevel;
  readIndex = (readIndex + 1) % READINGS_FOR_AVERAGE;

  // Calculate average
  float sum = 0;
  for (int i = 0; i < READINGS_FOR_AVERAGE; i++) {
    sum += readings[i];
  }

  return sum / READINGS_FOR_AVERAGE;
}

void calculateRiseRate() {
  unsigned long currentTime = millis();
  unsigned long timeDiff = currentTime - lastMeasurementTime;

  if (lastMeasurementTime > 0 && timeDiff > 0) {
    float levelDiff = currentWaterLevel - lastWaterLevel;
    // Convert to cm per hour
    riseRate = (levelDiff / timeDiff) * 3600000.0;
  }

  lastMeasurementTime = currentTime;
  lastWaterLevel = currentWaterLevel;
}

void updateBatteryLevel() {
  int rawValue = analogRead(BATTERY_PIN);
  // ESP32 ADC is 12-bit (0-4095), with 3.3V reference
  // Assuming voltage divider (e.g., 2x 10k resistors)
  float voltage = (rawValue / 4095.0) * 3.3 * 2.0;

  batteryPercent = ((voltage - BATTERY_MIN_V) / (BATTERY_MAX_V - BATTERY_MIN_V)) * 100.0;
  batteryPercent = constrain(batteryPercent, 0, 100);
}

void sendBLEData() {
  if (!deviceConnected) return;

  // Pack water level and rise rate into 8 bytes (2 floats)
  uint8_t levelData[8];
  memcpy(levelData, &currentWaterLevel, 4);
  memcpy(levelData + 4, &riseRate, 4);
  pWaterLevelChar->setValue(levelData, 8);
  pWaterLevelChar->notify();

  // Send rise rate separately as well
  uint8_t rateData[4];
  memcpy(rateData, &riseRate, 4);
  pRiseRateChar->setValue(rateData, 4);
  pRiseRateChar->notify();

  // Send battery level as single byte (0-100)
  uint8_t batteryByte = (uint8_t)batteryPercent;
  pBatteryChar->setValue(&batteryByte, 1);
  pBatteryChar->notify();
}

void loop() {
  static unsigned long lastUpdate = 0;
  unsigned long currentMillis = millis();

  // Update measurements at regular intervals
  if (currentMillis - lastUpdate >= MEASUREMENT_INTERVAL_MS) {
    lastUpdate = currentMillis;

    // Take measurement
    currentWaterLevel = calculateWaterLevel();
    calculateRiseRate();
    updateBatteryLevel();

    // Send data via BLE
    sendBLEData();

    // Debug output
    Serial.print("Water Level: ");
    Serial.print(currentWaterLevel);
    Serial.print(" cm | Rise Rate: ");
    Serial.print(riseRate);
    Serial.print(" cm/hr | Battery: ");
    Serial.print(batteryPercent);
    Serial.println("%");
  }

  // Handle BLE connection state changes
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);  // Give BLE stack time to ready
    pServer->startAdvertising();
    Serial.println("Restarted advertising");
    oldDeviceConnected = deviceConnected;
  }

  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
}
