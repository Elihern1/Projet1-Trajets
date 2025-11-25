import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  TextInput,
  View,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";
import { useFocusEffect } from "expo-router";

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
      <ThemedText type="title" style={styles.title}>Nouveau trajet</ThemedText>

      <ThemedText style={styles.label}>Nom du trajet</ThemedText>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <ThemedText style={styles.label}>Description</ThemedText>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {loading ? (
        <ActivityIndicator />
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

          {!recording ? (
            <Button title="Démarrer l’enregistrement" onPress={startRecording} />
          ) : (
            <Button title="Arrêter" color="red" onPress={stopRecording} />
          )}

          {!recording && positions.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Button
                title={sending ? "Envoi..." : "Envoyer le trajet"}
                onPress={sendTrip}
                disabled={sending}
              />
            </View>
          )}
        </>
      )}
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
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
  previewBox: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  previewTitle: {
    padding: 10,
    fontWeight: "700",
  },
  map: {
    height: 220,
    width: "100%",
  },
});
