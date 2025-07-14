export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: "USER" | "TRAINER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}
