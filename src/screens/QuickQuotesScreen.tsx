// src/screens/QuickQuotesScreen.tsx
// This screen is a placeholder for your "Get Quick Quotes" module.

import React, { useState } from 'react';

import {  ScrollView, View, ActivityIndicator, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'; // Ensure StyleSheet is explicitly imported here
// Import common components - assuming these are already named exports
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

// Placeholder for a function to fetch quotes
interface Quote {
  id: string;
  service: string;
  price: number;
  description: string;
}

const fetchQuickQuote = async (serviceType: string): Promise<Quote> => {
  // Simulate an API call delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const quotes: { [key: string]: Quote } = { // Explicitly type quotes object
        'painting': { id: 'q1', service: 'House Painting', price: 1200, description: 'Full interior painting for a 3-bedroom house.' },
        'plumbing': { id: 'q2', service: 'Plumbing Repair', price: 350, description: 'Standard plumbing fixture repair and inspection.' },
        'cleaning': { id: 'q3', service: 'Deep Cleaning', price: 250, description: 'Thorough deep cleaning for an apartment.' },
        'default': { id: 'q4', service: 'General Service', price: 500, description: 'Custom service quote.' }
      };
      const selectedQuote = quotes[serviceType.toLowerCase()] || quotes.default;
      resolve(selectedQuote);
    }, 1500);
  });
};

// QuickQuotesScreen component - now a named export
export const QuickQuotesScreen: React.FC = () => { // Changed to named export
  const [serviceType, setServiceType] = useState<string>('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetQuote = async () => {
    setError(null);
    setQuote(null);
    setLoading(true);
    try {
      if (!serviceType.trim()) {
        setError('Please enter a service type.');
        return;
      }
      const newQuote = await fetchQuickQuote(serviceType);
      setQuote(newQuote);
    } catch (err: any) {
      setError('Failed to get quote: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={quickQuotesScreenStyles.container}>
      <View style={quickQuotesScreenStyles.card}>
        <Text style={quickQuotesScreenStyles.title}>Get Quick Quotes</Text>
        <Text style={quickQuotesScreenStyles.description}>
          Enter a service type (e.g., "painting", "plumbing", "cleaning") to get an estimated quote.
        </Text>

        <Input
          placeholder="Enter service type (e.g., painting)"
          value={serviceType}
          onChangeText={setServiceType}
          style={quickQuotesScreenStyles.input}
        />

        <Button
          title="Get Quote"
          onPress={handleGetQuote}
          disabled={loading}
          style={quickQuotesScreenStyles.button}
        />

        {loading && <ActivityIndicator size="large" color="#6200EE" style={quickQuotesScreenStyles.loadingIndicator} />}

        {error && <Text style={quickQuotesScreenStyles.errorText}>{error}</Text>}

        {quote && (
          <View style={quickQuotesScreenStyles.quoteResult}>
            <Text style={quickQuotesScreenStyles.quoteTitle}>Quote Details:</Text>
            <View style={quickQuotesScreenStyles.infoRow}>
              <Text style={quickQuotesScreenStyles.label}>Service:</Text>
              <Text style={quickQuotesScreenStyles.value}>{quote.service}</Text>
            </View>
            <View style={quickQuotesScreenStyles.infoRow}>
              <Text style={quickQuotesScreenStyles.label}>Price:</Text>
              <Text style={quickQuotesScreenStyles.value}>${quote.price.toFixed(2)}</Text>
            </View>
            <View style={quickQuotesScreenStyles.infoRow}>
              <Text style={quickQuotesScreenStyles.label}>Description:</Text>
              <Text style={quickQuotesScreenStyles.value}>{quote.description}</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const quickQuotesScreenStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    marginBottom: 20,
    width: '100%',
  },
  button: {
    width: '100%',
  },
  loadingIndicator: {
    marginTop: 20,
  },
  errorText: {
    color: '#D32F2F',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
  },
  quoteResult: {
    marginTop: 30,
    width: '100%',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
  quoteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#444',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  value: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
    marginLeft: 10,
    textAlign: 'right',
  },
});
