import * as bodyParser from "body-parser";
import * as config from "config";
import * as cookies from "cookie-parser";
import cookieSession = require("cookie-session");
import * as express from "express";
import * as helmet from "helmet";
import * as passport from "passport";
import LoginController from "./controller/login";
import UserController from "./controller/user";
import { errorRequestHandler } from "./misc/error";
import UserRepository from "./model/userRepository";

export function createApp( userRepository: UserRepository): express.Application {

    const app: express.Application = express();
    const cookieConfig: any = config.get("cookie");
    cookieConfig.httpOnly = true;
    cookieConfig.expires = new Date( Date.now() + 24 * 60 * 60 * 1000 );

    app.use(helmet());
    app.use(bodyParser.json());
    app.use(cookies());
    app.use(cookieSession(cookieConfig));
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (!req.user) {
            req.user = {roles: ["public"]};
        }
        next();
    });

    app.use(passport.initialize());
    app.use(passport.session());

    app.use((new UserController(userRepository)).createRouter());
    app.use((new LoginController(userRepository)).createRouter());

    app.use(errorRequestHandler);

    return app;
}
