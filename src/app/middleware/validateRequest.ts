import { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validateRequest = (zodSchema: z.Schema<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
  
            if (req.body && req.body.data) {
                req.body = JSON.parse(req.body.data);
            }

            const parsedResult = await zodSchema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
                cookies: req.cookies,
            });

        
            req.body = parsedResult.body;

            Object.assign(req.params, parsedResult.params);


            return next();
        } catch (error) {
            return next(error);
        }
    };
};