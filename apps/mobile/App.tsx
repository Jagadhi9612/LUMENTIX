import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebaseConfig';
import LoginScreen from './src/screens/LoginScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import AITrainerScreen from './src/screens/AITrainerScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { getUserProfile } from './src/services/userService';
import { TouchableOpacity, Text } from 'react-native';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'trainer' | 'history'>('trainer');

  useEffect(() => {
    // Firebase auth state checking 
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setHasProfile(!!profile);
      } else {
        setHasProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  if (hasProfile === null) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  if (!hasProfile) {
    return <ProfileSetupScreen onProfileComplete={() => setHasProfile(true)} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trainer' && styles.tabActive]}
          onPress={() => setActiveTab('trainer')}
        >
          <Text style={[styles.tabText, activeTab === 'trainer' && styles.tabTextActive]}>
            AI Trainer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'trainer' ? <AITrainerScreen /> : <HistoryScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', backgroundColor: '#111', paddingTop: 50, paddingBottom: 10 },
  tab: { flex: 1, alignItems: 'center', padding: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#d10101' },
  tabText: { color: '#888', fontSize: 14 },
  tabTextActive: { color: '#d10101', fontWeight: 'bold' },
});