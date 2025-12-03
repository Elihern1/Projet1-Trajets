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
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

export default function TripsListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { trips, loadTrips, loadMore, deleteTrip, loading } = useTrips();
  const [selectedType, setSelectedType] = useState<"personnel" | "affaire">(
    "personnel"
  );
  const [items, setItems] = useState<Trip[]>([]);

  useEffect(() => {
    loadTrips(selectedType).catch((err) =>
      console.error("load trips error", err)
    );
  }, [selectedType]);

  useEffect(() => {
    setItems(trips);
  }, [trips]);

  function confirmDelete(trip: Trip) {
    if (trip.ownerId && user && trip.ownerId !== user.uid) {
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
          },
        },
      ]
    );
  }

  function openDetails(trip: Trip) {
    router.push(`/trips/details?id=${trip.id}`);

  }

  function goToNewTrip() {
    router.push("/trips/new");
  }

  return (
    <ThemedView style={styles.container}>  

      <ThemedText type="title">Trajets</ThemedText>

      <View style={styles.tabs}>
        {(["personnel", "affaire"] as const).map((type) => {
          const active = selectedType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.tab,
                active && { backgroundColor: "#2563eb" },
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[styles.tabText, active && { color: "#fff" }]}>
                {type === "personnel" ? "Personnels" : "Affaires"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
              {item.ownerId === user?.uid && (
                <TouchableOpacity onPress={() => confirmDelete(item)}>
                  <Text style={styles.deleteText}>Supprimer</Text>
                </TouchableOpacity>
              )}
            </View>

            {!!item.description && (
              <Text style={styles.description}>{item.description}</Text>
            )}

            <Text style={styles.meta}>
              Type : {item.type ?? "personnel"} • Positions :{" "}
              {item.positionsCount ?? 0} • Créé le{" "}
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Aucun trajet pour l’instant. Appuie sur “Nouveau trajet” pour en
            créer un.
          </Text>
        }
        onEndReached={() =>
          loadMore(selectedType).catch((err) => console.error(err))
        }
        onEndReachedThreshold={0.5}
        refreshing={loading}
        onRefresh={() => loadTrips(selectedType).catch((err) => console.error(err))}
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
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    alignItems: "center",
  },
  tabText: {
    color: "#2563eb",
    fontWeight: "600",
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
