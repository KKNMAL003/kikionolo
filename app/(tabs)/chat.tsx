import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import Header from '../../components/Header';
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
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Fetch messages for this user
  useEffect(() => {
    if (!user) return;
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('communication_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          const formattedMessages = data.map(msg => ({
            id: msg.id,
            sender: msg.sender_type || 'user',
            user_id: msg.user_id,
            content: msg.subject || msg.message,
            created_at: msg.created_at
          }));
          setMessages(formattedMessages);
        } else if (error) {
          console.warn('Failed to fetch messages:', error.message);
        }
      } catch (error) {
        console.warn('Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [user]);

  // Real-time subscription with better error handling
  useEffect(() => {
    if (!user) return;
    
    let isSubscribed = true;
    
    const setupSubscription = async () => {
      try {
        const channel = supabase
          .channel(`communication_logs:user_id=eq.${user.id}`)
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'communication_logs', 
              filter: `user_id=eq.${user.id}` 
            },
            (payload) => {
              if (!isSubscribed) return;
              
              if (payload.eventType === 'INSERT' && payload.new) {
                const newMessage = {
                  id: payload.new.id,
                  sender: payload.new.sender_type || 'user',
                  user_id: payload.new.user_id,
                  content: payload.new.subject || payload.new.message,
                  created_at: payload.new.created_at
                };
                setMessages((prev) => [...prev, newMessage]);
              }
            },
          )
          .subscribe((status, err) => {
            if (!isSubscribed) return;
            
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to communication_logs');
            } else if (status === 'CHANNEL_ERROR') {
              console.warn('Channel subscription error:', err);
            } else if (status === 'TIMED_OUT') {
              console.warn('Channel subscription timed out');
            } else if (status === 'CLOSED') {
              console.log('Channel subscription closed');
            }
          });
        
        return () => {
          isSubscribed = false;
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.warn('Error setting up real-time subscription:', error);
      }
    };
    
    const cleanup = setupSubscription();
    
    return () => {
      isSubscribed = false;
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [user]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    
    try {
      const { error } = await supabase.from('communication_logs').insert({
        user_id: user.id,
        customer_id: user.id,
        log_type: 'user_message',
        subject: input.trim(),
        message: input.trim(),
        sender_type: 'customer',
        is_read: false,
      });
      
      if (error) {
        console.warn('Failed to send message:', error.message);
      } else {
        setInput('');
      }
    } catch (error) {
      console.warn('Error sending message:', error);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'customer' ? styles.userBubble : styles.staffBubble,
      ]}
    >
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Send a message to start the conversation!</Text>
            </View>
          }
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor={COLORS.text.gray}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
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
  messagesList: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.text.gray,
    fontSize: 16,
    textAlign: 'center',
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
});