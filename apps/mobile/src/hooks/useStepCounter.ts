// apps/mobile/src/hooks/useStepCounter.ts
import { useState, useEffect } from 'react';
import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';
import { analyzeHealthWithCodex } from '../services/aiCodexService';

export const useStepCounter = () => {
  const [steps, setSteps] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const dailyTarget = 5000;

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsAvailable(true);
      let mockSteps = 0;
      const interval = setInterval(() => {
        mockSteps += 500;
        setSteps(mockSteps);

        // Mock heart rate — Friday ko real sensor se aayega
        const mockHeartRate = mockSteps > 3000 ? 125 : 90;

        analyzeHealthWithCodex({
          heartRate: mockHeartRate,
          sleepHours: 6,
          activityType: 'walking'
        }).then((insight) => setAiInsight(insight));

      }, 3000);
      return () => clearInterval(interval);
    }

    // Real device
    Pedometer.isAvailableAsync().then(setIsAvailable);
    const subscription = Pedometer.watchStepCount((result) => {
      setSteps(result.steps);
    });
    return () => subscription.remove();

  }, []);

  return { steps, isAvailable, dailyTarget, aiInsight };
};