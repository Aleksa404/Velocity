
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: String; // "USER" | "TRAINER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}
