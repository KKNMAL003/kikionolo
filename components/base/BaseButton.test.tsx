import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BaseButton } from './BaseButton';

describe('BaseButton', () => {
  it('renders children', () => {
    const { getByText } = render(<BaseButton>Click me</BaseButton>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<BaseButton onPress={onPress}>Press</BaseButton>);
    fireEvent.press(getByText('Press'));
    expect(onPress).toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId } = render(<BaseButton loading>Load</BaseButton>);
    expect(getByTestId('ActivityIndicator')).toBeTruthy();
  });

  it('applies variant styles', () => {
    const { getByText } = render(<BaseButton variant="danger">Danger</BaseButton>);
    expect(getByText('Danger')).toBeTruthy();
  });
}); 