import { useTheme } from '@react-navigation/native';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const { user, login } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const primary = colors.primary ?? '#2563eb';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirection si user déjà connecté
  useEffect(() => {
    if (user) {
      router.replace('/trips');
    }
  }, [user, router]);

  async function handleLogin() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      Alert.alert('Erreur', 'Email et mot de passe sont obligatoires.');
      return;
    }

    try {
      await login(trimmedEmail, password);
      router.replace('/trips');
    } catch (e: any) {
      Alert.alert('Connexion impossible', e.message ?? 'Erreur inconnue');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* En-tête */}
          <View style={styles.header}>
            <ThemedText type="title">Trajets</ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>
              Connecte-toi pour retrouver tes trajets et positions
            </ThemedText>
          </View>

          {/* Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <ThemedText type="subtitle">Connexion</ThemedText>

            <View style={styles.form}>
              {/* Email */}
              <ThemedText>Email</ThemedText>
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
                placeholderTextColor={colors.text + '88'}
                cursorColor={colors.text}
              />

              {/* Mot de passe */}
              <ThemedText>Mot de passe</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.background,
                  },
                ]}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.text + '88'}
                cursorColor={colors.text}
              />

              {/* Bouton connexion */}
              <Pressable
                style={[styles.primaryButton, { backgroundColor: primary }]}
                onPress={handleLogin}
              >
                <ThemedText style={styles.primaryButtonText}>Se connecter</ThemedText>
              </Pressable>

              {/* Lien inscription */}
              <View style={styles.footerRow}>
                <ThemedText>Pas de compte ?</ThemedText>
                <Link href="/register">
                  <ThemedText type="link">Créer un compte</ThemedText>
                </Link>
              </View>
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
  footerRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
});