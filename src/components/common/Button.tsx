// src/components/common/Button.tsx
// A reusable Button component with basic styling.

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'; // Ensure StyleSheet is explicitly imported here

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'danger'; // Added variant prop
}

export const Button: React.FC<ButtonProps> = ({ // Named export
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  variant = 'primary', // Default variant
}) => {
  // Determine button styles based on variant and disabled state
  const buttonStyles: ViewStyle[] = [commonButtonStyles.button, style];
  const textStylesArray: TextStyle[] = [commonButtonStyles.buttonText, textStyle];

  if (variant === 'primary') {
    buttonStyles.push(commonButtonStyles.primaryButton);
    textStylesArray.push(commonButtonStyles.primaryButtonText);
  } else if (variant === 'secondary') {
    buttonStyles.push(commonButtonStyles.secondaryButton);
    textStylesArray.push(commonButtonStyles.secondaryButtonText);
  } else if (variant === 'danger') {
    buttonStyles.push(commonButtonStyles.dangerButton);
    textStylesArray.push(commonButtonStyles.dangerButtonText);
  }

  if (disabled) {
    buttonStyles.push(commonButtonStyles.buttonDisabled);
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={textStylesArray}>{title}</Text>
    </TouchableOpacity>
  );
};

// FIX: Ensure StyleSheet.create is used correctly here.
const commonButtonStyles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120, // Ensure minimum width for touchability
  },
  primaryButton: {
    backgroundColor: '#6200EE', // Deep Purple
  },
  secondaryButton: {
    backgroundColor: '#03DAC6', // Teal
  },
  dangerButton: {
    backgroundColor: '#B00020', // Red for danger actions
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
