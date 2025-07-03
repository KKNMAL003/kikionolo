import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MessageActionsProps {
  onReply?: () => void;
  onForward?: () => void;
  onCopy?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: () => void;
  onPin?: () => void;
  onReport?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
  disabled?: boolean;
  message?: any;
  isOwnMessage?: boolean;
  isPinned?: boolean;
  isForwarded?: boolean;
  isEditable?: boolean;
  isDeletable?: boolean;
  isReactable?: boolean;
  isSharable?: boolean;
  isDownloadable?: boolean;
  style?: any;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  onReply,
  onForward,
  onCopy,
  onEdit,
  onDelete,
  onReact,
  onPin,
  onReport,
  onShare,
  onDownload,
  onClose,
  disabled = false,
  message,
  isOwnMessage = false,
  isPinned = false,
  isForwarded = false,
  isEditable = true,
  isDeletable = true,
  isReactable = true,
  isSharable = true,
  isDownloadable = true,
  style,
}) => {
  const theme = useTheme();

  const renderAction = (
    icon: string,
    onPress: () => void,
    label: string,
    disabled?: boolean
  ) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.action,
          disabled && styles.disabledAction,
          {
            backgroundColor: disabled
              ? theme.colors.background
              : theme.colors.surface,
          },
        ]}
      >
        <Icon
          name={icon}
          size={20}
          color={disabled
            ? theme.colors.placeholder
            : theme.colors.primary}
        />
        <View style={styles.actionLabel}>
          <Text
            style={[
              styles.actionLabelText,
              disabled && {
                color: theme.colors.placeholder,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Left actions */}
      <View style={styles.leftActions}>
        {onReply && renderAction('reply', onReply, 'Reply')}
        {onForward && renderAction('forward', onForward, 'Forward')}
        {onCopy && renderAction('content-copy', onCopy, 'Copy')}
      </View>

      {/* Center actions */}
      <View style={styles.centerActions}>
        {isEditable && onEdit && renderAction('pencil', onEdit, 'Edit')}
        {isDeletable && onDelete && renderAction('delete', onDelete, 'Delete')}
        {isReactable && onReact && renderAction('emoticon-outline', onReact, 'React')}
      </View>

      {/* Right actions */}
      <View style={styles.rightActions}>
        {isSharable && onShare && renderAction('share', onShare, 'Share')}
        {isDownloadable && onDownload && renderAction('download', onDownload, 'Download')}
        {onClose && renderAction('close', onClose, 'Close')}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  disabledAction: {
    opacity: 0.5,
  },
  actionLabel: {
    marginLeft: 8,
  },
  actionLabelText: {
    fontSize: 14,
    color: '#000000',
  },
});
