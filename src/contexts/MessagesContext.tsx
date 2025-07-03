import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { Message, Conversation, MessageStatus, MessageType } from '../types/messaging';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

// Types
type MessagesState = {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Record<string, Message[]>;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
};

type MessagesAction =
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: { conversationId: string; messages: Message[] } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_MORE'; payload: boolean }
  | { type: 'SET_HAS_MORE'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

type MessagesContextType = {
  state: MessagesState;
  dispatch: React.Dispatch<MessagesAction>;
  sendMessage: (text: string, conversationId: string, type?: MessageType, file?: any) => Promise<void>;
  updateMessage: (messageId: string, updates: Partial<Message>, conversationId: string) => Promise<void>;
  deleteMessage: (messageId: string, conversationId: string) => Promise<void>;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  getUnreadCount: (conversationId: string) => number;
  getConversation: (conversationId: string) => Conversation | undefined;
  getMessages: (conversationId: string) => Message[];
};

// Initial state
const initialState: MessagesState = {
  conversations: [],
  currentConversationId: null,
  messages: {},
  loading: false,
  loadingMore: false,
  hasMore: true,
  error: null,
};

// Create context
const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

// Reducer function
function messagesReducer(state: MessagesState, action: MessagesAction): MessagesState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversationId: action.payload };
    
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages,
        },
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_LOADING_MORE':
      return { ...state, loadingMore: action.payload };
    
    case 'SET_HAS_MORE':
      return { ...state, hasMore: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    default:
      return state;
  }
}

// Provider component
export const MessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = React.useReducer(messagesReducer, initialState);
  const { user } = useAuth();

  // Helper functions
  const getUnreadCount = useCallback((conversationId: string): number => {
    const messages = state.messages[conversationId] || [];
    return messages.filter(msg => msg.senderId !== user?.id).length;
  }, [state.messages, user]);

  const getConversation = useCallback((conversationId: string) => {
    return state.conversations.find(conv => conv.id === conversationId);
  }, [state.conversations]);

  const getMessages = useCallback((conversationId: string) => {
    return state.messages[conversationId] || [];
  }, [state.messages]);

  // Send message
  const sendMessage = useCallback(async (
    text: string, 
    conversationId: string,
    type: MessageType = 'text',
    file?: any
  ) => {
    if (!user) return;
    
    const newMessage: Message = {
      id: uuidv4(),
      conversationId,
      senderId: user.id,
      text,
      type,
      status: 'sending',
      timestamp: Date.now(),
      file,
    };
    
    dispatch({
      type: 'SET_MESSAGES',
      payload: {
        conversationId,
        messages: [newMessage, ...(state.messages[conversationId] || [])],
      },
    });
  }, [user, state.messages]);

  // Update message
  const updateMessage = useCallback(async (
    messageId: string, 
    updates: Partial<Message>,
    conversationId: string
  ) => {
    const messages = state.messages[conversationId] || [];
    const updatedMessages = messages.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    );
    
    dispatch({
      type: 'SET_MESSAGES',
      payload: { conversationId, messages: updatedMessages },
    });
  }, [state.messages]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string, conversationId: string) => {
    const messages = state.messages[conversationId] || [];
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    
    dispatch({
      type: 'SET_MESSAGES',
      payload: { conversationId, messages: updatedMessages },
    });
  }, [state.messages]);

  // Load more messages
  const loadMoreMessages = useCallback(async (conversationId: string) => {
    if (state.loadingMore || !state.hasMore) return;
    
    try {
      dispatch({ type: 'SET_LOADING_MORE', payload: true });
      
      // Simulate loading older messages
      const olderMessages: Message[] = [];
      
      dispatch({
        type: 'SET_MESSAGES',
        payload: {
          conversationId,
          messages: [...olderMessages, ...(state.messages[conversationId] || [])],
        },
      });
      
      if (olderMessages.length === 0) {
        dispatch({ type: 'SET_HAS_MORE', payload: false });
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load more messages' });
    } finally {
      dispatch({ type: 'SET_LOADING_MORE', payload: false });
    }
  }, [state.loadingMore, state.hasMore, state.messages]);

  return (
    <MessagesContext.Provider
      value={{
        state,
        dispatch,
        sendMessage,
        updateMessage,
        deleteMessage,
        loadMoreMessages,
        getUnreadCount,
        getConversation,
        getMessages,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};

// Custom hook
export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};
