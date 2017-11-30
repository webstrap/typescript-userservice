import { ObjectId } from "bson";
import User from "../../../src/model/user";

/**
 * generates users numbered from 1 to {amount}
 * @param amount number of users to generate
 */
export function generateUsers(amount: number): User[] {
    const result: User[] = new Array();
    for (let index = 1; index <= amount; index++) {
        const user = new User({
            email: `test${index}@test.com`,
            facebook: `${index}`,
            google: `${index}`,
            name: `name${index}`,
        });
        user.id = new ObjectId();
        user.created = new Date();
        user.updated = new Date();
        result.push(user);
    }
    return result;
}
