import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Button,
  FlatList,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useTrips } from "@/context/trips-context";
import type { Trip, Position } from "@/services/types";

const MapView = ({ children }: any) => (
  <View
    style={{
      height: 200,
      backgroundColor: "#d1d5db",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 10,
      marginTop: 8,
      overflow: "hidden",
    }}
  >
    <Text style={{ color: "#333" }}>Carte non disponible (Expo Go)</Text>
    {children}
  </View>
);

const Marker = () => null;
const Polyline = () => null;
/* ------------------------------------------------------------------ */

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const router = useRouter();

  const { getTripById, getPositionsForTrip, updateTrip, deleteTrip } =
    useTrips();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    if (!tripId) return;
    setLoading(true);

    const t = await getTripById(tripId);
    const pos = await getPositionsForTrip(tripId);

    if (t) {
      setTrip(t);
      setName(t.name);
      setDescription(t.description ?? "");
    }

    setPositions(pos);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((e) => console.error("details load error", e));
  }, [id]);

  async function handleSave() {
    if (!trip) return;

    try {
      await updateTrip({
        ...trip,
        name: name.trim(),
        description: description.trim(),
      });
      Alert.alert("Succès", "Trajet mis à jour.");
      await load();
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
    }
  }

  function confirmDelete() {
    if (!trip) return;

    Alert.alert("Supprimer le trajet", `Supprimer "${trip.name}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await deleteTrip(trip.id);
          router.back();
        },
      },
    ]);
  }

  if (loading || !trip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement du trajet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER ------------------------------------------------------ */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Détails du trajet</Text>
      </View>

      {/* FORM -------------------------------------------------------- */}
      <Text style={styles.label}>Nom</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* CARTE ------------------------------------------------------- */}
      <Text style={styles.label}>Carte</Text>
      <MapView />

      {/* POSITIONS --------------------------------------------------- */}
      <Text style={styles.label}>Positions ({positions.length})</Text>

      <FlatList
        style={styles.list}
        data={positions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <View style={styles.positionItem}>
            <Text style={styles.positionTitle}>
              #{index + 1} • {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
            </Text>
            <Text style={styles.positionSub}>{item.timestamp}</Text>
          </View>
        )}
      />

      {/* ACTIONS ----------------------------------------------------- */}
      <View style={styles.buttonsRow}>
        <Button title="SAUVEGARDER" onPress={handleSave} />
      </View>

      <View style={styles.buttonsRow}>
        <Button
          title="SUPPRIMER LE TRAJET"
          color="#b91c1c"
          onPress={confirmDelete}
        />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* STYLES */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f7fb",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    paddingRight: 8,
  },
  backText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
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
  list: {
    marginTop: 8,
    flex: 1,
  },
  positionItem: {
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  positionTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  positionSub: {
    fontSize: 12,
    color: "#6b7280",
  },
  buttonsRow: {
    marginTop: 8,
  },
});
