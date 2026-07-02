import { Pedometer } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsAvailable(true);
      let mockSteps = 0;
      const interval = setInterval(() => {
        mockSteps += 1;
        setSteps(mockSteps);
      }, 1000);
      return () => clearInterval(interval);
    }

    Pedometer.isAvailableAsync().then((result) => {
      setIsAvailable(result);
    });

    const subscription = Pedometer.watchStepCount((result) => {
      setSteps(result.steps);
    });

    return () => subscription.remove();

  }, []);

  return { steps, isAvailable };
}