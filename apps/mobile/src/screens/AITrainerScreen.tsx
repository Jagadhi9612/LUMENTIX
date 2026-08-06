import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStepCounter } from '../hooks/useStepCounter';
import { analyzeHealthWithCodex } from '../services/aiCodexService';
import { auth } from '../config/firebaseConfig';
import { getUserProfile, createDefaultProfile, saveWorkoutToFirebase, UserProfile } from '../services/userService';
import { useBluetooth } from '../hooks/useBluetooth';

const DAILY_FREE_LIMIT = 3;

export default function AITrainerScreen() {
  const { steps } = useStepCounter();
  const { heartRate, isConnected, deviceName } = useBluetooth();
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptsUsedToday, setPromptsUsedToday] = useState(0);
  const [metricsText, setMetricsText] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const userId = auth.currentUser?.uid || 'test_user_001';

  useEffect(() => {
    const loadProfile = async () => {
      let profile = await getUserProfile(userId);
      if (!profile) {
        profile = await createDefaultProfile(userId);
      }
      setUserProfile(profile);
    };
    loadProfile();
  }, []);

  // Daily limit check (Dependencies mein userId add kiya taaki user change hone par refresh ho)
  useEffect(() => {
    checkDailyLimit();
  }, [userId]);

  // Metrics text box update
  useEffect(() => {
    const dailyTarget = userProfile?.dailyStepTarget || 5000;
    const metrics = `
  Steps today: ${steps} / ${dailyTarget}
  Heart Rate: ${heartRate} BPM
  Activity: walking
  Sleep last night: ${userProfile?.sleepHours || 6} hours
  Fitness Goal: ${userProfile?.goal || 'Fat Loss'}
  BLE Device: ${isConnected ? deviceName : 'Not connected'}
  Progress: ${((steps / dailyTarget) * 100).toFixed(0)}% of daily target
    `.trim();
    setMetricsText(metrics);
  }, [steps, userProfile, heartRate, isConnected]);

  const checkDailyLimit = async () => {
    const today = new Date().toDateString();
    
    // FIX 1: User-Specific AsyncStorage Keys
    const dateKey = `ai_prompts_date_${userId}`;
    const countKey = `ai_prompts_count_${userId}`;
    
    const stored = await AsyncStorage.getItem(dateKey);
    const count = await AsyncStorage.getItem(countKey);
    
    if (stored !== today) {
      await AsyncStorage.setItem(dateKey, today);
      await AsyncStorage.setItem(countKey, '0');
      setPromptsUsedToday(0);
    } else {
      setPromptsUsedToday(parseInt(count || '0'));
    }
  };

  const handleAskAI = async () => {
    if (promptsUsedToday >= DAILY_FREE_LIMIT) {
      Alert.alert(
        'Daily Limit Reached',
        `You have used all ${DAILY_FREE_LIMIT} free prompts today.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade ₹99/month', onPress: () => Alert.alert('Coming Soon', 'Payment feature coming soon!') }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const dailyTarget = userProfile?.dailyStepTarget || 5000;
      const calculatedHeartRate = steps > dailyTarget * 0.6 ? 125 : 90;

      const response = await analyzeHealthWithCodex({
        heartRate: calculatedHeartRate,
        sleepHours: userProfile?.sleepHours || 6,
        activityType: 'walking',
        metricsText,
      });

      setAiResponse(response);

      // Firebase mein save karo
      await saveWorkoutToFirebase(userId, {
        date: new Date().toISOString().split('T')[0],
        steps,
        heartRate: calculatedHeartRate,
        aiResponse: response,
        // FIX 2: Title Case for Goal Fallback
        goal: userProfile?.goal || 'Fat Loss', 
      });

      // FIX 1 (Continued): Update user-specific count
      const countKey = `ai_prompts_count_${userId}`;
      const newCount = promptsUsedToday + 1;
      await AsyncStorage.setItem(countKey, newCount.toString());
      setPromptsUsedToday(newCount);

    } catch (error) {
      setAiResponse('Unable to get AI insight right now.');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🤖 AI Trainer</Text>
      <Text style={styles.sectionTitle}>📊 Your Current Metrics:</Text>
      <View style={styles.metricsBox}>
        <Text style={styles.metricsText}>{metricsText}</Text>
      </View>
      <Text style={styles.limitText}>
        Daily limit: {promptsUsedToday}/{DAILY_FREE_LIMIT} prompts used
      </Text>
      <TouchableOpacity
        style={[styles.button, promptsUsedToday >= DAILY_FREE_LIMIT && styles.buttonDisabled]}
        onPress={handleAskAI}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Getting insight...' : 'Ask AI Trainer'}
        </Text>
      </TouchableOpacity>
      {promptsUsedToday >= DAILY_FREE_LIMIT && (
        <TouchableOpacity style={styles.payButton}>
          <Text style={styles.payButtonText}>Want more? Upgrade Rs.99/month</Text>
        </TouchableOpacity>
      )}
      {aiResponse ? (
        <View style={styles.responseBox}>
          <Text style={styles.sectionTitle}>AI Response:</Text>
          <Text style={styles.responseText}>{aiResponse}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000', 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#ff0000', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  sectionTitle: { 
    fontSize: 16, 
    color: '#fff', 
    marginBottom: 8, 
    fontWeight: 'bold' 
  },
  metricsBox: { 
    backgroundColor: '#1a1a1a', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#da0000' 
  },
  metricsText: { 
    color: '#90EE90', 
    fontSize: 14, 
    lineHeight: 22 
  },
  limitText: { 
    color: '#888', 
    fontSize: 13, 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  button: { 
    backgroundColor: '#e22600', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 10 
  },
  buttonDisabled: { 
    backgroundColor: '#555' 
  },
  buttonText: { 
    color: '#000', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  payButton: { 
    backgroundColor: '#2a2a2a', 
    padding: 12, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#e22600' 
  },
  payButtonText: { 
    color: '#e22600', 
    fontSize: 14 
  },
  responseBox: { 
    backgroundColor: '#1a1a1a', 
    padding: 15, 
    borderRadius: 10, 
    marginTop: 10, 
    borderWidth: 1, 
    borderColor: '#90EE90' 
  },
  responseText: { 
    color: '#fff', 
    fontSize: 14, 
    lineHeight: 22 
  },
});