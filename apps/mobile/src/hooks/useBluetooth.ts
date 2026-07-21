import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export function useBluetooth() {
  const [heartRate, setHeartRate] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string>('');

  useEffect(() => {
    
    if (Platform.OS === 'web') {
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

  const startScan = () => {
    setIsScanning(true);
    
    setTimeout(() => setIsScanning(false), 5000);
  };

  const stopScan = () => {
    setIsScanning(false);
  };

  return { heartRate, isScanning, isConnected, deviceName, startScan, stopScan };
}