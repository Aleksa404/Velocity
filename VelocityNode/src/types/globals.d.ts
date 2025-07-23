/// <reference types="@clerk/express/env" />

import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload; // Adjust type to your decoded token structure
    }
  }
}
