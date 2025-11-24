import { useColorScheme as _useColorScheme } from 'react-native';

// Expo Router template helper to always return a usable scheme
export function useColorScheme(): 'light' | 'dark' {
  const scheme = _useColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}
