import { useEffect, useState, useMemo } from "react";
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
import MapView, { Marker, Region, Polyline } from "react-native-maps";

import { useTrips } from "@/context/trips-context";
import type { Trip, Position } from "@/services/types";

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const router = useRouter();
  const { getTripById, getPositionsForTrip, updateTrip, deleteTrip } =
    useTrips();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger le trajet et ses positions
  async function load() {
    try {
      setLoading(true);
      const t = await getTripById(tripId);
      const pos = await getPositionsForTrip(tripId);
      setTrip(t);
      setPositions(pos);
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de charger le trajet.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tripId]);

  // Région initiale centrée sur l'arrivée (ou Montréal)
  const initialRegion: Region = useMemo(() => {
    if (positions.length > 0) {
      const last = positions[positions.length - 1];
      return {
        latitude: last.latitude,
        longitude: last.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return {
      latitude: 45.5017,
      longitude: -73.5673,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [positions]);

  async function handleSave() {
    if (!trip) return;
    try {
      setSaving(true);
      await updateTrip(trip);
      Alert.alert("Succès", "Trajet mis à jour.");
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de mettre à jour le trajet.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert("Supprimer", "Supprimer ce trajet ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await deleteTrip(tripId);
          router.back();
        },
      },
    ]);
  }

  if (loading || !trip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Chargement...</Text>
      </View>
    );
  }

  // Position départ et arrivée
  const start = positions[0];
  const end = positions[positions.length - 1];

  return (
    <View style={styles.container}>

      {/* Bouton Retour */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/trips")}
>
      <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>



      {/* Infos trajet */}
      <Text style={styles.label}>Nom</Text>
      <TextInput
        style={styles.input}
        value={trip.name}
        onChangeText={(text) => setTrip({ ...trip, name: text })}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={trip.description ?? ""}
        onChangeText={(text) => setTrip({ ...trip, description: text })}
        multiline
      />

      {/* MAP */}
      <Text style={styles.label}>Carte du trajet</Text>

      <MapView style={styles.map} initialRegion={initialRegion}>

        {/* Trajet complet */}
        {positions.length > 1 && (
          <Polyline
            coordinates={positions.map((p) => ({
              latitude: p.latitude,
              longitude: p.longitude,
            }))}
            strokeColor="#2563eb"
            strokeWidth={5}
          />
        )}

        {/* Départ */}
        {start && (
          <Marker
            coordinate={{ latitude: start.latitude, longitude: start.longitude }}
            pinColor="green"
            title="Départ"
            description={new Date(start.timestamp).toLocaleString()}
          />
        )}

        {/* Arrivée */}
        {end && (
          <Marker
            coordinate={{ latitude: end.latitude, longitude: end.longitude }}
            pinColor="red"
            title="Arrivée"
            description={new Date(end.timestamp).toLocaleString()}
          />
        )}

      </MapView>

      {/* Liste des positions */}
      <Text style={styles.label}>Positions : {positions.length}</Text>

      <FlatList
        data={positions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <View style={styles.positionRow}>
            <Text style={styles.positionTitle}>
              #{index + 1} — {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
            </Text>
            <Text style={styles.positionSub}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
        )}
      />

      {/* Boutons */}
      <View style={styles.buttonsRow}>
        <Button
          title={saving ? "Sauvegarde..." : "Sauvegarder"}
          onPress={handleSave}
        />
        <View style={{ height: 8 }} />
        <Button title="Supprimer" color="red" onPress={handleDelete} />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f3f4f6" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    marginBottom: 8,
  },
  backText: { fontSize: 16, fontWeight: "600" },

  label: { marginTop: 12, marginBottom: 4, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "white",
  },
  textArea: { minHeight: 60, textAlignVertical: "top" },

  map: {
    height: 250,
    width: "100%",
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 10,
  },

  positionRow: {
    padding: 8,
    backgroundColor: "white",
    marginBottom: 6,
    borderRadius: 8,
  },
  positionTitle: { fontWeight: "600" },
  positionSub: { fontSize: 12, color: "#6b7280" },

  buttonsRow: { marginTop: 12 },
});
