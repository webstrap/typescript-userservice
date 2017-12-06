import { NextFunction, Request, RequestHandler, Response } from "express";

// tslint:disable:max-classes-per-file
class BaseError extends Error {
    public static code: number;
    public status: number = 500;
    public message: string;
    get code(): number { return (this.constructor as any).code; }
}

export class ValidationError extends BaseError {
    public static code: number =  100;
    public status: number = 400;
    public name: string = "Validation Error";
    public message: string = "Parameter validation failed";
    constructor(message?: string) {
        super();
        if ( message ) {
            this.message = `${this.message}: ${message}`;
        }
    }
}

export class AuthorizationError extends BaseError {
    public static code: number =  200;
    public status: number = 403;
    public name: string = "Authorization Error";
    public message: string = "Access Denied";
    constructor(message?: string) {
        super();
        if ( message ) {
            this.message = `${this.message}: ${message}`;
        }
    }
}

export class InvalidSessionError extends BaseError {
    public static code: number =  300;
    public status: number = 401;
    public name: string = "Invalid Session Error";
    public message: string = "A problem with the provided session cookie occured";
    constructor(message?: string) {
        super();
        if ( message ) {
            this.message = `${this.message}: ${message}`;
        }
    }
}

export class ResourceNotFoundError extends BaseError {
    public static code: number =  400;
    public status: number = 404;
    public name: string = "Resource Not Found Error";
    public message: string = "The requested resource was not found";
    constructor(message?: string) {
        super();
        if ( message ) {
            this.message = `${this.message}: ${message}`;
        }
    }
}

/**
 * General error catching handler for RequestHandler.
 * Calls next(error) to forward to express error handler.
 */
export function catchError(fun: RequestHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
        fun(req, res, next).catch(next);
    };
}

export function errorRequestHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if ( err instanceof BaseError ) {
        const {code, name, message} = err as any;
        res.status(err.status).send({code, name, message});
    } else {
        res.status(500).send({name: err.name, message: err.message});
    }
}
