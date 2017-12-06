import { IsEmail, IsOptional, Length } from "class-validator";
import { Column, CreateDateColumn, Entity, Index, ObjectID,
    ObjectIdColumn, UpdateDateColumn, VersionColumn } from "typeorm";
import { ROLES } from "../config/accesscontrol";

/**
 * Base User Document
 */
@Entity()
export default class User implements DisplayUser {

    /**
     * This field is used for the route and permissions
     */
    public static resourceName: string = "users";

    @ObjectIdColumn()
    public id: ObjectID;

    @CreateDateColumn()
    public created: Date;

    @UpdateDateColumn()
    public updated: Date;

    @VersionColumn()
    public version: number;

    // Index creation does not work at the moment
    @Column()
    @IsEmail()
    @Index({unique: true, sparse: false})
    public email: string;

    @Length(3, 20)
    @Column()
    @IsOptional()
    @Index({unique: true, sparse: false})
    public name?: string;

    @Column()
    @IsOptional()
    public google?: string;

    @Column()
    @IsOptional()
    public facebook?: string;

    @Column()
    public roles: ROLES[] = [ROLES.user];

    constructor( user?: ConstructorUser ) {
        Object.assign(this, user);
    }
}

export interface DisplayUser {
    id: ObjectID;
    name?: string;
}

export interface ConstructorUser {
    name?: string;
    email?: string;
    google?: string;
    facebook?: string;
    roles?: ROLES[];
}
