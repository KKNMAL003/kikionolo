import React from 'react';
import { View, StyleSheet } from 'react-native';
import { reportError } from '../utils/errorReporting';
import { BaseText } from './base/BaseText';
import { BaseButton } from './base/BaseButton';
import { colors } from '../theme/colors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, info);
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={styles.container} accessibilityRole="alert" accessibilityLabel="Error message">
          <BaseText style={styles.title}>Something went wrong.</BaseText>
          <BaseText style={styles.message}>{this.state.error?.message}</BaseText>
          <BaseButton onPress={this.handleReset} accessibilityLabel="Try Again" variant="danger">
            Try Again
          </BaseButton>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.error,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    color: colors.text.primary,
    textAlign: 'center',
  },
}); 