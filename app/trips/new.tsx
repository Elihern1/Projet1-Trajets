import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

import { useTrips } from "@/context/trips-context";
import type { Position } from "@/services/types";

type TempPosition = Omit<Position, "id" | "tripId">;

export default function NewTripScreen() {
  const router = useRouter();
  const { addTripWithPositions } = useTrips();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [positions, setPositions] = useState<TempPosition[]>([]);
  const [tracking, setTracking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Demande une position et l'ajoute au tableau
  async function capturePosition() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "Active la localisation pour continuer.");
        stopTracking();
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      });

      const now = new Date().toISOString().replace("T", " ").split(".")[0];

      const newPos: TempPosition = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        timestamp: now,
      };

      setPositions((prev) => [...prev, newPos]);
    } catch (e) {
      console.error("Erreur GPS:", e);
      Alert.alert("Erreur", "Impossible de récupérer la position.");
      stopTracking();
    }
  }

  function startTracking() {
    if (tracking) return;
    setPositions([]); // on recommence un trajet propre
    setTracking(true);

    // capture tout de suite une première position
    capturePosition();

    // puis toutes les 5 secondes
    intervalRef.current = setInterval(() => {
      capturePosition();
    }, 5000);
  }

  function stopTracking() {
    setTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    // nettoyage si on quitte l'écran
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Nom obligatoire", "Donne un nom au trajet.");
      return;
    }
    if (positions.length === 0) {
      Alert.alert(
        "Aucune position",
        "Commence le suivi GPS pour enregistrer des positions."
      );
      return;
    }

    try {
      await addTripWithPositions(name.trim(), description.trim(), positions);
      Alert.alert("Succès", "Trajet enregistré !");
      setName("");
      setDescription("");
      setPositions([]);
      stopTracking();
      router.back(); // retour à la liste
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible d'enregistrer le trajet.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouveau trajet</Text>

      <Text style={styles.label}>Nom du trajet</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ex: Trajet vers le travail"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Optionnel"
        multiline
      />

      <View style={styles.buttonsRow}>
        <Button
          title={tracking ? "Arrêter le suivi" : "Démarrer le suivi"}
          onPress={tracking ? stopTracking : startTracking}
          color={tracking ? "#b91c1c" : "#15803d"}
        />
      </View>

      <Text style={styles.label}>
        Positions enregistrées : {positions.length}
      </Text>

      <FlatList
        data={positions}
        keyExtractor={(_, index) => String(index)}
        style={styles.list}
        renderItem={({ item, index }) => (
          <View style={styles.positionItem}>
            <Text style={styles.positionText}>
              #{index + 1} • {item.latitude.toFixed(5)},{" "}
              {item.longitude.toFixed(5)}
            </Text>
            <Text style={styles.positionSub}>{item.timestamp}</Text>
          </View>
        )}
      />

      <View style={styles.saveButton}>
        <Button title="Enregistrer le trajet" onPress={handleSave} />
      </View>
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
    marginBottom: 16,
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
  buttonsRow: {
    marginTop: 16,
    marginBottom: 8,
  },
  list: {
    marginTop: 8,
    flex: 1,
  },
  positionItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  positionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  positionSub: {
    fontSize: 12,
    color: "#6b7280",
  },
  saveButton: {
    marginTop: 8,
  },
});
