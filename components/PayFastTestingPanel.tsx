import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { COLORS } from '../constants/colors';
import Button from './Button';
import { PayFastDevUtils } from '../utils/payfast-dev';
import { getPayFastConfig, testSignatureGeneration } from '../utils/payfast';

interface PayFastTestingPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function PayFastTestingPanel({ visible, onClose }: PayFastTestingPanelProps) {
  const [testResults, setTestResults] = useState<string[]>([]);

  if (!visible) return null;

  const addTestResult = (result: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${result}`, ...prev.slice(0, 9)]);
  };

  const runConfigTest = () => {
    const { isValid, issues } = PayFastDevUtils.validateConfig();
    addTestResult(`Config test: ${isValid ? 'VALID' : 'INVALID'} ${issues.length > 0 ? `(${issues.join(', ')})` : ''}`);
  };

  const runSignatureTest = () => {
    try {
      const signature = testSignatureGeneration();
      addTestResult(`Signature test: Generated ${signature.substring(0, 16)}...`);
    } catch (error: any) {
      addTestResult(`Signature test: ERROR - ${error.message}`);
    }
  };

  const runSimulatedPayment = async () => {
    try {
      addTestResult('Starting simulated payment...');
      const success = await PayFastDevUtils.simulatePayment({
        orderId: `TEST-${Date.now()}`,
        amount: 150.00,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '0821234567',
        itemName: 'Test Gas Delivery',
        itemDescription: 'Testing PayFast integration',
      });
      addTestResult(`Simulated payment: ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error: any) {
      addTestResult(`Simulated payment: ERROR - ${error.message}`);
    }
  };

  const runAdvancedTest = async () => {
    try {
      addTestResult('Starting advanced test...');
      const success = await PayFastDevUtils.advancedTest({
        orderId: `ADV-TEST-${Date.now()}`,
        amount: 250.00,
        customerName: 'Advanced Test User',
        customerEmail: 'advanced@example.com',
        itemName: 'Advanced Test Order',
      });
      addTestResult(`Advanced test: ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error: any) {
      addTestResult(`Advanced test: ERROR - ${error.message}`);
    }
  };

  const showConfig = () => {
    const config = getPayFastConfig();
    Alert.alert(
      'PayFast Configuration',
      `Merchant ID: ${config.merchantId}\nMerchant Key: ${config.merchantKey}\nUsing Sandbox: ${config.useSandbox}\nSalt Passphrase: ${config.saltPassphrase}`,
      [{ text: 'OK' }]
    );
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>PayFast Testing Panel</Text>
          <Button title="Close" onPress={onClose} style={styles.closeButton} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration Tests</Text>
            <View style={styles.buttonRow}>
              <Button title="Test Config" onPress={runConfigTest} style={styles.testButton} />
              <Button title="Show Config" onPress={showConfig} style={styles.testButton} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Signature Tests</Text>
            <Button title="Test Signature Generation" onPress={runSignatureTest} style={styles.testButton} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Flow Tests</Text>
            <View style={styles.buttonRow}>
              <Button title="Simulated Payment" onPress={runSimulatedPayment} style={styles.testButton} />
              <Button title="Advanced Test" onPress={runAdvancedTest} style={styles.testButton} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <View style={styles.resultsContainer}>
              <Button title="Clear Results" onPress={clearResults} style={styles.clearButton} />
              {testResults.length === 0 ? (
                <Text style={styles.noResults}>No test results yet</Text>
              ) : (
                testResults.map((result, index) => (
                  <Text key={index} style={styles.resultText}>{result}</Text>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  panel: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  testButton: {
    flex: 1,
    paddingVertical: 10,
  },
  clearButton: {
    marginBottom: 10,
  },
  resultsContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  noResults: {
    color: COLORS.text.gray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  resultText: {
    color: COLORS.text.white,
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});