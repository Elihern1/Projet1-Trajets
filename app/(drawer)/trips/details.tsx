import { useEffect, useState, useMemo } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Button,
  Alert,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker, Region, Polyline } from "react-native-maps";

import { useTrips } from "@/context/trips-context";
import type { Trip, Position } from "@/services/types";
import { useAuth } from "@/context/auth-context";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  const router = useRouter();
  const { getTripById, updateTrip, deleteTrip } = useTrips();
  const { user } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger le trajet et ses positions
  async function load() {
    try {
      setLoading(true);
      const t = tripId ? await getTripById(tripId) : null;
      setTrip(t);
      setPositions(t?.positions ?? []);
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
    if (trip.ownerId && user && trip.ownerId !== user.uid) {
      Alert.alert(
        "Action non autorisée",
        "Tu ne peux modifier que tes propres trajets."
      );
      return;
    }
    try {
      setSaving(true);
      await updateTrip(trip.id, {
        name: trip.name,
        description: trip.description,
      });
      Alert.alert("Succès", "Trajet mis à jour.");
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de mettre à jour le trajet.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (trip?.ownerId && user && trip.ownerId !== user.uid) {
      Alert.alert(
        "Action non autorisée",
        "Tu ne peux supprimer que tes propres trajets."
      );
      return;
    }

    Alert.alert("Supprimer", "Supprimer ce trajet ?", [
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <ThemedText>Chargement...</ThemedText>
      </View>
    );
  }

  if (!loading && !trip) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Trajet introuvable.</ThemedText>
      </ThemedView>
    );
  }

  // Position départ et arrivée
  const start = positions[0];
  const end = positions[positions.length - 1];
  const creatorLabel = trip.ownerId === user?.uid ? "toi" : "Utilisateur inconnu";
  const isOwner = !!user && trip.ownerId === user.uid;

  function formatTimestamp(ts: string) {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) {
      return ts;
    }
    return date.toLocaleString();
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

      {/* Bouton Retour */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/trips")}
      >
        <ThemedText style={styles.backText}>← Retour</ThemedText>
      </TouchableOpacity>



      {/* Infos trajet */}
      <ThemedText style={styles.owner}>
        Créé par {creatorLabel} — {isOwner ? "tu es le propriétaire" : "lecture seule"}
      </ThemedText>

      <ThemedText style={styles.label}>Nom</ThemedText>
      <TextInput
        style={styles.input}
        value={trip.name}
        onChangeText={(text) => setTrip({ ...trip, name: text })}
        editable={isOwner}
        placeholder="Nom du trajet"
        placeholderTextColor="#9ca3af"
      />

      <ThemedText style={styles.label}>Description</ThemedText>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={trip.description ?? ""}
        onChangeText={(text) => setTrip({ ...trip, description: text })}
        multiline
        editable={isOwner}
        placeholder="Description"
        placeholderTextColor="#9ca3af"
      />

      {/* MAP */}
      <ThemedText style={styles.label}>Carte du trajet</ThemedText>

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
            description={formatTimestamp(start.timestamp)}
          />
        )}

        {/* Arrivée */}
        {end && (
          <Marker
            coordinate={{ latitude: end.latitude, longitude: end.longitude }}
            pinColor="red"
            title="Arrivée"
            description={formatTimestamp(end.timestamp)}
          />
        )}

      </MapView>

      {/* Liste des positions */}
      <ThemedText style={styles.label}>Positions : {positions.length}</ThemedText>

      {positions.map((item, index) => (
        <View key={item.id ?? index} style={styles.positionRow}>
          <ThemedText style={styles.positionTitle}>
            #{index + 1} — {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
          </ThemedText>
          <ThemedText style={styles.positionSub}>
            {formatTimestamp(item.timestamp)}
          </ThemedText>
        </View>
      ))}

      {/* Boutons */}
        </ScrollView>

        <View style={styles.buttonsRow}>
          <Button
            title={saving ? "Sauvegarde..." : "Sauvegarder"}
            onPress={handleSave}
            disabled={!isOwner || saving}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Supprimer"
            color="red"
            onPress={handleDelete}
            disabled={!isOwner}
          />
        </View>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },

  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    marginBottom: 8,
  },
  backText: { fontSize: 16, fontWeight: "600", color: "#111827" },

  owner: {
    marginBottom: 6,
    color: "#111827",
    fontWeight: "600",
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: "700",
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#ffffff",
    color: "#111827",
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
    padding: 10,
    backgroundColor: "#ffffff",
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  positionTitle: { fontWeight: "700", color: "#111827" },
  positionSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  buttonsRow: {
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
  },
});
