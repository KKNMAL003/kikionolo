import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { messageFacadeService } from '../services/messages/MessageService';
// Message persistence will be handled by the message service
import type { 
  Message as BaseMessage, 
  CreateMessageRequest as BaseCreateMessageRequest, 
  SenderType, 
  MessageType,
  IMessageService,
  MessageFilters,
  ConversationSummary
} from '../services/interfaces/IMessageService';
import { CreateMessageSchema, validateData, getValidationErrors } from '../validation/schemas';

// Define our complete message type with all required fields
export interface Message {
  // Base message fields
  id: string;
  userId: string;
  customerId: string;
  staffId?: string;
  logType: MessageType;
  subject: string;
  message: string;
  senderType: SenderType;
  isRead: boolean;
  createdAt: string;
  // Extended fields for UI state
  _clientKey: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isOptimistic: boolean;
  // Additional UI fields
  timestamp: number;
  updatedAt: string;
  // These fields are used for UI purposes but may not be in the base type
  senderId: string;
  recipientId: string;
}

// Extend the base create message request with our app-specific fields
interface CreateMessageRequest extends BaseCreateMessageRequest {
  _clientKey?: string; // For optimistic updates
  // Add any additional fields needed for creating a message
  timestamp?: number;
  recipientId?: string; // ID of the message recipient
}

// Messages Context Types
interface MessagesContextType {
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  
  // Message methods
  sendMessage: (request: CreateMessageRequest) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  getMessagesByDate: (date: string) => Promise<Message[]>;
  deleteMessage: (messageId: string) => Promise<boolean>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  // State
  const [messagesById, setMessagesById] = useState<Record<string, Message>>({});
  const [allIds, setAllIds] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Auth context
  const { user, isAuthenticated } = useAuth();
  
  // Refs for cleanup
  const isMountedRef = useRef(true);
  const unsubscribeFuncsRef = useRef<Array<() => void>>([]);
  const messagesMapRef = useRef<Map<string, Message>>(new Map()); // For tracking duplicate messages

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
      setMessagesById({});
      setAllIds([]);
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
      
      const fetchedMessages = await messageFacadeService.getMessages(user.id, {
        limit: 50, // Load recent messages
      });
      
      if (isMountedRef.current) {
        // Update messages map for duplicate tracking
        messagesMapRef.current.clear();
        
        // Assume all fetchedMessages are valid, convert to app message inline
        const safeFetchedMessages = Array.isArray(fetchedMessages) ? fetchedMessages : [];
        const appMessages = safeFetchedMessages.map(msg => ({
          ...msg,
          _clientKey: msg.id + '-' + Date.now(),
          status: 'delivered' as const,
          timestamp: new Date(msg.createdAt).getTime(),
          updatedAt: msg.createdAt,
          senderId: msg.userId,
          recipientId: msg.customerId || msg.staffId || 'admin',
        }));
        
        // Add to messages map
        appMessages.forEach(msg => {
          messagesMapRef.current.set(msg.id, msg);
        });
        
        // Set state with messages from map to ensure unique objects
        const newMessagesById: Record<string, Message> = {};
        const newAllIds: string[] = [];
        appMessages.forEach(msg => {
          newMessagesById[msg.id] = msg;
          newAllIds.push(msg.id);
        });
        setMessagesById(newMessagesById);
        setAllIds(newAllIds);
        console.log(`MessagesContext: Loaded ${appMessages.length} messages`);
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
      const count = await messageFacadeService.getUnreadCount(user.id);
      
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
    if (!user || user.isGuest) return () => {};

    console.log('MessagesContext: Setting up real-time event listeners');

    // Subscribe to new messages
    const unsubscribeMessages = messageFacadeService.onMessageReceived((message) => {
      if (!isMountedRef.current || !message) return;
      
      console.log('MessagesContext: New message received:', message.id);
      
      const appMessage: Message = {
        ...message,
        _clientKey: message.id + '-' + Date.now(),
        status: 'delivered' as const,
        timestamp: new Date(message.createdAt).getTime(),
        updatedAt: message.createdAt,
        senderId: message.userId,
        recipientId: message.customerId || message.staffId || 'admin',
      };
      
      setMessagesById(prev => ({
        ...prev,
        [appMessage.id]: appMessage
      }));
      setAllIds(prev => [...prev, appMessage.id]);
      
      // Update unread count if it's from staff and unread
      if (message.senderType === 'staff' && !message.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Subscribe to message updates
    const unsubscribeUpdates = messageFacadeService.onMessageUpdated((messageId, updates) => {
      if (!isMountedRef.current) return;
      
      console.log('MessagesContext: Message updated:', messageId, updates);
      
      setMessagesById(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          ...updates,
          _clientKey: prev[messageId]._clientKey,
          status: updates.status || prev[messageId].status || 'delivered'
        }
      }));
      
      // Update unread count if read status changed
      if (updates.isRead !== undefined) {
        loadUnreadCount();
      }
    });

    // Subscribe to unread count changes
    const unsubscribeUnreadCount = messageFacadeService.onUnreadCountChanged((count) => {
      if (!isMountedRef.current) return;
      
      console.log('MessagesContext: Unread count changed:', count);
      setUnreadCount(count);
    });

    // Store unsubscribe functions
    const cleanup = () => {
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeUpdates) unsubscribeUpdates();
      if (unsubscribeUnreadCount) unsubscribeUnreadCount();
    };
    
