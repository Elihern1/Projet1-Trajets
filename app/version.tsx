import { useRouter } from 'expo-router';
import { Button, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function VersionScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const paddingTop = 24 + top;

  return (
    <ThemedView style={[styles.container, { paddingTop }]}>
      <ThemedText type="title">Version de l&apos;application</ThemedText>

      <ThemedText style={styles.text}>Projet: Trajets</ThemedText>
      <ThemedText style={styles.text}>Version 1.0.0</ThemedText>
      <ThemedText style={styles.text}>
        Application développée dans le cadre du cours Multiplateformes (AEC).
      </ThemedText>

      <Button title="Retour" onPress={() => router.back()} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    marginTop: 12,
  },
});
