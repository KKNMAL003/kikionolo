import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MessageComposerProps {
  onSend: (text: string) => void;
  onAttachmentPress?: () => void;
  onCameraPress?: () => void;
  onEmojiPress?: () => void;
  onVoiceNotePress?: () => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxHeight?: number;
  minHeight?: number;
  showAttachmentButton?: boolean;
  showCameraButton?: boolean;
  showEmojiButton?: boolean;
  showVoiceNoteButton?: boolean;
  showSendButton?: boolean;
  text?: string;
  autoFocus?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  onAttachmentPress,
  onCameraPress,
  onEmojiPress,
  onVoiceNotePress,
  onTypingStart,
  onTypingEnd,
  placeholder = 'Type a message...',
  disabled = false,
  maxHeight = 120,
  minHeight = 40,
  showAttachmentButton = true,
  showCameraButton = true,
  showEmojiButton = true,
  showVoiceNoteButton = true,
  showSendButton = true,
  text: externalText,
  autoFocus = false,
}) => {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState(externalText || '');
  const [isFocused, setIsFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(minHeight);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isFocused && text.trim().length > 0) {
      setIsFocused(true);
      onTypingStart?.();
    } else if (isFocused && text.trim().length === 0) {
      setIsFocused(false);
      onTypingEnd?.();
    }
  }, [text, isFocused, onTypingStart, onTypingEnd]);

  // Handle send
  const handleSend = useCallback(() => {
    const trimmedText = text.trim();
    if (trimmedText.length > 0) {
      onSend(trimmedText);
      setText('');
      if (contentHeight > minHeight) {
        setContentHeight(minHeight);
      }
    }
  }, [text, onSend, contentHeight, minHeight]);

  // Handle content size change
  const handleContentSizeChange = useCallback((e) => {
    const { height } = e.nativeEvent.contentSize;
    setContentHeight(Math.max(minHeight, Math.min(height, maxHeight)));
  }, [minHeight, maxHeight]);

  return (
    <View style={styles.container}>
      {/* Left action buttons */}
      <View style={styles.leftActions}>
        {showAttachmentButton && (
          <TouchableOpacity
            onPress={onAttachmentPress}
            disabled={disabled}
            style={styles.actionButton}
          >
            <Icon name="paperclip" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        {showCameraButton && (
          <TouchableOpacity
            onPress={onCameraPress}
            disabled={disabled}
            style={styles.actionButton}
          >
            <Icon name="camera" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Message input */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={(newText) => {
            setText(newText);
            handleTyping();
          }}
          onContentSizeChange={handleContentSizeChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          style={[
            styles.input,
            { height: Math.max(minHeight, contentHeight) },
          ]}
          multiline={true}
          autoFocus={autoFocus}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
          editable={!disabled}
          maxLength={1000}
        />

        {/* Right action buttons */}
        <View style={styles.rightActions}>
          {showEmojiButton && (
            <TouchableOpacity
              onPress={onEmojiPress}
              disabled={disabled}
              style={styles.actionButton}
            >
              <Icon name="emoticon-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          {showVoiceNoteButton && (
            <TouchableOpacity
              onPress={onVoiceNotePress}
              disabled={disabled}
              style={styles.actionButton}
            >
              <Icon name="microphone" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Send button */}
      {showSendButton && (
        <TouchableOpacity
          onPress={handleSend}
          disabled={disabled || text.trim().length === 0}
          style={[
            styles.sendButton,
            { backgroundColor: text.trim().length > 0 ? theme.colors.primary : theme.colors.background },
          ]}
        >
          <Icon name="send" size={20} color={text.trim().length > 0 ? '#FFFFFF' : theme.colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    minHeight: 40,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
    padding: 0,
    margin: 0,
  },
  sendButton: {
    padding: 8,
    borderRadius: 24,
    marginRight: 8,
  },
});
