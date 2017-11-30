import * as config from "config";
import { Connection, createConnection } from "typeorm";
import User from "../model/user";

export function configureTypeORM(): Promise<Connection> {
    const mongoConfig: any = config.util.extendDeep(
        config.get("mongo"),
        {
            entities: [
                User, // IMPORTANT: add new entities here
            ],
            type: "mongodb",
        });
    return createConnection(mongoConfig);
}
