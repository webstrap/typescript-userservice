import * as express from "express";
import * as request from "supertest";
import "ts-jest";
import { createApp } from "../../../src/app";
import { ValidationError } from "../../../src/misc/error";
import Message from "../../../src/model/message";
import { MessageRepository } from "../../../src/model/messageRepository";
import UserRepository from "../../../src/model/userRepository";
import { generateMessages } from "../../util/data/message.data";
import { generateUsers } from "../../util/data/user.data";

const userRepositoryMock = new UserRepository(null);
const users = generateUsers(60);
userRepositoryMock.find = (options: any) => {
    return Promise.resolve(users.slice(options.skip, options.skip + options.take));
};
userRepositoryMock.findOneById = (id: any) => {
    const filtered = users.filter((user) => user.id.toString() === id);
    if (filtered.length === 1) {
        const user = filtered[0];
        return Promise.resolve(user);
    }
    return Promise.reject("User not found");
};
const messageRepositoryMock = new MessageRepository(null);
const messages = generateMessages(40, users[0].id);
messageRepositoryMock.find = (options: any) => {
    return Promise.resolve( messages
        .filter( (message: Message) => {
            if (options.id) {
                return message.owner.toHexString() === options.id.toHexString();
            }
            return true;
            } )
        .slice(options.skip, options.skip + options.take));
};
messageRepositoryMock.findOneById = (id: any) => {
    const filtered = messages.filter((message) => message.id.toString() === id);
    if (filtered.length === 1) {
        const message = filtered[0];
        return Promise.resolve(message);
    }
    return Promise.reject("Message not found");
};
messageRepositoryMock.save = jest.fn( (message) => message );
messageRepositoryMock.deleteOne = jest.fn( (message) => message );
const app = createApp(userRepositoryMock, messageRepositoryMock);

const authedApp = express();
authedApp.all("*", (req, res, next) => {
    req.user = {
        id: users[0].id.toString(),
        roles: users[0].roles,
    };
    next();
});
authedApp.use(app);

describe("The MessageController for fetching messages", () => {

    it("should throw an error when the user is not logged in", async () => {
        const response = await request(app).get(`/${Message.resourceName}`);
        expect(response.body).toHaveProperty("code", 200);
        expect(response.status).toEqual(403);
    });

    it("should return the 20 latest messages for a logged in user", async () => {
        const response = await request(authedApp).get(`/${Message.resourceName}`);
        expect(response.body).toHaveLength(20);
        expect(response.status).toEqual(200);
        expect(response.body[0]).toHaveProperty("owner", users[0].id.toHexString());
        // it returns all users that it gets from the userRepository
    });

    it("should not allow more than 50 users", async () => {
        const response = await request(authedApp).get(`/${Message.resourceName}?limit=60`);
        expect(response.status).toEqual(400);
        expect(response.body.code).toBe(ValidationError.code);
    });

    it("should support paging via offset and limit", async () => {
        const response = await request(authedApp).get(`/${Message.resourceName}?limit=10&offset=10`);
        const { id } = messages[10];
        expect(response.body[0]).toHaveProperty("id", id.toString());
        expect(response.body.length).toBe(10);
    });
});

describe("The MessageController for fetching a single message", () => {
    // this test should be moved to the UserRepository Test
    it("should return fields title and message", async (done) => {
        const response = await request(authedApp).get(`/${Message.resourceName}/${messages[0].id.toString()}`);
        expect(response.body).toHaveProperty("title", messages[0].title );
        expect(response.body).toHaveProperty("message", messages[0].message );
        expect(response.status).toEqual(200);
        return done();
    });
});

describe("The MessageController for creating a message", () => {
    // this test should be moved to the UserRepository Test
    it("should delete a message if the current user is the owner", async (done) => {
        const response = await request(authedApp).post(`/${Message.resourceName}`)
                                                .send({
                                                    message: "unit test message",
                                                    title: "test title",
                                                    to: { id: users[1].id.toHexString()}});
        expect(response.body).toHaveProperty("title", "test title");
        expect(response.status).toEqual(201);
        expect(messageRepositoryMock.save).toHaveBeenCalledTimes(2);
        return done();
    });
});

describe("The MessageController for deleting a message", () => {
    // this test should be moved to the UserRepository Test
    it("should delete a message if the current user is the owner", async (done) => {
        const response = await request(authedApp).delete(`/${Message.resourceName}/${messages[0].id.toString()}`);
        expect(response.body).toHaveProperty("title", messages[0].title );
        expect(response.body).toHaveProperty("message", messages[0].message );
        expect(response.status).toEqual(200);
        expect(messageRepositoryMock.deleteOne).toBeCalled();
        return done();
    });
});
