import "ts-jest";
import { MongoRepository } from "typeorm";
import { ValidationError } from "../../../src/misc/error";
import Message from "../../../src/model/message";
import { MessageRepository } from "../../../src/model/messageRepository";
import { generateMessages } from "../../util/data/message.data";

const mongoRepositoryMock = new MongoRepository<Message>();
const messageRepository = new MessageRepository(mongoRepositoryMock);
const messages = generateMessages(60);
mongoRepositoryMock.save = jest.fn( (user) => user );

describe("The MessageRepository.save method", () => {
    it("should throw an error for invalid message not having a title", async ( done ) => {
        try {
            messages[0].title = null;
            await messageRepository.save(messages[0]);
        } catch ( error ) {
            if ( error instanceof ValidationError ) {
                expect((mongoRepositoryMock.save as any).mock.calls.length).toBe(0);
                return done();
            }
        }
        expect(true).toBe(false);
        done();
    });

    it("should throw an error for invalid message not having a to", async ( done ) => {
        try {
            messages[1].to = null;
            await messageRepository.save(messages[1]);
        } catch ( error ) {
            if ( error instanceof ValidationError ) {
                expect((mongoRepositoryMock.save as any).mock.calls.length).toBe(0);
                return done();
            }
        }
        expect(true).toBe(false);
        done();
    });

    it("should throw an error for invalid message not having a from", async ( done ) => {
        try {
            messages[2].from = null;
            await messageRepository.save(messages[2]);
        } catch ( error ) {
            if ( error instanceof ValidationError ) {
                expect((mongoRepositoryMock.save as any).mock.calls.length).toBe(0);
                return done();
            }
        }
        expect(true).toBe(false);
        done();
    });

    it("should call MongoRepository.save for a valid message", async ( done ) => {
        const message = await messageRepository.save(messages[3]);
        expect((mongoRepositoryMock.save as any).mock.calls.length).toBe(1);
        expect(message).toBe(messages[3]);
        done();
    });

});
