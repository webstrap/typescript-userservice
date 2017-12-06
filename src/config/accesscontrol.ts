import { AccessControl, Permission } from "accesscontrol";
import { ObjectId } from "bson";
import Message from "../model/message";
import User from "../model/user";

export const enum ROLES {
    public = "public",
    user = "user",
    userAdmin = "userAdmin",
    admin = "admin",
}
/**
 * Important note: in this grants you can define create, update and delete permissions on a attribute level.
 *
 * If you give someone create or delete with a * it would mean one can create that resource. If you substract
 * an attribute, you can still create a resource, but don't set that attribute.
 * If you don't give *, but just one attribute, he is only allowed to set this attribute on an existing resource,
 * but not e.g. update that attribute.
 *
 * E.g. with create resource "user": ["*", "!roles"] you can create a user but not set roles on it.
 * with create own resource "user": ["name"] you can on your own user, set a username, if there is none set yet.
 *
 * TODO: it seems the grants are not powerful enough to reflect more complex requirements, since you need to check
 * on each change of the permission, where this resource is checked in which scope. On the other hand I think permission
 * management is always very application specific, so it might be acceptable, to have some parts what is modifyable
 * controlled e.g. on the model level (timecreated), some part in the controller and some part in the grants.
 */
function getGrants() {
     // tslint:disable:object-literal-sort-keys
     return {
        [ROLES.admin]: {
            [User.resourceName]: {
                "create:any": ["*"],
                "update:any": ["*"],
            },
            [Message.resourceName]: {
                "read:any": ["id"],
                "delete:any": ["*"],
            },
        },
        [ROLES.userAdmin]: {
            [User.resourceName]: {
                "create:any": ["*", "!roles"],
                "read:any": ["*"],
                "update:any": ["*", "!roles"], // with that permission you can change the name of any user as well
                "delete:any": ["*"],
            },
        },
        [ROLES.user]: {
            [User.resourceName]: {
                "create:own": ["name"], // this allows a user to set a name if it is not set
                "read:own": ["id", "created", "email", "name", "facebook", "google"],
                "delete:own": ["*"],
            },
            [Message.resourceName]: {
                "create:any": ["to", "title", "message"],
                "read:own": ["*"],
                "delete:own": ["*"],
            },
        },
        [ROLES.public]: {
            [User.resourceName]: {
                "read:any": ["id", "name"],
            },
        },
    };
}

export function getPermission(options: PermissionOptions) {
    if (!options || !options.resource || !options.action) {
        throw new Error("resource and action are required for permission checks");
    }
    const query = ac().can(options.role);
    switch (options.action) {
        case "create":
            return options.own ? query.createOwn(options.resource) : query.create(options.resource);
        case "read":
            return options.own ? query.readOwn(options.resource) : query.read(options.resource);
        case "update":
            return options.own ? query.updateOwn(options.resource) : query.update(options.resource);
        case "delete":
            return options.own ? query.deleteOwn(options.resource) : query.delete(options.resource);
        default:
            throw new Error(`action is no valid option: ${options.action}`);
    }
}

export function isAllowed(options: PermissionOptions) {
    return getPermission(options).granted;
}

/**
 * Convinience wrapper for permission.filter and id.toString();
 */
export function filter(permission: Permission, data: any) {
    return permission.filter(mapIdToString(data));
}

function createAccessControl(): AccessControl {
    const createdAc = new AccessControl(getGrants());
    createdAc.extendRole(ROLES.user, ROLES.public)
    .extendRole(ROLES.userAdmin, ROLES.user)
    .extendRole(ROLES.admin, ROLES.userAdmin);
    return createdAc;
}

let acInstance: AccessControl;
function ac(): AccessControl {
    if (!acInstance) {
        acInstance = createAccessControl();
    }
    return acInstance;
}
interface PermissionOptions {
    role: ROLES | ROLES[];
    action: string;
    resource: string;
    own ?: boolean;
}

/**
 * Deep map recursively all bson.ObjectId's toHexString().
 * This is required to prevent the express handler to send it as
 * {"_bsontype": "ObjectID", "id": {"data": [90, 57, ..], "type": "Buffer"}}
 * @param data any
 */
function mapIdToString(data: any) {
    if ( typeof data === "object") {
        Object.keys(data).map( (value: any) => {
            if (data[value] instanceof ObjectId) {
                data[value] = data[value].toHexString();
                return;
            }
            if (typeof data[value] === "object") {
                mapIdToString(data[value]);
            }
        });
    }
    return data;
}
