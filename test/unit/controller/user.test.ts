import * as express from "express";
import * as request from "supertest";
import "ts-jest";
import { createApp } from "../../../src/app";
import { ValidationError } from "../../../src/misc/error";
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
const app = createApp(userRepositoryMock);

const authedApp = express();
authedApp.all("*", (req, res, next) => {
    req.user = {
        id: users[0].id.toString(),
        roles: users[0].roles,
    };
    next();
});
authedApp.use(app);

describe("The UserController for fetching a list of users", () => {

    it("should return default 20 users", async () => {
        const response = await request(app).get("/users");
        expect(response.status).toEqual(200);
        // it returns all users that it gets from the userRepository
        expect(response.body.length).toEqual(20);
    });

    it("should not allow more than 50 users", async () => {
        const response = await request(app).get("/users?limit=60");
        expect(response.status).toEqual(400);
        expect(response.body.code).toBe(ValidationError.code);
    });

    it("should support paging via offset and limit", async () => {
        const response = await request(app).get("/users?limit=10&offset=10");
        const { id, name } = users[10];
        expect(response.body[0]).toEqual({ id: id.toString(), name });
        expect(response.body.length).toBe(10);
    });

    it("should return only the field id and name", async () => {
        const response = await request(app).get("/users");
        // reduce the users to just id and name
        const publicUsers = users.slice(0, 20).map(({ id, name }) => ({ id: id.toString(), name }));
        expect(response.body).toEqual(publicUsers);
    });

});

describe("The UserController for fetching a single user", () => {
    // this test should be moved to the UserRepository Test
    it("should return fields id and name", async (done) => {
        const response = await request(app).get(`/users/${users[0].id.toString()}`);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({id: users[0].id.toString(), name: users[0].name});
        return done();
    });

    it(`should return fields id, name, email, facebook, google, created
            for a logged in user requesting his own data`, async (done) => {
        const response = await request(authedApp).get(`/users/${users[0].id.toString()}`);
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

    // it(`should return fields id, name, email, facebook, google, created, updated
    //         for a user admin fetching any user`, async (done) => {
    //     const response = await request(app).get("/users");
    //     expect(response.status).toEqual(200);
    //     const {created, name, email, facebook, google} = users[0];
    //     expect(response.body).toBe({id: users[0].id.toString(), created, name, email, facebook, google});
    //     return done();
    // }); {User} {modify/start} {resource} {resource.ships>5}
});
