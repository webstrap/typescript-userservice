import * as config from "config";
import * as express from "express";
import "reflect-metadata";
import { Connection } from "typeorm";
import { createApp } from "./app";
import { configureTypeORM } from "./config/typeorm";
import Message from "./model/message";
import { MessageRepository } from "./model/messageRepository";
import User from "./model/user";
import UserRepository from "./model/userRepository";

const connectionPromise = configureTypeORM();
// just to allow access to the instance of the running express Application
const server: {app: express.Application} = {app: null};
// prepare dependencies
connectionPromise.then( (connection: Connection) => {
    const userRepository = new UserRepository(connection.getMongoRepository(User));
    const messageRepository = new MessageRepository(connection.getMongoRepository(Message));
    userRepository.findOneOrCreate({email: config.get("server.email"), roles: ["admin"]});
    // For testability the Express Application is created separately without starting it
    server.app = createApp(userRepository, messageRepository);
    const port = config.get("server.port");
    server.app.listen(port, () => {
        // tslint:disable-next-line:no-console
        console.log("Server listening at %s", port);
    });
});

export default server;
