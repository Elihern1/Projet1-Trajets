export type User = {
id: number;
firstName: string;
lastName: string;
email: string;
password: string;
};
export type Trip = {
  id: number;
  userId: number;
  name: string;
  description?: string;
  createdAt: string; // 'yyyy-MM-dd HH:mm:ss'
};

export type Position = {
  id?: number;
  tripId?: number;
  latitude: number;
  longitude: number;
  timestamp: string;
};