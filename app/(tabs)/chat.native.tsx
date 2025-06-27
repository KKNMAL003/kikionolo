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
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import MessageBubble from '../../components/MessageBubble';
import type { Message } from '../../types/message';
import type { User } from '../../types/user';

// ChatScreen: Main chat UI for live staff and AI assistant
// - Fetches chat history for the user
// - Subscribes to real-time updates from Supabase
// - Groups messages by date for conversation history
// - Allows starting a new chat (adds a system message)
export default function ChatScreen() {
  const chatbaseUrl = 'https://www.chatbase.co/chatbot-iframe/SzxvYORICrmmckhOCkvB6';
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isLiveChatVisible, setLiveChatVisible] = useState(false);
  const [activeConversationDate, setActiveConversationDate] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Fetch chat history and subscribe to real-time updates when live chat is open
    if (!user || !isLiveChatVisible) return;

    const fetchHistory = async () => {
      // Fetch all messages for the user from Supabase
      console.log('Fetching chat history for user:', user.id);
      const { data, error } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('log_type', ['user_message', 'staff_message'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chat history:', error);
        alert(`Could not load chat history: ${error.message}`);
        return;
      }

      if (data) {
        console.log('Fetched history:', data.length, 'messages');
        if (data.length > 0) {
          setMessages((prev) => {
            const all = [...prev];
            data.forEach((msg) => {
              if (!all.find((m) => m.id === msg.id)) all.push(msg);
            });
            return all.sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            );
          });
          const mostRecentDate = new Date(data[data.length - 1].created_at)
            .toISOString()
            .split('T')[0];
          setActiveConversationDate(mostRecentDate);
        } else {
          console.log('No new data fetched, keeping previous messages.');
        }
      }
    };
    fetchHistory();

    const channel = supabase
      .channel('public:communication_logs:chat')
      // Subscribe to new messages for this user
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communication_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New message received:', payload.new);
          if (payload.new) {
            const newMessage = payload.new as Message;
            setMessages((prevMessages) => {
              if (prevMessages.find((msg) => msg.id === newMessage.id)) return prevMessages;
              return [...prevMessages, newMessage].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
              );
            });
          }
        },
      )
      .subscribe();

    return () => {
      // Clean up the subscription on modal close
      console.log('Unsubscribing from chat channel');
      supabase.removeChannel(channel);
    };
  }, [user, isLiveChatVisible]);

  const sendMessage = async () => {
    // Send a new message to Supabase and clear input
    if (!input.trim() || !user) {
      console.log('SendMessage blocked: Input is empty or user is not available.');
      return;
    }

    setSending(true);
    const messageContent = input.trim();
    setInput('');

    const { data: newMessage, error } = await supabase
      .from('communication_logs')
      .insert({
        user_id: user.id,
        log_type: 'user_message',
        subject: messageContent,
        message: messageContent,
      })
      .select()
      .single();

    setSending(false);

    if (error) {
      console.error('Supabase insert error:', JSON.stringify(error, null, 2));
      alert(`Failed to send message: ${error.message}`);
      setInput(messageContent);
    } else if (newMessage) {
      console.log('Message sent successfully and returned:', newMessage);
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
    // Start a new chat for today and add a system message
    const today = new Date().toISOString().split('T')[0];
    setActiveConversationDate(today);
    // Optionally, add a system message to mark the new chat
    setMessages((prev) => {
      // Only add if not already present for today
      if (
        prev.some(
          (m) =>
            m.log_type === 'system' && new Date(m.created_at).toISOString().split('T')[0] === today,
        )
      )
        return prev;
      return [
        ...prev,
        {
          id: uuidv4(),
          user_id: user?.id || '',
          log_type: 'system',
          subject: '--- New chat started ---',
          message: '--- New chat started ---',
          created_at: new Date().toISOString(),
        },
      ];
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header />
      <WebView source={{ uri: chatbaseUrl }} style={styles.webview} />
      <View style={styles.liveChatButtonContainer}>
        <TouchableOpacity style={styles.liveChatButton} onPress={() => setLiveChatVisible(true)}>
          <Text style={styles.liveChatButtonText}>Live Chat with Staff</Text>
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
                    Send a message to start the conversation.
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
              />
              <TouchableOpacity
                style={[styles.sendButton, sending && { opacity: 0.5 }]}
                onPress={sendMessage}
                disabled={sending}
              >
                <Text style={styles.sendButtonText}>{sending ? '...' : 'Send'}</Text>
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
  },
  liveChatButtonText: { color: COLORS.text.white, fontSize: 16, fontWeight: 'bold' },

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

  messageBubble: { marginBottom: 12, padding: 12, borderRadius: 16, maxWidth: '80%' },
  userBubble: { backgroundColor: COLORS.primary, alignSelf: 'flex-end' },
  staffBubble: { backgroundColor: '#222', alignSelf: 'flex-start' },
  messageText: { color: COLORS.text.white, fontSize: 16 },
  timestamp: { color: COLORS.text.gray, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonText: { color: COLORS.text.white, fontWeight: 'bold', fontSize: 16 },

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
