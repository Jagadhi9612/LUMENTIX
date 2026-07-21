import { Pedometer } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const useStepCounter = () => {
  const [steps, setSteps] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const dailyTarget = 5000;

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsAvailable(true);
      let mockSteps = 0;
      const interval = setInterval(() => {
        mockSteps += 500;
        setSteps(mockSteps);
      }, 3000);
      return () => clearInterval(interval);
    }

    Pedometer.isAvailableAsync().then(setIsAvailable);
    const subscription = Pedometer.watchStepCount((result) => {
      setSteps(result.steps);
    });
    return () => subscription.remove();

  }, []);

  return { steps, isAvailable, dailyTarget };
};