import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BaseInput } from './BaseInput';

describe('BaseInput', () => {
  it('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <BaseInput placeholder="Type here..." />
    );
    expect(getByPlaceholderText('Type here...')).toBeTruthy();
  });

  it('calls onChangeText when typing', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <BaseInput placeholder="Type here..." onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByPlaceholderText('Type here...'), 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });
}); 