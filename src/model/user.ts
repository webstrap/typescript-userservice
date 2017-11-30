import { IsEmail, IsOptional, Length } from "class-validator";
import { Column, CreateDateColumn, Entity, Index, ObjectID,
    ObjectIdColumn, UpdateDateColumn, VersionColumn } from "typeorm";
import { ROLES } from "../config/accesscontrol";

/**
 * Base User Document
 */
@Entity()
export default class User {

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
    public roles: string[] = [ROLES.user];

    constructor( user: any ) {
        Object.assign(this, user);
    }
}
