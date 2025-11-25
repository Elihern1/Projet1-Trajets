import { createContext, useContext, useEffect, useState } from "react";
import { db, run, getAll } from "@/services/database.native";
import type { Trip, Position } from "@/services/types";

type TripsContextType = {
  trips: Trip[];
  loadTrips: () => Promise<void>;
  createTrip: (data: { name: string; description: string }) => Promise<number>;
  addPositionToTrip: (
    tripId: number,
    pos: { latitude: number; longitude: number }
  ) => Promise<void>;
  getTripById: (id: number) => Promise<Trip | null>;
  getPositionsForTrip: (id: number) => Promise<Position[]>;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: number) => Promise<void>;
};

const TripsContext = createContext<TripsContextType | undefined>(undefined);

export function TripsProvider({ children }: { children: any }) {
  const [trips, setTrips] = useState<Trip[]>([]);

  async function loadTrips() {
    const rows = await getAll<Trip>("SELECT * FROM trips ORDER BY id DESC;");
    setTrips(rows);
  }

  async function createTrip(data: { name: string; description: string }) {
    await run(
      `INSERT INTO trips (name, description, createdAt)
       VALUES (?, ?, datetime('now'));`,
      [data.name, data.description]
    );

    const row = await getAll<{ id: number }>(
      "SELECT id FROM trips ORDER BY id DESC LIMIT 1;"
    );

    await loadTrips();
    return row[0].id;
  }

  async function addPositionToTrip(
    tripId: number,
    pos: { latitude: number; longitude: number }
  ) {
    await run(
      `INSERT INTO positions (tripId, latitude, longitude, timestamp)
       VALUES (?, ?, ?, datetime('now'));`,
      [tripId, pos.latitude, pos.longitude]
    );
  }

  async function getTripById(id: number) {
    const rows = await getAll<Trip>("SELECT * FROM trips WHERE id = ?;", [id]);
    return rows[0] ?? null;
  }

  async function getPositionsForTrip(id: number) {
    return await getAll<Position>(
      "SELECT * FROM positions WHERE tripId = ? ORDER BY id ASC;",
      [id]
    );
  }

  async function updateTrip(trip: Trip) {
    await run(
      `UPDATE trips SET name = ?, description = ? WHERE id = ?;`,
      [trip.name, trip.description, trip.id]
    );
    await loadTrips();
  }

  async function deleteTrip(id: number) {
    await run("DELETE FROM positions WHERE tripId = ?;", [id]);
    await run("DELETE FROM trips WHERE id = ?;", [id]);
    await loadTrips();
  }

  useEffect(() => {
    loadTrips().catch((err) => console.error("loadTrips error", err));
  }, []);

  return (
    <TripsContext.Provider
      value={{
        trips,
        loadTrips,
        createTrip,
        addPositionToTrip,
        getTripById,
        getPositionsForTrip,
        updateTrip,
        deleteTrip,
      }}
    >
      {children}
    </TripsContext.Provider>
  );
}

export function useTrips() {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error("useTrips must be inside TripsProvider");
  return ctx;
}
