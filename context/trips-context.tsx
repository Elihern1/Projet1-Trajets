import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Trip, Position } from "@/services/types";
import { run, getAll } from "@/services/database.native";

type TripsContextType = {
  trips: Trip[];
  loadTrips: () => Promise<void>;
  addTripWithPositions: (
    name: string,
    description: string,
    positions: Omit<Position, "id" | "tripId">[]
  ) => Promise<void>;
  deleteTrip: (id: number) => Promise<void>;
  updateTrip: (trip: Trip) => Promise<void>;
  getTripById: (id: number) => Promise<Trip | null>;
  getPositionsForTrip: (tripId: number) => Promise<Position[]>;
};

const TripsContext = createContext<TripsContextType | undefined>(undefined);

export function useTrips(): TripsContextType {
  const ctx = useContext(TripsContext);
  if (!ctx) {
    throw new Error("useTrips doit être utilisé dans un TripsProvider");
  }
  return ctx;
}

export function TripsProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);

  async function loadTrips() {
    const rows = await getAll<Trip>(
      "SELECT * FROM trips ORDER BY datetime(createdAt) DESC;"
    );
    setTrips(rows);
  }

  async function addTripWithPositions(
    name: string,
    description: string,
    positions: Omit<Position, "id" | "tripId">[]
  ) {
    const createdAt = new Date().toISOString().replace("T", " ").split(".")[0];

    // INSERT trip
    const result = await run(
      "INSERT INTO trips (name, description, createdAt) VALUES (?, ?, ?);",
      [name, description, createdAt]
    );

    const tripId = result.lastInsertRowId as number;

    // INSERT positions
    for (const pos of positions) {
      await run(
        "INSERT INTO positions (tripId, latitude, longitude, timestamp) VALUES (?, ?, ?, ?);",
        [tripId, pos.latitude, pos.longitude, pos.timestamp]
      );
    }

    await loadTrips();
  }

  async function deleteTrip(id: number) {
    await run("DELETE FROM positions WHERE tripId = ?;", [id]);
    await run("DELETE FROM trips WHERE id = ?;", [id]);
    await loadTrips();
  }

  async function updateTrip(trip: Trip) {
    await run(
      "UPDATE trips SET name = ?, description = ? WHERE id = ?;",
      [trip.name, trip.description, trip.id]
    );
    await loadTrips();
  }

  async function getTripById(id: number): Promise<Trip | null> {
    const rows = await getAll<Trip>(
      "SELECT * FROM trips WHERE id = ? LIMIT 1;",
      [id]
    );
    return rows[0] ?? null;
  }

  async function getPositionsForTrip(tripId: number): Promise<Position[]> {
    const rows = await getAll<Position>(
      "SELECT * FROM positions WHERE tripId = ? ORDER BY datetime(timestamp) ASC;",
      [tripId]
    );
    return rows;
  }

  useEffect(() => {
    loadTrips().catch((err) => console.error("loadTrips error:", err));
  }, []);

  return (
    <TripsContext.Provider
      value={{
        trips,
        loadTrips,
        addTripWithPositions,
        deleteTrip,
        updateTrip,
        getTripById,
        getPositionsForTrip,
      }}
    >
      {children}
    </TripsContext.Provider>
  );
}
