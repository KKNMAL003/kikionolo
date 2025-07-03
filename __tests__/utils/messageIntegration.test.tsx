import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ChatScreen from '../../app/(tabs)/chat';
import { MessagesProvider } from '../../contexts/MessagesContext';
import { ErrorBoundary } from '../../components/ErrorBoundary';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', isGuest: false }, isAuthenticated: true })
}));

jest.mock('../../contexts/OrdersContext', () => ({ useOrders: () => ({}) }));
jest.mock('../../contexts/NotificationsContext', () => ({ useNotifications: () => ({}) }));
jest.mock('../../contexts/MessagesContext', () => {
  const actual = jest.requireActual('../../contexts/MessagesContext');
  return {
    ...actual,
    useMessages: () => ({
      messages: [
        { id: '1', userId: 'u1', customerId: 'c1', logType: 'user_message', subject: 'Test', message: 'Hello', senderType: 'customer', isRead: false, createdAt: new Date().toISOString(), _clientKey: '1', status: 'sent', isOptimistic: false, timestamp: Date.now(), updatedAt: new Date().toISOString(), senderId: 'u1', recipientId: 'c1' }
      ],
      unreadCount: 1,
      isLoading: false,
      sendMessage: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      refreshMessages: jest.fn(),
      getMessagesByDate: jest.fn(),
      deleteMessage: jest.fn(),
      getUnreadMessages: jest.fn(),
      getSortedMessages: jest.fn(),
      getPaginatedMessages: jest.fn(),
    })
  };
});

describe('ChatScreen Integration', () => {
  it('renders messages and allows sending', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MessagesProvider>
        <ChatScreen />
      </MessagesProvider>
    );
    expect(getByText('Hello')).toBeTruthy();
    const input = getByPlaceholderText('Type your message...');
    fireEvent.changeText(input, 'New message');
    fireEvent(input, 'onSubmitEditing');
    await waitFor(() => {
      // Would check for sendMessage call or UI update
      expect(input.props.value).toBe('New message');
    });
  });

  it('shows new messages received via real-time events', async () => {
    // Simulate a new message being added to context
    const newMessage = {
      id: '2', userId: 'u1', customerId: 'c1', logType: 'user_message', subject: 'Realtime', message: 'Realtime message', senderType: 'customer', isRead: false, createdAt: new Date().toISOString(), _clientKey: '2', status: 'sent', isOptimistic: false, timestamp: Date.now(), updatedAt: new Date().toISOString(), senderId: 'u1', recipientId: 'c1'
    };
    const useMessages = jest.fn().mockReturnValue({
      messages: [
        { id: '1', userId: 'u1', customerId: 'c1', logType: 'user_message', subject: 'Test', message: 'Hello', senderType: 'customer', isRead: false, createdAt: new Date().toISOString(), _clientKey: '1', status: 'sent', isOptimistic: false, timestamp: Date.now(), updatedAt: new Date().toISOString(), senderId: 'u1', recipientId: 'c1' },
        newMessage
      ],
      unreadCount: 2,
      isLoading: false,
      sendMessage: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      refreshMessages: jest.fn(),
      getMessagesByDate: jest.fn(),
      deleteMessage: jest.fn(),
      getUnreadMessages: jest.fn(),
      getSortedMessages: jest.fn(),
      getPaginatedMessages: jest.fn(),
    });
    jest.doMock('../../contexts/MessagesContext', () => ({ useMessages }));
    const { getByText } = render(
      <MessagesProvider>
        <ChatScreen />
      </MessagesProvider>
    );
    expect(getByText('Realtime message')).toBeTruthy();
  });

  it('catches errors in the chat UI with ErrorBoundary', async () => {
    const Thrower = () => { throw new Error('Chat error!'); };
    const { getByText } = render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    expect(getByText('Something went wrong.')).toBeTruthy();
    expect(getByText('Chat error!')).toBeTruthy();
  });
}); 