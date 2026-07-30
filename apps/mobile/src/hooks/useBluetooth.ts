import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import * as base64 from 'base64-js';

const manager = new BleManager();
const HEART_RATE_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_CHARACTERISTIC_UUID='00002a37-0000-1000-8000-00805f9b34fb';

export function useBluetooth() {
  const [heartRate, setHeartRate] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string>('');
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  
  useEffect(() => {
    
    if (Platform.OS === 'web') {
      setHasPermissions(true);
      setIsConnected(true);
      setDeviceName('Mock BLE Band');
      
      const interval = setInterval(() => {
        // Realistic heart rate simulation
        const mockHR = Math.floor(65 + Math.random() * 40);
        setHeartRate(mockHR);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const startScan = async () => {
    setIsScanning(true);
    if(Platform.OS === 'web'){
      
      setTimeout(() => setIsScanning(false), 5000);
      return;
    }
    
    try{
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      
      const allPermissionsGranted = Object.values(granted).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );
      setHasPermissions(allPermissionsGranted);

      if(allPermissionsGranted){
        console.log("Success: All Bluetooth Permissions Granted!");

        manager.startDeviceScan([HEART_RATE_SERVICE_UUID],null,async(error,device)=>{
          if(error){
            console.warn('Scan error:',error);
            setIsScanning(false);
            return;
          }

          if(device){
            console.log('Found heart-rate device:', device.name || device.id);

            //1. stopping scanner and ui loading spinner 
            manager.stopDeviceScan();
            setIsScanning(false);

            //2. try to establish connection 
            try{
              const connectedDevice = await device.connect(); // connecting device with device
              await connectedDevice.discoverAllServicesAndCharacteristics(); //discovering map inside device

              //3. updaying ui states- success
              setIsConnected(true);
              setDeviceName(device.name || 'Unknown device');
              console.log('Connected successfully! Starting to monitor heart rate...');

              connectedDevice.monitorCharacteristicForService(
                HEART_RATE_SERVICE_UUID, HEART_RATE_CHARACTERISTIC_UUID,
                (error,characteristic)=>{
                  if(error){
                    console.warn('Monitor error: ', error);
                    return;
                  }

                  if(characteristic?.value){
                    const rawData = base64.toByteArray(characteristic.value);
                    const hr = rawData[1];
                    setHeartRate(hr);
                  }
                }
              );

            } catch(connectErr){
              console.warn('Connection failed: ', connectErr);
              setIsConnected(false);
            }

          }
        });
      } else{
        console.log("Error: User Denied Permissions.");
        setIsScanning(false);
      }
    } catch(err){
      console.warn("Error while requesting permissions:", err);
      setIsScanning(false);
    }
    
  };

  const stopScan = () => {
    setIsScanning(false);
  };

  return { heartRate, isScanning, isConnected, deviceName, hasPermissions, startScan, stopScan };
}