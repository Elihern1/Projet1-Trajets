import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { auth, db } from "./firebase";
import type { Position } from "./types";

type TripDoc = {
  ownerId: string;
  name: string;
  description?: string;
  type?: string;
  positionsCount: number;
  createdAt: number;
  updatedAt: number;
};

type TripWithId = TripDoc & { id: string };

function getCurrentUserUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("Vous devez être connecté.");
  }
  return uid;
}

export async function createTripFS(
  name: string,
  description: string,
  type: "personnel" | "affaire",
  positions: Position[]
): Promise<string> {
  const uid = getCurrentUserUid();
  const now = Date.now();

  const tripRef = await addDoc(collection(db, "trips"), {
    ownerId: uid,
    name,
    description,
    type,
    positionsCount: positions.length,
    createdAt: now,
    updatedAt: now,
  });

  const positionsCol = collection(tripRef, "positions");
  await Promise.all(
    positions.map((pos) =>
      addDoc(positionsCol, {
        latitude: pos.latitude,
        longitude: pos.longitude,
        timestamp: pos.timestamp,
      })
    )
  );

  return tripRef.id;
}

export async function getTripsFS(
  limitCount: number,
  lastDoc?: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData> | null,
  typeFilter?: "personnel" | "affaire"
): Promise<{ trips: TripWithId[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  const uid = getCurrentUserUid();

  const constraints = [where("ownerId", "==", uid)] as any[];
  if (typeFilter) {
    constraints.push(where("type", "==", typeFilter));
  }
  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(limitCount));

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const snap = await getDocs(query(collection(db, "trips"), ...constraints));
  const trips: TripWithId[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as TripDoc),
  }));

  return {
    trips,
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
  };
}

export async function getTripByIdFS(
  tripId: string
): Promise<(TripWithId & { positions: Position[] }) | null> {
  const tripRef = doc(db, "trips", tripId);
  const tripSnap = await getDoc(tripRef);
  if (!tripSnap.exists()) {
    return null;
  }

  const posSnap = await getDocs(
    query(collection(tripRef, "positions"), orderBy("timestamp", "asc"))
  );

  const positions: Position[] = posSnap.docs.map((p) => ({
    ...(p.data() as Position),
    id: p.id,
  }));

  return {
    id: tripSnap.id,
    ...(tripSnap.data() as TripDoc),
    positions,
  };
}

export async function updateTripFS(
  tripId: string,
  updateData: Partial<TripDoc>
): Promise<void> {
  const tripRef = doc(db, "trips", tripId);
  await updateDoc(tripRef, {
    ...updateData,
    updatedAt: Date.now(),
  });
}

export async function deleteTripFS(tripId: string): Promise<void> {
  const tripRef = doc(db, "trips", tripId);
  const posSnap = await getDocs(collection(tripRef, "positions"));

  await Promise.all(posSnap.docs.map((p) => deleteDoc(p.ref)));
  await deleteDoc(tripRef);
}
