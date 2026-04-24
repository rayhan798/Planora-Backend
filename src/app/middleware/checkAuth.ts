/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import AppError from "../errorHelpers/AppError";
import { jwtUtils } from "../utils/jwt";
import { prisma } from "../lib/prisma";
import { envVars } from "../config/env";

export interface IRequestUser {
  userId: number;
  role: string;
  email?: string;
  name?: string;
}

export const checkAuth =
  (...allowedRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const cookieToken = req.cookies?.accessToken;

      let token: string | undefined;

    //  token check 
      if (cookieToken) {
        token = cookieToken;
      } else if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }

      if (!token) {
        if (allowedRoles.includes("OPTIONAL")) {
          return next();
        }
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized! No token provided.",
        );
      }

      
      const verified = jwtUtils.verifyToken(
        token,
        envVars.ACCESS_TOKEN_SECRET!,
      );

      if (!verified.success) {
        const message =
          verified.message === "jwt expired"
            ? "Session expired! Please login again."
            : "Unauthorized! Invalid token.";

        throw new AppError(status.UNAUTHORIZED, message);
      }

      const userData = verified.data as any;

      const user = await prisma.user.findUnique({
        where: { id: userData.userId || userData.id },
      });

      if (!user) throw new AppError(status.UNAUTHORIZED, "User not found.");


      if ((user as any).status === "BLOCKED")
        throw new AppError(status.FORBIDDEN, "User is blocked.");
      if ((user as any).status === "DELETED")
        throw new AppError(status.UNAUTHORIZED, "User is deleted.");

   
      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes("OPTIONAL") &&
        !allowedRoles.includes(user.role)
      ) {
        throw new AppError(
          status.FORBIDDEN,
          "Forbidden! You don't have permission.",
        );
      }


      (req as any).user = {
        userId: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
      } as IRequestUser;

      next();
    } catch (err: any) {
      next(err);
    }
  };

export const authMiddleware = checkAuth();
export const optionalAuthMiddleware = checkAuth("OPTIONAL");
