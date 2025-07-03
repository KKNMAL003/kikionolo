import React from 'react';
import { BaseCard } from './BaseCard';
import { BaseText } from './BaseText';

export default {
  title: 'Base/BaseCard',
  component: BaseCard,
};

export const Default = () => (
  <BaseCard>
    <BaseText>This is a card</BaseText>
  </BaseCard>
); 