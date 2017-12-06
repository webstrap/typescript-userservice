import { ObjectId } from "bson";
import Message from "../../../src/model/message";

/**
 * generates users numbered from 1 to {amount}
 * @param amount number of users to generate
 */
export function generateMessages(amount: number, id?: ObjectId): Message[] {
    const result: Message[] = new Array();
    for (let index = 1; index <= amount; index++) {
        const message = new Message({
            // tslint:disable:object-literal-sort-keys
            to: {
                id: new ObjectId(),
                name: `to name${index}`,
            },
            from: {
                id: new ObjectId(),
                name: `from name${index}`,
            },
            title: `title ${index} @test`,
            message: `Message Test ${index}`,
        });
        message.owner = id;
        message.id = new ObjectId();
        message.created = new Date();
        result.push(message);
    }
    return result;
}
