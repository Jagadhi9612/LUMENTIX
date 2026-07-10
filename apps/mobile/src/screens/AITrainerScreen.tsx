import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStepCounter } from '../hooks/useStepCounter';
import { analyzeHealthWithCodex } from '../services/aiCodexService';
import { auth } from '../config/firebaseConfig';
import { getUserProfile, createDefaultProfile, saveWorkoutToFirebase, UserProfile } from '../services/userService';

const DAILY_FREE_LIMIT = 3;

export default function AITrainerScreen() {
  const { steps, isAvailable } = useStepCounter();
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptsUsedToday, setPromptsUsedToday] = useState(0);
  const [metricsText, setMetricsText] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const userId = auth.currentUser?.uid || 'test_user_001';

  // Firebase se profile load karo
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

  // Daily limit check
  useEffect(() => {
    checkDailyLimit();
  }, []);

  // Metrics text box update
  useEffect(() => {
    const dailyTarget = userProfile?.dailyStepTarget || 5000;
    const heartRate = steps > dailyTarget * 0.6 ? 125 : 90;
    const metrics = `
Steps today: ${steps} / ${dailyTarget}
Heart Rate: ${heartRate} BPM
Activity: walking
Sleep last night: ${userProfile?.sleepHours || 6} hours
Fitness Goal: ${userProfile?.goal || 'Fat Loss'}
Progress: ${((steps / dailyTarget) * 100).toFixed(0)}% of daily target
    `.trim();
    setMetricsText(metrics);
  }, [steps, userProfile]);

  const checkDailyLimit = async () => {
    const today = new Date().toDateString();
    const stored = await AsyncStorage.getItem('ai_prompts_date');
    const count = await AsyncStorage.getItem('ai_prompts_count');
    if (stored !== today) {
      await AsyncStorage.setItem('ai_prompts_date', today);
      await AsyncStorage.setItem('ai_prompts_count', '0');
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
      const heartRate = steps > dailyTarget * 0.6 ? 125 : 90;

      const response = await analyzeHealthWithCodex({
        heartRate,
        sleepHours: userProfile?.sleepHours || 6,
        activityType: 'walking',
        metricsText,
      });

      setAiResponse(response);

      // Firebase mein save karo
      await saveWorkoutToFirebase(userId, {
        date: new Date().toISOString().split('T')[0],
        steps,
        heartRate,
        aiResponse: response,
        goal: userProfile?.goal || 'fatLoss',
      });

      const newCount = promptsUsedToday + 1;
      await AsyncStorage.setItem('ai_prompts_count', newCount.toString());
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
    color: '#FFD700', 
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
    borderColor: '#FFD700' 
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
    backgroundColor: '#FFD700', 
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
    borderColor: '#FFD700' 
  },
  payButtonText: { 
    color: '#FFD700', 
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