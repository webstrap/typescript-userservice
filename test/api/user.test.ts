import * as supertest from "supertest";
import "ts-jest";
import { ROLES } from "../../src/config/accesscontrol";
import { AuthorizationError } from "../../src/misc/error";
import { createSessionCookie } from "../util/createSessionCookie";

const request = supertest.agent("http://localhost:5555");

let adminCookie: string;
let createdUserId: string;
let secondUserId: string;
let userCookie: string;
let userAdminCookie: string;
beforeAll(async () => {
    adminCookie = await createSessionCookie({roles: ["admin"]});
});

describe("/users", async () => {
    it("POST should allow to create a user for a userAdmin", async (done) => {
        const response = await request.post("/users")
                                      .send({email: "tests@test.com", name: "API Tester"})
                                      .set("cookie", adminCookie);

        expect(response.body).toHaveProperty("email", "tests@test.com");
        expect(response.status).toBe(201);
        createdUserId = response.body.id;
        userCookie = await createSessionCookie({id: createdUserId, roles: ["user"]});
        userAdminCookie = await createSessionCookie({id: createdUserId, roles: [ROLES.userAdmin]});
        done();
    });

    it("a normal user should be able to update his name", async (done) => {
        const response = await request.put(`/users/${createdUserId}`)
                                      .send({name: "test put"})
                                      .set("cookie", userCookie);

        expect(response.body).toHaveProperty("name", "test put");
        expect(response.status).toBe(200);
        done();
    });

    it("a normal user should not be able to update facebook or role", async (done) => {
        const response = await request.put(`/users/${createdUserId}`)
                                      .send({facebook: "test facebook", roles: ["admin"]})
                                      .set("cookie", userCookie);

        expect(response.body).toHaveProperty("code", AuthorizationError.code);
        expect(response.status).toBe(403);
        done();
    });

    it("a userAdmin can create a user, but not with admin role", async (done) => {
        const response = await request.post(`/users`)
                                      .send({email: "userAdmin@test.com", roles: [ROLES.admin]})
                                      .set("cookie", userAdminCookie);

        expect(response.body).toHaveProperty("email", "userAdmin@test.com");
        expect(response.body).toHaveProperty("roles", [ROLES.user]);
        expect(response.status).toBe(201);
        secondUserId = response.body.id;
        done();
    });

    it("an userAdmin can not update roles", async (done) => {
        const response = await request.put(`/users/${createdUserId}`)
                                      .send({roles: ["admin"]})
                                      .set("cookie", userAdminCookie);

        expect(response.body).toHaveProperty("code", AuthorizationError.code);
        expect(response.status).toBe(403);
        done();
    });

    it("an user can't delete any account", async (done) => {
        const response = await request.delete(`/users/${secondUserId}`)
                                      .set("cookie", userCookie);

        expect(response.body).toHaveProperty("code", AuthorizationError.code);
        expect(response.status).toBe(403);
        done();
    });

    it("an user can delete his own account", async (done) => {
        const response = await request.delete(`/users/${createdUserId}`)
                                      .set("cookie", userCookie);

        expect(response.body).toHaveProperty("n", 1);
        expect(response.status).toBe(200);
        const verifyResponse = await request.get(`/users/${createdUserId}`);
        expect(verifyResponse.status).toBe(404);
        done();
    });

    it("an userAdmin can delete any account", async (done) => {
        const response = await request.delete(`/users/${secondUserId}`)
                                      .set("cookie", userAdminCookie);

        expect(response.body).toHaveProperty("n", 1);
        expect(response.status).toBe(200);
        const verifyResponse = await request.get(`/users/${secondUserId}`);
        expect(verifyResponse.status).toBe(404);
        done();
    });

    it("POST should not allow a request without a signature", async (done) => {
        const brokenCookie = adminCookie.replace(/session.sig.*/, "");
        const response = await request.post("/users")
                                      .send({email: "tests@test.com", name: "API Tester"})
                                      .set("cookie", brokenCookie);

        expect(response.body).toHaveProperty("code", AuthorizationError.code);
        expect(response.status).toBe(403);
        done();
    });

    it("POST should not allow a request when the roles were modified", async (done) => {
        const brokenCookie = adminCookie.replace("mFkbWluIl19fX0", "nVzZXJBZG1pbiJdfX19");
        const response = await request.post("/users")
                                      .send({email: "tests@test.com", name: "API Tester"})
                                      .set("cookie", brokenCookie);

        expect(response.body).toHaveProperty("code", AuthorizationError.code);
        expect(response.status).toBe(403);
        done();
    });
});
