import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, GestureResponderEvent, StyleProp, ViewStyle, ImageStyle, TextStyle, Platform } from 'react-native';
import { formatMessageTime } from '../../utils/dateUtils';
import { Message, MessageStatus, MessageType } from '../../types/messaging';
import { useTheme } from '../../contexts/ThemeContext';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser?: boolean;
  showAvatar?: boolean;
  showStatus?: boolean;
  showUsername?: boolean;
  showDate?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressUser?: () => void;
  onPressReply?: () => void;
  onPressReaction?: (emoji: string) => void;
  onPressOption?: (option: string) => void;
  renderCustomContent?: (message: Message) => React.ReactNode;
  renderCustomHeader?: (message: Message) => React.ReactNode;
  renderCustomFooter?: (message: Message) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bubbleStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  timeStyle?: StyleProp<TextStyle>;
  usernameStyle?: StyleProp<TextStyle>;
  avatarStyle?: StyleProp<ImageStyle>;
  statusStyle?: StyleProp<ViewStyle>;
  maxWidth?: number | string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser = false,
  showAvatar = true,
  showStatus = true,
  showUsername = false,
  showDate = true,
  onPress,
  onLongPress,
  onPressUser,
  onPressReply,
  onPressReaction,
  onPressOption,
  renderCustomContent,
  renderCustomHeader,
  renderCustomFooter,
  style,
  bubbleStyle,
  textStyle,
  timeStyle,
  usernameStyle,
  avatarStyle,
  statusStyle,
  maxWidth = '80%',
}) => {
  const theme = useTheme();
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const handleLongPress = useCallback(() => {
    onLongPress?.();
    setShowOptions(true);
  }, [onLongPress]);

  const handlePressReaction = useCallback((emoji: string) => {
    onPressReaction?.(emoji);
    setShowReactions(false);
  }, [onPressReaction]);

  const handlePressOption = useCallback((option: string) => {
    onPressOption?.(option);
    setShowOptions(false);
  }, [onPressOption]);

  const renderContent = useMemo(() => {
    if (renderCustomContent) {
      return renderCustomContent(message);
    }

    switch (message.type) {
      case 'text':
        return (
          <Text style={[styles.text, textStyle]}>
            {message.text}
          </Text>
        );
      case 'image':
        return (
          <Image
            source={{ uri: message.file?.uri || message.previewUrl }}
            style={styles.media}
            resizeMode="cover"
          />
        );
      case 'video':
        return (
          <View style={styles.videoContainer}>
            <Image
              source={{ uri: message.thumbnailUrl }}
              style={styles.media}
              resizeMode="cover"
            />
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>
        );
      case 'file':
        return (
          <View style={styles.fileContainer}>
            <Text style={styles.fileName} numberOfLines={1}>
              {message.file?.name || 'File'}
            </Text>
            <Text style={styles.fileSize}>
              {message.size ? formatFileSize(message.size) : 'Unknown size'}
            </Text>
          </View>
        );
      default:
        return null;
    }
  }, [message, renderCustomContent, textStyle]);

  const renderHeader = useMemo(() => {
    if (renderCustomHeader) {
      return renderCustomHeader(message);
    }

    if (showUsername && !isCurrentUser) {
      return (
        <Text 
          style={[styles.username, usernameStyle]}
          onPress={onPressUser}
        >
          {message.senderId}
        </Text>
      );
    }

    return null;
  }, [message, isCurrentUser, showUsername, renderCustomHeader, usernameStyle, onPressUser]);

  const renderFooter = useMemo(() => {
    if (renderCustomFooter) {
      return renderCustomFooter(message);
    }

    return (
      <View style={styles.footer}>
        {showDate && (
          <Text style={[styles.time, timeStyle]}>
            {formatMessageTime(message.timestamp)}
          </Text>
        )}
        {showStatus && isCurrentUser && (
          <View style={[styles.status, statusStyle]}>
            {message.status === 'sending' && <Text style={styles.statusText}>🕒</Text>}
            {message.status === 'sent' && <Text style={styles.statusText}>✓</Text>}
            {message.status === 'delivered' && <Text style={styles.statusText}>✓✓</Text>}
            {message.status === 'read' && <Text style={styles.statusText}>✓✓✓</Text>}
            {message.status === 'failed' && <Text style={[styles.statusText, styles.failed]}>✕</Text>}
          </View>
        )}
      </View>
    );
  }, [message, isCurrentUser, showDate, showStatus, renderCustomFooter, timeStyle, statusStyle]);

  const bubbleStyles = [
    styles.bubble,
    isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
    bubbleStyle,
    { maxWidth },
  ];

  const containerStyles = [
    styles.container,
    isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
    style,
  ];

  return (
    <View style={containerStyles}>
      {!isCurrentUser && showAvatar && (
        <TouchableOpacity onPress={onPressUser} style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/40' }}
            style={[styles.avatar, avatarStyle]}
          />
        </TouchableOpacity>
      )}
      
      <View style={styles.messageContainer}>
        {renderHeader}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePress}
          onLongPress={handleLongPress}
          style={bubbleStyles}
        >
          {message.replyToId && (
            <View style={styles.replyContainer}>
              <Text style={styles.replyText} numberOfLines={1}>
                Replying to: {message.replyToId}
              </Text>
            </View>
          )}
          {renderContent}
          {renderFooter}
        </TouchableOpacity>
      </View>

      {/* Reactions */}
      {showReactions && (
        <View style={styles.reactionsContainer}>
          {['👍', '❤️', '😮', '😢', '😡', '🎉'].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionItem}
              onPress={() => handlePressReaction(emoji)}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Options */}
      {showOptions && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handlePressOption('reply')}
          >
            <Text style={styles.optionText}>Reply</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handlePressOption('copy')}
          >
            <Text style={styles.optionText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => handlePressOption('forward')}
          >
            <Text style={styles.optionText}>Forward</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, styles.deleteButton]}
            onPress={() => handlePressOption('delete')}
          >
            <Text style={[styles.optionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
  },
  messageContainer: {
    maxWidth: '80%',
  },
  bubble: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#F1F0F0',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  media: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  videoContainer: {
    position: 'relative',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 2,
  },
  fileContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.5)',
    marginRight: 4,
  },
  status: {
    marginLeft: 4,
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
  },
  failed: {
    color: '#FF3B30',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  username: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    marginLeft: 8,
  },
  replyContainer: {
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    paddingLeft: 8,
    marginBottom: 8,
  },
  replyText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  reactionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 4,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  reactionItem: {
    padding: 4,
  },
  reactionEmoji: {
    fontSize: 20,
  },
  optionsContainer: {
    position: 'absolute',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 14,
    color: '#000',
  },
  deleteButton: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    marginTop: 4,
    paddingTop: 12,
  },
  deleteText: {
    color: '#FF3B30',
  },
});

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default MessageBubble;
