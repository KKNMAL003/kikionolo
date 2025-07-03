import React from 'react';
import { BaseButton } from './BaseButton';
import { Ionicons } from '@expo/vector-icons';

export default {
  title: 'Base/BaseButton',
  component: BaseButton,
};

export const Primary = () => <BaseButton>Primary Button</BaseButton>;
export const Secondary = () => <BaseButton variant="secondary">Secondary Button</BaseButton>;
export const Outline = () => <BaseButton variant="outline">Outline Button</BaseButton>;
export const WithIcon = () => (
  <BaseButton iconLeft={<Ionicons name="star" size={16} color="#fff" />}>With Icon</BaseButton>
); 