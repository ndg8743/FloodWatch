# FloodWatch ESP32 Sensor Setup Guide

Complete guide for building and programming an ESP32-based water level sensor that communicates with the FloodWatch PWA via Bluetooth Low Energy (BLE).

## Table of Contents

1. [Hardware Requirements](#hardware-requirements)
2. [Wiring Diagram](#wiring-diagram)
3. [Software Setup](#software-setup)
4. [Configuration](#configuration)
5. [Installation Tips](#installation-tips)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Topics](#advanced-topics)

## Hardware Requirements

### Required Components

| Component | Model | Description | Where to Buy | ~Cost |
|-----------|-------|-------------|--------------|-------|
| Microcontroller | ESP32 DevKit V1 | Main board with WiFi/BLE | Amazon, AliExpress | $8-15 |
| Ultrasonic Sensor | JSN-SR04T | Waterproof, 25-450cm range | Amazon, AliExpress | $8-12 |
| USB Cable | Micro-USB | For programming | Any | $2-5 |
| Jumper Wires | Female-Female | For connections | Amazon | $3-5 |

**Total basic cost: ~$20-35**

### Optional Components (Portable/Weatherproof Setup)

| Component | Description | ~Cost |
|-----------|-------------|-------|
| 18650 Battery | 3.7V 2600mAh+ Li-Ion | $5-10 |
| TP4056 Module | USB battery charger with protection | $1-2 |
| 2x 10kΩ Resistors | For battery voltage divider | $0.10 |
| Waterproof Enclosure | IP65+ rated, 100x68x50mm min | $10-20 |
| Cable Glands | PG7 or PG9 for wire entry | $2-5 |
| Mounting Bracket | Stainless steel L-bracket | $5-10 |

### Alternative Sensors

| Sensor | Pros | Cons | Use Case |
|--------|------|------|----------|
| **JSN-SR04T** (recommended) | Waterproof, good range | Slightly less accurate | Outdoor permanent installation |
| HC-SR04 | Very accurate, cheap | Not waterproof | Indoor/covered testing |
| A02YYUW | Fully sealed, UART | Higher cost ($15-20) | Submersible applications |
| VL53L0X | Laser ToF, very accurate | Short range (2m) | High precision needs |

## Wiring Diagram

### Basic Setup (USB Powered)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    ESP32 DevKit V1              JSN-SR04T Ultrasonic        │
│    ┌──────────────┐             ┌──────────────────┐        │
│    │              │             │                  │        │
│    │         3.3V ├─────────────┤ VCC              │        │
│    │              │             │                  │        │
│    │        GPIO5 ├─────────────┤ TRIG             │        │
│    │              │             │                  │        │
│    │       GPIO18 ├─────────────┤ ECHO             │        │
│    │              │             │                  │        │
│    │          GND ├─────────────┤ GND              │        │
│    │              │             │                  │        │
│    │         USB  │             └──────────────────┘        │
│    │          │   │                     │                   │
│    └──────────┼───┘                     │                   │
│               │                    [Sensor Probe]           │
│         [Computer]                      ↓                   │
│                                    [Water Surface]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Battery-Powered Setup

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Battery + TP4056              ESP32 DevKit               │
│    ┌─────────────┐               ┌──────────────┐           │
│    │   TP4056    │               │              │           │
│    │   ┌─────┐   │               │              │           │
│    │   │ USB │   │     B+        │         VIN  │           │
│    │   └──┬──┘   ├───────────────┤              │           │
│    │      │      │               │              │           │
│    │  [18650]    │     B-        │          GND │           │
│    │   Cell      ├───────────────┤              │           │
│    └─────────────┘               │              │           │
│                                  │       GPIO34 │           │
│    Battery Voltage Divider:      │          │   │           │
│                                  │          │   │           │
│         B+ ────┬──── 10kΩ ───────┼──────────┘   │           │
│                │                 │              │           │
│                └──── 10kΩ ───────┤          GND │           │
│                │                 └──────────────┘           │
│               GND                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pin Reference

| ESP32 Pin | Function | Connected To |
|-----------|----------|--------------|
| GPIO 5 | Digital Output | Ultrasonic TRIG |
| GPIO 18 | Digital Input | Ultrasonic ECHO |
| GPIO 34 | ADC Input | Battery voltage divider (optional) |
| GPIO 2 | Digital Output | Built-in LED (status) |
| 3.3V | Power | Ultrasonic VCC |
| GND | Ground | All GND connections |
| VIN | Power Input | Battery B+ (when using battery) |

## Software Setup

### Option 1: Arduino IDE (Recommended for Beginners)

#### Step 1: Install Arduino IDE

Download from: https://www.arduino.cc/en/software

#### Step 2: Add ESP32 Board Support

1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click OK

5. Go to **Tools → Board → Boards Manager**
6. Search for "esp32"
7. Install **"ESP32 by Espressif Systems"** (version 2.0.0 or later)

#### Step 3: Configure Board Settings

Go to **Tools** and set:
- **Board**: ESP32 Dev Module
- **Upload Speed**: 921600
- **CPU Frequency**: 240MHz
- **Flash Frequency**: 80MHz
- **Flash Mode**: QIO
- **Flash Size**: 4MB
- **Partition Scheme**: Default 4MB with spiffs
- **Port**: Select your COM port

#### Step 4: Upload Firmware

1. Open `floodwatch_sensor.ino`
2. Click the **Upload** button (→ arrow)
3. Wait for "Done uploading"

### Option 2: PlatformIO (Recommended for Developers)

#### Step 1: Install PlatformIO

- Install [VS Code](https://code.visualstudio.com/)
- Install PlatformIO extension from VS Code marketplace

#### Step 2: Build and Upload

```bash
cd microcontroller

# Build
pio run

# Upload
pio run -t upload

# Monitor serial output
pio device monitor
```

### Option 3: ESP-IDF (Advanced)

For custom builds or integrating with other ESP-IDF components:

```bash
# Install ESP-IDF
# See: https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/

idf.py set-target esp32
idf.py build
idf.py flash
idf.py monitor
```

## Configuration

### Basic Configuration

Edit these values in `floodwatch_sensor.ino`:

```cpp
// ============= DEVICE SETUP =============

// Unique name for this sensor (shows in Bluetooth scan)
#define DEVICE_NAME "FloodWatch-001"

// Height of sensor above ground/riverbed in centimeters
// Measure from sensor face to lowest point you want to monitor
#define SENSOR_HEIGHT_CM 200.0

// ============= ALERT THRESHOLDS =============

// Water level (cm) that triggers each alert level
#define ALERT_LEVEL_WATCH 50.0      // Yellow - elevated
#define ALERT_LEVEL_WARNING 100.0   // Orange - flood watch
#define ALERT_LEVEL_CRITICAL 150.0  // Red - major flood
```

### Multiple Sensors

To deploy multiple sensors:

1. Change `DEVICE_NAME` for each sensor:
   ```cpp
   #define DEVICE_NAME "FloodWatch-Creek"
   #define DEVICE_NAME "FloodWatch-River"
   #define DEVICE_NAME "FloodWatch-Pond"
   ```

2. Each will appear separately in the app's Bluetooth scan

### Custom BLE UUIDs

If you need custom UUIDs (e.g., for a custom app):

```cpp
// In firmware
#define SERVICE_UUID        "your-service-uuid-here"
#define WATER_LEVEL_UUID    "your-characteristic-uuid-1"
// ... etc
```

```env
# In web app .env file
VITE_BLE_SERVICE_UUID=your-service-uuid-here
VITE_BLE_CHAR_WATER_LEVEL=your-characteristic-uuid-1
```

## Installation Tips

### Sensor Mounting

```
                    ┌─── ESP32 Enclosure
                    │
     ═══════════════╪═══════════════  ← Bridge/Overhang
                    │
                    │    ← PVC guide tube (optional)
                    │       reduces wind interference
                    │
                    ▼
              [Ultrasonic]   ← Sensor faces straight down
                    │
                    │  ← Clearance: 25cm minimum above
                    │     highest expected water level
                    │
    ~~~~~~~~~~~~~~~~│~~~~~~~~~~~~~~~~  ← Water surface
                    │
                    │  ← Measured distance
                    │
    ════════════════════════════════  ← Riverbed/ground
```

### Best Practices

1. **Mount sensor perpendicular to water surface** - Angled mounting causes inaccurate readings

2. **Minimum clearance** - Keep sensor at least 25cm above highest expected water

3. **Use a guide tube** - 50mm PVC pipe helps focus the ultrasonic beam and blocks wind

4. **Protect from direct sun** - Heat affects measurements; use a shade/enclosure

5. **Secure all connections** - Use waterproof connectors or seal with silicone

### Weatherproofing Checklist

- [ ] Enclosure is IP65 rated or better
- [ ] Cable glands installed for all wire entries
- [ ] Desiccant packet inside enclosure
- [ ] Silicone sealant on all seams
- [ ] Drainage hole at lowest point (covered with mesh)
- [ ] Sensor probe properly sealed to enclosure
- [ ] Battery contacts protected from corrosion

## Troubleshooting

### Sensor Not Appearing in App

| Symptom | Cause | Solution |
|---------|-------|----------|
| Not in scan list | ESP32 not powered | Check USB/battery connection |
| Not in scan list | BLE not advertising | Restart ESP32, check serial output |
| Not in scan list | Wrong browser | Use Chrome on Android |
| Scan fails | Bluetooth disabled | Enable Bluetooth on phone |

### Inaccurate Readings

| Symptom | Cause | Solution |
|---------|-------|----------|
| Readings too high | Wrong SENSOR_HEIGHT_CM | Measure and update config |
| Erratic values | Interference | Add guide tube, check for obstacles |
| Always max range | Sensor too high | Lower mounting position |
| Always min range | Obstruction | Clear sensor path |
| Jumpy readings | Waves/ripples | Increase READINGS_FOR_AVERAGE |

### Connection Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Frequent disconnects | Distance too far | Move closer (BLE range ~10m) |
| Frequent disconnects | Interference | Move away from WiFi routers |
| Won't reconnect | BLE stack issue | Restart ESP32 |
| Data stops updating | Notifications failed | Reconnect in app |

### Serial Monitor Debug

Open Serial Monitor at 115200 baud to see:

```
╔════════════════════════════════════════════╗
║         FloodWatch Water Sensor            ║
║  Version: 1.0.0                            ║
║  Device:  FloodWatch-001                   ║
╚════════════════════════════════════════════╝

Initializing BLE...
BLE advertising started
Device name: FloodWatch-001
Taking initial readings...
=== Sensor Ready ===

┌──────────────────────────────────────────┐
│ Water Level: 45.3 cm  [NORMAL]
│ Rise Rate:   0.15 cm/hr
│ Min/Max:     42.1 / 48.7 cm
│ Battery:     87% (3.92V)
│ Status:      ok
│ BLE:         Advertising (0 total)
│ Uptime:      0m 15s
└──────────────────────────────────────────┘
```

## Advanced Topics

### Power Optimization

For battery-powered deployments, reduce power consumption:

```cpp
// Increase measurement interval
#define MEASUREMENT_INTERVAL_MS 5000  // Every 5 seconds

// Use deep sleep between measurements (add to loop)
if (!deviceConnected) {
  esp_sleep_enable_timer_wakeup(DEEP_SLEEP_INTERVAL_US);
  esp_deep_sleep_start();
}
```

### OTA Updates

Enable over-the-air firmware updates:

```cpp
#include <ArduinoOTA.h>

void setup() {
  // ... existing setup ...

  ArduinoOTA.setHostname(DEVICE_NAME);
  ArduinoOTA.begin();
}

void loop() {
  ArduinoOTA.handle();
  // ... existing loop ...
}
```

### Data Logging

Add SD card logging for offline data:

```cpp
#include <SD.h>
#include <SPI.h>

void logReading() {
  File dataFile = SD.open("datalog.csv", FILE_APPEND);
  if (dataFile) {
    dataFile.printf("%lu,%.2f,%.2f,%.0f\n",
      millis(), currentWaterLevel, riseRate, batteryPercent);
    dataFile.close();
  }
}
```

### WiFi Connectivity

Add WiFi for remote monitoring (alongside BLE):

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YourSSID";
const char* password = "YourPassword";
const char* serverUrl = "https://your-server.com/api/readings";

void sendToServer() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"device\":\"" + String(DEVICE_NAME) +
                     "\",\"level\":" + String(currentWaterLevel) + "}";

    int httpCode = http.POST(payload);
    http.end();
  }
}
```

## Support

- **Issues**: https://github.com/ndg8743/FloodWatch/issues
- **Wiki**: https://github.com/ndg8743/FloodWatch/wiki

## License

MIT License - Feel free to modify and distribute.
