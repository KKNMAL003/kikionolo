import 'react-native-get-random-values';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';
import { COLORS } from '../../constants/colors';
import Header from '../../components/Header';
import { WebView } from 'react-native-webview';
import { useUser } from '../../context/UserContext';
import MessageBubble from '../../components/MessageBubble';
import type { Message } from '../../context/UserContext';
import { Ionicons } from '@expo/vector-icons';

// ChatScreen: Main chat UI for live staff and AI assistant
// - Fetches chat history for the user
// - Subscribes to real-time updates from Supabase
// - Groups messages by date for conversation history
// - Allows starting a new chat (adds a system message)
export default function ChatScreen() {
  const chatbaseUrl = 'https://www.chatbase.co/chatbot-iframe/SzxvYORICrmmckhOCkvB6';
  const { 
    user, 
    messages, 
    unreadMessagesCount, 
    markMessageAsRead, 
    markAllMessagesAsRead, 
    sendMessage 
  } = useUser();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isLiveChatVisible, setLiveChatVisible] = useState(false);
  const [activeConversationDate, setActiveConversationDate] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Set active conversation to today when opening live chat
  useEffect(() => {
    if (isLiveChatVisible && !activeConversationDate) {
      const today = new Date().toISOString().split('T')[0];
      setActiveConversationDate(today);
    }
  }, [isLiveChatVisible, activeConversationDate]);

  // Mark messages as read when viewing them
  useEffect(() => {
    if (isLiveChatVisible && unreadMessagesCount > 0) {
      markAllMessagesAsRead();
    }
  }, [isLiveChatVisible, unreadMessagesCount, markAllMessagesAsRead]);

  const handleSendMessage = async () => {
    if (!input.trim() || !user || sending) {
      console.log('SendMessage blocked: Input is empty, no user, or already sending.');
      return;
    }

    setSending(true);
    const messageContent = input.trim();
    setInput('');

    try {
      await sendMessage(messageContent);
      console.log('Message sent successfully');
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      // Restore input on error
      setInput(messageContent);
    } finally {
      setSending(false);
    }
  };

  const conversationDates = useMemo(() => {
    // Group messages by date for conversation history
    const dates = new Set<string>();
    messages.forEach((msg) => {
      dates.add(new Date(msg.created_at).toISOString().split('T')[0]);
    });
    return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [messages]);

  const currentChatMessages = useMemo(() => {
    // Filter messages for the active conversation date
    if (!activeConversationDate) return [];
    return messages.filter(
      (msg) => new Date(msg.created_at).toISOString().split('T')[0] === activeConversationDate,
    );
  }, [messages, activeConversationDate]);

  const startNewChat = () => {
    // Start a new chat for today
    const today = new Date().toISOString().split('T')[0];
    setActiveConversationDate(today);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header />
      <WebView source={{ uri: chatbaseUrl }} style={styles.webview} />
      <View style={styles.liveChatButtonContainer}>
        <TouchableOpacity style={styles.liveChatButton} onPress={() => setLiveChatVisible(true)}>
          <Text style={styles.liveChatButtonText}>Live Chat with Staff</Text>
          {unreadMessagesCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadMessagesCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={isLiveChatVisible}
        animationType="slide"
        onRequestClose={() => setLiveChatVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Live Chat</Text>
            <TouchableOpacity onPress={() => setLiveChatVisible(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          {conversationDates.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Conversations:</Text>
              <FlatList
                horizontal
                data={conversationDates}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.threadButton,
                      item === activeConversationDate && styles.activeThreadButton,
                    ]}
                    onPress={() => setActiveConversationDate(item)}
                  >
                    <Text style={styles.threadButtonText}>{new Date(item).toLocaleDateString()}</Text>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          <TouchableOpacity style={styles.newChatButton} onPress={startNewChat}>
            <Text style={styles.newChatButtonText}>Start New Chat</Text>
          </TouchableOpacity>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <FlatList
              ref={flatListRef}
              data={currentChatMessages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ flexGrow: 1, padding: 16 }}
              renderItem={({ item }) => <MessageBubble message={item} />}
              ListEmptyComponent={
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>
                    Send a message to start the conversation with our support team.
                  </Text>
                </View>
              }
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Type your message..."
                placeholderTextColor={COLORS.text.gray}
                editable={!sending}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, sending && { opacity: 0.5 }]}
                onPress={handleSendMessage}
                disabled={sending || !input.trim()}
              >
                <Ionicons 
                  name={sending ? "hourglass" : "send"} 
                  size={20} 
                  color={COLORS.text.white} 
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  webview: { flex: 1, backgroundColor: 'transparent' },
  liveChatButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingBottom: 34,
    backgroundColor: COLORS.background,
  },
  liveChatButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  liveChatButtonText: { color: COLORS.text.white, fontSize: 16, fontWeight: 'bold' },
  unreadBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: COLORS.text.white,
    fontSize: 12,
    fontWeight: 'bold',
  },

  modalContainer: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: { color: COLORS.text.white, fontSize: 18, fontWeight: 'bold' },
  closeButton: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },

  historyContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  historyTitle: { color: COLORS.text.gray, fontSize: 12, marginBottom: 8 },
  threadButton: {
    backgroundColor: '#333',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeThreadButton: { backgroundColor: COLORS.primary },
  threadButtonText: { color: COLORS.text.white, fontSize: 12 },

  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: COLORS.text.gray, fontSize: 16, textAlign: 'center' },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    backgroundColor: '#222',
    color: COLORS.text.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  newChatButton: {
    alignSelf: 'center',
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 8,
  },
  newChatButtonText: { color: COLORS.text.white, fontSize: 14, fontWeight: 'bold' },
});