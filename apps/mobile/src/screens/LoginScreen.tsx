import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
//import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      if (isSignupMode) {
        // Agar switch ON hai, toh naya account banao
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Signed up and logged in:', userCredential.user.uid);
        onLoginSuccess();
      } else {
        // Agar switch OFF hai, toh purane account se login karo
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Logged in:', userCredential.user.uid);
        onLoginSuccess();
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        Alert.alert('Login Failed', 'Incorrect email or password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert('Login Failed', 'No account found with this email.');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Too Many Attempts', 'Account temporarily locked. Try again later.');
      } else if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Signup Failed', 'An account already exists with this email.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Signup Failed', 'Password should be at least 6 characters.');
      } else {
        Alert.alert('Login Failed', error.message);
      }
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Elite Fitness</Text>
      <Text style={styles.subtitle}>Member Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading 
            ? (isSignupMode ? 'Signing up...' : 'Logging in...') 
            : (isSignupMode ? 'Sign Up' : 'Login')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsSignupMode(!isSignupMode)}>
          <Text style={styles.toggleText}>
            {isSignupMode ? 'Already have an account? Login' : "New user? Sign up"}
          </Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#e40f00', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: '#1a1a1a', color: '#fff', padding: 14,
    borderRadius: 10, marginBottom: 16, fontSize: 14,
    borderWidth: 1, borderColor: '#333'
  },
  button: { backgroundColor: '#9d0d02', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  toggleText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
});