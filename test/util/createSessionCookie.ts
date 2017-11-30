import * as config from "config";
import cookieSession = require("cookie-session");
import * as express from "express";
import * as request from "supertest";

interface CookieUserOption {
    id?: string;
    roles?: string[];
}

/**
 * This function creates a signed cookie with the cookie session plugin.
 * It is meant to be used for API tests, without the need to do a real
 * server login.
 */
export async function createSessionCookie(userData: CookieUserOption): Promise<string> {
    if (!userData) {
        throw TypeError("Method expects session data.");
    }

    const app = express();
    app.use(cookieSession(config.get("cookie")));
    app.get("/", (req, res, next) => {
        req.session = { passport: {user: userData }} as any;
        next();
    });

    const response = await request(app).get("/");
    let cookie: string = response.header["set-cookie"][0];
    cookie = cookie.replace(/(session=[^;]+;).*(session.sig=[^;]+;).*/, "$1 $2");
    return Promise.resolve(cookie);
}
