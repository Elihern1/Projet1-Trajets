import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useTrips } from "@/context/trips-context";
import type { Trip } from "@/services/types";


export default function TripsListScreen() {
  const router = useRouter();
  const { trips, loadTrips, getPositionsForTrip } = useTrips();

  const [loading, setLoading] = useState(true);
  const [enriched, setEnriched] = useState<
    (Trip & { positionsCount: number; lastTimestamp: string | null })[]
  >([]);

  async function fetchData() {
    setLoading(true);

    // enrichit chaque trajet avec le nombre de positions
    const fullList = [];
    for (const trip of trips) {
      const pos = await getPositionsForTrip(trip.id);
      fullList.push({
        ...trip,
        positionsCount: pos.length,
        lastTimestamp: pos[pos.length - 1]?.timestamp ?? null,
      });
    }

    setEnriched(fullList);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [trips]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement des trajets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trajets ({enriched.length})</Text>

      <TouchableOpacity
        style={styles.newTripButton}
        onPress={() => router.push("/trips/new")}
      >
        <Text style={styles.newTripText}>+ Nouveau trajet</Text>
      </TouchableOpacity>

      {enriched.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Aucun trajet pour l’instant.</Text>
        </View>
      )}

      <FlatList
        data={enriched}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(`/trips/details?id=${item.id}`)}
          >
            <Text style={styles.itemTitle}>{item.name}</Text>

            <Text style={styles.itemSub}>
              📍 {item.positionsCount} positions
            </Text>

            {item.lastTimestamp && (
              <Text style={styles.itemSub}>🕒 {item.lastTimestamp}</Text>
            )}

            <Text style={styles.itemSub}>
              👤{" "}
              {item.userFirstName || item.userLastName
                ? `${item.userFirstName ?? ""} ${item.userLastName ?? ""}`.trim()
                : "Utilisateur inconnu"}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f7fb" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  newTripButton: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  newTripText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  emptyBox: {
    padding: 18,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    marginTop: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
  },

  item: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemTitle: { fontSize: 16, fontWeight: "700" },
  itemSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
});
