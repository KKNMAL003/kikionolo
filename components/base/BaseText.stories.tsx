import React from 'react';
import { BaseText } from './BaseText';

export default {
  title: 'Base/BaseText',
  component: BaseText,
};

export const Primary = () => <BaseText>Primary Text</BaseText>;
export const Secondary = () => <BaseText color="secondary">Secondary Text</BaseText>;
export const Heading = () => <BaseText size="h1" weight="bold">Heading 1</BaseText>;
export const Monospace = () => <BaseText monospace>Monospace Text</BaseText>; 