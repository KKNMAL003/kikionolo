import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MessageInputProps {
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
  enableMentions?: boolean;
  enableHashtags?: boolean;
  text?: string;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad' | 'decimal-pad';
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  blurOnSubmit?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardAppearance?: 'default' | 'light' | 'dark';
  textContentType?: 'none' | 'URL' | 'emailAddress' | 'name' | 'password' | 'newPassword' | 'oneTimeCode';
  textAlign?: 'left' | 'center' | 'right';
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  numberOfLines?: number;
  spellCheck?: boolean;
  scrollEnabled?: boolean;
  editable?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
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
  enableMentions = true,
  enableHashtags = true,
  text: externalText,
  autoFocus = false,
  keyboardType = 'default',
  returnKeyType = 'send',
  blurOnSubmit = false,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  keyboardAppearance = 'default',
  textContentType = 'none',
  textAlign = 'left',
  textAlignVertical = 'center',
  numberOfLines = 1,
  spellCheck = true,
  scrollEnabled = true,
  editable = true,
  testID,
  accessibilityLabel = 'Message input',
}) => {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState(externalText || '');
  const [isFocused, setIsFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(minHeight);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle text changes
  const handleChangeText = useCallback((newText: string) => {
    setText(newText);
    
    // Handle typing indicator
    if (!isTyping && newText.trim().length > 0) {
      setIsTyping(true);
      onTypingStart?.();
    } else if (isTyping && newText.trim().length === 0) {
      setIsTyping(false);
      onTypingEnd?.();
    }

    // Reset typing indicator after delay
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (newText.trim().length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTypingEnd?.();
      }, 2000);
    }
  }, [isTyping, onTypingStart, onTypingEnd]);

  // Handle send
  const handleSend = useCallback(() => {
    const trimmedText = text.trim();
    if (trimmedText.length > 0) {
      onSend(trimmedText);
      setText('');
      
      // Reset input height
      if (contentHeight > minHeight) {
        setContentHeight(minHeight);
      }
    }
  }, [text, onSend, contentHeight, minHeight]);

  // Handle keyboard submit
  const handleSubmitEditing = useCallback(() => {
    handleSend();
  }, [handleSend]);

  // Handle content size change
  const handleContentSizeChange = useCallback((e: any) => {
    const { height } = e.nativeEvent.contentSize;
    const newHeight = Math.max(minHeight, Math.min(height, maxHeight));
    setContentHeight(newHeight);
  }, [maxHeight, minHeight]);

  // Handle focus/blur
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Render action buttons
  const renderActionButton = useCallback((
    icon: string,
    onPress: (() => void) | undefined,
    visible: boolean = true,
    testID?: string
  ) => {
    if (!visible || !onPress) return null;
    
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.actionButton}
        disabled={disabled}
        testID={testID}
      >
        <Icon 
          name={icon} 
          size={24} 
          color={theme.colors.primary} 
        />
      </TouchableOpacity>
    );
  }, [disabled, theme.colors.primary]);

  return (
    <View style={styles.container}>
      {/* Left action buttons */}
      <View style={styles.leftActions}>
        {renderActionButton('paperclip', onAttachmentPress, showAttachmentButton, 'attachment-button')}
        {renderActionButton('camera', onCameraPress, showCameraButton, 'camera-button')}
      </View>

      {/* Message input */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmitEditing}
          onContentSizeChange={handleContentSizeChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          style={[styles.input, { height: contentHeight }]}
          multiline={true}
          maxLength={1000}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          blurOnSubmit={blurOnSubmit}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardAppearance={keyboardAppearance}
          textContentType={textContentType}
          textAlign={textAlign as any}
          textAlignVertical={textAlignVertical as any}
          numberOfLines={numberOfLines}
          spellCheck={spellCheck}
          scrollEnabled={scrollEnabled}
          editable={!disabled && editable}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="text"
          underlineColorAndroid="transparent"
          enablesReturnKeyAutomatically
        />

        {/* Right action buttons */}
        <View style={styles.rightActions}>
          {renderActionButton('emoticon-outline', onEmojiPress, showEmojiButton, 'emoji-button')}
          {renderActionButton('microphone', onVoiceNotePress, showVoiceNoteButton && text?.trim().length === 0, 'voice-note-button')}
        </View>
      </View>

      {/* Send button */}
      {showSendButton && (
        <TouchableOpacity
          onPress={handleSend}
          disabled={disabled || text.trim().length === 0}
          style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
          testID="send-button"
          accessibilityLabel="Send message"
          accessibilityRole="button"
        >
          <Icon 
            name="send" 
            size={20} 
            color="#FFFFFF" 
          />
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
