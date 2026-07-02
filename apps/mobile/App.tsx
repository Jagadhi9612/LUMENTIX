import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useStepCounter } from './src/hooks/useStepCounter';

export default function App() {
  const { steps, isAvailable } = useStepCounter();

   return (
    <View style={styles.container}>
      <Text style={styles.title}>Elite Fitness</Text>
      <Text style={styles.label}>
        Step Counter: {isAvailable ? 'Available' : 'Not Available'}
      </Text>
      <Text style={styles.steps}>Steps: {steps}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
  },
  steps: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
  },
});
