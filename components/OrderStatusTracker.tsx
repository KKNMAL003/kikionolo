import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { BaseText } from './base/BaseText';

interface OrderStatusTrackerProps {
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  orderDate: string;
  estimatedDelivery?: string;
}

const STATUS_STEPS = [
  {
    key: 'confirmed',
    label: 'Order Confirmed',
    icon: 'checkmark-circle',
  },
  {
    key: 'preparing',
    label: 'Preparing Order',
    icon: 'construct',
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: 'car',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: 'checkmark-done-circle',
  },
];

export default function OrderStatusTracker({
  status,
  orderDate,
  estimatedDelivery,
}: OrderStatusTrackerProps) {
  const getStatusIndex = (currentStatus: string) => {
    if (currentStatus === 'cancelled') return -1;
    if (currentStatus === 'pending') return -1;
    return STATUS_STEPS.findIndex((step) => step.key === currentStatus);
  };

  const currentStatusIndex = getStatusIndex(status);

  const getStatusColor = (stepIndex: number) => {
    if (status === 'cancelled') return colors.error;
    if (stepIndex <= currentStatusIndex) return colors.primary;
    return colors.text.gray;
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'Your order has been received and is being processed.';
      case 'confirmed':
        return 'Your order has been confirmed and is being prepared.';
      case 'preparing':
        return 'Your order is being prepared for delivery.';
      case 'out_for_delivery':
        return 'Your order is on its way to you!';
      case 'delivered':
        return 'Your order has been successfully delivered.';
      case 'cancelled':
        return 'Your order has been cancelled.';
      default:
        return 'Order status unknown.';
    }
  };

  if (status === 'cancelled') {
    return (
      <View style={styles.container}>
        <BaseText style={styles.title}>Order Status</BaseText>
        <View style={styles.cancelledContainer}>
          <Ionicons name="close-circle" size={48} color={colors.error} />
          <BaseText style={styles.cancelledText}>Order Cancelled</BaseText>
          <BaseText style={styles.statusMessage}>{getStatusMessage()}</BaseText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BaseText style={styles.title}>Order Status</BaseText>

      <View style={styles.statusHeader}>
        <BaseText style={styles.statusMessage}>{getStatusMessage()}</BaseText>
        {estimatedDelivery && status !== 'delivered' && (
          <BaseText style={styles.estimatedDelivery}>Estimated delivery: {estimatedDelivery}</BaseText>
        )}
      </View>

      <View style={styles.timelineContainer}>
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index <= currentStatusIndex;
          const isActive = index === currentStatusIndex;

          return (
            <View key={step.key} style={styles.timelineStep}>
              <View style={styles.timelineRow}>
                <View style={[styles.stepIcon, { backgroundColor: getStatusColor(index) }]}>
                  <Ionicons name={step.icon as any} size={16} color={colors.text.white} />
                </View>

                <View style={styles.stepContent}>
                  <BaseText
                    style={[
                      styles.stepLabel,
                      isActive && styles.activeStepLabel,
                      isCompleted && styles.completedStepLabel,
                    ]}
                  >
                    {step.label}
                  </BaseText>

                  {isActive && <BaseText style={styles.activeStepSubtext}>In Progress</BaseText>}

                  {isCompleted && index < currentStatusIndex && (
                    <BaseText style={styles.completedStepSubtext}>Completed</BaseText>
                  )}
                </View>
              </View>

              {index < STATUS_STEPS.length - 1 && (
                <View
                  style={[styles.timelineLine, { backgroundColor: getStatusColor(index + 1) }]}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  title: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusHeader: {
    marginBottom: 20,
  },
  statusMessage: {
    color: colors.text.white,
    fontSize: 16,
    marginBottom: 8,
  },
  estimatedDelivery: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelledContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  cancelledText: {
    color: colors.error,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineStep: {
    position: 'relative',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    color: colors.text.gray,
    fontSize: 14,
  },
  activeStepLabel: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  completedStepLabel: {
    color: colors.text.white,
  },
  activeStepSubtext: {
    color: colors.primary,
    fontSize: 12,
    marginTop: 2,
  },
  completedStepSubtext: {
    color: colors.text.gray,
    fontSize: 12,
    marginTop: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: 16,
  },
});
