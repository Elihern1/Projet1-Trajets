import * as Location from "expo-location";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";

import { useTrips } from "@/context/trips-context";
import type { Position } from "@/services/types";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

export default function NewTripScreen() {
  const router = useRouter();
  const { createTrip, addPositionToTrip } = useTrips();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [recording, setRecording] = useState(false);
  const [watcher, setWatcher] = useState<Location.LocationSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tripCreatedAt, setTripCreatedAt] = useState<string | null>(null);

  // Permet de limiter les enregistrements à 1 fois / 5 secondes
  const lastSavedRef = useRef(0);

  // Réinitialise l'écran à chaque focus pour éviter de voir l'ancien trajet
  useFocusEffect(
    useCallback(() => {
      setPositions([]);
      setTripCreatedAt(null);
      lastSavedRef.current = 0;
    }, [])
  );

  // Nettoyer le watcher quand l'écran se démonte
  useEffect(() => {
    return () => {
      if (watcher) {
        watcher.remove();
      }
    };
  }, [watcher]);

  function formatDate(date: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`;
  }

  async function startRecording() {
    if (recording) return;

    if (!name.trim()) {
      Alert.alert("Erreur", "Entre un nom pour le trajet.");
      return;
    }

    setLoading(true);

    try {
      // 1) Permission GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission manquante", "Active la localisation pour continuer.");
        setLoading(false);
        return;
      }

      // 2) Vérifier si GPS activé
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert("GPS désactivé", "Active le GPS sur ton téléphone.");
        setLoading(false);
        return;
      }

      // Point de départ : réinitialise les positions en mémoire
      const createdAt = formatDate(new Date());
      setTripCreatedAt(createdAt);
      setPositions([]);
      lastSavedRef.current = 0;

      // 3) Commencer l'écoute de la position
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced, // suffisant + économie batterie
          timeInterval: 5000, // minimum 5 secondes
          distanceInterval: 0,
        },
        async (loc) => {
          if (!loc?.coords) return;

          const now = Date.now();

          // throttle manuel — ignore si moins de 5 secondes entre deux save
          if (now - lastSavedRef.current < 5000) {
            return;
          }

          lastSavedRef.current = now;

          console.log("POSITION SAUVEGARDEE :", loc.coords);

          const timestamp = formatDate(
            new Date(loc.timestamp ?? Date.now())
          );

          setPositions((prev) => [
            ...prev,
            {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              timestamp,
            },
          ]);
        }
      );

      setWatcher(sub);
      setRecording(true);
    } catch (err) {
      console.error("Erreur startRecording", err);
      Alert.alert("Erreur", "Impossible de démarrer l’enregistrement.");
    } finally {
      setLoading(false);
    }
  }

  function stopRecording() {
    if (watcher) {
      watcher.remove();
    }
    setWatcher(null);
    setRecording(false);

    Alert.alert("Terminé", "Tu peux maintenant envoyer le trajet.");
  }

  async function sendTrip() {
    if (positions.length === 0) {
      Alert.alert("Aucune position", "Enregistre au moins un point avant d'envoyer.");
      return;
    }

    setSending(true);
    try {
      const tripId = await createTrip({
        name: name.trim(),
        description: description.trim(),
        createdAt: tripCreatedAt ?? formatDate(new Date()),
      });

      for (const pos of positions) {
        await addPositionToTrip(tripId, {
          latitude: pos.latitude,
          longitude: pos.longitude,
          timestamp: pos.timestamp,
        });
      }

      Alert.alert("Succès", "Trajet enregistré avec ses positions.");
      setName("");
      setDescription("");
      setPositions([]);
      setTripCreatedAt(null);
      setRecording(false);
      router.replace("/trips");
    } catch (err) {
      console.error("Erreur sendTrip", err);
      Alert.alert("Erreur", "Impossible d'enregistrer le trajet.");
    } finally {
      setSending(false);
    }
  }

  const previewRegion: Region | null = useMemo(() => {
    if (positions.length === 0) return null;
    const last = positions[positions.length - 1];
    return {
      latitude: last.latitude,
      longitude: last.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [positions]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => router.push("/trips")}>
            <ThemedText style={styles.backText}>← Retour</ThemedText>
          </TouchableOpacity>

          <ThemedText type="title" style={styles.title}>Nouveau trajet</ThemedText>

          <View style={styles.card}>
            <ThemedText style={styles.label}>Nom du trajet</ThemedText>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Balade du soir"
              placeholderTextColor="#9ca3af"
            />

            <ThemedText style={[styles.label, { marginTop: 14 }]}>Description</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Détails, contexte, etc."
              placeholderTextColor="#9ca3af"
            />
            <ThemedText style={styles.hint}>
              Ajoute une courte description pour te souvenir du trajet plus tard.
            </ThemedText>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 16 }} />
          ) : (
            <>
              {!recording && positions.length > 0 && previewRegion && (
                <View style={styles.previewBox}>
                  <ThemedText style={styles.previewTitle}>Aperçu du trajet</ThemedText>
                  <MapView style={styles.map} initialRegion={previewRegion}>
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
                    {positions[0] && (
                      <Marker
                        coordinate={{
                          latitude: positions[0].latitude,
                          longitude: positions[0].longitude,
                        }}
                        pinColor="green"
                        title="Départ"
                      />
                    )}
                    {positions[positions.length - 1] && (
                      <Marker
                        coordinate={{
                          latitude: positions[positions.length - 1].latitude,
                          longitude: positions[positions.length - 1].longitude,
                        }}
                        pinColor="red"
                        title="Arrivée"
                      />
                    )}
                  </MapView>
                </View>
              )}

              <View style={styles.actions}>
                {!recording ? (
                  <TouchableOpacity style={styles.primaryButton} onPress={startRecording}>
                    <ThemedText style={styles.primaryButtonText}>Démarrer l’enregistrement</ThemedText>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.dangerButton} onPress={stopRecording}>
                    <ThemedText style={styles.dangerButtonText}>Arrêter</ThemedText>
                  </TouchableOpacity>
                )}

                {!recording && positions.length > 0 && (
                  <TouchableOpacity
                    style={[styles.primaryButton, styles.sendButton, sending && styles.disabledButton]}
                    onPress={sendTrip}
                    disabled={sending}
                  >
                    <ThemedText style={styles.primaryButtonText}>
                      {sending ? "Envoi..." : "Envoyer le trajet"}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f5f7fb",
  },
  scrollContent: {
    paddingBottom: 32,
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
  title: {
    marginBottom: 12,
    color: "#111827",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
    color: "#0f172a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d7e2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    marginTop: 4,
    color: "#0f172a",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
    lineHeight: 20,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#6b7280",
  },
  previewBox: {
    marginTop: 4,
    marginBottom: 14,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  previewTitle: {
    padding: 10,
    fontWeight: "700",
  },
  map: {
    height: 220,
    width: "100%",
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  sendButton: {
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
});
