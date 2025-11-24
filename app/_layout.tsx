import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>

          {/* Auth screens */}
          <Stack.Screen name="index" />            {/* Login */}
          <Stack.Screen name="register" />         {/* Register */}
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
    </AuthProvider>
  );
}