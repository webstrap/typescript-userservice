import { ObjectId } from "bson";
import { validate } from "class-validator";
import { CollectionOptions } from "mongodb";
import { FindManyOptions, FindOneOptions, MongoRepository, ObjectLiteral, SaveOptions } from "typeorm";
import { ValidationError } from "../misc/error";
import Message from "./message";

/**
 * Controls all access to Message Documents from the MongoDB.
 *
 * For now it's it's own collection, might be moved to be a subcollection of the user.
 */
export class MessageRepository {

    private repository: MongoRepository<Message>;

    constructor(repository: MongoRepository<Message>) {
        this.repository = repository;
    }

    public async save(message: Message, options?: SaveOptions): Promise<Message> {
        const errors = await validate(message);
        if (errors.length > 0) {
            let concatErrors: string = "";
            errors.map((error) => {concatErrors += `[ ${error.property}: ${error.value}`; });
            throw new ValidationError(concatErrors);
        } else {
            return this.repository.save(message, options);
        }
    }

    public find(optionsOrConditions?: FindManyOptions<Message> | Partial<Message>): Promise<Message[]> {
        return this.repository.find(optionsOrConditions);
    }

    public findOne(optionsOrConditions?: FindManyOptions<Message> | Partial<Message>): Promise<Message> {
        return this.repository.findOne(optionsOrConditions);
    }

    public findOneById(id: any, options?: FindOneOptions<Message>): Promise<Message> {
        return this.repository.findOneById( new ObjectId(id) , options);
    }

    public deleteOne(query: ObjectLiteral, options?: CollectionOptions) {
        return this.repository.deleteOne(query, options);
    }
}
