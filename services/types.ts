export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
export type Trip = {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  type?: "personnel" | "affaire";
  positionsCount: number;
  createdAt: number;
  updatedAt: number;
  userFirstName?: string;
  userLastName?: string;
  positions?: Position[];
};

export type Position = {
  id?: string | number;
  tripId?: string | number;
  latitude: number;
  longitude: number;
  timestamp: string;
};
