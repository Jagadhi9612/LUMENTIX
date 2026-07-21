import { db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface UserProfile {
  name: string;
  height: number;
  weight: number;
  age: number;
  goal: 'Fat Loss' | 'Muscle Gain' | 'Endurance';
  sleepHours: number;
  dailyStepTarget: number;
}

// User profile fetch karo Firebase se
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'data');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};


export const createDefaultProfile = async (userId: string) => {
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'data');
    const defaultProfile: UserProfile = {
      name: 'Member',
      height: 170,
      weight: 70,
      age: 25,
      goal: 'Fat Loss',
      sleepHours: 7,
      dailyStepTarget: 8000,
    };
    await setDoc(docRef, defaultProfile);
    return defaultProfile;
  } catch (error) {
    console.error('Error creating profile:', error);
    return null;
  }
};

// save default profile to Firebase
export const saveWorkoutToFirebase = async (userId: string, data: {
  date: string;
  steps: number;
  heartRate: number;
  aiResponse: string;
  goal: string;
}) => {
  try {
    const docRef = doc(db, 'users', userId, 'aiHistory', data.date + '_' + Date.now());
    await setDoc(docRef, data);
    console.log('Workout saved to Firebase');
  } catch (error) {
    console.error('Error saving workout:', error);
  }
};

export const saveUserProfile = async (userId: string, profile: UserProfile): Promise<void> =>{
  try{
    const userRef = doc(db, 'users' , userId, 'profile', 'data');
    await setDoc(userRef, profile, {merge:true});
    console.log("User profile saved successfully!");
  } catch(error){
    console.error("Error saving user profile: ", error);
    throw error;
  }
};