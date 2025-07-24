export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors?: fieldError[];
}
export interface fieldError {
  field: string;
  message: string;
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
  user: UserLoginResponse;
  accessToken: string;
}
