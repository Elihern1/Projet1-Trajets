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
import MapView, { Marker, Region } from "react-native-maps";

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

  // Charger le trajet + les positions
  async function load() {
    try {
      setLoading(true);
      const t = await getTripById(tripId);
      const pos = await getPositionsForTrip(tripId);
      setTrip(t);
      setPositions(pos);
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de charger le trajet.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tripId]);

  // Region initiale pour la carte
  const initialRegion: Region | undefined = useMemo(() => {
    if (positions.length > 0) {
      const last = positions[positions.length - 1];
      return {
        latitude: last.latitude,
        longitude: last.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Valeur par défaut (ex.: Montréal)
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
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de mettre à jour le trajet.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      "Supprimer",
      "Voulez-vous vraiment supprimer ce trajet ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTrip(tripId);
              router.back();
            } catch (e) {
              console.error(e);
              Alert.alert("Erreur", "Impossible de supprimer le trajet.");
            }
          },
        },
      ]
    );
  }

  if (loading || !trip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Chargement du trajet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Infos du trajet */}
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

      {/* Carte */}
      <Text style={styles.label}>Carte</Text>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
      >
        {positions.map((pos) => (
          <Marker
            key={pos.id}
            coordinate={{
              latitude: pos.latitude,
              longitude: pos.longitude,
            }}
            title={new Date(pos.timestamp).toLocaleString()}
          />
        ))}
      </MapView>

      {/* Liste des positions */}
      <Text style={styles.label}>Positions ({positions.length})</Text>
      <FlatList
        style={styles.list}
        data={positions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <View style={styles.positionRow}>
            <Text style={styles.positionTitle}>
              #{index + 1} - {item.latitude.toFixed(5)},{" "}
              {item.longitude.toFixed(5)}
            </Text>
            <Text style={styles.positionSub}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
        )}
      />

      {/* Boutons */}
      <View style={styles.buttonsRow}>
        <Button title={saving ? "Enregistrement..." : "Sauvegarder"} onPress={handleSave} />
        <View style={{ height: 8 }} />
        <Button title="Supprimer" color="red" onPress={handleDelete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f3f4f6",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  map: {
    width: "100%",
    height: 200, // IMPORTANT: sans hauteur la carte n’apparaît pas
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  list: {
    flexGrow: 0,
  },
  positionRow: {
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
    marginTop: 16,
  },
});
