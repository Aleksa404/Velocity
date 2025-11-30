import { JwtPayload } from "jsonwebtoken";

export type UserPayloadType = {
  id: string;
  email: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: UserPayloadType; // Adjust type to your decoded token structure
    }
  }
}
