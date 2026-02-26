import { User } from "../generated/prisma/client";
import { UserRole } from "../lib/middlewares/auth.middleware";

declare global {
  namespace Express {
    interface Request {
      userId: User["id"];
      userRole: UserRole;
    }
  }
}
