import { Stack } from "expo-router";

export default function TripsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // on gère notre propre bouton
      }}
    />
  );
}
