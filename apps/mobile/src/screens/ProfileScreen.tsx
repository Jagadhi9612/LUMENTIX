import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { auth } from '../config/firebaseConfig';
import { getUserProfile, UserProfile } from '../services/userService';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (auth.currentUser) {
        const data = await getUserProfile(auth.currentUser.uid);
        setProfile(data);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const exportFullUserData = async () => {
    if (!profile) return;
    try {
      const csvHeader = "Name,Age,Weight,Goal,Phone\n";
      const csvRow = `${profile.name},${profile.age},${profile.weight},${profile.goal},${profile.phoneNumber || 'N/A'}\n`;
      const csvContent = csvHeader + csvRow;

      const fileName = `EliteFitness_Profile_${Date.now()}.csv`;
      
      // 🔥 TypeScript error bypass trick using 'any'
      const dir = (FileSystem as any).documentDirectory;
      const filePath = dir + fileName;

      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Profile Data',
        });
      } else {
        Alert.alert('Success', `Data saved locally to: ${filePath}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#d10101" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 My Profile</Text>

      {profile && (
        <View style={styles.card}>
          <Text style={styles.text}>Name: {profile.name}</Text>
          <Text style={styles.text}>Age: {profile.age}</Text>
          <Text style={styles.text}>Weight: {profile.weight} kg</Text>
          <Text style={styles.text}>Goal: {profile.goal}</Text>
          <Text style={styles.text}>Phone: {profile.phoneNumber || 'Not provided'}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.exportBtn} onPress={exportFullUserData}>
        <Text style={styles.exportBtnText}>📥 Export My Data (CSV)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 24, alignItems: 'center' },
  loaderContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  card: { backgroundColor: '#111', padding: 20, borderRadius: 10, width: '100%', marginBottom: 30 },
  text: { color: '#888', fontSize: 16, marginBottom: 12 },
  exportBtn: { backgroundColor: '#FFD700', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  exportBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});