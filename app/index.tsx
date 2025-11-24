import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="version" />

      {/* Trips */}
      <Stack.Screen name="trips/index" />
      <Stack.Screen name="trips/new" />
      <Stack.Screen name="trips/details" />
    </Stack>
  );
}
