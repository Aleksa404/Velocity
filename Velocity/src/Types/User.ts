export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: String; // "USER" | "TRAINER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
