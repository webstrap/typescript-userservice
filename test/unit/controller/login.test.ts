import * as request from "supertest";
import "ts-jest";
import { createApp } from "../../../src/app";
import UserRepository from "../../../src/model/userRepository";
import { generateUsers } from "../../util/data/user.data";

const userRepositoryMock = new UserRepository(null);
const users = generateUsers(60);
userRepositoryMock.find = (options) => Promise.resolve(users);
const app = createApp( userRepositoryMock );

describe("The UserController for fetching a single user", () => {
  it("should return only name if a user is not logged in", (done) => {
      request(app).get("/users").expect(200, done);
    });
});
