import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import type { Message } from '../context/UserContext';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isFromUser = message.sender_type === 'customer';
  const isOrderUpdate = message.log_type === 'order_status_update';

  if (isOrderUpdate) {
    return (
      <View style={styles.orderUpdateContainer}>
        <View style={styles.orderUpdateBubble}>
          <Text style={styles.orderUpdateTitle}>📦 Order Update</Text>
          <Text style={styles.orderUpdateText}>{message.subject}</Text>
          <Text style={styles.timestamp}>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
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
      <Text style={styles.messageText}>{message.subject}</Text>
      <View style={styles.messageFooter}>
        <Text style={styles.timestamp}>
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        {!message.is_read && !isFromUser && (
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
    backgroundColor: COLORS.primary, 
    alignSelf: 'flex-end' 
  },
  staffBubble: { 
    backgroundColor: '#222', 
    alignSelf: 'flex-start' 
  },
  messageText: { 
    color: COLORS.text.white, 
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
    color: COLORS.text.gray, 
    fontSize: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  orderUpdateContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  orderUpdateBubble: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    maxWidth: '90%',
  },
  orderUpdateTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderUpdateText: {
    color: COLORS.text.white,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default MessageBubble;