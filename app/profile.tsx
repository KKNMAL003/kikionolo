import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  FlatList, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { useRouter } from 'expo-router';
import { useUser, ProfileUpdateProgress as UserProfileUpdateProgress } from '../context/UserContext';
import Toast from 'react-native-toast-message';
import CustomTextInput from '../components/CustomTextInput';
import AddressValidator, { AddressValidationResult } from '../components/AddressValidator';
import ProfileUpdateProgress from '../components/ProfileUpdateProgress';
import { validateField, validateProfileData } from '../utils/profileValidation';

type TabType = 'orders' | 'profile' | 'settings';
type SettingsScreenType = 'main' | 'notifications' | 'privacy' | 'payment' | 'help';

interface FormErrors {
  [key: string]: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  streetAddress: string;
  apartment: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUserProfile, isAuthenticated, orders, cancelOrder } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<UserProfileUpdateProgress[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    streetAddress: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'South Africa',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null);
  const [settingsScreen, setSettingsScreen] = useState<SettingsScreenType>('main');
  
  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      // Parse existing address or use empty values
      const existingAddress = user.address || '';
      const addressParts = parseAddress(existingAddress);
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        streetAddress: addressParts.streetAddress,
        apartment: addressParts.apartment,
        city: addressParts.city,
        state: addressParts.state,
        postalCode: addressParts.postalCode,
        country: addressParts.country || 'South Africa',
      });
    }
  }, [user]);

  // Parse existing address into components
  const parseAddress = useCallback((address: string) => {
    if (!address) {
      return {
        streetAddress: '',
        apartment: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'South Africa'
      };
    }

    // Simple parsing - in a real app, you'd want more sophisticated parsing
    const parts = address.split(',').map(part => part.trim());
    return {
      streetAddress: parts[0] || '',
      apartment: '',
      city: parts[1] || '',
      state: parts[2] || '',
      postalCode: parts[3] || '',
      country: parts[4] || 'South Africa'
    };
  }, []);

  // Combine address parts into a single string
  const combineAddress = useCallback((formData: FormData) => {
    const addressParts = [
      formData.streetAddress,
      formData.apartment,
      formData.city,
      formData.state,
      formData.postalCode,
      formData.country
    ].filter(part => part && part.trim() !== '');
    
    return addressParts.join(', ');
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear existing error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time validation
    const validation = validateField(field, value);
    if (!validation.isValid && validation.error) {
      setFormErrors(prev => ({ ...prev, [field]: validation.error || '' }));
    }
  }, [formErrors]);

  const handleAddressValidation = useCallback((result: AddressValidationResult) => {
    setAddressValidation(result);
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};
    
    // Validate the complete form data including individual address fields
    const validationResult = validateProfileData(formData);
    
    if (!validationResult.isValid) {
      // Map validation errors to form errors
      Object.entries(validationResult.errors).forEach(([field, fieldErrors]) => {
        if (fieldErrors && fieldErrors.length > 0) {
          errors[field] = fieldErrors[0]; // Take the first error for each field
        }
      });
    }
    
    // Address validation
    if (addressValidation && !addressValidation.isValid) {
      errors.streetAddress = 'Please review your address based on the suggestions above';
    }
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: firstError,
        position: 'bottom',
        visibilityTime: 4000,
      });
      return false;
    }
    
    return true;
  }, [formData, addressValidation]);

  // Simplified and more robust handleSaveProfile
  const handleSaveProfile = useCallback(async () => {
    console.log('handleSaveProfile: Starting profile update');
    
    // Prevent multiple simultaneous save attempts
    if (isSaving) {
      console.log('handleSaveProfile: Save already in progress, ignoring duplicate request');
      return;
    }

    setIsSaving(true);
    setShowProgress(true);
    setUpdateProgress([]);
    
    try {
      dismissKeyboard();
      
      // Validate form first
      console.log('handleSaveProfile: Starting form validation...');
      if (!validateForm()) {
        console.log('handleSaveProfile: Form validation failed.');
        return;
      }
      console.log('handleSaveProfile: Form validation passed.');

      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log('handleSaveProfile: Component unmounted, aborting save.');
        return;
      }

      // Prepare cleaned data for submission - map form data to User interface
      const cleanedData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: combineAddress(formData),
        // Include individual address fields for validation
        streetAddress: formData.streetAddress.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim(),
      };

      console.log('handleSaveProfile: Cleaned data prepared:', cleanedData);

      // Call the simplified update function with better timeout handling
      const result = await updateUserProfile(cleanedData);
      
      // Update progress state
      setUpdateProgress(result.progress);
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) {
        console.log('handleSaveProfile: Component unmounted after update, not updating UI.');
        return;
      }

      if (result.success) {
        console.log('handleSaveProfile: Profile updated successfully.');
        setIsEditing(false);
        setShowProgress(false);
      } else {
        console.log('handleSaveProfile: Profile update failed:', result.error);
        
        // Keep progress visible for user to see what went wrong
        setTimeout(() => {
          if (isMountedRef.current) {
            setShowProgress(false);
          }
        }, 5000);
      }
    } catch (error: any) {
      console.error('handleSaveProfile: Error caught in outer catch block:', error.message);
      
      if (isMountedRef.current) {
        setShowProgress(false);
        
        let errorMessage = 'An unexpected error occurred. Please try again.';
        
        if (error.message?.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message?.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }

        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: errorMessage,
          position: 'bottom',
          visibilityTime: 6000,
        });
      }
    } finally {
      console.log('handleSaveProfile: Finally block entered. Setting isSaving to false.');
      // Always reset loading state if component is still mounted
      if (isMountedRef.current) {
        console.log('handleSaveProfile: Component still mounted, resetting isSaving to false.');
        setIsSaving(false);
      } else {
        console.log('handleSaveProfile: Component unmounted in finally block, not updating state.');
      }
      console.log('handleSaveProfile: End of finally block.');
    }
  }, [formData, updateUserProfile, validateForm, combineAddress, dismissKeyboard, isSaving]);

  const handleCancelEdit = useCallback(() => {
    // Prevent canceling while saving
    if (isSaving) {
      return;
    }

    dismissKeyboard();
    setIsEditing(false);
    setShowProgress(false);
    setFormErrors({});
    setAddressValidation(null);
    
    // Reset form data to original user data
    if (user) {
      const existingAddress = user.address || '';
      const addressParts = parseAddress(existingAddress);
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        streetAddress: addressParts.streetAddress,
        apartment: addressParts.apartment,
        city: addressParts.city,
        state: addressParts.state,
        postalCode: addressParts.postalCode,
        country: addressParts.country || 'South Africa',
      });
    }
  }, [user, parseAddress, dismissKeyboard, isSaving]);

  const handleLogout = async () => {
    await logout();
    // Use replace to reset navigation stack and prevent going back to profile
    router.replace('/(tabs)');
  };

  const handleLogin = () => {
    // Use replace to prevent stacking
    router.replace('/auth/login');
  };

  const handleClose = () => {
    dismissKeyboard();
    // Use replace to prevent stacking when going back to tabs
    router.replace('/(tabs)');
  };

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            const success = await cancelOrder(orderId);
            if (success) {
              Toast.show({
                type: 'success',
                text1: 'Order Cancelled',
                text2: 'Your order has been cancelled successfully.',
                position: 'bottom',
              });
            } else {
              Toast.show({
                type: 'error',
                text1: 'Cancellation Failed',
                text2: 'Failed to cancel your order. Please try again.',
                position: 'bottom',
              });
            }
          },
        },
      ]
    );
  };

  const handleViewOrderDetails = (orderId: string) => {
    // Use push for order details since it's a different screen type
    router.push(`/order/${orderId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFC107'; // Amber
      case 'delivered':
        return '#4CAF50'; // Green
      case 'cancelled':
        return '#F44336'; // Red
      default:
        return COLORS.text.gray;
    }
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => handleViewOrderDetails(item.id)}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>Order #{item.id.slice(-6)}</Text>
          <Text style={styles.orderDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderItems}>
        {item.items.slice(0, 2).map((orderItem, index) => (
          <View key={index} style={styles.orderItemRow}>
            <Text style={styles.orderItemName}>{orderItem.productName} x{orderItem.quantity}</Text>
            <Text style={styles.orderItemPrice}>R {(orderItem.price * orderItem.quantity).toFixed(2)}</Text>
          </View>
        ))}
        {item.items.length > 2 && (
          <Text style={styles.moreItemsText}>+{item.items.length - 2} more items</Text>
        )}
      </View>
      
      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.orderTotal}>Total: R {item.totalAmount.toFixed(2)}</Text>
          <Text style={styles.orderPayment}>{item.paymentMethod.toUpperCase()}</Text>
        </View>
        
        <View style={styles.orderActions}>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => handleViewOrderDetails(item.id)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          
          {item.status === 'pending' && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => handleCancelOrder(item.id)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Empty state for orders
  const renderOrdersEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="document-text-outline" size={64} color={COLORS.text.gray} />
      <Text style={styles.emptyStateText}>You have no orders yet.</Text>
      <Button 
        title="Browse Products" 
        onPress={() => router.replace('/(tabs)/order')}
        style={styles.browseButton}
      />
    </View>
  );

  // Orders list data preparation
  const sortedOrders = orders?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  // Render different tab content without nesting ScrollViews
  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        // Use FlatList directly without wrapping in ScrollView
        return (
          <FlatList
            data={sortedOrders}
            renderItem={renderOrderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.ordersList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Text style={styles.sectionTitle}>Your Orders</Text>
            }
            ListEmptyComponent={renderOrdersEmptyState}
            style={styles.ordersListContainer}
          />
        );

      case 'profile':
        return (
          <KeyboardAvoidingView 
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          >
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <ScrollView 
                style={styles.profileScrollView}
                contentContainerStyle={styles.profileScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.sectionTitle}>Profile Information</Text>
                
                {/* Show progress during update */}
                {showProgress && updateProgress.length > 0 && (
                  <ProfileUpdateProgress steps={updateProgress.map(p => ({
                    id: p.step,
                    title: p.step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    status: p.status,
                    description: p.message || p.error
                  }))} />
                )}
                
                {isEditing ? (
                  <View style={styles.profileSection}>
                    <View style={styles.inputGroup}>
                      <CustomTextInput
                        label="Full Name *"
                        value={formData.name}
                        onChangeText={(text) => handleChange('name', text)}
                        placeholder="Enter your full name"
                        returnKeyType="next"
                        editable={!isSaving}
                        autoCapitalize="words"
                        error={formErrors.name}
                      />
                    </View>
                    
                    <View style={styles.inputGroup}>
                      <CustomTextInput
                        label="Email"
                        value={formData.email}
                        onChangeText={(text) => handleChange('email', text)}
                        placeholder="Enter your email address"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!user?.isGuest && !isSaving}
                        returnKeyType="next"
                        error={formErrors.email}
                      />
                      {user?.isGuest && (
                        <Text style={styles.helperText}>
                          📧 Create an account to use email features
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.inputGroup}>
                      <CustomTextInput
                        label="Phone Number *"
                        value={formData.phone}
                        onChangeText={(text) => handleChange('phone', text)}
                        placeholder="Enter your phone number"
                        keyboardType="phone-pad"
                        returnKeyType="next"
                        editable={!isSaving}
                        error={formErrors.phone}
                      />
                      <Text style={styles.helperText}>
                        📞 Used for delivery coordination
                      </Text>
                    </View>

                    {/* Enhanced Address Section */}
                    <View style={styles.addressSection}>
                      <Text style={styles.addressSectionTitle}>📍 Delivery Address</Text>
                      
                      <View style={styles.inputGroup}>
                        <CustomTextInput
                          label="Street Address *"
                          value={formData.streetAddress}
                          onChangeText={(text) => handleChange('streetAddress', text)}
                          placeholder="e.g., 123 Main Street"
                          returnKeyType="next"
                          editable={!isSaving}
                          autoCapitalize="words"
                          error={formErrors.streetAddress}
                        />
                        
                        {/* Address Validation Component */}
                        <AddressValidator
                          address={combineAddress(formData)}
                          onValidationComplete={handleAddressValidation}
                          enabled={formData.streetAddress.length > 5 && formData.city.length > 1}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <CustomTextInput
                          label="Apartment, Suite, Unit (Optional)"
                          value={formData.apartment}
                          onChangeText={(text) => handleChange('apartment', text)}
                          placeholder="e.g., Apt 4B, Suite 100"
                          returnKeyType="next"
                          editable={!isSaving}
                          autoCapitalize="words"
                        />
                      </View>

                      <View style={styles.inputRow}>
                        <View style={styles.inputHalf}>
                          <CustomTextInput
                            label="City *"
                            value={formData.city}
                            onChangeText={(text) => handleChange('city', text)}
                            placeholder="e.g., Johannesburg"
                            returnKeyType="next"
                            editable={!isSaving}
                            autoCapitalize="words"
                            error={formErrors.city}
                          />
                        </View>
                        <View style={styles.inputHalf}>
                          <CustomTextInput
                            label="State/Province"
                            value={formData.state}
                            onChangeText={(text) => handleChange('state', text)}
                            placeholder="e.g., Gauteng"
                            returnKeyType="next"
                            editable={!isSaving}
                            autoCapitalize="words"
                          />
                        </View>
                      </View>

                      <View style={styles.inputRow}>
                        <View style={styles.inputHalf}>
                          <CustomTextInput
                            label="ZIP/Postal Code"
                            value={formData.postalCode}
                            onChangeText={(text) => handleChange('postalCode', text)}
                            placeholder="e.g., 2000"
                            returnKeyType="next"
                            editable={!isSaving}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.inputHalf}>
                          <CustomTextInput
                            label="Country"
                            value={formData.country}
                            onChangeText={(text) => handleChange('country', text)}
                            placeholder="South Africa"
                            returnKeyType="done"
                            editable={!isSaving}
                            autoCapitalize="words"
                          />
                        </View>
                      </View>

                      <Text style={styles.helperText}>
                        🚚 This will be your primary delivery address for orders
                      </Text>
                    </View>
                    
                    <View style={styles.buttonRow}>
                      <Button 
                        title="Cancel" 
                        onPress={handleCancelEdit}
                        style={[styles.button, styles.cancelButtonStyle]}
                        variant="outline"
                        disabled={isSaving}
                      />
                      <Button 
                        title={isSaving ? "Saving..." : "Save Changes"} 
                        onPress={handleSaveProfile}
                        style={[styles.button, styles.saveButton]}
                        loading={isSaving}
                        disabled={isSaving || !formData.name.trim()}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.profileSection}>
                    <View style={styles.profileItem}>
                      <Text style={styles.profileLabel}>Name</Text>
                      <Text style={styles.profileValue}>{user?.name || 'Not set'}</Text>
                    </View>
                    <View style={styles.profileItem}>
                      <Text style={styles.profileLabel}>Email</Text>
                      <Text style={styles.profileValue}>{user?.email || 'Not set'}</Text>
                    </View>
                    <View style={styles.profileItem}>
                      <Text style={styles.profileLabel}>Phone</Text>
                      <Text style={styles.profileValue}>{user?.phone || 'Not set'}</Text>
                    </View>
                    <View style={styles.profileItem}>
                      <Text style={styles.profileLabel}>Delivery Address</Text>
                      <Text style={styles.profileValue}>{user?.address || 'Not set'}</Text>
                    </View>
                    
                    <Button 
                      title="Edit Profile" 
                      onPress={() => setIsEditing(true)}
                      style={styles.editButton}
                      disabled={isSaving}
                    />
                  </View>
                )}
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        );

      case 'settings':
        return (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.settingsSection}>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setSettingsScreen('notifications')}
              >
                <Ionicons name="notifications-outline" size={24} color={COLORS.text.white} />
                <Text style={styles.settingText}>Notifications</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.gray} style={styles.settingArrow} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setSettingsScreen('privacy')}
              >
                <Ionicons name="lock-closed-outline" size={24} color={COLORS.text.white} />
                <Text style={styles.settingText}>Privacy & Security</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.gray} style={styles.settingArrow} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => router.replace('/(tabs)/chat')}
              >
                <Ionicons name="help-circle-outline" size={24} color={COLORS.text.white} />
                <Text style={styles.settingText}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.gray} style={styles.settingArrow} />
              </TouchableOpacity>
              
              {user ? (
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
                  <Text style={[styles.settingText, { color: COLORS.error }]}>Sign Out</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={handleLogin}
                >
                  <Ionicons name="log-in-outline" size={24} color={COLORS.primary} />
                  <Text style={[styles.settingText, { color: COLORS.primary }]}>Sign In</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  // Count pending orders for badge
  const pendingOrdersCount = orders?.filter(order => order.status === 'pending').length || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrapper}>
        <Header showBackButton />
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
        >
          <Ionicons name="close" size={24} color={COLORS.text.white} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={60} color={COLORS.text.white} />
          </View>
          <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
          
          {pendingOrdersCount > 0 && (
            <TouchableOpacity 
              style={styles.orderBadge}
              onPress={() => setActiveTab('orders')}
            >
              <Text style={styles.orderBadgeText}>
                {pendingOrdersCount} Pending Order{pendingOrdersCount > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
          
          {!isAuthenticated && (
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'orders' && styles.activeTab]} 
            onPress={() => {
              setActiveTab('orders');
              setSettingsScreen('main');
              dismissKeyboard();
            }}
          >
            <View style={styles.tabContentWrapper}>
              <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
                Orders
              </Text>
              {pendingOrdersCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{pendingOrdersCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'profile' && styles.activeTab]} 
            onPress={() => {
              setActiveTab('profile');
              setSettingsScreen('main');
              dismissKeyboard();
            }}
          >
            <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
              Profile
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'settings' && styles.activeTab]} 
            onPress={() => {
              setActiveTab('settings');
              setSettingsScreen('main');
              dismissKeyboard();
            }}
          >
            <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  headerWrapper: {
    position: 'relative',
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    color: COLORS.text.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  orderBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 16,
  },
  orderBadgeText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  loginButtonText: {
    color: COLORS.text.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 30,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 30,
  },
  activeTab: {
    backgroundColor: COLORS.background,
  },
  tabText: {
    color: COLORS.text.gray,
    fontSize: 16,
  },
  activeTabText: {
    color: COLORS.text.white,
    fontWeight: 'bold',
  },
  tabContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: COLORS.text.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  // Updated styles for better scroll handling
  keyboardAvoidingView: {
    flex: 1,
  },
  profileScrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileScrollContent: {
    paddingBottom: 140,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    color: COLORS.text.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  emptyStateContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
  },
  emptyStateText: {
    color: COLORS.text.gray,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  browseButton: {
    width: '100%',
  },
  ordersListContainer: {
    flex: 1,
  },
  ordersList: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    color: COLORS.text.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderDate: {
    color: COLORS.text.gray,
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderItemName: {
    color: COLORS.text.white,
    fontSize: 14,
    flex: 1,
  },
  orderItemPrice: {
    color: COLORS.text.white,
    fontSize: 14,
  },
  moreItemsText: {
    color: COLORS.text.gray,
    fontSize: 12,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  orderTotal: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderPayment: {
    color: COLORS.text.gray,
    fontSize: 12,
    marginTop: 4,
  },
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewDetailsText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  cancelButton: {
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  profileItem: {
    marginBottom: 16,
  },
  profileLabel: {
    color: COLORS.text.gray,
    fontSize: 14,
    marginBottom: 4,
  },
  profileValue: {
    color: COLORS.text.white,
    fontSize: 16,
  },
  editButton: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  addressSection: {
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressSectionTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
    marginRight: 8,
  },
  helperText: {
    color: COLORS.text.gray,
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  cancelButtonStyle: {
    backgroundColor: 'transparent',
    borderColor: COLORS.error,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  settingsSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 8,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingText: {
    color: COLORS.text.white,
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  settingArrow: {
    marginLeft: 'auto',
  },
});