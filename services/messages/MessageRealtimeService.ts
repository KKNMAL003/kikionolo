import type { Message, MessageEventHandler, MessageUpdateHandler, UnreadCountHandler } from './types';

class MessageRealtimeService {
  private messageHandlers: Set<MessageEventHandler> = new Set();
  private updateHandlers: Set<MessageUpdateHandler> = new Set();
  private unreadCountHandlers: Set<UnreadCountHandler> = new Set();

  onMessageReceived(handler: MessageEventHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }
  onMessageUpdated(handler: MessageUpdateHandler): () => void {
    this.updateHandlers.add(handler);
    return () => this.updateHandlers.delete(handler);
  }
  onUnreadCountChanged(handler: UnreadCountHandler): () => void {
    this.unreadCountHandlers.add(handler);
    return () => this.unreadCountHandlers.delete(handler);
  }
  emitMessageReceived(message: Message): void {
    this.messageHandlers.forEach(h => h(message));
  }
  emitMessageUpdated(messageId: string, updates: Partial<Message>): void {
    this.updateHandlers.forEach(h => h(messageId, updates));
  }
  emitUnreadCountChanged(count: number): void {
    this.unreadCountHandlers.forEach(h => h(count));
  }
  clearAll(): void {
    this.messageHandlers.clear();
    this.updateHandlers.clear();
    this.unreadCountHandlers.clear();
  }
}

export const messageRealtimeService = new MessageRealtimeService(); 