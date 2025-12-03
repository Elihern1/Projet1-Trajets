import { createContext, useContext, useEffect, useState } from "react";
import { run, getAll, createTables } from "@/services/database.native";
import type { Trip, Position } from "@/services/types";
import { useAuth } from "./auth-context";

type TripsContextType = {
  trips: Trip[];
  loadTrips: () => Promise<void>;
  createTrip: (data: {
    name: string;
    description: string;
    createdAt?: string;
  }) => Promise<number>;
  addPositionToTrip: (
    tripId: number,
    pos: { latitude: number; longitude: number; timestamp?: string }
  ) => Promise<void>;
  getTripById: (id: number) => Promise<Trip | null>;
  getPositionsForTrip: (id: number) => Promise<Position[]>;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: number) => Promise<void>;
};

const TripsContext = createContext<TripsContextType | undefined>(undefined);

export function TripsProvider({ children }: { children: any }) {
  const { user, profile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);

  async function loadTrips() {
    await createTables();
    const rows = await getAll<Trip>(
      `
        SELECT t.*, u.firstName AS userFirstName, u.lastName AS userLastName
        FROM trips t
        LEFT JOIN users u ON u.id = t.userId
        ORDER BY t.id DESC;
      `
    );

    const hydrated = rows.map((row) => {
      if (row.userId === user?.uid) {
        return {
          ...row,
          userFirstName: row.userFirstName ?? profile?.firstName,
          userLastName: row.userLastName ?? profile?.lastName,
        };
      }
      return row;
    });

    setTrips(hydrated);
  }

  async function createTrip(data: {
    name: string;
    description: string;
    createdAt?: string;
  }) {
    if (!user) {
      throw new Error("Vous devez être connecté pour créer un trajet");
    }

    await createTables();
    await run(
      `INSERT INTO trips (userId, name, description, createdAt)
       VALUES (?, ?, ?, COALESCE(?, datetime('now')));`,
      [user.uid, data.name, data.description, data.createdAt ?? null]
    );

    const row = await getAll<{ id: number }>(
      "SELECT last_insert_rowid() AS id;"
    );

    await loadTrips();
    return row[0].id;
  }

  async function ensureOwnTrip(tripId: number) {
    if (!user) {
      throw new Error("Vous devez être connecté");
    }

    const ownerRow = await getAll<{ userId: string | null }>(
      "SELECT userId FROM trips WHERE id = ?;",
      [tripId]
    );

    const ownerId = ownerRow[0]?.userId ?? null;
    if (ownerId !== user.uid) {
      throw new Error("Vous ne pouvez modifier que vos trajets.");
    }
  }

  async function addPositionToTrip(
    tripId: number,
    pos: { latitude: number; longitude: number; timestamp?: string }
  ) {
    await ensureOwnTrip(tripId);
    await run(
      `INSERT INTO positions (tripId, latitude, longitude, timestamp)
       VALUES (?, ?, ?, COALESCE(?, datetime('now')));`,
      [tripId, pos.latitude, pos.longitude, pos.timestamp ?? null]
    );
  }

  async function getTripById(id: number) {
    const rows = await getAll<Trip>(
      `
        SELECT t.*, u.firstName AS userFirstName, u.lastName AS userLastName
        FROM trips t
        LEFT JOIN users u ON u.id = t.userId
        WHERE t.id = ?;
      `,
      [id]
    );
    const trip = rows[0] ?? null;
    if (trip && trip.userId === user?.uid) {
      return {
        ...trip,
        userFirstName: trip.userFirstName ?? profile?.firstName,
        userLastName: trip.userLastName ?? profile?.lastName,
      };
    }
    return trip;
  }

  async function getPositionsForTrip(id: number) {
    const rows = await getAll<Position>(
      "SELECT * FROM positions WHERE tripId = ? ORDER BY id ASC;",
      [id]
    );

    // 🔥 Correction : convertir en nombres pour MapView
    return rows.map((p) => ({
      ...p,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
    }));
  }

  async function updateTrip(trip: Trip) {
    await ensureOwnTrip(trip.id);
    await run(
      `UPDATE trips SET name = ?, description = ? WHERE id = ?;`,
      [trip.name, trip.description, trip.id]
    );
    await loadTrips();
  }

  async function deleteTrip(id: number) {
    await ensureOwnTrip(id);
    await run("DELETE FROM positions WHERE tripId = ?;", [id]);
    await run("DELETE FROM trips WHERE id = ?;", [id]);
    await loadTrips();
  }

  useEffect(() => {
    loadTrips().catch((err) => console.error("loadTrips error", err));
    // Recharger quand l'utilisateur change ou quand son profil se charge
  }, [user?.uid, profile?.firstName, profile?.lastName]);

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
