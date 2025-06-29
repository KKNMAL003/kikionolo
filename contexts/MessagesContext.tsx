import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { messageService } from '../services/messages/MessageService';
import { useAuth } from './AuthContext';
import type { Message, MessageFilters } from '../services/interfaces/IMessageService';

// Messages Context Types
interface MessagesContextType {
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  
  // Message methods
  sendMessage: (content: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  getMessagesByDate: (date: string) => Promise<Message[]>;
  deleteMessage: (messageId: string) => Promise<boolean>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Auth context
  const { user, isAuthenticated } = useAuth();
  
  // Refs for cleanup
  const isMountedRef = useRef(true);
  const unsubscribeFuncsRef = useRef<Array<() => void>>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clean up all subscriptions
      unsubscribeFuncsRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribeFuncsRef.current = [];
    };
  }, []);

  // Load messages when user changes
  useEffect(() => {
    if (user && isAuthenticated && !user.isGuest) {
      loadMessages();
      loadUnreadCount();
      setupEventListeners();
    } else {
      // Clear messages for guest users or when logged out
      setMessages([]);
      setUnreadCount(0);
      // Clean up subscriptions
      unsubscribeFuncsRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribeFuncsRef.current = [];
    }
  }, [user, isAuthenticated]);

  // Load messages from service
  const loadMessages = useCallback(async () => {
    if (!user || user.isGuest) return;

    try {
      setIsLoading(true);
      console.log('MessagesContext: Loading messages for user:', user.id);
      
      const fetchedMessages = await messageService.getMessages(user.id, {
        limit: 50, // Load recent messages
      });
      
      if (isMountedRef.current) {
        setMessages(fetchedMessages);
        console.log(`MessagesContext: Loaded ${fetchedMessages.length} messages`);
      }
    } catch (error) {
      console.error('MessagesContext: Error loading messages:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]);

  // Load unread count from service
  const loadUnreadCount = useCallback(async () => {
    if (!user || user.isGuest) return;

    try {
      const count = await messageService.getUnreadCount(user.id);
      
      if (isMountedRef.current) {
        setUnreadCount(count);
        console.log(`MessagesContext: Unread count: ${count}`);
      }
    } catch (error) {
      console.error('MessagesContext: Error loading unread count:', error);
    }
  }, [user]);

  // Set up event listeners for real-time updates
  const setupEventListeners = useCallback(() => {
    if (!user || user.isGuest) return;

    console.log('MessagesContext: Setting up real-time event listeners');

    // Subscribe to new messages
    const unsubscribeMessages = messageService.onMessageReceived((message) => {
      if (!isMountedRef.current) return;
      
      console.log('MessagesContext: New message received:', message.id);
      setMessages(prev => [message, ...prev]);
      
      // Update unread count if it's from staff and unread
      if (message.senderType === 'staff' && !message.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Subscribe to message updates
    const unsubscribeUpdates = messageService.onMessageUpdated((messageId, updates) => {
      if (!isMountedRef.current) return;
      
      console.log('MessagesContext: Message updated:', messageId, updates);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, ...updates }
            : msg
        )
      );
      
      // Update unread count if read status changed
      if (updates.isRead !== undefined) {
        loadUnreadCount();
      }
    });

    // Subscribe to unread count changes
    const unsubscribeUnreadCount = messageService.onUnreadCountChanged((count) => {
      if (!isMountedRef.current) return;
      
      console.log('MessagesContext: Unread count changed:', count);
      setUnreadCount(count);
    });

    // Store unsubscribe functions
    unsubscribeFuncsRef.current = [
      unsubscribeMessages,
      unsubscribeUpdates,
      unsubscribeUnreadCount,
    ];

    console.log('MessagesContext: Real-time event listeners set up successfully');
  }, [user, loadUnreadCount]);

  // Message methods
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!user || user.isGuest) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('MessagesContext: Sending message:', content);
      
      await messageService.sendMessage({
        userId: user.id,
        subject: content,
        message: content,
        logType: 'user_message',
        senderType: 'customer',
      });
      
      console.log('MessagesContext: Message sent successfully');
    } catch (error) {
      console.error('MessagesContext: Error sending message:', error);
      throw error;
    }
  }, [user]);

  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    try {
      console.log('MessagesContext: Marking message as read:', messageId);
      
      await messageService.markAsRead(messageId);
      
      console.log('MessagesContext: Message marked as read successfully');
    } catch (error) {
      console.error('MessagesContext: Error marking message as read:', error);
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!user || user.isGuest) return;

    try {
      console.log('MessagesContext: Marking all messages as read');
      
      await messageService.markAllAsRead(user.id);
      
      console.log('MessagesContext: All messages marked as read successfully');
    } catch (error) {
      console.error('MessagesContext: Error marking all messages as read:', error);
      throw error;
    }
  }, [user]);

  const refreshMessages = useCallback(async (): Promise<void> => {
    console.log('MessagesContext: Refreshing messages');
    await Promise.all([loadMessages(), loadUnreadCount()]);
  }, [loadMessages, loadUnreadCount]);

  const getMessagesByDate = useCallback(async (date: string): Promise<Message[]> => {
    if (!user || user.isGuest) {
      return [];
    }

    try {
      console.log('MessagesContext: Getting messages by date:', date);
      
      const dateMessages = await messageService.getMessagesByDate(user.id, date);
      
      console.log(`MessagesContext: Found ${dateMessages.length} messages for date ${date}`);
      return dateMessages;
    } catch (error) {
      console.error('MessagesContext: Error getting messages by date:', error);
      return [];
    }
  }, [user]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      console.log('MessagesContext: Deleting message:', messageId);
      
      const success = await messageService.deleteMessage(messageId);
      
      if (success) {
        // Remove from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        // Refresh unread count
        await loadUnreadCount();
        console.log('MessagesContext: Message deleted successfully');
      }
      
      return success;
    } catch (error) {
      console.error('MessagesContext: Error deleting message:', error);
      return false;
    }
  }, [loadUnreadCount]);

  const value: MessagesContextType = {
    messages,
    unreadCount,
    isLoading,
    
    // Message methods
    sendMessage,
    markAsRead,
    markAllAsRead,
    refreshMessages,
    getMessagesByDate,
    deleteMessage,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}