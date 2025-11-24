import { MapView, Marker, Polyline } from "expo-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTrips } from "@/context/trips-context";
import type { Position, Trip } from "@/services/types";

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
      await updateTrip({ ...trip, name: name.trim(), description: description.trim() });
      Alert.alert("Succès", "Trajet mis à jour.");
      await load();
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
    }
  }

  function confirmDelete() {
    if (!trip) return;
    Alert.alert(
      "Supprimer le trajet",
      `Voulez-vous vraiment supprimer "${trip.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTrip(trip.id);
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
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement du trajet...</Text>
      </View>
    );
  }

  const hasPositions = positions.length > 0;
  const first = hasPositions ? positions[0] : null;
  const coords = positions.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Détails du trajet</Text>

      {/* Nom + description modifiables */}
      <Text style={styles.label}>Nom</Text>
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

      {/* Carte */}
      <Text style={styles.label}>Carte</Text>
      {hasPositions && first ? (
        <MapView
          style={styles.map}
          initialCamera={{
            center: {
              latitude: first.latitude,
              longitude: first.longitude,
            },
            zoom: 14,
          }}
        >
          {positions.map((p) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              title={trip.name}
              description={p.timestamp}
            />
          ))}

          {coords.length > 1 && (
            <Polyline
              coordinates={coords}
              strokeWidth={3}
            />
          )}
        </MapView>
      ) : (
        <View style={[styles.map, styles.center]}>
          <Text>Pas encore de positions pour ce trajet.</Text>
        </View>
      )}

      {/* Liste des positions */}
      <Text style={styles.label}>
        Positions ({positions.length})
      </Text>
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

      {/* Boutons actions */}
      <View style={styles.buttonsRow}>
        <Button title="Sauvegarder" onPress={handleSave} />
      </View>
      <View style={styles.buttonsRow}>
        <Button
          title="Supprimer le trajet"
          onPress={confirmDelete}
          color="#b91c1c"
        />
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  map: {
    height: 200,
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
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
