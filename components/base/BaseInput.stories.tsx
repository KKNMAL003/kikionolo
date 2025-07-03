import React, { useState } from 'react';
import { BaseInput } from './BaseInput';

export default {
  title: 'Base/BaseInput',
  component: BaseInput,
};

export const Default = () => {
  const [value, setValue] = useState('');
  return <BaseInput value={value} onChangeText={setValue} placeholder="Type here..." />;
}; 