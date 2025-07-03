import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, View, Text, ActivityIndicator, RefreshControl, StyleProp, ViewStyle, ListRenderItem } from 'react-native';
import { format } from 'date-fns';
import { Message, MessageGroup } from '../../types/messaging';
import MessageBubble from './MessageBubble';
import { useTheme } from '../../contexts/ThemeContext';

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  refreshing?: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  onPressMessage?: (message: Message) => void;
  onLongPressMessage?: (message: Message) => void;
  onPressUser?: (userId: string) => void;
  onPressReaction?: (messageId: string, emoji: string) => void;
  onPressOption?: (messageId: string, option: string) => void;
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: Error) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  inverted?: boolean;
  showAvatar?: boolean;
  showStatus?: boolean;
  showUsername?: boolean;
  showDateHeaders?: boolean;
  groupMessagesByUser?: boolean;
  maxGroupTimeGap?: number;
}

const DEFAULT_MAX_GROUP_TIME_GAP = 5 * 60 * 1000; // 5 minutes

const MessageList: React.FC<MessageListProps> = ({
  messages = [],
  currentUserId = '',
  loading = false,
  loadingMore = false,
  hasMore = false,
  refreshing = false,
  onLoadMore,
  onRefresh,
  onPressMessage,
  onLongPressMessage,
  onPressUser,
  onPressReaction,
  onPressOption,
  renderHeader,
  renderFooter,
  renderEmpty,
  renderLoading,
  style,
  contentContainerStyle,
  inverted = true,
  showAvatar = true,
  showStatus = true,
  showUsername = true,
  showDateHeaders = true,
  groupMessagesByUser = true,
  maxGroupTimeGap = DEFAULT_MAX_GROUP_TIME_GAP,
}) => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [isAtBottom, setIsAtBottom] = React.useState(true);

  // Group messages by date and sender
  const messageGroups = useMemo(() => {
    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    (Array.isArray(messages) ? messages : []).forEach((message, index) => {
      const messageDate = format(message.timestamp, 'yyyy-MM-dd');
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
      
      // Check if we need to show date header
      const showDate = !prevMessage || 
        format(prevMessage.timestamp, 'yyyy-MM-dd') !== messageDate;
      
      // Check if we can group with previous message
      const canGroupWithPrevious = groupMessagesByUser && 
        prevMessage && 
        prevMessage.senderId === message.senderId && 
        (message.timestamp - prevMessage.timestamp) <= maxGroupTimeGap;
      
      if (canGroupWithPrevious && currentGroup) {
        // Add to current group
        currentGroup.messages.push(message);
      } else {
        // Create new group
        currentGroup = {
          id: `group-${message.id}`,
          date: messageDate,
          sender: { id: message.senderId },
          messages: [message],
          showDate,
        };
        groups.push(currentGroup);
      }
    });

    return groups;
  }, [messages, groupMessagesByUser, maxGroupTimeGap]);

  // Handle load more when scrolling near the top
  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore || isScrolling) return;
    onLoadMore?.();
  }, [loading, loadingMore, hasMore, isScrolling, onLoadMore]);

  // Handle scroll events
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottomValue = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    
    if (isAtBottom !== isAtBottomValue) {
      setIsAtBottom(isAtBottomValue);
    }
  }, [isAtBottom]);

  // Handle scroll begin/end
  const handleScrollBeginDrag = useCallback(() => {
    setIsScrolling(true);
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    setIsScrolling(false);
  }, []);

  // Render a single message group
  const renderMessageGroup = useCallback(({ item }: { item: MessageGroup }) => {
    return (
      <View style={styles.messageGroup}>
        {item.showDate && showDateHeaders && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>
              {format(new Date(item.date), 'MMMM d, yyyy')}
            </Text>
          </View>
        )}
        {item.messages.map((message, index) => {
          const isCurrentUser = message.senderId === currentUserId;
          const isFirstInGroup = index === 0;
          const isLastInGroup = index === item.messages.length - 1;
          const showAvatarForMessage = showAvatar && isLastInGroup && !isCurrentUser;
          const showUsernameForMessage = showUsername && isFirstInGroup && !isCurrentUser;
          
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={isCurrentUser}
              showAvatar={showAvatarForMessage}
              showStatus={showStatus && isCurrentUser}
              showUsername={showUsernameForMessage}
              showDate={isLastInGroup}
              onPress={() => onPressMessage?.(message)}
              onLongPress={() => onLongPressMessage?.(message)}
              onPressUser={() => onPressUser?.(message.senderId)}
              onPressReaction={(emoji) => onPressReaction?.(message.id, emoji)}
              onPressOption={(option) => onPressOption?.(message.id, option)}
              style={[
                styles.messageBubble,
                isFirstInGroup && styles.firstMessageInGroup,
                isLastInGroup && styles.lastMessageInGroup,
                isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
              ]}
            />
          );
        })}
      </View>
    );
  }, [currentUserId, onPressMessage, onLongPressMessage, onPressUser, onPressReaction, onPressOption, showAvatar, showStatus, showUsername, showDateHeaders]);

  // Render list header
  const renderListHeader = useCallback(() => {
    if (loading) {
      return renderLoading ? (
        renderLoading()
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }
    
    return renderHeader?.() || null;
  }, [loading, renderHeader, renderLoading, theme]);

  // Render list footer
  const renderListFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }
    
    return renderFooter?.() || null;
  }, [loadingMore, renderFooter, theme]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (loading) return null;
    
    if (renderEmpty) {
      return renderEmpty();
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.text }]}>
          No messages yet
        </Text>
      </View>
    );
  }, [loading, renderEmpty, theme]);

  // Scroll to bottom when new messages arrive and user is at bottom
  useEffect(() => {
    if (messages.length > 0 && isAtBottom) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages.length, isAtBottom]);

  return (
    <View style={[styles.container, style]}>
      <FlatList
        ref={flatListRef}
        data={messageGroups}
        renderItem={renderMessageGroup}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.contentContainer,
          contentContainerStyle,
          inverted && styles.invertedContent,
        ]}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        inverted={inverted}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={100}
        windowSize={21}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          ) : undefined
        }
      />
      
      {!isAtBottom && messages.length > 0 && (
        <TouchableOpacity
          style={[styles.scrollToBottomButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }}
        >
          <Text style={styles.scrollToBottomText}>▼</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  contentContainer: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  invertedContent: {
    flexDirection: 'column-reverse',
  },
  messageGroup: {
    marginBottom: 8,
  },
  messageBubble: {
    marginVertical: 2,
  },
  firstMessageInGroup: {
    marginTop: 8,
  },
  lastMessageInGroup: {
    marginBottom: 8,
  },
  currentUserBubble: {
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  otherUserBubble: {
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  dateHeader: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 8,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollToBottomText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MessageList;
