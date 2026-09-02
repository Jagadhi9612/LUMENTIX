import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from '../config/firebaseConfig';
import { saveUserProfile } from '../services/userService';

type Goal = 'Fat Loss' | 'Muscle Gain' | 'Endurance';

export default function ProfileSetupScreen({ onProfileComplete }: { onProfileComplete: () => void }) {
  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState<Goal>('Fat Loss');
  const [saving, setSaving] = useState(false);
  const[phoneNumber,setPhoneNumber]=useState('');

  const handleSubmit = async () => {
    if (!name || !height || !weight || !age) {
      Alert.alert('Missing info', 'Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      await saveUserProfile(auth.currentUser!.uid, {
        name,
        height: Number(height),
        weight: Number(weight),
        age: Number(age),
        goal,
        phoneNumber,
        sleepHours: 7,
        dailyStepTarget: 8000,
      });
      onProfileComplete();
    } catch (e) {
      Alert.alert('Error', 'Could not save profile, try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your profile</Text>
      <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#888" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Height (cm)" placeholderTextColor="#888" keyboardType="numeric" value={height} onChangeText={setHeight} />
      <TextInput style={styles.input} placeholder="Weight (kg)" placeholderTextColor="#888" keyboardType="numeric" value={weight} onChangeText={setWeight} />
      <TextInput style={styles.input} placeholder="Age" placeholderTextColor="#888" keyboardType="numeric" value={age} onChangeText={setAge} />
      <TextInput style = {styles.input} placeholder="Phone Number" placeholderTextColor="#888 " keyboardType='phone-pad' value={phoneNumber} onChangeText={setPhoneNumber}/>

      <View style={styles.goalRow}>
        {(['Fat Loss', 'Muscle Gain', 'Endurance'] as Goal[]).map((g) => (
          <TouchableOpacity key={g} style={[styles.goalChip, goal === g && styles.goalChipActive]} onPress={() => setGoal(g)}>
            <Text style={[styles.goalText, goal === g && styles.goalTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Continue'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 24, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#111', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 },
  goalRow: { flexDirection: 'row', marginBottom: 20 },
  goalChip: { flex: 1, padding: 10, marginRight: 6, borderRadius: 6, backgroundColor: '#111', alignItems: 'center' },
  goalChipActive: { backgroundColor: '#d10101' },
  goalText: { color: '#888', fontSize: 12 },
  goalTextActive: { color: '#fff', fontWeight: 'bold' },
  button: { backgroundColor: '#d10101', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});