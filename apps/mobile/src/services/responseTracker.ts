// apps/mobile/src/services/responseTracker.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const STORAGE_KEY = 'ai_response_history';

// saving new response  
export const saveAIResponse = async (record: Omit<AIResponseRecord, 'id'>) => {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const history: AIResponseRecord[] = existing ? JSON.parse(existing) : [];

    const newRecord: AIResponseRecord = {
      ...record,
      id: Date.now().toString(), // Unique ID
    };

    history.push(newRecord);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    console.log('Response saved successfully');
  } catch (error) {
    console.error('Save error:', error);
  }
};


export const getResponseHistory = async (
  period: '7days' | '1month' | '1year' | 'all'
): Promise<AIResponseRecord[]> => {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
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


export const clearHistory = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};