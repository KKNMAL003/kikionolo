import { Message, MessageGroup } from '../types/messaging';
import { format } from 'date-fns';

/**
 * Groups messages by date and optionally by sender
 * @param messages Array of messages to group
 * @param currentUserId Current user's ID for determining message ownership
 * @param maxTimeGapMs Maximum time gap in milliseconds to group messages from the same sender (default: 5 minutes)
 * @returns Array of message groups
 */
export const groupMessagesByDate = (
  messages: Message[],
  currentUserId: string = '',
  maxTimeGapMs: number = 5 * 60 * 1000
): MessageGroup[] => {
  if (!messages || messages.length === 0) return [];

  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;
  let lastMessage: Message | null = null;
  let lastDate = '';

  // Process messages in chronological order
  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  (Array.isArray(sortedMessages) ? sortedMessages : []).forEach((message) => {
    const messageDate = format(message.timestamp, 'yyyy-MM-dd');
    const isNewDay = lastDate !== messageDate;
    
    // Check if we should start a new group
    if (
      isNewDay || // New day
      !currentGroup || // First message
      currentGroup.sender.id !== message.senderId || // Different sender
      (lastMessage && 
        (message.timestamp - lastMessage.timestamp) > maxTimeGapMs) // Time gap too large
    ) {
      // Create a new group
      currentGroup = {
        id: `group-${message.id}`,
        date: messageDate,
        sender: { id: message.senderId },
        messages: [message],
        showDate: isNewDay,
      };
      groups.push(currentGroup);
    } else {
      // Add to current group
      currentGroup.messages.push(message);
    }

    lastMessage = message;
    lastDate = messageDate;
  });

  return groups;
};

/**
 * Checks if a message should show a date header
 * @param message Current message
 * @param previousMessage Previous message in the list
 * @returns boolean indicating if date header should be shown
 */
export const shouldShowDateHeader = (
  message: Message,
  previousMessage?: Message
): boolean => {
  if (!previousMessage) return true;
  
  const currentDate = format(message.timestamp, 'yyyy-MM-dd');
  const previousDate = format(previousMessage.timestamp, 'yyyy-MM-dd');
  
  return currentDate !== previousDate;
};

/**
 * Checks if a message should show the sender's avatar
 * @param message Current message
 * @param nextMessage Next message in the list
 * @param currentUserId Current user's ID
 * @returns boolean indicating if avatar should be shown
 */
export const shouldShowAvatar = (
  message: Message,
  nextMessage?: Message,
  currentUserId?: string
): boolean => {
  // Don't show avatar for current user's messages
  if (currentUserId && message.senderId === currentUserId) return false;
  
  // Show avatar if next message is from a different sender or doesn't exist
  return !nextMessage || nextMessage.senderId !== message.senderId;
};

/**
 * Formats a timestamp into a readable time string
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export const formatMessageTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

/**
 * Gets the appropriate status icon for a message
 * @param status Message status
 * @returns Status icon string
 */
export const getStatusIcon = (status: Message['status']): string => {
  switch (status) {
    case 'sending':
      return '🕒';
    case 'sent':
      return '✓';
    case 'delivered':
      return '✓✓';
    case 'read':
      return '✓✓';
    case 'failed':
      return '✕';
    default:
      return '';
  }
};

/**
 * Gets the appropriate status color for a message
 * @param status Message status
 * @returns Color string
 */
export const getStatusColor = (
  status: Message['status'],
  theme: { colors: { primary: string; error: string; text: string } }
): string => {
  switch (status) {
    case 'sending':
      return theme.colors.text;
    case 'sent':
      return theme.colors.text;
    case 'delivered':
      return theme.colors.text;
    case 'read':
      return theme.colors.primary;
    case 'failed':
      return theme.colors.error;
    default:
      return theme.colors.text;
  }
};

/**
 * Truncates text to a specified length
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @param ellipsis String to append when truncated (default: "...")
 * @returns Truncated text
 */
export const truncateText = (
  text: string,
  maxLength: number = 100,
  ellipsis: string = '...'
): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + ellipsis;
};

/**
 * Checks if a message is from the current user
 * @param message Message to check
 * @param currentUserId Current user's ID
 * @returns boolean indicating if message is from current user
 */
export const isCurrentUser = (
  message: Message,
  currentUserId?: string
): boolean => {
  return !!currentUserId && message.senderId === currentUserId;
};

/**
 * Gets the appropriate message alignment based on sender
 * @param message Message to check
 * @param currentUserId Current user's ID
 * @returns 'flex-start' or 'flex-end'
 */
export const getMessageAlignment = (
  message: Message,
  currentUserId?: string
): 'flex-start' | 'flex-end' => {
  return isCurrentUser(message, currentUserId) ? 'flex-end' : 'flex-start';
};

/**
 * Gets the appropriate bubble style based on message type and sender
 * @param message Message to check
 * @param currentUserId Current user's ID
 * @returns Style object
 */
export const getBubbleStyle = (
  message: Message,
  currentUserId?: string,
  theme: any
) => {
  const isFromCurrentUser = isCurrentUser(message, currentUserId);
  
  return {
    alignSelf: isFromCurrentUser ? 'flex-end' : 'flex-start',
    backgroundColor: isFromCurrentUser 
      ? theme.colors.primary 
      : theme.colors.background,
    borderTopLeftRadius: isFromCurrentUser ? 16 : 4,
    borderTopRightRadius: isFromCurrentUser ? 4 : 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 12,
    marginVertical: 2,
    maxWidth: '80%',
  };
};
