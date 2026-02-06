import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface AvatarProps {
  source?: { uri: string };
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

const Avatar: React.FC<AvatarProps> = ({
  source,
  name = '',
  size = 'medium',
  backgroundColor = '#2196F3',
  textColor = '#fff',
  style,
}) => {
  const getInitials = (fullName: string): string => {
    if (!fullName) return '';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const avatarStyle = [
    styles.avatar,
    styles[`${size}Avatar`],
    { backgroundColor },
    style,
  ];

  const textStyle = [
    styles.avatarText,
    styles[`${size}AvatarText`],
    { color: textColor },
  ];

  return (
    <View style={avatarStyle}>
      {source ? (
        // TODO: Add Image component when react-native-fast-image or similar is needed
        <View style={styles.imagePlaceholder}>
          <Text style={textStyle}>IMG</Text>
        </View>
      ) : (
        <Text style={textStyle}>{getInitials(name)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  
  // Sizes
  smallAvatar: {
    width: 32,
    height: 32,
  },
  mediumAvatar: {
    width: 40,
    height: 40,
  },
  largeAvatar: {
    width: 56,
    height: 56,
  },
  xlargeAvatar: {
    width: 80,
    height: 80,
  },
  
  // Text styles
  avatarText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Size-specific text styles
  smallAvatarText: {
    fontSize: 12,
  },
  mediumAvatarText: {
    fontSize: 16,
  },
  largeAvatarText: {
    fontSize: 20,
  },
  xlargeAvatarText: {
    fontSize: 28,
  },
  
  // Image placeholder
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default Avatar;