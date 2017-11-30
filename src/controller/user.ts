import { ObjectId } from "bson";
import { NextFunction, Request, Response, Router } from "express";
import { filter, getPermission } from "../config/accesscontrol";
import { AuthorizationError, catchError, UserNotFoundError, ValidationError } from "../misc/error";
import User from "../model/user";
import UserRepository from "../model/userRepository";

/**
 * The UserController creates the Express router for /users routes
 * and contains all of its request handler.
 */
export default class UserController {

    private userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Creates an Express router and binds all request handler to this instance
     * of the controller.
     */
    public createRouter() {
        const router = Router();
        router.route("/users")
              .get( catchError( this.getUsers.bind(this) ) )
              .post( catchError( this.postUsers.bind(this) ) );
        router.route( "/users/:id")
              .get( catchError( this.getUser.bind(this) ) )
              .put( catchError( this.putUser.bind(this) ) )
              .delete( catchError( this.deleteUser.bind(this) ) );
        return router;
    }

    /**
     * Creates a new user if the current user has User Admin priveleges.
     * Allowed to set all fields from {User}, except for id, timeCreated,
     * timeUpdated and version.
     */
    public async postUsers(req: Request, res: Response, next: NextFunction) {
        const permission = getPermission({role: req.user.roles, action: "create", resource: "user"});
        const readPermission = getPermission({role: req.user.roles, action: "read", resource: "user"});
        if ( permission.granted ) {
            const user = new User(permission.filter(req.body));
            await this.userRepository.save(user);
            // set location header to new resource
            res.header("location", `/users/${user.id}`)
               .status(201)
               .send(filter(readPermission, user));
            next();

        } else {
            throw new AuthorizationError();
        }

    }

    /**
     * Writes a list of json users to the response. Takes limit and offset
     * as parameters from {Request.query.limit} and {Request.query.offset}
     * e.g. /users?limit=10&offset=20
     *
     * @throws RangeError
     */
    public async getUsers(req: Request, res: Response, next: NextFunction) {
        const limit = Number(req.query.limit) || 20;
        const offset = Number(req.query.offset) || 0;
        // limit 0 - 50 allowed, to prevent requests with too much load
        if ( limit < 0 || limit > 50 ) {
            throw new ValidationError("limit parameter must be an integer between 0 and 50");
        }
        // mongodb offset cannot be negative
        if ( isNaN(offset) || offset < 0 ) {
            throw new ValidationError("offset must be a positive integer");
        }

        const permission = getPermission({role: req.user.roles, action: "read", resource: "user"});
        const users = await this.userRepository.find({ skip: offset, take: limit });
        res.send( filter( permission, users ));
        next();
    }

    /**
     * Writes a single user to the response where it takes the id from {Request.params.id}
     * e.g. /users/59f5aa2c923
     */
    public async getUser(req: Request, res: Response, next: NextFunction) {
        const user = await this.userRepository.findOneById( req.params.id );
        if ( !user ) {
            throw new UserNotFoundError();
        }
        const isOwn = req.user.id === req.params.id;
        const permission = getPermission({role: req.user.roles, action: "read", resource: "user", own: isOwn });
        res.send( filter( permission, user ));
        next();
    }

    /**
     * Updates the via {Request.params.id} given user if it is the id of the
     * current user or the current user has User admin priveleges. Allowed fields
     * to be changed by a user are: name, email and password.
     * @throws not implemented
     */
    public async putUser(req: Request, res: Response, next: NextFunction) {
        const isOwn = req.user.id === req.params.id;
        const permission = getPermission({role: req.user.roles, action: "update", resource: "user", own: isOwn });
        if ( permission.granted ) {
            const allowedFields = permission.filter(req.body);
            if ( Object.keys(allowedFields).length === 0) {
                throw new AuthorizationError();
            }
            const resultObject = await this.userRepository.findMergeUpdate(
                                req.params.id,
                                allowedFields);

            res.send( filter( permission, resultObject));
            return next();
        }
        throw new AuthorizationError("update not allowed");
    }

    public async deleteUser(req: Request, res: Response, next: NextFunction) {
        const isOwn = req.user.id === req.params.id;
        const permission = getPermission({role: req.user.roles, action: "delete", resource: "user", own: isOwn });
        if ( permission.granted ) {
            const result = await this.userRepository.deleteOne({_id: new ObjectId(req.params.id)});
            res.send(result);
            return next();
        }
        throw new AuthorizationError("delete not allowed");
    }
}
