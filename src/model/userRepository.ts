import { ObjectId } from "bson";
import { validate } from "class-validator";
import * as config from "config";
import { CollectionOptions } from "mongodb";
import { FindManyOptions, FindOneOptions, MongoRepository, ObjectLiteral, SaveOptions } from "typeorm";
import { ValidationError } from "../misc/error";
import User from "./user";

/**
 * Controls all access to User Documents from the MongoDB
 */
export default class UserRepository {

    private repository: MongoRepository<User>;

    constructor(repository: MongoRepository<User>) {
        this.repository = repository;
    }

    public async findOneOrCreate(conditions: any): Promise<User> {
        let user = await this.repository.findOne(conditions);
        if ( user ) {
            return Promise.resolve<User>(user);
        }
        user = new User(conditions);
        return this.save(user);
    }

    public async findMergeUpdate(query: ObjectLiteral, update: object) {
        const user = await this.repository.findOneById(query);
        config.util.extendDeep(user, update);
        return this.repository.save(user);
    }

    public async save(user: User, options?: SaveOptions): Promise<User> {
        const errors = await validate(user);
        if (errors.length > 0) {
            let concatErrors: string = "";
            errors.map((error) => {concatErrors += `[ ${error.property}: ${error.value}`; });
            throw new ValidationError(concatErrors);
        } else {
            return this.repository.save(user, options);
        }
    }

    public findOneById(id: any, options?: FindOneOptions<User>): Promise<User> {
        return this.repository.findOneById( new ObjectId(id) , options);
    }

    /**
     * Find a list of users, supports pagination
     *
     * @param optionsOrConditions filter with a partial of a User e.g. {name:"Alex"} or
     * pass "skip" and "take" for pagination
     */
    public find(optionsOrConditions?: FindManyOptions<User> | Partial<User>): Promise<User[]> {
        return this.repository.find(optionsOrConditions);
    }

    public findOne(optionsOrConditions?: FindManyOptions<User> | Partial<User>): Promise<User> {
        return this.repository.findOne(optionsOrConditions);
    }

    public deleteOne(query: ObjectLiteral, options?: CollectionOptions) {
        return this.repository.deleteOne(query, options);
    }

    /**
     * DISABLED FOR NOW
     *
     * It would bypass validation, therefor I disabled it again for now.
     *
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     *
     * usage: findOneAndUpdate({ _id: new ObjectId(idString) },
     *                          { $set: allowedFields });
     */
    // public findOneAndUpdate(query: ObjectLiteral,
    //                         update: object,
    //                         options?: FindOneAndReplaceOption):
    //                         Promise<FindAndModifyWriteOpResultObject> {
    //     return this.repository.findOneAndUpdate(query, update, options);
    // }
}
