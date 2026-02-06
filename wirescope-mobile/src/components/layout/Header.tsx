import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  showBorder?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  backgroundColor = '#fff',
  textColor = '#333',
  style,
  showBorder = true,
}) => {
  const headerStyle = [
    styles.header,
    { backgroundColor },
    showBorder && styles.headerBorder,
    style,
  ];

  const titleStyle = [styles.title, { color: textColor }];
  const subtitleStyle = [styles.subtitle, { color: `${textColor}80` }];

  return (
    <View style={headerStyle}>
      <View style={styles.leftSection}>
        {leftIcon && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onLeftPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {leftIcon}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerSection}>
        <Text style={titleStyle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={subtitleStyle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightSection}>
        {rightIcon && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onRightPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  headerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default Header;