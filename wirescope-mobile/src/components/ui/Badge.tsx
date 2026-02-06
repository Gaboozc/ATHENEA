import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface BadgeProps {
  count?: number;
  text?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  position?: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft' | 'inline';
  style?: ViewStyle;
  showZero?: boolean;
  maxCount?: number;
}

const Badge: React.FC<BadgeProps> = ({
  count,
  text,
  variant = 'primary',
  size = 'medium',
  position = 'inline',
  style,
  showZero = false,
  maxCount = 99,
}) => {
  // Don't render if count is 0 and showZero is false
  if (count !== undefined && count === 0 && !showZero) {
    return null;
  }

  // Don't render if neither count nor text is provided
  if (count === undefined && !text) {
    return null;
  }

  const displayText = text || (count !== undefined ? 
    (count > maxCount ? `${maxCount}+` : count.toString()) : '');

  const badgeStyle = [
    styles.badge,
    styles[`${variant}Badge`],
    styles[`${size}Badge`],
    position !== 'inline' && styles[`${position}Position`],
    style,
  ];

  const textStyle = [
    styles.badgeText,
    styles[`${variant}BadgeText`],
    styles[`${size}BadgeText`],
  ];

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{displayText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 6,
  },
  
  // Variants
  primaryBadge: {
    backgroundColor: '#2196F3',
  },
  secondaryBadge: {
    backgroundColor: '#6c757d',
  },
  successBadge: {
    backgroundColor: '#4CAF50',
  },
  warningBadge: {
    backgroundColor: '#FF9800',
  },
  errorBadge: {
    backgroundColor: '#F44336',
  },
  infoBadge: {
    backgroundColor: '#17a2b8',
  },
  
  // Sizes
  smallBadge: {
    minHeight: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  mediumBadge: {
    minHeight: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  largeBadge: {
    minHeight: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  
  // Positions
  topRightPosition: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  topLeftPosition: {
    position: 'absolute',
    top: -8,
    left: -8,
  },
  bottomRightPosition: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  bottomLeftPosition: {
    position: 'absolute',
    bottom: -8,
    left: -8,
  },
  
  // Text styles
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Variant text styles (all use white text)
  primaryBadgeText: {
    color: '#fff',
  },
  secondaryBadgeText: {
    color: '#fff',
  },
  successBadgeText: {
    color: '#fff',
  },
  warningBadgeText: {
    color: '#fff',
  },
  errorBadgeText: {
    color: '#fff',
  },
  infoBadgeText: {
    color: '#fff',
  },
  
  // Size text styles
  smallBadgeText: {
    fontSize: 10,
  },
  mediumBadgeText: {
    fontSize: 12,
  },
  largeBadgeText: {
    fontSize: 14,
  },
});

export default Badge;