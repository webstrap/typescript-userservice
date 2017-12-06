import { ObjectId } from "bson";
import { NextFunction, Request, Response, Router } from "express";
import { filter, getPermission } from "../config/accesscontrol";
import { AuthorizationError, catchError, ResourceNotFoundError, ValidationError } from "../misc/error";
import Message from "../model/message";
import { MessageRepository } from "../model/messageRepository";
import UserRepository from "../model/userRepository";

/**
 * The MessageController creates the Express router for /messages routes
 * and contains all of its request handler.
 * Update of messages is not allowed at the moment.
 */
export default class MessageController {

    private static isOwn(user: string, message: Message): boolean {
        if (message && message.owner && message.owner.toString ) {
            return message.owner.toString() === user;
        }
        return false;
    }

    private messageRepository: MessageRepository;

    private userRepository: UserRepository;

    constructor(messageRepository: MessageRepository, userRepository: UserRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates an Express router and binds all request handler to this instance
     * of the controller.
     */
    public createRouter() {
        const router = Router();
        router.route(`/${Message.resourceName}`)
              .get( catchError( this.getMessages.bind(this) ) )
              .post( catchError( this.postMessage.bind(this) ) );
        router.route( `/${Message.resourceName}/:id`)
              .get( catchError( this.getMessage.bind(this) ) )
              .delete( catchError( this.deleteMessage.bind(this) ) );
        return router;
    }

    /**
     * Creates a new message, which creates one copy for the sender and one for the receiver.
     * This is to not have to handle the delete for both users, so each user can delete it's
     * own copy of the message (for in it is the incoming for the other the outgoing).
     *
     * allowed fields are "to", "title" and "message"
     */
    public async postMessage(req: Request, res: Response, next: NextFunction) {
        const createPermission = getPermission(
            {role: req.user.roles, action: "create", resource: Message.resourceName});
        const readPermission = getPermission(
            {role: req.user.roles, action: "read", resource: Message.resourceName, own: true});

        if ( createPermission.granted ) {
            // it is expected to get in the body the id of a user {to:{id:"AFD123"}}
            if (! (req.body.to && req.body.to.id && typeof req.body.to.id === "string" ) ) {
                throw new ValidationError("no recipient set: 'to' field with a user 'id' expected");
            }
            // TODO: yes the following 2 db queries could be merged to one find or made in parallel.
            const fromUser = await this.userRepository.findOneById(req.user.id);
            // new ObjectId is used in this case to verify that the passed id has the correct format
            const toUser = await this.userRepository.findOneById(new ObjectId(req.body.to.id).toHexString());
            const fromMessage = new Message(createPermission.filter(req.body));
            const toMessage = new Message(createPermission.filter(req.body));
            fromMessage.from = {id: fromUser.id, name: fromUser.name};
            toMessage.from = {id: fromUser.id, name: fromUser.name};
            fromMessage.to = {id: toUser.id, name: toUser.name};
            toMessage.to = {id: toUser.id, name: toUser.name};
            fromMessage.owner = fromUser.id;
            toMessage.owner = toUser.id;
            await this.messageRepository.save(fromMessage);
            await this.messageRepository.save(toMessage);
            // set location header to new resource
            res.header("location", `/${Message.resourceName}/${fromMessage.id}`)
               .status(201)
               .send(filter(readPermission, fromMessage));
            next();

        } else {
            throw new AuthorizationError();
        }

    }

    /**
     * Writes a list of json messages to the response. Takes limit and offset
     * as parameters from {Request.query.limit} and {Request.query.offset}
     * e.g. /messages?limit=10&offset=20&filter=from
     *
     * @throws RangeError
     */
    public async getMessages(req: Request, res: Response, next: NextFunction) {
        if ( !req.user.id ) {
            throw new AuthorizationError("you need to be logged in to access messages.");
        }
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

        // own = true because you can only read your own messages
        const permission = getPermission(
            {role: req.user.roles, action: "read", resource: Message.resourceName, own: true});

        const ownerMessages = await this.messageRepository.find(
                        {where: {owner: new ObjectId(req.user.id) }, skip: offset, take: limit});
        res.send( filter( permission, ownerMessages ));
        next();
    }

    /**
     * Writes a single user to the response where it takes the id from {Request.params.id}
     * e.g. /messages/59f5aa2c923
     */
    public async getMessage(req: Request, res: Response, next: NextFunction) {
        const message = await this.messageRepository.findOneById( req.params.id );
        if ( !message ) {
            throw new ResourceNotFoundError(Message.resourceName);
        }
        const isOwn = MessageController.isOwn(req.user.id, message);
        const permission =
            getPermission({role: req.user.roles, action: "read", resource: Message.resourceName, own: isOwn });
        if ( !permission.granted) {
            throw new AuthorizationError();
        }
        res.send( filter( permission, message ));
        next();
    }

    public async deleteMessage(req: Request, res: Response, next: NextFunction) {
        const message = await this.messageRepository.findOneById( req.params.id );
        if ( !message ) {
            throw new ResourceNotFoundError(Message.resourceName);
        }
        const isOwn = MessageController.isOwn(req.user.id, message);
        const permission =
            getPermission({role: req.user.roles, action: "delete", resource: Message.resourceName, own: isOwn });
        if ( permission.granted ) {
            await this.messageRepository.deleteOne({_id: new ObjectId(req.params.id)});
            res.send( filter( permission, message ));
            return next();
        }
        throw new AuthorizationError("for action delete");
    }
}
