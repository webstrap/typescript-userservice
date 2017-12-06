import { ObjectId } from "bson";
import { NextFunction, Request, Response, Router } from "express";
import { filter, getPermission } from "../config/accesscontrol";
import { AuthorizationError, catchError, ResourceNotFoundError, ValidationError } from "../misc/error";
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
        router.route(`/${User.resourceName}`)
              .get( catchError( this.getUsers.bind(this) ) )
              .post( catchError( this.postUsers.bind(this) ) );
        router.route( `/${User.resourceName}/:id`)
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
        const permission = getPermission({role: req.user.roles, action: "create", resource: User.resourceName});
        const readPermission = getPermission({role: req.user.roles, action: "read", resource: User.resourceName});
        if ( permission.granted ) {
            let user = new User(permission.filter(req.body));
            user = await this.userRepository.save(user);
            // set location header to new resource
            res.header("location", `/${User.resourceName}/${user.id}`)
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

        const permission = getPermission({role: req.user.roles, action: "read", resource: User.resourceName});
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
            throw new ResourceNotFoundError();
        }
        const isOwn = req.user.id === req.params.id;
        const permission =
            getPermission({role: req.user.roles, action: "read", resource: User.resourceName, own: isOwn });
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
        const createPermission =
            getPermission({role: req.user.roles, action: "create", resource: User.resourceName, own: isOwn });
        const readPermission =
            getPermission({role: req.user.roles, action: "read", resource: User.resourceName, own: isOwn });
        const updatePermission =
            getPermission({role: req.user.roles, action: "update", resource: User.resourceName, own: isOwn });
        if ( updatePermission.granted) {
            const allowedUpdateFields = updatePermission.filter(req.body);
            if ( Object.keys(allowedUpdateFields).length === 0) {
                throw new AuthorizationError("no valid update fields passed");
            }
            const user = await this.userRepository.findMergeUpdate(
                                req.params.id,
                                allowedUpdateFields);

            res.send( filter( readPermission, user));
            return next();
        }
        if ( createPermission.granted ) {
            const allowedCreateFields = createPermission.filter(req.body);
            if ( Object.keys(allowedCreateFields).length === 0) {
                throw new AuthorizationError("no valid create fields passed");
            }
            let user = await this.userRepository.findOneById(req.params.id) as any;
            let userWasChanged = false;
            Object.keys(allowedCreateFields).forEach( ( key )  => {
                if ( !user[key] ) {
                    user[key] = allowedCreateFields[key];
                    userWasChanged = true;
                }
            });
            if ( !userWasChanged ) {
                throw new AuthorizationError("user was not changed");
            }
            user = await this.userRepository.save(user);
            res.send( filter( readPermission, user));
        }
        throw new AuthorizationError("update not allowed");
    }

    public async deleteUser(req: Request, res: Response, next: NextFunction) {
        const isOwn = req.user.id === req.params.id;
        const permission =
            getPermission({role: req.user.roles, action: "delete", resource: User.resourceName, own: isOwn });
        if ( permission.granted ) {
            const result = await this.userRepository.deleteOne({_id: new ObjectId(req.params.id)});
            res.send(result);
            return next();
        }
        throw new AuthorizationError("for action delete");
    }
}
