import { supabase } from '../../lib/supabase';
import type { 
  IMessageService, 
  Message, 
  CreateMessageRequest, 
  MessageFilters, 
  ConversationSummary 
} from '../interfaces/IMessageService';
import type { 
  SupabaseMessage, 
  MessageEventHandler, 
  MessageUpdateHandler, 
  UnreadCountHandler 
} from './types';
import { messageApiService } from './MessageApiService';
import { messageCacheService } from './MessageCacheService';
import { messageRealtimeService } from './MessageRealtimeService';

export class MessageFacadeService implements IMessageService {
  private static instance: MessageFacadeService;
  
  // Event handlers for real-time updates
  private messageHandlers: Set<MessageEventHandler> = new Set();
  private updateHandlers: Set<MessageUpdateHandler> = new Set();
  private unreadCountHandlers: Set<UnreadCountHandler> = new Set();
  
  // Singleton pattern to ensure one instance
  public static getInstance(): MessageFacadeService {
    if (!MessageFacadeService.instance) {
      MessageFacadeService.instance = new MessageFacadeService();
    }
    return MessageFacadeService.instance;
  }

  /**
   * Send a new message
   */
  async sendMessage(request: CreateMessageRequest): Promise<Message> {
    const message = await messageApiService.sendMessage(request);
    messageCacheService.set(message.id, message);
    messageRealtimeService.emitMessageReceived(message);
    return message;
  }

  /**
   * Get all messages for a user
   */
  async getMessages(userId: string, filters?: MessageFilters): Promise<Message[]> {
    const messages = await messageApiService.getMessages(userId, filters);
    messageCacheService.setAll(messages);
    return messages;
  }

  /**
   * Mark a specific message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    await messageApiService.markAsRead(messageId);
    const msg = messageCacheService.get(messageId);
    if (msg) {
      msg.isRead = true;
      messageCacheService.set(messageId, msg);
      messageRealtimeService.emitMessageUpdated(messageId, { isRead: true });
    }
  }

  /**
   * Mark all messages as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await messageApiService.markAllAsRead(userId);
    messageCacheService.getAll().forEach(msg => {
      if (!msg.isRead) {
        msg.isRead = true;
        messageCacheService.set(msg.id, msg);
        messageRealtimeService.emitMessageUpdated(msg.id, { isRead: true });
      }
    });
    messageRealtimeService.emitUnreadCountChanged(0);
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return messageApiService.getUnreadCount(userId);
  }

  /**
   * Get conversation summary for user
   */
  async getConversationSummary(userId: string): Promise<ConversationSummary> {
    return messageApiService.getConversationSummary(userId);
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    const result = await messageApiService.deleteMessage(messageId);
    if (result) {
      messageCacheService.remove(messageId);
      messageRealtimeService.emitMessageUpdated(messageId, { deleted: true });
    }
    return result;
  }

  /**
   * Get messages by conversation date
   */
  async getMessagesByDate(userId: string, date: string): Promise<Message[]> {
    return messageApiService.getMessagesByDate(userId, date);
  }

  /**
   * Event subscription methods for real-time updates
   */
  
  /**
   * Subscribe to new message events
   */
  onMessageReceived(handler: MessageEventHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Subscribe to message update events
   */
  onMessageUpdated(handler: MessageUpdateHandler): () => void {
    this.updateHandlers.add(handler);
    return () => this.updateHandlers.delete(handler);
  }

  /**
   * Subscribe to unread count changes
   */
  onUnreadCountChanged(handler: UnreadCountHandler): () => void {
    this.unreadCountHandlers.add(handler);
    return () => this.unreadCountHandlers.delete(handler);
  }

  /**
   * Emit new message event to subscribers
   */
  private emitMessageReceived(message: Message): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('MessageService: Error in message handler:', error);
      }
    });
  }

  /**
   * Emit message update event to subscribers
   */
  private emitMessageUpdated(messageId: string, updates: Partial<Message>): void {
    this.updateHandlers.forEach(handler => {
      try {
        handler(messageId, updates);
      } catch (error) {
        console.error('MessageService: Error in update handler:', error);
      }
    });
  }

  /**
   * Emit unread count change event to subscribers
   */
  private emitUnreadCountChanged(count: number): void {
    this.unreadCountHandlers.forEach(handler => {
      try {
        handler(count);
      } catch (error) {
        console.error('MessageService: Error in unread count handler:', error);
      }
    });
  }

  /**
   * Format Supabase message to interface format
   * @private
   */
  private formatMessage(supabaseMessage: SupabaseMessage): Message {
    return {
      id: supabaseMessage.id,
      userId: supabaseMessage.user_id,
      customerId: supabaseMessage.customer_id,
      staffId: supabaseMessage.staff_id,
      logType: supabaseMessage.log_type as any,
      subject: supabaseMessage.subject || supabaseMessage.message,
      message: supabaseMessage.message,
      senderType: supabaseMessage.sender_type as any,
      isRead: supabaseMessage.is_read,
      createdAt: supabaseMessage.created_at,
    };
  }

  /**
   * Clean up all event handlers
   */
  public cleanup(): void {
    console.log('MessageService: Cleaning up event handlers');
    this.messageHandlers.clear();
    this.updateHandlers.clear();
    this.unreadCountHandlers.clear();
    messageRealtimeService.clearAll();
  }
}

// Export singleton instance
export const messageFacadeService = MessageFacadeService.getInstance();