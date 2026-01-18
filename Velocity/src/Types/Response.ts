import type { User } from "./User";

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  error?: any;
}
export interface UserLoginResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: String; // "USER" | "TRAINER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}
export interface UserTokenResponse {
  user: User;
  accessToken: string;
}
