import { addUserGrant, addGroupGrant, searchAllUsers, searchRole, searchUser, searchGroup, validateArgs, validateAccess } from "./infra.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.4/command/mod.ts";


new Command()
  .name("kubectl-infra")
  .arguments("[user:string] [role:string]")
  .action(async ()=>{
    let output = "";
    if (await validateAccess()) {
    const { user, group, role} = await validateArgs(Deno.args);
    if (Deno.args.length === 2) {
      if (user.length>0) {
      output = await addUserGrant(user, role);
      } else if (group.length>0 ) {
        output = await addGroupGrant(group, role);
      }
    } else if (Deno.args.length === 1) {
      if (user.length > 0) {
        output = await searchUser(user);
      } else if (role.length > 0) {
        output = searchRole(role);
      } else if (group.length > 0) {
        output = await searchGroup(group);
      }
    } else if (Deno.args.length === 0) {
      searchAllUsers();
    } else {
      console.log("Use Infra to run the command");
    }
    console.log(output);
  } else {
    console.log("You aren't configured to grant access with Infra")
  }
  
  })
  .parse(Deno.args);