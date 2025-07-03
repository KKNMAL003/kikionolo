import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ActivityIndicator, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../contexts/MessagesContext';
import MessageBubble from '../../components/MessageBubble';
import { BaseText } from '../../components/base/BaseText';
import { BaseButton } from '../../components/base/BaseButton';
import { BaseInput } from '../../components/base/BaseInput';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { WebView } from 'react-native-webview';

const CHATBASE_URL = 'https://www.chatbase.co/chatbot-iframe/SzxvYORICrmmckhOCkvB6';

export default function ChatScreen() {
  const { user } = useAuth();
  const {
    messages,
    unreadCount,
    markAllAsRead,
    sendMessage,
    isLoading,
  } = useMessages();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isLiveChatVisible, setLiveChatVisible] = useState(false);
  const [activeConversationDate, setActiveConversationDate] = useState<string | null>(null);
  const flatListRef = useRef<any>(null);

  // Set active conversation to today when opening live chat
  useEffect(() => {
    if (isLiveChatVisible && !activeConversationDate) {
      const today = new Date().toISOString().split('T')[0];
      setActiveConversationDate(today);
    }
  }, [isLiveChatVisible, activeConversationDate]);

  // Mark messages as read when viewing them
  useEffect(() => {
    if (isLiveChatVisible && unreadCount > 0) {
      markAllAsRead();
    }
  }, [isLiveChatVisible, unreadCount, markAllAsRead]);

  const handleSendMessage = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    const messageContent = input.trim();
    setInput('');
    try {
      if (!user.id) throw new Error('User ID is required to send a message');
      await sendMessage({
        userId: user.id,
        subject: messageContent,
        message: messageContent,
        logType: 'user_message',
        senderType: 'customer',
      });
      setTimeout(() => {
        if (flatListRef.current) {
          if (Platform.OS === 'web') {
            flatListRef.current.scrollToEnd({ animated: true });
          } else {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }
      }, 300);
    } catch (error: any) {
      setInput(messageContent);
    } finally {
      setSending(false);
    }
  };

  // Group messages by date for conversation history
  const conversationDates = useMemo(() => {
    const dates = new Set<string>();
    (Array.isArray(messages) ? messages : []).forEach((msg) => {
      try {
        if (msg.createdAt && !isNaN(new Date(msg.createdAt).getTime())) {
          dates.add(new Date(msg.createdAt).toISOString().split('T')[0]);
        }
      } catch {}
    });
    return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [messages]);

  // Filter messages for the active conversation date
  const currentChatMessages = useMemo(() => {
    if (!activeConversationDate) return [];
    return messages.filter((msg) => {
      try {
        if (!msg.createdAt || isNaN(new Date(msg.createdAt).getTime())) return false;
        return new Date(msg.createdAt).toISOString().split('T')[0] === activeConversationDate;
      } catch {
        return false;
      }
    }).map(msg => ({
      ...msg,
      _clientKey: msg.id + '-' + (msg._clientKey || Math.random().toString(36).substring(2, 8)),
    }));
  }, [messages, activeConversationDate]);

  const startNewChat = () => {
    const today = new Date().toISOString().split('T')[0];
    setActiveConversationDate(today);
  };

  const formatThreadDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {/* AI Assistant */}
      <View style={styles.content}>
        {Platform.OS === 'web' ? (
          <iframe
            src={CHATBASE_URL}
            width="100%"
            style={{ height: 700, minHeight: 400, border: 'none' }}
            frameBorder="0"
            title="AI Assistant"
            aria-label="AI Assistant"
          />
        ) : (
          <WebView source={{ uri: CHATBASE_URL }} style={styles.webview} />
        )}
        <View style={styles.liveChatButtonContainer}>
          <BaseButton
            style={styles.liveChatButton}
            onPress={() => setLiveChatVisible(true)}
            accessibilityLabel="Open live chat with staff"
            variant="primary"
          >
            <BaseText style={styles.liveChatButtonText}>Live Chat with Staff</BaseText>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <BaseText style={styles.unreadBadgeText}>{unreadCount}</BaseText>
              </View>
            )}
          </BaseButton>
        </View>
        <Modal
          visible={isLiveChatVisible}
          animationType="slide"
          onRequestClose={() => setLiveChatVisible(false)}
          transparent={Platform.OS === 'web'}
          accessibilityViewIsModal
        >
          <View style={Platform.OS === 'web' ? styles.modalOverlay : styles.modalContainer}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <BaseText style={styles.modalTitle}>Live Chat</BaseText>
                <BaseButton
                  onPress={() => setLiveChatVisible(false)}
                  style={styles.closeButton}
                  accessibilityLabel="Close live chat"
                  variant="ghost"
                >
                  <BaseText style={styles.closeButtonText}>Close</BaseText>
                </BaseButton>
              </View>
              {conversationDates.length > 0 && (
                <View style={styles.historyContainer}>
                  <BaseText style={styles.historyTitle}>Conversations:</BaseText>
                  <View style={{ flexDirection: 'row' }}>
                    {conversationDates.map((item) => (
                      <BaseButton
                        key={item}
                        style={[
                          styles.threadButton,
                          item === activeConversationDate && styles.activeThreadButton,
                        ]}
                        onPress={() => setActiveConversationDate(item)}
                        accessibilityLabel={`Switch to conversation from ${formatThreadDate(item)}`}
                        variant={item === activeConversationDate ? 'primary' : 'ghost'}
                      >
                        <BaseText style={styles.threadButtonText}>{formatThreadDate(item)}</BaseText>
                      </BaseButton>
                    ))}
                  </View>
                </View>
              )}
              <BaseButton
                style={styles.newChatButton}
                onPress={startNewChat}
                accessibilityLabel="Start new chat"
                variant="outline"
              >
                <BaseText style={styles.newChatButtonText}>Start New Chat</BaseText>
              </BaseButton>
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <BaseText style={styles.loadingText}>Loading messages...</BaseText>
                  </View>
                ) : (
                  <>
                    <View style={{ flex: 1 }}>
                      <FlatList
                        ref={flatListRef}
                        data={currentChatMessages}
                        keyExtractor={(item) => item._clientKey || item.id}
                        contentContainerStyle={{ flexGrow: 1, padding: 16 }}
                        renderItem={({ item }) => <MessageBubble message={item} />}
                        ListEmptyComponent={
                          <View style={styles.placeholder}>
                            <BaseText style={styles.placeholderText}>
                              Send a message to start the conversation with our support team.
                            </BaseText>
                          </View>
                        }
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                        accessibilityLabel="Message list"
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <BaseInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Type your message..."
                        editable={!sending}
                        multiline
                        maxLength={500}
                        accessibilityLabel="Message input"
                        onSubmitEditing={handleSendMessage}
                      />
                      <BaseButton
                        style={[styles.sendButton, sending && { opacity: 0.5 }]}
                        onPress={handleSendMessage}
                        disabled={sending || !input.trim()}
                        accessibilityLabel="Send message"
                        variant="primary"
                      >
                        <Ionicons
                          name={sending ? 'hourglass' : 'send'}
                          size={20}
                          color={colors.text.white}
                          accessibilityLabel={sending ? 'Sending' : 'Send'}
                        />
                      </BaseButton>
                    </View>
                  </>
                )}
              </KeyboardAvoidingView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  webview: { flex: 1, backgroundColor: 'transparent' },
  liveChatButtonContainer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingBottom: 34,
    backgroundColor: colors.background,
  },
  liveChatButton: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  liveChatButtonText: { color: colors.text.white, fontSize: 16, fontWeight: 'bold' },
  unreadBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: colors.text.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    paddingTop: 20,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    minHeight: 56,
    gap: 8,
  },
  modalTitle: { color: colors.text.white, fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  closeButton: { backgroundColor: 'transparent', padding: 0 },
  closeButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  historyContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  historyTitle: { color: colors.text.gray, fontSize: 12, marginBottom: 8 },
  threadButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeThreadButton: { backgroundColor: colors.primary },
  threadButtonText: { color: colors.text.white, fontSize: 12 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.gray,
    marginTop: 12,
  },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: colors.text.gray, fontSize: 16, textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatButton: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 8,
  },
  newChatButtonText: { color: colors.text.white, fontSize: 14, fontWeight: 'bold' },
});