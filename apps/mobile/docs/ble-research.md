# Bluetooth Heart Rate Tracking Research
Date: 15-07-2026
Approved approach: Option B — External BLE Wearable

## Why BLE wearable over camera PPG
- Camera method needs finger still — not practical during workout
- BLE gives continuous real-time readings
- Higher accuracy — dedicated PPG sensor in wearable
- Works in background while user exercises

## Library: react-native-ble-plx
- GitHub: github.com/dotintent/react-native-ble-plx
- Works with Expo Dev Client (not Expo Go)
- Requires custom native build

## Android Permissions needed
- BLUETOOTH_SCAN
- BLUETOOTH_CONNECT  
- ACCESS_FINE_LOCATION

## Standard BLE Heart Rate UUIDs
- Heart Rate Service: 0x180D
- HR Measurement Characteristic: 0x2A37
- These are universal — work with any BLE wearable

## Next step
Install react-native-ble-plx and build useBluetooth.ts hook