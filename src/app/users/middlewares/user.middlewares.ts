import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UserInterface } from "../../schemas/user.schema";
import {
  FORBIDDEN,
  UNAUTHORIZED,
  BAD_REQUEST,
} from "../../../constants/codes.constanst";
import HttpHandler from "../../../helpers/handler.helper";

const JWT_SECRET = process.env.JWT_SECRET || "test";

interface AuthRequest extends Request {
  user?: JwtPayload;
}
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return HttpHandler.response(res, UNAUTHORIZED, {
        message: "Unauthorized",
        data: { error: "No token provided" },
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return HttpHandler.response(res, FORBIDDEN, {
          message: "Forbidden",
          data: { error: "Invalid token" },
        });
      }

      req.user = decoded as JwtPayload; // Assertion here
      next();
    });
  } catch (error: any) {
    return HttpHandler.response(res, UNAUTHORIZED, {
      message: "Unauthorized",
      data: { error: error.message },
    });
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return HttpHandler.response(res, UNAUTHORIZED, {
        message: "Unauthorized",
        data: { error: "User not authenticated" },
      });
    }

    if (typeof req.user === 'string' || !('role' in req.user)) {
        return HttpHandler.response(res, FORBIDDEN, {
            message: "Forbidden",
            data: { error: "User is not an admin" },
        });
    }

    if (req.user.role !== "admin") {
      return HttpHandler.response(res, FORBIDDEN, {
        message: "Forbidden",
        data: { error: "User is not an admin" },
      });
    }

    next();
  } catch (error: any) {
    return HttpHandler.response(res, FORBIDDEN, {
      message: "Forbidden",
      data: { error: error.message },
    });
  }
};

export function checkEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  throw new Error('Function not implemented.');
}

export function checkActive(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  throw new Error('Function not implemented.');
}
export function checkCredentials(arg0: string, checkActive: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>, passwordComplexity: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>, checkCredentials: any, arg4: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>, generateToken: (req: Request, res: Response) => Promise<Response>) {
  throw new Error('Function not implemented.');
}

