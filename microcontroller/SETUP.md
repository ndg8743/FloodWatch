# FloodWatch ESP32 Sensor Setup Guide

This guide walks you through setting up an ESP32-based water level sensor that communicates with the FloodWatch PWA via Bluetooth Low Energy (BLE).

## Hardware Requirements

### Required Components
| Component | Description | Approximate Cost |
|-----------|-------------|------------------|
| ESP32 DevKit V1 | Main microcontroller with built-in BLE | $8-15 |
| JSN-SR04T | Waterproof ultrasonic distance sensor | $8-12 |
| Jumper Wires | For connections | $3-5 |
| USB Cable | Micro-USB for programming | $2-5 |

### Optional (for Portable Operation)
| Component | Description | Approximate Cost |
|-----------|-------------|------------------|
| 3.7V LiPo Battery | 18650 or pouch cell, 2000mAh+ | $5-10 |
| TP4056 Module | Battery charging module | $1-2 |
| 2x 10kΩ Resistors | For battery voltage divider | $0.10 |
| Waterproof Enclosure | IP65+ rated | $10-20 |

## Wiring Diagram

```
ESP32 DevKit          JSN-SR04T Ultrasonic
------------          -------------------
GPIO 5  ─────────────── TRIG
GPIO 18 ─────────────── ECHO
3.3V    ─────────────── VCC
GND     ─────────────── GND


Optional Battery Monitoring:
                        ┌─── Battery + (4.2V max)
                        │
                       [10kΩ]
                        │
GPIO 34 ────────────────┼─── Voltage divider output
                        │
                       [10kΩ]
                        │
GND ────────────────────┴─── Battery - / GND
```

## Software Setup

### 1. Install Arduino IDE
Download and install from: https://www.arduino.cc/en/software

### 2. Add ESP32 Board Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "esp32" and install "ESP32 by Espressif Systems"

### 3. Select Board and Port
1. **Tools → Board → ESP32 Arduino → ESP32 Dev Module**
2. **Tools → Port → [Select your COM port]**

### 4. Upload the Firmware
1. Open `floodwatch_sensor/floodwatch_sensor.ino`
2. Click the Upload button (→)
3. Wait for "Done uploading"

## Configuration

### Customizing UUIDs
If you need custom BLE UUIDs (for multiple sensors), modify these lines in the `.ino` file:

```cpp
#define SERVICE_UUID        "12345678-1234-5678-1234-56789abcdef0"
#define WATER_LEVEL_UUID    "12345678-1234-5678-1234-56789abcdef1"
#define RISE_RATE_UUID      "12345678-1234-5678-1234-56789abcdef2"
#define BATTERY_UUID        "12345678-1234-5678-1234-56789abcdef3"
#define STATUS_UUID         "12345678-1234-5678-1234-56789abcdef4"
```

Then update the web app's `.env` file to match:

```env
VITE_BLE_SERVICE_UUID=your-service-uuid
VITE_BLE_CHAR_WATER_LEVEL=your-water-level-uuid
# ... etc
```

### Customizing Device Name
Change the device name to identify multiple sensors:

```cpp
#define DEVICE_NAME "FloodWatch-001"  // Change to FloodWatch-002, etc.
```

### Adjusting Sensor Height
Set the height of your sensor above the ground/riverbed:

```cpp
#define SENSOR_HEIGHT_CM 200.0  // Adjust based on your installation
```

## Installation Tips

### Mounting the Sensor
1. Mount the ultrasonic sensor pointing straight down toward the water
2. Ensure there are no obstructions in the sensor's path
3. Keep the sensor at least 20cm above the highest expected water level
4. Use a PVC pipe as a guide tube to prevent wind interference

### Weatherproofing
1. Use a waterproof enclosure (IP65 or better)
2. Apply silicone sealant around cable entry points
3. Add desiccant packets inside the enclosure
4. Mount with slight downward tilt to prevent water pooling

### Power Options

**USB Power (Continuous)**
- Connect to a USB power adapter
- Best for permanent installations with power access

**Battery Power (Portable)**
- Use 18650 Li-Ion cells for long runtime
- Enable deep sleep in firmware for extended battery life
- Expected runtime: 2-7 days depending on measurement frequency

## Troubleshooting

### Sensor Not Appearing in App
1. Ensure ESP32 is powered on (blue LED blinking)
2. Check that Bluetooth is enabled on your phone
3. Verify you're using Chrome on Android (Web Bluetooth requirement)
4. Try restarting the ESP32

### Inaccurate Readings
1. Check for obstructions in sensor path
2. Verify sensor height configuration matches actual height
3. Ensure sensor is perpendicular to water surface
4. Check for electrical interference from nearby devices

### Connection Drops Frequently
1. Reduce distance between phone and sensor
2. Check battery level (low battery affects BLE range)
3. Avoid metal enclosures that block BLE signal

### No BLE Advertising
1. Re-upload the firmware
2. Check serial monitor for error messages
3. Try a different ESP32 board

## Serial Monitor Debug

Connect via USB and open Serial Monitor (115200 baud) to see:

```
FloodWatch Sensor Starting...
BLE advertising started
Device name: FloodWatch-001
Water Level: 45.32 cm | Rise Rate: 0.15 cm/hr | Battery: 87%
Water Level: 45.35 cm | Rise Rate: 0.18 cm/hr | Battery: 87%
Client connected
...
```

## Data Format

The sensor sends data in the following formats:

### Water Level Characteristic (8 bytes)
```
[0-3]: float32 - Water level in centimeters
[4-7]: float32 - Rise rate in cm/hour
```

### Battery Characteristic (1 byte)
```
[0]: uint8 - Battery percentage (0-100)
```

## Next Steps

After setup:
1. Open the FloodWatch PWA in Chrome
2. Go to the Sensors page
3. Tap "Connect" and select your sensor
4. View real-time water levels and history charts
