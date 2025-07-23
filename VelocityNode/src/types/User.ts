import { Role } from "./Role";

export interface User {
  id: String;
  email: String;
  password: String;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
