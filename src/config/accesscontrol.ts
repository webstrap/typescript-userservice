import { AccessControl, Permission } from "accesscontrol";

export const enum ROLES {
    user = "user",
    userAdmin = "userAdmin",
    admin = "admin",
}

// tslint:disable:object-literal-sort-keys
const grantsObject = {
    [ROLES.admin]: {
        user: {
            "create:any": ["*"],
            "update:any": ["*"],
        },
    },
    [ROLES.userAdmin]: {
        user: {
            "create:any": ["*", "!roles"],
            "read:any": ["*"],
            "update:any": ["*", "!roles"],
            "delete:any": ["*"],
        },
    },
    [ROLES.user]: {
        user: {
            "read:own": ["id", "created", "email", "name", "facebook", "google"],
            "update:own": ["name"],
            "delete:own": ["*"],
        },
    },
    public: {
        user: {
            "read:any": ["id", "name"],
        },
    },
};

export const ac: AccessControl = new AccessControl(grantsObject);
ac.extendRole("user", "public")
    .extendRole("userAdmin", "user")
    .extendRole("admin", "userAdmin");
interface PermissionOptions {
    role: string | string[];
    action: string;
    resource: string;
    own?: boolean;
}

export function getPermission(options: PermissionOptions) {
    const query = ac.can(options.role);
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

export function mapIdToString(data: any) {
    if (data instanceof Object && data.id && data.id.toHexString) {
        data.id = data.id.toHexString();
        return data;
    }
    if (data instanceof Array && data.length > 0) {
        data.map((element) => {
            if (element instanceof Object && element.id && element.id.toHexString) {
                element.id = element.id.toHexString();
             }
        });
        return data;
    }
    return data;
}

/**
 * Convinience wrapper for permission.filter and id.toString();
 */
export function filter(permission: Permission, data: any) {
    return permission.filter(mapIdToString(data));
}
