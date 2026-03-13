import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

interface PremiumCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  index?: number;
  delay?: number;
  glass?: boolean;
}

export const PremiumCard = ({ children, style, index = 0, delay = 80, glass = true }: PremiumCardProps) => {
  const AnimatedView = index >= 0 ? Animated.View : View;
  const animationProps = index >= 0 ? { entering: FadeInUp.delay(index * delay).springify().damping(15) } : {};

  return (
    //@ts-ignore
    <AnimatedView 
      {...animationProps}
      style={[styles.card, glass && styles.glassEffect, style]}
    >
      {glass && Platform.OS === 'ios' && (
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      {children}
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      android: { 
        elevation: 6,
        shadowColor: '#000',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      }
    })
  },
  glassEffect: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(200, 132, 42, 0.15)', // LYNX subtle gold border
  }
});
