import * as config from "config";
import * as passport from "passport";
import { Strategy } from "passport-google-oauth20";

export function configurePassport(userCreateCB: () => void ) {

    const googleConfig: any = config.get("passport.google");
    googleConfig.passReqToCallback = true;
    passport.use(new Strategy(googleConfig, userCreateCB));

    passport.deserializeUser(async (user, done) => {
        done(null, user);
    });

    passport.serializeUser(({id, roles}, done) => {
        done(null, {id: id.toString, roles});
    });
}
