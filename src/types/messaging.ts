import { FileInfo } from '../utils/fileUtils';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'contact' | 'sticker';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: number;
}

export interface Reaction {
  emoji: string;
  userId: string;
  timestamp: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  type: MessageType;
  status: MessageStatus;
  timestamp: number;
  updatedAt?: number;
  isEdited?: boolean;
  isDeleted?: boolean;
  deletedForEveryone?: boolean;
  deletedForMe?: Record<string, boolean>;
  reactions?: Reaction[];
  replyToId?: string;
  forwardedFrom?: string;
  metadata?: Record<string, unknown>;
  file?: FileInfo;
  localPath?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  size?: number;
  mimeType?: string;
  caption?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contact?: {
    name: string;
    phoneNumbers: string[];
    emails?: string[];
  };
  readBy?: Record<string, number>;
  deliveredTo?: Record<string, number>;
  seenBy?: Record<string, number>;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

export interface MessageGroup {
  id: string;
  date: string;
  sender: User;
  messages: Message[];
  showDate: boolean;
}

export interface SendMessageParams {
  conversationId: string;
  text?: string;
  type?: MessageType;
  file?: FileInfo;
  replyToId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateMessageParams {
  messageId: string;
  text?: string;
  status?: MessageStatus;
  isEdited?: boolean;
  isDeleted?: boolean;
  deletedForEveryone?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ReactToMessageParams {
  messageId: string;
  emoji: string;
  userId: string;
}

export interface MarkAsReadParams {
  messageIds: string[];
  userId: string;
  timestamp: number;
}

export interface PaginationParams {
  limit: number;
  before?: number;
  after?: number;
}

export interface MessageListProps {
  messages: Message[];
  currentUser: User;
  onLoadMore: () => Promise<void>;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message, forEveryone: boolean) => void;
  onPressUser?: (userId: string) => void;
  onLongPress?: (message: Message) => void;
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: Error) => React.ReactNode;
  loading?: boolean;
  hasMore?: boolean;
  error?: Error | null;
  inverted?: boolean;
  showUserAvatars?: boolean;
  showStatus?: boolean;
  showDateHeaders?: boolean;
  groupMessagesByUser?: boolean;
  enableReactions?: boolean;
  enableReplies?: boolean;
  enableEditing?: boolean;
  enableDeleting?: boolean;
  enableForwarding?: boolean;
  enableCopying?: boolean;
  enableSelection?: boolean;
  selectedMessages?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  style?: React.CSSProperties;
  className?: string;
}

export interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  showAvatar: boolean;
  showStatus: boolean;
  showUsername: boolean;
  showDate: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressUser?: () => void;
  onPressReply?: () => void;
  onPressReaction?: (emoji: string) => void;
  onPressOption?: (option: string) => void;
  renderCustomContent?: (message: Message) => React.ReactNode;
  renderCustomHeader?: (message: Message) => React.ReactNode;
  renderCustomFooter?: (message: Message) => React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export interface MessageInputProps {
  onSend: (text: string) => void;
  onAttachmentPress?: () => void;
  onCameraPress?: () => void;
  onVoiceNotePress?: () => void;
  onEmojiPress?: () => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
  placeholder?: string;
  inputStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  sendButtonStyle?: React.CSSProperties;
  attachmentButtonStyle?: React.CSSProperties;
  cameraButtonStyle?: React.CSSProperties;
  voiceNoteButtonStyle?: React.CSSProperties;
  emojiButtonStyle?: React.CSSProperties;
  disabled?: boolean;
  maxHeight?: number;
  autoFocus?: boolean;
  multiline?: boolean;
  showAttachmentButton?: boolean;
  showCameraButton?: boolean;
  showVoiceNoteButton?: boolean;
  showEmojiButton?: boolean;
  showSendButton?: boolean;
  enableMentions?: boolean;
  enableHashtags?: boolean;
  renderCustomInput?: (props: any) => React.ReactNode;
  renderCustomSendButton?: (onPress: () => void, disabled: boolean) => React.ReactNode;
  renderCustomAttachmentButton?: (onPress: () => void) => React.ReactNode;
  renderCustomCameraButton?: (onPress: () => void) => React.ReactNode;
  renderCustomVoiceNoteButton?: (onPress: () => void, isRecording: boolean) => React.ReactNode;
  renderCustomEmojiButton?: (onPress: () => void) => React.ReactNode;
}

export interface MessageStatusProps {
  status: MessageStatus;
  timestamp: number;
  seenBy?: Record<string, number>;
  deliveredTo?: Record<string, number>;
  readBy?: Record<string, number>;
  currentUserId?: string;
  users?: Record<string, User>;
  showTime?: boolean;
  showStatus?: boolean;
  showReadReceipts?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export interface MessageReactionsProps {
  reactions: Reaction[];
  onReactionPress?: (emoji: string) => void;
  onLongPress?: (emoji: string) => void;
  currentUserId?: string;
  style?: React.CSSProperties;
  className?: string;
}

export interface MessageContextType {
  messages: Message[];
  conversations: Conversation[];
  currentConversation?: Conversation;
  currentUser?: User;
  users: Record<string, User>;
  loading: boolean;
  hasMore: boolean;
  error: Error | null;
  sendMessage: (params: SendMessageParams) => Promise<Message>;
  updateMessage: (params: UpdateMessageParams) => Promise<Message>;
  deleteMessage: (messageId: string, forEveryone: boolean) => Promise<void>;
  reactToMessage: (params: ReactToMessageParams) => Promise<void>;
  markAsRead: (params: MarkAsReadParams) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  setCurrentConversation: (conversationId: string) => void;
  createConversation: (participantIds: string[], type?: 'direct' | 'group') => Promise<Conversation>;
  addParticipant: (conversationId: string, userId: string) => Promise<void>;
  removeParticipant: (conversationId: string, userId: string) => Promise<void>;
  muteConversation: (conversationId: string, muted: boolean) => Promise<void>;
  archiveConversation: (conversationId: string, archived: boolean) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  searchMessages: (query: string, conversationId?: string) => Promise<Message[]>;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  uploadFile: (file: FileInfo, onProgress?: (progress: number) => void) => Promise<string>;
  downloadFile: (fileId: string, onProgress?: (progress: number) => void) => Promise<string>;
}
