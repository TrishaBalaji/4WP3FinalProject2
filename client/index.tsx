import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';

type Inspiration = {
  id: number;
  summary: string;
  explanation: string;
  visual: string | null;
  priority: number;
};

const API_URL = 'http://localhost:3000/api';

export default function Index() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [summary, setSummary] = useState('');
  const [explanation, setExplanation] = useState('');
  const [priority, setPriority] = useState('');
  const [message, setMessage] = useState('App loaded.');

  async function fetchData() {
    try {
      setMessage('Fetching data...');
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: Inspiration[] = await response.json();
      setInspirations(data);
      setMessage(`Loaded ${data.length} item(s).`);
      console.log('GET success:', data);
    } catch (error: any) {
      console.log('GET error:', error);
      setMessage(`Fetch failed: ${error?.message || 'Unknown error'}`);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);
  
  function loadIntoForm(item: Inspiration) {
    setSelectedId(String(item.id));
    setSummary(item.summary);
    setExplanation(item.explanation);
    setPriority(String(item.priority));
    setMessage(`Loaded item ${item.id} into form.`);
  }
 
return (
    <View style={styles.container}>
      <Text style={styles.title}>Art Inspirations</Text>
      <Text style={styles.message}>{message}</Text>

      <View style={styles.listSection}>
        <FlatList
          data={inspirations}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>No inspirations found.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => loadIntoForm(item)}>
              <Text style={styles.cardTitle}>ID: {item.id} | {item.summary}</Text>
              <Text style={styles.cardText}>{item.explanation}</Text>
              <Text style={styles.cardText}>Priority: {item.priority}</Text>
              <Text style={styles.tapHint}>Tap to load into form</Text>
            </Pressable>
          )}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.placeholderText}>Form controls coming next.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  message: {
    textAlign: 'center',
    color: 'red',
    marginVertical: 10,
    paddingHorizontal: 12
  },
  listSection: {
    flex: 4,
    backgroundColor: '#DFFFFF',
    padding: 10,
    justifyContent: 'center'
  },
  formSection: {
    flex: 3,
    backgroundColor: '#fbe9fc',
    padding: 12,
    justifyContent: 'center'
  },
  placeholderText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#555'
  }
  card: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  cardText: {
    fontSize: 15,
    marginTop: 4
  },
  tapHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#666'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16
  }
});
  
