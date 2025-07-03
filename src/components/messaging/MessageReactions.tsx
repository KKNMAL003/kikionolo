import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MessageReactionsProps {
  message: any;
  onReact: (emoji: string) => void;
  onClose: () => void;
  visible: boolean;
  style?: any;
  emojis?: string[];
  maxReactions?: number;
}

const defaultEmojis = [
  '👍', '❤️', '😂', '🎉', '😢', '🤔', '👀', '👏', '🔥', '🥰',
  '😊', '😍', '🤩', '🤔', '🥰', '😎', '🤩', '🥳', '🎈', '🎉',
];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  message,
  onReact,
  onClose,
  visible = false,
  style,
  emojis = defaultEmojis,
  maxReactions = 20,
}) => {
  const theme = useTheme();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [scale] = useState(new Animated.Value(1));

  // Animate scale when visible changes
  React.useEffect(() => {
    if (visible) {
      Animated.spring(scale, {
        toValue: 1.05,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scale]);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    setSelectedEmoji(emoji);
    onReact(emoji);
  }, [onReact]);

  // Handle reaction removal
  const handleRemoveReaction = useCallback(() => {
    if (selectedEmoji) {
      onReact(selectedEmoji);
      setSelectedEmoji(null);
    }
  }, [selectedEmoji, onReact]);

  // Group reactions by emoji
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, any[]>);

  // Sort reactions by count
  const sortedReactions = Object.entries(groupedReactions || {})
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, maxReactions);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ scale }],
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Reaction buttons */}
      <View style={styles.reactionButtons}>
        {emojis.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleEmojiSelect(emoji)}
            style={[
              styles.reactionButton,
              selectedEmoji === emoji && styles.selectedReactionButton,
            ]}
          >
            <Icon
              name={emoji}
              size={24}
              color={selectedEmoji === emoji ? theme.colors.primary : theme.colors.text}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Current reactions */}
      {sortedReactions.length > 0 && (
        <View style={styles.currentReactions}>
          {sortedReactions.map(([emoji, reactions]) => (
            <View key={emoji} style={styles.reactionItem}>
              <Icon
                name={emoji}
                size={20}
                color={theme.colors.text}
              />
              <Text style={[styles.reactionCount, { color: theme.colors.text }]}>
                {reactions.length}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Close button */}
      <TouchableOpacity
        onPress={onClose}
        style={[
          styles.closeButton,
          {
            backgroundColor: theme.colors.primary,
          },
        ]}
      >
        <Icon
          name="close"
          size={20}
          color={theme.colors.background}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
  },
  reactionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  reactionButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  selectedReactionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  currentReactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    borderRadius: 24,
  },
});