    unsubscribeFuncsRef.current.push(cleanup);
    console.log('MessagesContext: Real-time event listeners set up successfully');
    
    return cleanup;
  }, [user, loadUnreadCount]);

  // Message methods
  const sendMessage = useCallback(async (request: CreateMessageRequest): Promise<void> => {
    if (!user || user.isGuest) {
      throw new Error('User not authenticated');
    }

    // Create tempId in the outer scope so it's available in the catch block
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    
    try {
      console.log('MessagesContext: Sending message:', request);
      
      // Create optimistic message with all required properties
      const optimisticMessage: Message = {
        id: tempId,
        userId: user.id,
        customerId: user.id,
        staffId: undefined,
        logType: request.logType || 'user_message',
        subject: request.subject || 'New Message',
        message: request.message,
        senderType: request.senderType || 'customer',
        isRead: false,
        createdAt: now,
        _clientKey: tempId, // Use the tempId as the client key
        status: 'sending',
        isOptimistic: true,
        // Additional fields for UI
        timestamp: Date.now(),
        updatedAt: now,
        // Required by our Message interface
        senderId: user.id,
        recipientId: request.recipientId || 'admin' // Default recipient if not specified
      };

      // Add optimistic message to UI immediately
      setMessagesById(prev => ({
        ...prev,
        [tempId]: optimisticMessage
      }));
      setAllIds(prev => [...prev, tempId]);
      
      // Prepare the request for the service
      const serviceRequest: BaseCreateMessageRequest = {
        userId: user.id,
        subject: request.subject,
        message: request.message,
        logType: request.logType,
        senderType: request.senderType,
        orderId: request.orderId
      };
      
      // Send message via service
      const newMessage = await messageFacadeService.sendMessage(serviceRequest);
      
      console.log('MessagesContext: Message sent successfully', newMessage);
      
      // Create the app message from the service response
      const appMessage: Message = {
        // Base message fields
        ...newMessage,
        // Ensure all required fields are included
        _clientKey: newMessage.id, // Use the real ID as part of the client key
        status: 'sent',
        isOptimistic: false,
        timestamp: new Date(newMessage.createdAt).getTime(),
        updatedAt: newMessage.createdAt, // Use the server's timestamp
        // Ensure required fields from our extended interface
        senderId: newMessage.userId, // Assuming the sender is the current user
        recipientId: request.recipientId || 'admin' // Use the same recipient as in the request
      };
      
      // Log the created message for debugging
      console.log('Created app message:', appMessage);
      
      // Update local state with the new message
      setMessagesById(prev => ({
        ...prev,
        [newMessage.id]: appMessage
      }));
      setAllIds(prev => prev.filter(id => id !== tempId).concat(newMessage.id));
      
      // Update messages map
      messagesMapRef.current.set(appMessage.id, appMessage);
      
    } catch (error: any) {
      console.error('MessagesContext: Error sending message:', error.message);
      
      // Update message status to failed with all required properties
      setMessagesById(prev => ({
        ...prev,
        [tempId]: {
          ...optimisticMessage,
          status: 'failed' as const,
          isOptimistic: false,
          // Ensure all required fields are included
          senderId: optimisticMessage.senderId || user.id,
          recipientId: optimisticMessage.recipientId || 'admin',
          updatedAt: new Date().toISOString()
        }
      }));
      setAllIds(prev => prev.filter(id => id !== tempId).concat(tempId));
      
      console.error('Failed to send message:', error);
      
      throw error;
    }
  }, [user]);
  
  // Mark a message as read
  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    if (!user || user.isGuest) return;
    
    try {
      console.log('MessagesContext: Marking message as read:', messageId);
      
      // Optimistically update the UI
      setMessagesById(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          isRead: true,
          status: 'read' as const,
          updatedAt: new Date().toISOString()
        }
      }));
      
      // Update the message in the map
      const existingMsg = messagesMapRef.current.get(messageId);
      if (existingMsg) {
        messagesMapRef.current.set(messageId, {
          ...existingMsg,
          isRead: true,
          status: 'read' as const,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Update the server
      await messageFacadeService.markAsRead(messageId);
      
      // Update the unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log('MessagesContext: Message marked as read successfully');
      
    } catch (error: any) {
      console.error('MessagesContext: Error marking message as read:', error.message);
      
      // Revert optimistic update on error
      setMessagesById(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          isRead: false,
          status: 'delivered' as const,
          updatedAt: new Date().toISOString()
        }
      }));
      
      // Revert the message in the map
      const existingMsg = messagesMapRef.current.get(messageId);
      if (existingMsg) {
        messagesMapRef.current.set(messageId, {
          ...existingMsg,
          isRead: false,
          status: 'delivered' as const,
          updatedAt: new Date().toISOString()
        });
      }
      
      throw error;
    }
  }, [user]);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!user || user.isGuest) return;

    try {
      console.log('MessagesContext: Marking all messages as read');
      
      await messageFacadeService.markAllAsRead(user.id);
      
      console.log('MessagesContext: All messages marked as read successfully');
      
      // Update local state
      setMessagesById(prev => ({
        ...prev,
        ...Object.fromEntries(Object.entries(prev).map(([id, msg]) => [id, { ...msg, isRead: true, _clientKey: msg._clientKey }]))
      }));
      
      // Update all messages in map
      messagesMapRef.current.forEach((msg, id) => {
        messagesMapRef.current.set(id, { ...msg, isRead: true });
      });
      
      // Reset unread count
      setUnreadCount(0);
      
    } catch (error: any) {
      console.error('MessagesContext: Error marking all messages as read:', error.message);
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
      
      const dateMessages = await messageFacadeService.getMessagesByDate(user.id, date);
      
      console.log(`MessagesContext: Found ${dateMessages.length} messages for date ${date}`);
      
      // Add client keys for rendering
      const enhancedMessages = dateMessages.map(msg => ({
        ...msg,
        _clientKey: msg.id + '-' + Date.now()
      }));
      
      return enhancedMessages;
    } catch (error: any) {
      console.error('MessagesContext: Error getting messages by date:', error.message);
      return [];
    }
  }, [user]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      console.log('MessagesContext: Deleting message:', messageId);
      
      const success = await messageFacadeService.deleteMessage(messageId);
      
      if (success) {
        // Remove from local state
        setMessagesById(prev => ({
          ...prev,
          [messageId]: undefined
        }));
        setAllIds(prev => prev.filter(id => id !== messageId));
        
        // Remove from messages map
        messagesMapRef.current.delete(messageId);
        
        // Refresh unread count
        await loadUnreadCount();
        console.log('MessagesContext: Message deleted successfully');
      }
      
      return success;
    } catch (error: any) {
      console.error('MessagesContext: Error deleting message:', error.message);
      return false;
    }
  }, [loadUnreadCount]);

  // Selector to get denormalized messages array (sorted by createdAt desc)
  const getMessages = useCallback((): Message[] => {
    return allIds.map(id => messagesById[id]).filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [allIds, messagesById]);

  const value: MessagesContextType & {
    getUnreadMessages: () => Message[];
    getSortedMessages: () => Message[];
    getPaginatedMessages: (page: number, pageSize: number) => Message[];
  } = {
    messages: getMessages(),
    unreadCount,
    isLoading,
    
    // Message methods
    sendMessage,
    markAsRead,
    markAllAsRead,
    refreshMessages,
    getMessagesByDate,
    deleteMessage,
    getUnreadMessages: () => getMessages().filter(msg => !msg.isRead),
    getSortedMessages: () => getMessages().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    getPaginatedMessages: (page: number, pageSize: number) => getMessages().slice((page - 1) * pageSize, page * pageSize),
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