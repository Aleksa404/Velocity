import { Role } from "./Role";

export interface User {
  id: String;
  email: String;
  hashedPassword: String;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
