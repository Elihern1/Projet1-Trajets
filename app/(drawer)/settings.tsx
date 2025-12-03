import { Link, useRouter } from 'expo-router';
import { Alert, Button, Keyboard, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const paddingTop = 24 + top;

  async function handleLogout() {
    await signOut();
    router.replace('/');
  }

  if (!user) {
    return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ThemedView style={[styles.container, { paddingTop }]}>
        <ThemedText>Vous n&apos;êtes pas connecté.</ThemedText>
        <Button title="Aller à la connexion" onPress={() => router.replace('/')} />
      </ThemedView>
    </TouchableWithoutFeedback>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ThemedView style={[styles.container, { paddingTop }]}>
      <ThemedText type="title">Paramètres</ThemedText>

      <View style={styles.section}>
        <ThemedText type="subtitle">Profil</ThemedText>
        <ThemedText>Prénom : {profile?.firstName ?? 'Inconnu'}</ThemedText>
        <ThemedText>Nom : {profile?.lastName ?? 'Inconnu'}</ThemedText>
        <ThemedText>Email : {profile?.email ?? user.email}</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Sécurité</ThemedText>
        <Button
          title="Changer le mot de passe"
          onPress={() => router.push('/change-password')}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Application</ThemedText>
        <Button
          title="Version de l'application"
          onPress={() => router.push('/version')}
        />
      </View>

      <View style={styles.section}>
        <Button
          title="Se déconnecter"
          color="red"
          onPress={() => {
            Alert.alert(
              'Déconnexion',
              'Voulez-vous vraiment vous déconnecter ?',
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Se déconnecter', style: 'destructive', onPress: handleLogout },
              ]
            );
          }}
        />
      </View>

      <View style={styles.section}>
        <Link href="/(tabs)">
          <ThemedText type="link">Retour à l&apos;accueil</ThemedText>
        </Link>
      </View>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginTop: 24,
    gap: 8,
  },
});
