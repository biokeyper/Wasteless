import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * React Native's `useColorScheme` can report 'unspecified', but the app only
 * themes for light and dark. Collapse the third state onto 'light' so callers
 * can index the theme maps directly.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
