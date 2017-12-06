
import {  NextFunction, Request, Response } from "express";
import { Router } from "express";
import * as passport from "passport";
import { configurePassport } from "../config/passport";
import { InvalidSessionError } from "../misc/error";
import User from "../model/user";
import UserRepository from "../model/userRepository";

export default class LoginController {

    private userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    public createRouter(): Router {
        configurePassport(this.connectFindOrCreate.bind(this));

        const router = Router();
        router.get("/login/google", passport.authenticate("google", { scope: ["email"] }));
        router.get("/login/google/callback",
            passport.authenticate("google", { failureRedirect: "/login" }),
            this.getGoogleCallbackRedirect.bind(this));
        router.get("/logout", this.getLogout.bind(this));
        return router;
    }

    public async connectFindOrCreate( req: Request,
                                      accessToken: string,
                                      refreshToken: string,
                                      profile: any,
                                      done: (err: Error, user: User) => void ) {
        let user: User;
        // connect google with the user in the current session
        if ( req.user && req.user.id ) {
            user = await this.userRepository.findOneById(req.user.id);
            if (!user) {
                return done(new InvalidSessionError("user not found"), null);
            }
            user.google = profile.id;
            this.userRepository.save(user);
        }
        // otherwise try to find an existing user for login
        if ( !user ) {
            user = await this.userRepository.findOne({ google: profile.id });
        }
        // otherwise try to find an existing user for login
        if ( !user ) {
            user = await this.userRepository.findOne({ email: profile.emails[0].value });
        }
        // or create a new user
        if ( !user ) {
            user = new User( { google: profile.id, email: profile.emails[0].value });
            await this.userRepository.save(user);
            req.session.newUser = true;
        }
        done(null, user);
    }

    /**
     * Logout of the current user and redirect to the homepage
     */
    public getLogout(req: Request, res: Response, next: NextFunction): void {
        req.logout();
        res.redirect("/");
    }

    public getGoogleCallbackRedirect(req: Request, res: Response, next: NextFunction): void {
        if (req.user && req.user.id) {
            res.location(`/${User.resourceName}/${req.user.id}` );
        }
        let status = 302;
        if ( req.session.newUser ) {
            status = 201;
            delete req.session.newUser;
        }
        res.sendStatus(status);
        next();
    }
}
