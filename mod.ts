import {
	addUserGrant,
	addGroupGrant,
	searchAllUsers,
	searchRole,
	searchUser,
	searchGroup,
	validateAccess,
} from "./infra.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.4/command/mod.ts";

new Command()
	.name("grants")
	.option("-u, --user <user:string>", "user email address")
	.option("-r, --role <role:string>", "role name")
	.option("-g, --group <group:string>", "group name")
	.action(async ({ user = "", group = "", role = "" }) => {
		let output = "";
		if (await validateAccess()) {
			if (user.length > 0 && role.length > 0) {
				output = await addUserGrant(user, role);
			} else if (group.length > 0 && role.length > 0) {
				output = await addGroupGrant(group, role);
			} else if (user.length > 0) {
				output = await searchUser(user);
			} else if (role.length > 0) {
				output = await searchRole(role);
			} else if (group.length > 0) {
				output = await searchGroup(group);
			} else {
				searchAllUsers();
			}

			console.log(output);
		} else {
			console.log("You aren't configured to grant access with Infra");
		}
	})
	.parse(Deno.args);
