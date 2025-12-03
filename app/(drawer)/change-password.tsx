import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';

export default function ChangePasswordScreen() {
  const { sendResetPassword, user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const primary = colors.primary ?? '#2563eb';
  const { top } = useSafeAreaInsets();
  const paddingTop = 20 + top;

  const [email, setEmail] = useState(user?.email ?? '');

  async function handleSubmit() {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté.');
      return;
    }

    const targetEmail = (email || user?.email || '').trim();
    if (!targetEmail) {
      Alert.alert('Erreur', 'Renseigne une adresse courriel.');
      return;
    }

    try {
      await sendResetPassword(targetEmail);
      Alert.alert(
        'Email envoyé',
        "Vérifie ta boîte mail pour réinitialiser ton mot de passe."
      );
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? "Impossible d'envoyer l'email");
    }
  }

  return (
    <ThemedView style={[styles.container, { paddingTop }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText type="title">Sécurité</ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>
              Mets à jour ton mot de passe pour protéger tes trajets
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle">Réinitialiser le mot de passe</ThemedText>

            <View style={styles.form}>
              <ThemedText>Adresse courriel</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.background,
                  },
                ]}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="email@exemple.com"
                placeholderTextColor={colors.text}
                cursorColor={colors.text}
              />

              <Pressable
                style={[styles.primaryButton, { backgroundColor: primary }]}
                onPress={handleSubmit}
              >
                <ThemedText style={styles.primaryButtonText}>
                  Envoyer l'email de réinitialisation
                </ThemedText>
              </Pressable>

              <Pressable
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => router.back()}
              >
                <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>
                  Annuler
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 16,
  },
  header: {
    gap: 8,
  },
  subtitle: {
    opacity: 0.8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  form: {
    gap: 12,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
});
