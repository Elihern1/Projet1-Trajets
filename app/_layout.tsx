import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { AuthProvider } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createTables } from "../services/database.native";
import { TripsProvider } from '@/context/trips-context';


export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    createTables()
      .then(() => console.log("SQLite tables ready"))
      .catch((err) => console.error("DB ERROR:", err));
  }, []);

  return (
    <AuthProvider>
      <TripsProvider>
        <ThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
          <Stack screenOptions={{ headerShown: false }}>
            {/* Auth screens */}
            <Stack.Screen name="index" />
            <Stack.Screen name="register" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="change-password" />
            <Stack.Screen name="version" />

            {/* Tabs */}
            <Stack.Screen name="(tabs)" />

            {/* Trips */}
            <Stack.Screen name="trips/index" />
            <Stack.Screen name="trips/new" />
            <Stack.Screen name="trips/details" />
          </Stack>

          <StatusBar style="auto" />
        </ThemeProvider>
      </TripsProvider>
    </AuthProvider>
  );
}
