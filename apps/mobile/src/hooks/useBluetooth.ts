import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';


const manager = new BleManager();
const HEART_RATE_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';

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

        manager.startDeviceScan([HEART_RATE_SERVICE_UUID],null,(error,device)=>{
          if(error){
            console.warn('Scan error:',error);
            setIsScanning(false);
            return;
          }

          if(device){
            console.log('Found heart-rate device:', device.name || device.id);
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