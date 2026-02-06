import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  style?: ViewStyle;
  disabled?: boolean;
}

const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  onDelete,
  variant = 'filled',
  size = 'medium',
  color = 'primary',
  style,
  disabled = false,
}) => {
  const chipStyle = [
    styles.chip,
    styles[`${variant}Chip`],
    styles[`${size}Chip`],
    styles[`${color}Chip`],
    selected && styles[`${variant}ChipSelected`],
    selected && styles[`${color}ChipSelected`],
    disabled && styles.disabledChip,
    style,
  ];

  const textStyle = [
    styles.chipText,
    styles[`${variant}ChipText`],
    styles[`${size}ChipText`],
    styles[`${color}ChipText`],
    selected && styles[`${variant}ChipTextSelected`],
    selected && styles[`${color}ChipTextSelected`],
    disabled && styles.disabledChipText,
  ];

  const ChipContent = () => (
    <>
      <Text style={textStyle}>{label}</Text>
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={disabled}
        >
          <Text style={[styles.deleteIcon, disabled && styles.disabledDeleteIcon]}>
            ✕
          </Text>
        </TouchableOpacity>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={chipStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <ChipContent />
      </TouchableOpacity>
    );
  }

  return (
    <View style={chipStyle}>
      <ChipContent />
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  
  // Variants
  filledChip: {
    backgroundColor: '#f0f0f0',
  },
  outlinedChip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  
  // Sizes
  smallChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediumChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  
  // Colors
  primaryChip: {},
  secondaryChip: {},
  successChip: {},
  warningChip: {},
  errorChip: {},
  
  // Selected states
  filledChipSelected: {},
  outlinedChipSelected: {
    backgroundColor: '#f0f8ff',
  },
  
  // Color-specific selected states
  primaryChipSelected: {
    backgroundColor: '#2196F3',
  },
  secondaryChipSelected: {
    backgroundColor: '#f5f5f5',
  },
  successChipSelected: {
    backgroundColor: '#4CAF50',
  },
  warningChipSelected: {
    backgroundColor: '#FF9800',
  },
  errorChipSelected: {
    backgroundColor: '#F44336',
  },
  
  // Text styles
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  
  // Variant text styles
  filledChipText: {
    color: '#333',
  },
  outlinedChipText: {
    color: '#333',
  },
  
  // Size text styles
  smallChipText: {
    fontSize: 12,
  },
  mediumChipText: {
    fontSize: 14,
  },
  
  // Color text styles
  primaryChipText: {},
  secondaryChipText: {},
  successChipText: {},
  warningChipText: {},
  errorChipText: {},
  
  // Selected text styles
  filledChipTextSelected: {
    color: '#fff',
  },
  outlinedChipTextSelected: {
    color: '#2196F3',
  },
  
  // Color-specific selected text styles
  primaryChipTextSelected: {
    color: '#fff',
  },
  secondaryChipTextSelected: {
    color: '#333',
  },
  successChipTextSelected: {
    color: '#fff',
  },
  warningChipTextSelected: {
    color: '#fff',
  },
  errorChipTextSelected: {
    color: '#fff',
  },
  
  // Delete button
  deleteButton: {
    marginLeft: 4,
    padding: 2,
  },
  deleteIcon: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  
  // Disabled states
  disabledChip: {
    opacity: 0.5,
  },
  disabledChipText: {
    opacity: 0.7,
  },
  disabledDeleteIcon: {
    opacity: 0.5,
  },
});

export default Chip;