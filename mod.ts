import {
  addGroupGrant,
  addUserGroup,
  addUserGrant,
  searchAllUsers,
  searchGroup,
  searchRole,
  searchUser,
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
    const hasuser = user.length > 0;
    const hasrole = role.length > 0;
    const hasgroup = group.length > 0
    if (await validateAccess()) {
      if (hasuser && hasrole) {
        output = await addUserGrant(user, role);
      } else if (hasuser && hasgroup) {
        output = await addUserGroup(user, group);
      } else if (hasgroup && hasrole) {
        output = await addGroupGrant(group, role);
      } else if (hasuser) {
        output = await searchUser(user);
      } else if (hasrole) {
        output = searchRole(role);
      } else if (hasgroup) {
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
