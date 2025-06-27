import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import type { Message } from '../types/message';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  if (message.log_type === 'system') {
    return (
      <View style={{ alignItems: 'center', marginVertical: 8 }}>
        <Text style={{ color: COLORS.text.gray, fontStyle: 'italic' }}>{message.subject}</Text>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.messageBubble,
        message.log_type === 'user_message' ? styles.userBubble : styles.staffBubble,
      ]}
    >
      <Text style={styles.messageText}>{message.subject}</Text>
      <Text style={styles.timestamp}>
        {new Date(message.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  messageBubble: { marginBottom: 12, padding: 12, borderRadius: 16, maxWidth: '80%' },
  userBubble: { backgroundColor: COLORS.primary, alignSelf: 'flex-end' },
  staffBubble: { backgroundColor: '#222', alignSelf: 'flex-start' },
  messageText: { color: COLORS.text.white, fontSize: 16 },
  timestamp: { color: COLORS.text.gray, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
});

export default MessageBubble;
