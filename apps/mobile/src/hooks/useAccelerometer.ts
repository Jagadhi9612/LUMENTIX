import { Accelerometer } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
}

export function useAccelerometer() {
  const [data, setData] = useState<AccelerometerData>({ x: 0, y: 0, z: 0 });
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsAvailable(true);
      // Mock data for browser testing
      const interval = setInterval(() => {
        setData({
          x: (Math.random() - 0.5) * 0.5,
          y: 9.8 + (Math.random() - 0.5) * 0.2,
          z: (Math.random() - 0.5) * 0.3,
        });
      }, 100);
      return () => clearInterval(interval);
    }

    // Real device
    Accelerometer.isAvailableAsync().then(setIsAvailable);
    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener(setData);
    return () => subscription.remove();
  }, []);

  return { data, isAvailable };
}