import { IsNotEmpty, IsOptional, Length } from "class-validator";
import { Column, CreateDateColumn, Entity, ObjectID, ObjectIdColumn } from "typeorm";
import { DisplayUser } from "./user";
/**
 * Base User Document
 */
@Entity()
export default class Message {

    /**
     * This field is used for the route and permissions
     */
    public static resourceName: string = "messages";

    @ObjectIdColumn()
    public id: ObjectID;

    @CreateDateColumn()
    public created: Date;

    @Column()
    public owner: ObjectID;

    @Column()
    @IsNotEmpty()
    public from?: DisplayUser;

    /**
     * at the moment to can only be a user, in the future it might be desired
     * to allow to send to groups of users.
     */
    @Column()
    @IsNotEmpty()
    public to?: DisplayUser;

    @Column()
    @Length(1, 60)
    public title: string;

    @Column()
    @IsOptional()
    @Length(0, 5000)
    public message ?: string;

    constructor( message: MessageConstructor ) {
        Object.assign(this, message);
    }
}

export interface MessageConstructor {
    owner?: ObjectID;
    from?: DisplayUser;
    to?: DisplayUser;
    title?: string;
    message?: string;
}
