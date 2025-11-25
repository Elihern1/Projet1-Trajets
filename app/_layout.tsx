import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/auth-context';
import { TripsProvider } from '@/context/trips-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createTables } from '../services/database.native';

export const unstable_settings = {
  // On dit à Expo Router que la navigation principale est le groupe (drawer)
  anchor: '(drawer)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    createTables()
      .then(() => console.log('SQLite tables ready'))
      .catch((err) => console.error('DB ERROR:', err));
  }, []);

  return (
    <AuthProvider>
      <TripsProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Login / Auth */}
            <Stack.Screen name="index" />
            <Stack.Screen name="register" />

            {/* Tout le reste (menu coulissant) */}
            <Stack.Screen name="(drawer)" />
          </Stack>

          <StatusBar style="auto" />
        </ThemeProvider>
      </TripsProvider>
    </AuthProvider>
  );
}