import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import CustomTextInput from '../../components/CustomTextInput';
import Button from '../../components/Button';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginAsGuest, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Clear network error when inputs change
  useEffect(() => {
    if (networkError) {
      setNetworkError(null);
    }
  }, [email, password]);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please enter both email and password.',
        position: 'bottom',
      });
      return;
    }

    // Clear any previous errors
    setNetworkError(null);

    try {
      const success = await login(email, password);
      if (success) {
        router.replace('/(tabs)');
      } else {
        // Display error in toast
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: 'Invalid email or password. Please try again.',
          position: 'bottom',
        });
      }
    } catch (error: any) {
      console.error('Login screen error:', error);
      
      // Check if the error is a network error
      if (error.message?.includes('Network request failed') || 
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('CORS')) {
        // Set network error to display the CORS help banner
        setNetworkError(
          'Connection issue detected. If you\'re in development mode, please configure CORS in your Supabase dashboard.'
        );
      } else {
        // Show regular error toast
        Toast.show({
          type: 'error',
          text1: 'Login Error',
          text2: error.message || 'An unexpected error occurred',
          position: 'bottom',
        });
      }
    }
  };

  const handleGuestLogin = async () => {
    try {
      await loginAsGuest();
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Guest login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Guest Login Failed',
        text2: error.message || 'Failed to login as guest',
        position: 'bottom',
      });
    }
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  const handleBack = () => {
    router.replace('/welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text.white} />
      </TouchableOpacity>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../assets/images/onolo-logo-new.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.appName}>Onolo Gas</Text>
            </View>

            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>Welcome back! Please sign in to continue.</Text>

            {/* Network Error Banner */}
            {networkError && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={20} color="#FFD700" />
                <Text style={styles.errorBannerText}>{networkError}</Text>
              </View>
            )}

            <View style={styles.form}>
              <CustomTextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
                returnKeyType="next"
              />

              <CustomTextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <Button
                title="Login"
                onPress={handleLogin}
                loading={isLoading}
                style={styles.loginButton}
              />

              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title="Continue as Guest"
                onPress={handleGuestLogin}
                variant="outline"
                style={styles.guestButton}
              />

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={handleRegister}>
                  <Text style={styles.registerLink}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 0,
  },
  appName: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.text.gray,
    fontSize: 16,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: 16,
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.text.gray,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  guestButton: {
    marginBottom: 24,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  registerText: {
    color: COLORS.text.gray,
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    color: COLORS.text.white,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});