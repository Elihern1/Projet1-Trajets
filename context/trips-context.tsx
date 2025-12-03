import { createContext, useContext, useEffect, useState } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import type { Position, Trip } from "@/services/types";
import {
  createTripFS,
  deleteTripFS,
  getTripByIdFS,
  getTripsFS,
  updateTripFS,
} from "@/services/trips.firestore";
import { useAuth } from "./auth-context";

type TripWithPositions = Trip & { positions?: Position[] };

type TripsContextType = {
  trips: Trip[];
  loading: boolean;
  currentType: "personnel" | "affaire" | null;
  loadTrips: (type?: "personnel" | "affaire") => Promise<void>;
  loadMore: (type?: "personnel" | "affaire") => Promise<void>;
  createTrip: (data: {
    name: string;
    description: string;
    type: "personnel" | "affaire";
    positions?: Position[];
  }) => Promise<string>;
  getTripById: (id: string) => Promise<TripWithPositions | null>;
  updateTrip: (
    tripId: string,
    data: Partial<Omit<Trip, "id" | "ownerId" | "positions">>
  ) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
};

const TripsContext = createContext<TripsContextType | undefined>(undefined);

function mapTrip(doc: any): Trip {
  return {
    id: doc.id,
    ownerId: doc.ownerId,
    name: doc.name ?? "",
    description: doc.description ?? "",
    type: doc.type,
    positionsCount: doc.positionsCount ?? 0,
    createdAt: doc.createdAt ?? 0,
    updatedAt: doc.updatedAt ?? 0,
    userFirstName: doc.userFirstName,
    userLastName: doc.userLastName,
  };
}

export function TripsProvider({ children }: { children: any }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentType, setCurrentType] = useState<"personnel" | "affaire" | null>(null);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  async function loadTrips(type?: "personnel" | "affaire") {
    if (!user) {
      setTrips([]);
      setLastDoc(null);
      setCurrentType(null);
      return;
    }

    setCurrentType(type ?? null);
    setLoading(true);
    try {
      const res = await getTripsFS(10, undefined, type);
      setTrips(res.trips.map(mapTrip));
      setLastDoc(res.lastDoc);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore(type?: "personnel" | "affaire") {
    if (!user || !lastDoc) return;
    setLoading(true);
    try {
      const res = await getTripsFS(10, lastDoc, type ?? currentType ?? undefined);
      setTrips((prev) => [...prev, ...res.trips.map(mapTrip)]);
      setLastDoc(res.lastDoc);
    } finally {
      setLoading(false);
    }
  }

  async function createTrip(data: {
    name: string;
    description: string;
    type: "personnel" | "affaire";
    positions?: Position[];
  }) {
    const tripId = await createTripFS(
      data.name,
      data.description,
      data.type,
      data.positions ?? []
    );
    await loadTrips(currentType ?? data.type);
    return tripId;
  }

  async function getTripById(id: string) {
    const res = await getTripByIdFS(id);
    if (!res) return null;

    const { positions = [], ...rest } = res;
    return { ...mapTrip({ ...rest, id: res.id }), positions };
  }

  async function updateTrip(
    tripId: string,
    data: Partial<Omit<Trip, "id" | "ownerId" | "positions">>
  ) {
    await updateTripFS(tripId, data);
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              ...data,
              updatedAt: Date.now(),
            }
          : t
      )
    );
  }

  async function deleteTrip(id: string) {
    await deleteTripFS(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    loadTrips(currentType ?? undefined).catch((err) =>
      console.error("loadTrips error", err)
    );
  }, [user?.uid]);

  return (
    <TripsContext.Provider
      value={{
        trips,
        loading,
        currentType,
        loadTrips,
        loadMore,
        createTrip,
        getTripById,
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
