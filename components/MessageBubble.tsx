import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import type { Message } from '../services/interfaces/IMessageService';
import { BaseText } from './base/BaseText';

interface MessageBubbleProps {
  message: Message & { _clientKey?: string };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  // Handle potential invalid dates
  const formattedTime = (() => {
    try {
      if (message.createdAt && !isNaN(new Date(message.createdAt).getTime())) {
        return new Date(message.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      return '';
    } catch (error) {
      console.warn('Invalid date format:', error);
      return '';
    }
  })();

  const isFromUser = message.senderType === 'customer';
  const isOrderUpdate = message.logType === 'order_status_update';

  if (isOrderUpdate) {
    return (
      <View style={styles.orderUpdateContainer}>
        <View style={styles.orderUpdateBubble}>
          <BaseText style={styles.orderUpdateTitle}>📦 Order Update</BaseText>
          <BaseText style={styles.orderUpdateText}>{message.subject}</BaseText>
          <BaseText style={styles.timestamp}>{formattedTime}</BaseText>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.messageBubble,
        isFromUser ? styles.userBubble : styles.staffBubble,
      ]}
    >
      <BaseText style={styles.messageText}>{message.subject || message.message}</BaseText>
      <View style={styles.messageFooter}>
        <BaseText style={styles.timestamp}>{formattedTime}</BaseText>
        {!message.isRead && !isFromUser && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageBubble: { 
    marginBottom: 12, 
    padding: 12, 
    borderRadius: 16, 
    maxWidth: '80%' 
  },
  userBubble: { 
    backgroundColor: colors.primary, 
    alignSelf: 'flex-end' 
  },
  staffBubble: { 
    backgroundColor: colors.card, 
    alignSelf: 'flex-start' 
  },
  messageText: { 
    color: colors.text.white, 
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: { 
    color: colors.text.gray, 
    fontSize: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  orderUpdateContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  orderUpdateBubble: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    maxWidth: '90%',
  },
  orderUpdateTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderUpdateText: {
    color: colors.text.white,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default MessageBubble;