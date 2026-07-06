import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStepCounter } from '../hooks/useStepCounter';
import { analyzeHealthWithCodex } from '../services/aiCodexService';
import { saveAIResponse } from '../services/responseTracker';

const DAILY_FREE_LIMIT = 3;

export default function AITrainerScreen() {
  const { steps, isAvailable } = useStepCounter();
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptsUsedToday, setPromptsUsedToday] = useState(0);
  const [metricsText, setMetricsText] = useState('');

  // Mock data — Firebase connect hone ke baad real data aayega
  const userProfile = {
    heartRate: steps > 3000 ? 125 : 90,
    sleepHours: 6,
    activityType: 'walking',
    goal: 'Fat Loss',
    dailyTarget: 5000,
  };

  
  useEffect(() => {
    const metrics = `
Steps today: ${steps} / ${userProfile.dailyTarget}
Heart Rate: ${userProfile.heartRate} BPM
Activity: ${userProfile.activityType}
Sleep last night: ${userProfile.sleepHours} hours
Fitness Goal: ${userProfile.goal}
Progress: ${((steps / userProfile.dailyTarget) * 100).toFixed(0)}% of daily target
    `.trim();
    setMetricsText(metrics);
  }, [steps]);

  
  useEffect(() => {
    checkDailyLimit();
  }, []);

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
        `You have used all ${DAILY_FREE_LIMIT} free AI prompts today. Upgrade to get more insights!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Pay for More', onPress: () => handlePayment() }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const response = await analyzeHealthWithCodex({
        heartRate: userProfile.heartRate,
        sleepHours: userProfile.sleepHours,
        activityType: userProfile.activityType,
        metricsText: metricsText,
      });

      setAiResponse(response);

      
      await saveAIResponse({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        steps: steps,
        heartRate: userProfile.heartRate,
        activityType: userProfile.activityType,
        sleepHours: userProfile.sleepHours,
        goal: userProfile.goal,
        aiResponse: response,
        promptsUsed: promptsUsedToday + 1,
      });

      const newCount = promptsUsedToday + 1;
      await AsyncStorage.setItem('ai_prompts_count', newCount.toString());
      setPromptsUsedToday(newCount);

    } catch (error) {
      setAiResponse('Unable to get AI insight. Please try again.');
    }
    setLoading(false);
  };

  const handlePayment = () => {
    Alert.alert('Coming Soon', 'Payment feature will be available soon!');
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
          {loading ? 'Getting insight...' : '🤖 Ask AI Trainer'}
        </Text>
      </TouchableOpacity>

      {promptsUsedToday >= DAILY_FREE_LIMIT && (
        <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
          <Text style={styles.payButtonText}>Want more? Upgrade ₹99/month</Text>
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
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFD700', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 16, color: '#fff', marginBottom: 8, fontWeight: 'bold' },
  metricsBox: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#FFD700' },
  metricsText: { color: '#90EE90', fontSize: 14, lineHeight: 22 },
  limitText: { color: '#888', fontSize: 13, marginBottom: 15, textAlign: 'center' },
  button: { backgroundColor: '#FFD700', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  payButton: { backgroundColor: '#2a2a2a', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#FFD700' },
  payButtonText: { color: '#FFD700', fontSize: 14 },
  responseBox: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#90EE90' },
  responseText: { color: '#fff', fontSize: 14, lineHeight: 22 },
});