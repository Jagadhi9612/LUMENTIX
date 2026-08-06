// apps/mobile/src/services/responseTracker.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { use } from 'react';

// Ek response ka structure
export interface AIResponseRecord {
  id: string;
  date: string;           
  time: string;           
  steps: number;
  heartRate: number;
  activityType: string;
  sleepHours: number;
  goal: string;
  aiResponse: string;
  promptsUsed: number;
}

const getStorageKey = (userId : string) => `ai_response_history_${userId}`;

// saving new response  
export const saveAIResponse = async (userId: string, record: Omit<AIResponseRecord, 'id'>) => {
  try {
    const key = getStorageKey(userId);
    const existing = await AsyncStorage.getItem(key);
    const history: AIResponseRecord[] = existing ? JSON.parse(existing) : [];

    const newRecord: AIResponseRecord = {
      ...record,
      id: Date.now().toString(), // Unique ID
    };

    history.push(newRecord);
    await AsyncStorage.setItem(key, JSON.stringify(history));
    console.log('Response saved successfully');
  } catch (error) {
    console.error('Save error:', error);
  }
};


export const getResponseHistory = async (
  userId: string, 
  period: '7days' | '1month' | '1year' | 'all'
): Promise<AIResponseRecord[]> => {
  try {
    const key = getStorageKey(userId);
    const existing = await AsyncStorage.getItem(key);
    if (!existing) return [];

    const history: AIResponseRecord[] = JSON.parse(existing);
    const now = new Date();
    const cutoff = new Date();

    if (period === '7days') cutoff.setDate(now.getDate() - 7);
    else if (period === '1month') cutoff.setMonth(now.getMonth() - 1);
    else if (period === '1year') cutoff.setFullYear(now.getFullYear() - 1);
    else return history; // 'all'

    return history.filter(r => new Date(r.date) >= cutoff);
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
};


export const convertToCSV = (history: AIResponseRecord[]): string => {
  if (history.length === 0) return 'No data available';

  const header = 'Date,Time,Steps,Heart Rate,Activity,Sleep Hours,Goal,AI Response\n';

  const rows = history.map(r =>
    `${r.date},${r.time},${r.steps},${r.heartRate} BPM,${r.activityType},${r.sleepHours}h,${r.goal},"${r.aiResponse.replace(/"/g, "'")}"`
  ).join('\n');

  return header + rows;
};


export const clearHistory = async (userId:string) => {
  await AsyncStorage.removeItem(getStorageKey(userId));
};