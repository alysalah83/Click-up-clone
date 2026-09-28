import { User } from "../generated/prisma/client.js";
import { UserRole } from "../lib/middlewares/auth.middleware.js";

declare global {
  namespace Express {
    interface Request {
      userId: User["id"];
      userRole: UserRole;
    }
  }
}
