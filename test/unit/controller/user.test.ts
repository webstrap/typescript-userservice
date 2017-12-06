import * as config from "config";
import * as express from "express";
import * as request from "supertest";
import "ts-jest";
import { createApp } from "../../../src/app";
import { ROLES } from "../../../src/config/accesscontrol";
import { AuthorizationError, ValidationError } from "../../../src/misc/error";
import { MessageRepository } from "../../../src/model/messageRepository";
import User from "../../../src/model/user";
import UserRepository from "../../../src/model/userRepository";
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
userRepositoryMock.findMergeUpdate = (id: any, update: object) => {
    const filtered = users.filter((user) => user.id.toString() === id);
    if (filtered.length === 1) {
        const user = filtered[0];
        config.util.extendDeep(user, update);
        return Promise.resolve(user);
    }
    return Promise.reject("User not found");
};
userRepositoryMock.save = jest.fn( (user) => user );
userRepositoryMock.deleteOne = jest.fn( (user) => user );
const messageRepositoryMock = new MessageRepository(null);
const app = createApp(userRepositoryMock, messageRepositoryMock);

const userApp = express();
userApp.all("*", (req, res, next) => {
    req.user = {
        id: users[0].id.toString(),
        roles: users[0].roles,
    };
    next();
});
userApp.use(app);

const app2 = createApp(userRepositoryMock, messageRepositoryMock);
const adminApp = express();
adminApp.all("*", (req, res, next) => {
    req.user = {
        id: users[0].id.toString(),
        roles: [ROLES.admin],
    };
    next();
});
adminApp.use(app2);

describe("The UserController for fetching a list of users", () => {

    it("should return default 20 users", async () => {
        const response = await request(app).get(`/${User.resourceName}`);
        expect(response.status).toEqual(200);
        // it returns all users that it gets from the userRepository
        expect(response.body.length).toEqual(20);
    });

    it("should not allow more than 50 users", async () => {
        const response = await request(app).get(`/${User.resourceName}?limit=60`);
        expect(response.status).toEqual(400);
        expect(response.body.code).toBe(ValidationError.code);
    });

    it("should support paging via offset and limit", async () => {
        const response = await request(app).get(`/${User.resourceName}?limit=10&offset=10`);
        const { id, name } = users[10];
        expect(response.body[0]).toEqual({ id: id.toString(), name });
        expect(response.body.length).toBe(10);
    });

    it("should return only the field id and name", async () => {
        const response = await request(app).get(`/${User.resourceName}`);
        // reduce the users to just id and name
        const publicUsers = users.slice(0, 20).map(({ id, name }) => ({ id: id.toString(), name }));
        expect(response.body).toEqual(publicUsers);
    });

});

describe("The UserController for fetching a single user", () => {
    // this test should be moved to the UserRepository Test
    it("should return fields id and name", async (done) => {
        const response = await request(app).get(`/${User.resourceName}/${users[0].id.toString()}`);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({id: users[0].id.toString(), name: users[0].name});
        return done();
    });

    it(`should return fields id, name, email, facebook, google, created
            for a logged in user requesting his own data`, async (done) => {
        const response = await request(userApp).get(`/${User.resourceName}/${users[0].id.toString()}`);
        expect(response.status).toEqual(200);
        const {created, name, email, facebook, google} = users[0];
        expect(response.body).toEqual({
            created: created.toISOString(),
            email,
            facebook,
            google,
            id: users[0].id.toString(),
            name,
        });
        return done();
    });

});

describe("The UserController for updating a user", () => {
    // this test should be moved to the UserRepository Test
    it("should update the name of a logged in user if it is currently empty", async (done) => {
        users[0].name = null;
        const response = await request(userApp).put(`/${User.resourceName}/${users[0].id.toString()}`)
                                            .send({name: "Updated Name"});
        expect(response.body).toHaveProperty("name", "Updated Name");
        expect(users[0].name).toBe("Updated Name");
        expect(response.status).toEqual(200);
        return done();
    });

    it("should't allow users to update the name if it is not empty", async (done) => {
        users[0].name = "some name";
        const response = await request(userApp).put(`/${User.resourceName}/${users[0].id.toString()}`)
                                                 .send({name: "Blocked Name"});
        expect(response.body).toHaveProperty("code", AuthorizationError.code);
        expect(response.status).toEqual(403);
        return done();
    });

    it("should allow admins to update any users name", async (done) => {
        const response = await request(adminApp).put(`/${User.resourceName}/${users[1].id.toString()}`)
                                                 .send({name: "Admin Name"});
        expect(response.body).toHaveProperty("name", "Admin Name");
        expect(response.status).toEqual(200);
        return done();
    });
});

describe("The UserController for deleting a user", () => {
    // this test should be moved to the UserRepository Test
    it("should update the name of a logged in user if it is currently empty", async (done) => {
        const response = await request(userApp).delete(`/${User.resourceName}/${users[0].id.toString()}`);
        expect(userRepositoryMock.deleteOne).toBeCalled();
        expect(response.status).toEqual(200);
        return done();
    });
});
