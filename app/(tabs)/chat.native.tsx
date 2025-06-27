import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, TextInput, TouchableOpacity, FlatList, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import Header from '../../components/Header';
import { WebView } from 'react-native-webview';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';

interface Message {
  id: string;
  sender: string;
  user_id: string;
  content: string;
  created_at: string;
}

export default function ChatScreen() {
  const chatbaseUrl = 'https://www.chatbase.co/chatbot-iframe/SzxvYORICrmmckhOCkvB6';
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Fetch messages for this user (from both user and staff)
  useEffect(() => {
    if (!user) return;
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (!error && data) setMessages(data);
    };
    fetchMessages();
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'realtime', table: 'messages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new as Message]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    setSending(true);
    const newMessage = {
      id: Math.random().toString(36).substr(2, 9), // temporary id
      sender: 'user',
      user_id: user.id,
      content: input.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]); // Optimistic update
    setInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    await supabase.from('messages').insert({
      sender: 'user',
      user_id: user.id,
      content: newMessage.content,
    });
    // Refetch messages to ensure sync
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (!error && data) setMessages(data);
    setSending(false);
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.staffBubble]}>
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.timestamp}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.realtimeChatContainer}>
          <View style={styles.messagesContainer}>
            {messages.length === 0 && !sending ? (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>No messages yet. Start the conversation!</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
            )}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type your message..."
              placeholderTextColor={COLORS.text.gray}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              editable={!sending}
            />
            <TouchableOpacity style={[styles.sendButton, (!input.trim() || sending) && { opacity: 0.5 }]} onPress={sendMessage} disabled={!input.trim() || sending}>
              <Text style={styles.sendButtonText}>{sending ? 'Sending...' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.content}>
          <WebView
            source={{ uri: chatbaseUrl }}
            style={styles.webview}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex1: {
    flex: 1,
  },
  realtimeChatContainer: {
    height: '45%',
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 80,
  },
  messageBubble: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  staffBubble: {
    backgroundColor: '#222',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: COLORS.text.white,
    fontSize: 16,
  },
  timestamp: {
    color: COLORS.text.gray,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
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
  sendButtonText: {
    color: COLORS.text.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  webview: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholderText: {
    color: COLORS.text.gray,
    fontSize: 16,
    textAlign: 'center',
  },
});