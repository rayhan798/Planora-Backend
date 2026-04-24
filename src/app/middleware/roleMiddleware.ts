import { Request, Response, NextFunction } from "express";


export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden! You don't have access." });
    }
    next();
  };
};