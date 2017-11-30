import "ts-jest";
import { getPermission, isAllowed, ROLES } from "../../../src/config/accesscontrol";
import { generateUsers } from "../../util/data/user.data";

const [user0] = generateUsers(1);

function testPermissionWithUser(options: any) {
    const permission = getPermission(options);
    return permission.filter(user0);
}

describe("Permission", () => {
    it("isAllowed", () => {
        const shouldBeAllowed = {role: ROLES.user, action: "read", own: true, resource: "user"};
        expect(isAllowed(shouldBeAllowed)).toBe(true);

        const shouldBeDenied = {role: ROLES.user, action: "delete", resource: "user"};
        expect(isAllowed(shouldBeDenied)).toBe(false);
    });
    it("getPermissions should allow a user to read his facebook, email and google", () => {
        const shouldBeAllowed = {role: ROLES.user, action: "read", own: true, resource: "user"};
        const filteredUser = testPermissionWithUser(shouldBeAllowed);
        expect(filteredUser).toHaveProperty("email");
        expect(filteredUser).toHaveProperty("facebook");
        expect(filteredUser).toHaveProperty("google");
    });

    it("getPermissions should deny normal users to read private data from others", () => {
        const shouldBeDenied = {role: ROLES.user, action: "read", resource: "user"};
        const filteredUser = testPermissionWithUser(shouldBeDenied);
        const {id, name} = user0;
        expect(filteredUser).toEqual({id, name});
    });
});
