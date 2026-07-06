import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import AITrainerScreen from './src/screens/AITrainerScreen';
import HistoryScreen from './src/screens/HistoryScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<'trainer' | 'history'>('trainer');

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trainer' && styles.tabActive]}
          onPress={() => setActiveTab('trainer')}
        >
          <Text style={[styles.tabText, activeTab === 'trainer' && styles.tabTextActive]}>
            🤖 AI Trainer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            📊 History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      {activeTab === 'trainer' ? <AITrainerScreen /> : <HistoryScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', backgroundColor: '#111', paddingTop: 50, paddingBottom: 10 },
  tab: { flex: 1, alignItems: 'center', padding: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  tabText: { color: '#888', fontSize: 14 },
  tabTextActive: { color: '#FFD700', fontWeight: 'bold' },
});