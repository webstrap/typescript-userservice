import "ts-jest";
import { MongoRepository } from "typeorm";
import { ValidationError } from "../../../src/misc/error";
import User from "../../../src/model/user";
import UserRepository from "../../../src/model/userRepository";
import { generateUsers } from "../../util/data/user.data";

const mongoRepositoryMock = new MongoRepository<User>();
const userRepository = new UserRepository(mongoRepositoryMock);
const users = generateUsers(60);
mongoRepositoryMock.save = jest.fn( (user) => user );

describe("The UserRepository.save method", () => {
    it("should throw an error for invalid users having no email", async ( done ) => {
        try {
            await userRepository.save(new User({facebook: "123"}));
        } catch ( error ) {
            if ( error instanceof ValidationError ) {
                expect((mongoRepositoryMock.save as any).mock.calls.length).toBe(0);
            }
        }
        done();
    });

    it("should throw an error for invalid users having an invalid email address", async ( done ) => {
        try {
            await userRepository.save(new User({email: "this.isNoEmail@"}));
        } catch ( error ) {
            if ( error instanceof ValidationError ) {
                expect((mongoRepositoryMock.save as any).mock.calls.length).toBe(0);
            }
        }
        done();
    });

    it("should call MongoRepository.save for a valid user", async ( done ) => {
        const user = await userRepository.save(users[0]);
        expect((mongoRepositoryMock.save as any).mock.calls.length).toBe(1);
        expect(user).toBe(users[0]);
        done();
    });

});

describe("The UserRepository.findOneOrCreate method", () => {
    it("should return an existing user when the email is found", async ( done ) => {
        mongoRepositoryMock.findOne = () => Promise.resolve<User>(users[0]);
        const user = await userRepository.findOneOrCreate({email: users[0].email});
        expect(user).toBe(users[0]);
        done();
    });
    it("should create a new user if the email does not exist", async ( done ) => {
        mongoRepositoryMock.findOne = () => Promise.resolve<User>(null);
        const user = await userRepository.findOneOrCreate({email: "xxx@new.com"});
        expect(user.email).toBe("xxx@new.com");
        done();
    });
});
