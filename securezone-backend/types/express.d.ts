import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User; // Add the user property to the Request type
    }
  }
}