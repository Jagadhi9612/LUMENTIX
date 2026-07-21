import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  getResponseHistory,
  convertToCSV,
  AIResponseRecord
} from '../services/responseTracker';

type Period = '7days' | '1month' | '1year';

export default function HistoryScreen() {
  const [history, setHistory] = useState<AIResponseRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('7days');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [selectedPeriod]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await getResponseHistory(selectedPeriod);
    // Latest pehle dikhao
    setHistory(data.reverse());
    setLoading(false);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const data = await getResponseHistory(selectedPeriod);
      const csv = convertToCSV(data);

      // Phone mein file likhna
      const fileName = `elite_fitness_history_${selectedPeriod}_${Date.now()}.csv`;
      const filePath = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(filePath, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share/download karna
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Save or Share Your Fitness History',
        });
      } else {
        Alert.alert('Exported!', `File saved at: ${filePath}`);
      }
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    }
    setExporting(false);
  };

  const periodLabel = {
    '7days': 'Last 7 Days',
    '1month': 'Last Month',
    '1year': 'Last Year',
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 AI Response History</Text>

      {/* Period Filter Buttons */}
      <View style={styles.filterRow}>
        {(['7days', '1month', '1year'] as Period[]).map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.filterBtn,
              selectedPeriod === period && styles.filterBtnActive
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.filterText,
              selectedPeriod === period && styles.filterTextActive
            ]}>
              {periodLabel[period]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Export Button */}
      <TouchableOpacity
        style={styles.exportBtn}
        onPress={handleExportCSV}
        disabled={exporting || history.length === 0}
      >
        <Text style={styles.exportText}>
          {exporting ? 'Exporting...' : '📥 Export as CSV'}
        </Text>
      </TouchableOpacity>

      {/* Stats Summary */}
      <View style={styles.statsBox}>
        <Text style={styles.statsText}>
          Total sessions: {history.length}
        </Text>
        {history.length > 0 && (
          <Text style={styles.statsText}>
            Avg steps: {Math.round(history.reduce((a, r) => a + r.steps, 0) / history.length).toLocaleString()}
          </Text>
        )}
      </View>

      {/* History List */}
      {loading ? (
        <ActivityIndicator color="#9d0d02" size ="large" style={{ marginTop: 40 }} />
      ) : history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No records found for {periodLabel[selectedPeriod]}</Text>
          <Text style={styles.emptySubText}>Ask AI Trainer to start tracking!</Text>
        </View>
      ) : (
        history.map((record) => (
          <View key={record.id} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <Text style={styles.recordDate}>{record.date}</Text>
              <Text style={styles.recordTime}>{record.time}</Text>
            </View>
            <View style={styles.metricsRow}>
              <Text style={styles.metricChip}>👟 {record.steps} steps</Text>
              <Text style={styles.metricChip}>❤️ {record.heartRate} BPM</Text>
              <Text style={styles.metricChip}>😴 {record.sleepHours}h sleep</Text>
            </View>
            <Text style={styles.goalText}>Goal: {record.goal}</Text>
            <Text style={styles.aiLabel}>🤖 AI Response:</Text>
            <Text style={styles.aiText}>{record.aiResponse}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '', marginBottom: 16, textAlign: 'center' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  filterBtn: { flex: 1, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#555', marginHorizontal: 4, alignItems: 'center' },
  filterBtnActive: { backgroundColor: '', borderColor: '' },
  filterText: { color: '#888', fontSize: 12 },
  filterTextActive: { color: '#000', fontWeight: 'bold' },
  exportBtn: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#FFD700' },
  exportText: { color: '', fontSize: 14, fontWeight: 'bold' },
  statsBox: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-around' },
  statsText: { color: '#90EE90', fontSize: 13 },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#888', fontSize: 16, marginBottom: 8 },
  emptySubText: { color: '#555', fontSize: 13 },
  recordCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  recordDate: { color: '', fontWeight: 'bold', fontSize: 14 },
  recordTime: { color: '#888', fontSize: 13 },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  metricChip: { color: '#fff', fontSize: 12, backgroundColor: '#2a2a2a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginBottom: 4 },
  goalText: { color: '#90EE90', fontSize: 12, marginBottom: 8 },
  aiLabel: { color: '', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  aiText: { color: '#ddd', fontSize: 13, lineHeight: 20 },
});