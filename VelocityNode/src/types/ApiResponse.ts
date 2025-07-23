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
