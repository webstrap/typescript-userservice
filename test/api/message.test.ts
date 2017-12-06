import * as supertest from "supertest";
import "ts-jest";
import { AuthorizationError } from "../../src/misc/error";
// import { ROLES } from "../../src/config/accesscontrol";
// import { AuthorizationError } from "../../src/misc/error";
import Message from "../../src/model/message";
import User from "../../src/model/user";
import { createSessionCookie } from "../util/createSessionCookie";

const request = supertest.agent("http://localhost:5555");

let adminCookie: string;
let userId1: string;
let userId2: string;
let user1Cookie: string;
let user2Cookie: string;
let messageIdUser1: string;
let messageIdUser2: string;
const randomMessage = `api test message ${Date.now()} now`;
beforeAll(async () => {
    // create general admin cookie
    adminCookie = await createSessionCookie({roles: ["admin"]});

    // create 2 users for testing
    [{body: {id: userId1}}, {body: {id: userId2}}] = await Promise.all( [
        request.post(`/${User.resourceName}`)
            .send({email: "tests12@test.com", name: "API Tester 1"})
            .set("cookie", adminCookie),
        request.post(`/${User.resourceName}`)
            .send({email: "tests22@test.com", name: "API Tester 2"})
            .set("cookie", adminCookie),
        ]);

    // generate cookies for the 2 test user
    [ user1Cookie, user2Cookie ] = await Promise.all([
        createSessionCookie({id: userId1, roles: ["user"]}),
        createSessionCookie({id: userId2, roles: ["user"]}),
    ]);
});

describe("/messages", async () => {
    it("POST should allow user1 to send a message to user2", async (done) => {
        const response = await request.post(`/${Message.resourceName}`)
                                      .send({to: {id: userId2}, title: "test title", message: randomMessage })
                                      .set("cookie", user1Cookie);
        expect(response.body).toHaveProperty("owner", userId1);
        expect(response.body).toHaveProperty("message", randomMessage);
        expect(response.status).toBe(201);
        done();
    });

    it("GET /messages should show user1 the message he has send", async (done) => {
        const response = await request.get(`/${Message.resourceName}`)
                                      .set("cookie", user1Cookie);

        expect(response.body[0]).toHaveProperty("message", randomMessage);
        expect(response.status).toBe(200);
        messageIdUser1 = response.body[0].id;
        done();
    });

    it("GET /messages should show user2 the message from user1", async (done) => {
        const response = await request.get(`/${Message.resourceName}`)
                                      .set("cookie", user2Cookie);

        expect(response.body[0]).toHaveProperty("message", randomMessage);
        expect(response.status).toBe(200);
        messageIdUser2 = response.body[0].id;
        done();
    });

    it("GET /messages/:id should show user1 a certain message", async (done) => {
        const response = await request.get(`/${Message.resourceName}/${messageIdUser1}`)
                                      .set("cookie", user1Cookie);

        expect(response.body).toHaveProperty("id", messageIdUser1);
        expect(response.status).toBe(200);
        done();
    });

    it("GET /messages/:id should not allow user1 to read the message from user2", async (done) => {
        const response = await request.get(`/${Message.resourceName}/${messageIdUser2}`)
                                      .set("cookie", user1Cookie);

        expect(response.body).toHaveProperty("code", AuthorizationError.code);
        expect(response.status).toBe(403);
        done();
    });

    it("DELETE should allow user1 to delete his message", async (done) => {
        const response = await request.delete(`/${Message.resourceName}/${messageIdUser1}`)
                                      .set("cookie", user1Cookie);

        expect(response.body).toHaveProperty("id", messageIdUser1);
        expect(response.status).toBe(200);
        done();
    });

    it("DELETE should not allow user1 to delete the received message of user2", async (done) => {
        const response = await request.delete(`/${Message.resourceName}/${messageIdUser2}`)
                                      .set("cookie", user1Cookie);

        expect(response.body).toHaveProperty("code", AuthorizationError.code);
        expect(response.status).toBe(403);
        done();
    });

    it("DELETE should allow user2 to delete his message", async (done) => {
        const response = await request.delete(`/${Message.resourceName}/${messageIdUser2}`)
                                      .set("cookie", user2Cookie);

        expect(response.body).toHaveProperty("id", messageIdUser2);
        expect(response.status).toBe(200);
        done();
    });
});
