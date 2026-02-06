import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  headerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  spacing?: 'none' | 'small' | 'medium' | 'large';
}

const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  children,
  style,
  headerStyle,
  contentStyle,
  spacing = 'medium',
}) => {
  return (
    <View style={[styles.section, styles[`${spacing}Spacing`], style]}>
      {(title || subtitle) && (
        <View style={[styles.header, headerStyle]}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    width: '100%',
  },
  
  // Spacing variants
  noneSpacing: {
    marginBottom: 0,
  },
  smallSpacing: {
    marginBottom: 12,
  },
  mediumSpacing: {
    marginBottom: 20,
  },
  largeSpacing: {
    marginBottom: 32,
  },
});

export default Section;