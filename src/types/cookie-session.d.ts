declare module "cookie-session";

/** 
 * 
 * This is to a bug with the tsc compiler
 * it is not happening on ts-node, maybe try in the future to remove it again
 * 
 * node_modules/@types/cookie-session/index.d.ts(10,15): error TS2430: Interface 'Request' incorrectly extends interface 'CookieSessionRequest'.
 * Types of property 'session' are incompatible.
 *   Type 'Session' is not assignable to type 'CookieSessionObject'.
 *     Property 'isChanged' is missing in type 'Session'.
 */