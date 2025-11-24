import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleRegister() {
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });

      Alert.alert('Compte créé', 'Votre compte a été créé, vous pouvez vous connecter.');
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? "Impossible de créer le compte");
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Créer un compte</ThemedText>

      <View style={styles.form}>
        <ThemedText>Prénom</ThemedText>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

        <ThemedText>Nom</ThemedText>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

        <ThemedText>Email</ThemedText>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <ThemedText>Mot de passe</ThemedText>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button title="Créer mon compte" onPress={handleRegister} />

        <View style={styles.loginLink}>
          <ThemedText>Déjà un compte ?</ThemedText>
          <Link href="/">
            <ThemedText type="link">Se connecter</ThemedText>
          </Link>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  form: {
    gap: 12,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loginLink: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
});