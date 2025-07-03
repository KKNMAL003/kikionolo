import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BaseButton } from './base/BaseButton';

type TimeSlot = 'morning' | 'afternoon' | 'evening';

interface DeliverySchedulerProps {
  selectedDate: Date;
  selectedTimeSlot: TimeSlot;
  onDateChange: (date: Date) => void;
  onTimeSlotChange: (timeSlot: TimeSlot) => void;
  minDate?: Date;
}

const TIME_SLOTS: { id: string; label: string; value: TimeSlot }[] = [
  { id: 'morning', label: 'Morning (8:00 AM - 12:00 PM)', value: 'morning' },
  { id: 'afternoon', label: 'Afternoon (12:00 PM - 5:00 PM)', value: 'afternoon' },
  { id: 'evening', label: 'Evening (5:00 PM - 8:00 PM)', value: 'evening' },
];

export default function DeliveryScheduler({
  selectedDate,
  selectedTimeSlot,
  onDateChange,
  onTimeSlotChange,
  minDate,
}: DeliverySchedulerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get minimum date (tomorrow) and maximum date (7 days from tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Reset time to start of day

  const maxDate = new Date();
  maxDate.setDate(tomorrow.getDate() + 6); // 7 days from tomorrow

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      // Ensure the selected date is not before tomorrow
      if (date < tomorrow) {
        date = new Date(tomorrow);
      }
      onDateChange(date);
    }
  };

  const handlePickerDismiss = () => {
    setShowDatePicker(false);
  };

  const handleDonePress = () => {
    setShowDatePicker(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isTomorrow = (date: Date) => {
    return date.toDateString() === tomorrow.toDateString();
  };

  const isDayAfterTomorrow = (date: Date) => {
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === dayAfterTomorrow.toDateString();
  };

  const getDateDisplayText = (date: Date) => {
    if (isTomorrow(date)) return 'Tomorrow';
    if (isDayAfterTomorrow(date)) return 'Day After Tomorrow';
    return formatDate(date);
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'ios') {
      // iOS: Show in a modal with better styling and theming
      return (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handlePickerDismiss}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <BaseButton onPress={handlePickerDismiss}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </BaseButton>
                <Text style={styles.modalTitle}>Select Delivery Date</Text>
                <BaseButton onPress={handleDonePress}>
                  <Text style={styles.modalDoneText}>Done</Text>
                </BaseButton>
              </View>
              <View style={styles.datePickerNote}>
                <Text style={styles.noteText}>📅 Delivery available from tomorrow onwards</Text>
              </View>
              <DateTimePicker
                value={selectedDate < tomorrow ? tomorrow : selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={tomorrow}
                maximumDate={maxDate}
                textColor={Platform.OS === 'ios' ? colors.text.white : undefined}
                themeVariant="dark"
                style={styles.iosDatePicker}
              />
            </View>
          </View>
        </Modal>
      );
    } else {
      // Android: Use default picker with better theming
      return showDatePicker ? (
        <DateTimePicker
          value={selectedDate < tomorrow ? tomorrow : selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={tomorrow}
          maximumDate={maxDate}
          textColor={colors.text.white}
        />
      ) : null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Delivery Schedule</Text>

      {/* Date Selection */}
      <View style={styles.dateSection}>
        <Text style={styles.label}>Delivery Date</Text>
        <View style={styles.dateNotice}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.dateNoticeText}>Deliveries available from tomorrow onwards</Text>
        </View>
        <BaseButton
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <View style={styles.dateContent}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <View style={styles.dateTextContainer}>
              <Text style={styles.dateText}>{getDateDisplayText(selectedDate)}</Text>
              {!isTomorrow(selectedDate) && !isDayAfterTomorrow(selectedDate) && (
                <Text style={styles.dateSubtext}>{formatDate(selectedDate)}</Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.text.white} />
        </BaseButton>
      </View>

      {/* Time Slot Selection */}
      <View style={styles.timeSlotsSection}>
        <Text style={styles.label}>Delivery Time</Text>
        {TIME_SLOTS.map((slot) => (
          <BaseButton
            key={slot.id}
            style={[styles.timeSlot, selectedTimeSlot === slot.value && styles.selectedTimeSlot]}
            onPress={() => onTimeSlotChange(slot.value)}
            activeOpacity={0.7}
          >
            <View style={styles.timeSlotContent}>
              <View
                style={[
                  styles.radioButton,
                  selectedTimeSlot === slot.value && styles.selectedRadioButton,
                ]}
              >
                {selectedTimeSlot === slot.value && <View style={styles.radioButtonInner} />}
              </View>
              <Text
                style={[
                  styles.timeSlotText,
                  selectedTimeSlot === slot.value && styles.selectedTimeSlotText,
                ]}
              >
                {slot.label}
              </Text>
            </View>
          </BaseButton>
        ))}
      </View>

      {/* Date Picker */}
      {renderDatePicker()}
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
  sectionTitle: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateSection: {
    marginBottom: 20,
  },
  label: {
    color: colors.text.gray,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  dateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  dateNoticeText: {
    color: colors.primary,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTextContainer: {
    marginLeft: 12,
  },
  dateText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateSubtext: {
    color: colors.text.gray,
    fontSize: 12,
    marginTop: 2,
  },
  timeSlotsSection: {
    marginTop: 8,
  },
  timeSlot: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTimeSlot: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  timeSlotContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioButton: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  timeSlotText: {
    color: colors.text.white,
    fontSize: 14,
    flex: 1,
  },
  selectedTimeSlotText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  // iOS Modal Styles with enhanced theming
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderWidth: 1,
    borderTopColor: colors.border,
    borderLeftColor: colors.border,
    borderRightColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCancelText: {
    color: colors.text.gray,
    fontSize: 16,
  },
  modalDoneText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerNote: {
    backgroundColor: colors.primary + '15',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  noteText: {
    color: colors.primary,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  iosDatePicker: {
    backgroundColor: colors.background,
    height: 200,
    marginTop: 10,
  },
});
