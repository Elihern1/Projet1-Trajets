import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

import { useTrips } from "@/context/trips-context";

export default function NewTripScreen() {
  const router = useRouter();
  const { createTrip, addPositionToTrip } = useTrips();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [recording, setRecording] = useState(false);
  const [watcher, setWatcher] = useState<Location.LocationSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  async function startRecording() {
    if (!name.trim()) {
      Alert.alert("Erreur", "Entre un nom pour le trajet.");
      return;
    }

    setLoading(true);

    // Permission GPS
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission manquante", "Active la localisation pour continuer.");
      setLoading(false);
      return;
    }

    // 1) On crée le trajet dans la BD
    const tripId = await createTrip({
      name: name.trim(),
      description: description.trim(),
    });

    // 2) On commence à écouter la position en temps réel
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // toutes les 5 secondes
        distanceInterval: 0,
      },
      async (loc) => {
        if (loc?.coords) {
          await addPositionToTrip(tripId, {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      }
    );

    setWatcher(sub);
    setRecording(true);
    setLoading(false);
  }

  function stopRecording() {
    if (watcher) watcher.remove();
    setWatcher(null);
    setRecording(false);

    Alert.alert("Terminé", "L’enregistrement du trajet est terminé.");
    router.replace("/(tabs)/trips");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouveau trajet</Text>

      <Text style={styles.label}>Nom du trajet</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {loading ? (
        <ActivityIndicator />
      ) : !recording ? (
        <Button title="Démarrer l’enregistrement" onPress={startRecording} />
      ) : (
        <Button title="Arrêter" color="red" onPress={stopRecording} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f7fb",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "white",
    marginTop: 4,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
});
