import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

import { useTrips } from "@/context/trips-context";
import { useAuth } from "@/context/auth-context";
import type { Trip } from "@/services/types";
import { createTables, getAll } from "@/services/database.native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

type TripWithCount = Trip & { positionsCount: number };

export default function TripsListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { trips, loadTrips, deleteTrip } = useTrips();
  const [items, setItems] = useState<TripWithCount[]>([]);

  async function loadWithCounts() {
    // S'assure que les tables existent
    await createTables();

    // Récupère le nombre de positions par trajet
    const counts = await getAll<{ tripId: number; count: number }>(
      "SELECT tripId, COUNT(*) as count FROM positions GROUP BY tripId;",
      []
    );

    const list: TripWithCount[] = trips.map((t) => {
      const found = counts.find((c) => c.tripId === t.id);
      return {
        ...t,
        positionsCount: found ? found.count : 0,
      };
    });

    setItems(list);
  }

  useEffect(() => {
    loadWithCounts().catch((err) => console.error("load trips error", err));
  }, [trips]);

  function confirmDelete(trip: TripWithCount) {
    if (trip.userId !== user?.id) {
      Alert.alert(
        "Action non autorisée",
        "Tu ne peux supprimer que tes propres trajets."
      );
      return;
    }

    Alert.alert(
      "Supprimer",
      `Voulez-vous supprimer le trajet "${trip.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteTrip(trip.id);
            await loadWithCounts();
          },
        },
      ]
    );
  }

  function openDetails(trip: TripWithCount) {
    router.push(`/trips/details?id=${trip.id}`);

  }

  function goToNewTrip() {
    router.push("/trips/new");
  }

  return (
    <ThemedView style={styles.container}>  

      <ThemedText type="title">Trajets</ThemedText>

      <TouchableOpacity style={styles.newButton} onPress={goToNewTrip}>
        <Text style={styles.newButtonText}>+ Nouveau trajet</Text>
      </TouchableOpacity>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => openDetails(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.userId === user?.id && (
                <TouchableOpacity onPress={() => confirmDelete(item)}>
                  <Text style={styles.deleteText}>Supprimer</Text>
                </TouchableOpacity>
              )}
            </View>

            {!!item.description && (
              <Text style={styles.description}>{item.description}</Text>
            )}

            <Text style={styles.meta}>
              Positions : {item.positionsCount} • Créé par{" "}
              {item.userFirstName || item.userLastName
                ? `${item.userFirstName ?? ""} ${item.userLastName ?? ""}`.trim()
                : "Utilisateur inconnu"}{" "}
              le {item.createdAt}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Aucun trajet pour l’instant. Appuie sur “Nouveau trajet” pour en
            créer un.
          </Text>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },

  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  title: {},
  newButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  newButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteText: {
    color: "red",
    fontWeight: "500",
  },
  description: {
    fontSize: 13,
    color: "#444",
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: "#666",
  },
  emptyText: {
    marginTop: 20,
    textAlign: "center",
    color: "#555",
  },
});
