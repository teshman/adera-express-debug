// src/components/common/Input.tsx
// A reusable Input component with basic styling.

import React from 'react';
import { TextInput, StyleSheet, ViewStyle, TextStyle, KeyboardTypeOptions } from 'react-native'; // Ensure StyleSheet is explicitly imported here

interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  style?: ViewStyle | TextStyle; // Allow both ViewStyle and TextStyle
}

export const Input: React.FC<InputProps> = ({ // Named export
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  style,
}) => {
  return (
    <TextInput
      style={[commonInputStyles.input, style]}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      placeholderTextColor="#A0A0A0" // Light gray placeholder text
    />
  );
};

// FIX: Ensure StyleSheet.create is used correctly here.
const commonInputStyles = StyleSheet.create({
  input: {
    width: '100%',
    height: 50,
    borderColor: '#D0D0D0', // Light gray border
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#333333', // Dark text color
  },
});
