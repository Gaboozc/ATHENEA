import React from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
  safeArea?: boolean;
  padding?: boolean;
  backgroundColor?: string;
  showsVerticalScrollIndicator?: boolean;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  contentContainerStyle,
  scrollable = false,
  safeArea = true,
  padding = true,
  backgroundColor = '#f5f5f5',
  showsVerticalScrollIndicator = false,
}) => {
  const containerStyle = [
    styles.container,
    { backgroundColor },
    padding && styles.padding,
    style,
  ];

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        padding && styles.padding,
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={containerStyle}>
      {children}
    </View>
  );

  if (safeArea) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        {content}
      </SafeAreaView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padding: {
    padding: 16,
  },
});

export default ScreenWrapper;