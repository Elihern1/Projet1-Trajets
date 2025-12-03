export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
export type Trip = {
  id: number;
  userId: string | null;
  name: string;
  description?: string;
  createdAt: string; // 'yyyy-MM-dd HH:mm:ss'
  userFirstName?: string;
  userLastName?: string;
};

export type Position = {
  id?: number;
  tripId?: number;
  latitude: number;
  longitude: number;
  timestamp: string;
};
