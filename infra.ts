import {isEmail} from 'https://deno.land/x/deno_validator@v0.0.5/mod.ts';

const cache: Array<string> = [];
let groupcache: Array<string> =[];
let rolecache: Array<string> =[];

export const searchUser = async (user: string) => {
  let output = "";
  let nsroles = "";
  let clusterroles = "";
  const currentDest = await getCurrentDestination();
  const currentNS = await getCurrentNamespace();
    const p = Deno.run({
      cmd: ["infra", "grants", "list", "--destination", currentDest, "--user", user ], stdout: "piped"
    })
    const _pout = new TextDecoder().decode(await p.output()).trim().split('\n').slice( 1).map(line => line.trim().split(/\s+/g)).forEach(item => {
      if (item[2] === `${currentDest}.${currentNS}`) {
        nsroles += nsroles.length === 0 ? item[1] : `, ${item[1]}`;
      } else {
        clusterroles += clusterroles.length === 0 ? item[1] : `, ${item[1]}`;
      }
    });
    const nsoutput = nsroles.length > 0 ? `${user} has the following roles for this namespace (${currentNS}): ${nsroles}` : `${user} has no roles for this namespace`;
    const clusteroutput = clusterroles.length > 0 ? `${user} has the following roles for this cluster: ${clusterroles}` : `${user} has no roles for this cluster`;
    output = `${nsoutput}\n${clusteroutput}`;
  return output;
}

export const searchGroup = async (group: string) => {
  const dest = await getCurrentDestination();
  const ns = await getCurrentNamespace();
  let nsgrants = "";
  let clustergrants = "";
  const u = Deno.run({
    cmd: ["infra", "groups", "list", "--no-truncate"], stdout: "piped"
  });
  const g = Deno.run({
    cmd: ["infra", "grants", "list", "--group", group ], stdout: "piped"
  })
  const uout = new TextDecoder().decode(await u.output()).trim().split('\n').slice(1).map(line => line.trim().split(/\s{2,}/g)).filter(line => line[0] === group)[0][1].split(', ');
  new TextDecoder().decode(await g.output()).trim().split('\n').slice(1).map(line => line.trim().split(/\s{2,}/g)).map(line => {
    if (line[2] === `${dest}.${ns}`) {
      nsgrants += nsgrants.length === 0 ? `Group ${group} has the following roles on this namespace (${ns}): ${line[1]} `: `, ${line[1]}`;
    } else if (line[2] === dest) {
      clustergrants += clustergrants.length === 0 ? `Group ${group} has the following roles across the cluster: ${line[1]} ` : `, ${line[1]}`;
    }
  });
  const users = uout[0]!== "0" ? `Users in group ${group}: ${uout.join(', ')}` : `No users in group ${group}`;
  const nsout = nsgrants.length > 0 ? nsgrants : `Group ${group} has no grants on this namespace (${ns})`;
  const clusterout = clustergrants.length > 0 ? clustergrants : `Group ${group} has no grants on this cluster`;
  const grants = `${nsout}\n${clusterout}`;  

  return `${users}\n${grants}`;
}
export const searchRole = (role: string) => {
  return role;
}

export const searchAllUsers = () => {

}

export const validateArgs = async  (args: Array<string>) => {
  let user = "";
  let group ="";
  let role = "";
  const whatsleft = ['user', 'group', 'role'];
  

  for (let i=0; i < args.length; i++) {
    const arg = args[i]

//  args.forEach(async (arg) => {
    if (isEmail(arg, {}) && whatsleft.includes('user')){
      const i = whatsleft.indexOf(arg);
      user = arg;
      whatsleft.splice(i, 1);   
    } else if (await isGroup(arg) && !(await isRole(arg)) && whatsleft.includes('group')) {
      group = arg;
      whatsleft.splice(whatsleft.indexOf('group'), 1);
    } else if ((await isRole(arg)) && !(await isGroup(arg)) && whatsleft.includes('role')) {
      role = arg;
      whatsleft.splice(whatsleft.indexOf('role'), 1);
    } else {
      console.log('Unable to determine arguments. Use Infra command instead.');
    }

    
    
  }
  return { user,  group, role}

}

export const validateAccess = async () => {
  let access = false;
  let isLoggedIn = false;
  try {
    let useremail = "";
    const p = Deno.run({
      cmd: ["infra", "info"], stdout: "piped", stderr: "piped"
    });
  let poutput = new TextDecoder().decode(await p.output())
  if(!poutput.includes('Access key is expired')) {
    poutput = poutput.trim().split('\n')[1].trim().split(': ')[1];
    useremail = poutput.split(' ')[0];
    isLoggedIn = true
  }

  const hasDest = await getCurrentDestination();
  const hasNS = await getCurrentNamespace();
  const q = Deno.run({
    cmd: ['infra', 'grants', 'list', '--destination', 'infra', '--user', useremail,  '--role', 'admin'], stdout:"piped", stderr:"piped"
  });
  const qoutput = new TextDecoder().decode(await q.output());
  const isAdmin = qoutput.length > 0;
  if (isLoggedIn && isAdmin && hasDest && hasNS) {
    access = true;
  }
} catch {
  // 
}

  return access;
}

const isGroup = async(test: string) => {
  let output =false;
  let poutput: Array<string> = [];
  if (cache.includes(`${test}isGroup`) ) {
    output = true;
  } else if (!cache.includes(`${test}isntGroup`)){
  if (groupcache.length === 0) {
  const p = Deno.run({
    cmd: ["infra", "groups", "list"], stdout: "piped"
  });
   poutput = new TextDecoder().decode(await p.output()).trim().split('\n').splice(1).map(val => val.trim().split(/\s{2,}/)[0]);
  groupcache = poutput;
}
  if (groupcache.includes(test)) {
    output = true;
    cache.push(`${test}isGroup`);
  } else {
    cache.push(`${test}isntGroup`);
  }
}
  return output
}

const isRole = async(test: string) => {
  let output =false
  let poutput: Array<string> = [];
  if (cache.includes(`${test}isRole`)) {
    output = true;
  } else if (!cache.includes(`${test}isntRole`)) {
    if (rolecache.length === 0) {
    const p = Deno.run({
    cmd: ['kubectl', 'get', 'clusterroles', '-l', 'app.infrahq.com/include-role=true', '-o', 'name'], stdout: 'piped'
  });
   poutput = new TextDecoder().decode(await p.output()).trim().split('\n').map(role=>role.substring(role.indexOf('/')+1)).concat(['cluster-admin', 'admin', 'edit', 'view']);
   rolecache = poutput;
}
  if (rolecache.includes(test)) {
    output = true;
    cache.push(`${test}isRole`);
  } else {
    cache.push(`${test}isntRole`);
  }
}
  return output;
}
export const addGroupGrant = async (group: string, role:string) => {
  const destns = `${await getCurrentDestination()}.${await getCurrentNamespace()}`;

  const cmd = ["infra", "grants", "add", "-g", group, destns, "--role", role]
  return await addGrant(cmd);
}

export const addUserGrant = async (user: string, role:string) => {
  const destns = `${await getCurrentDestination()}.${await getCurrentNamespace()}`;

  const cmd = ["infra", "grants", "add", user, destns, "--role", role]
  return await addGrant(cmd);
}
export const addGrant = async (cmd: Array<string>) => {
	let output = "";
  try{
    const p = Deno.run({
      cmd: cmd, stdout: "piped", stderr: "piped"
    });
    const perror = new TextDecoder().decode(await p.stderrOutput());
    
    const poutput = new TextDecoder().decode(await p.output());
    if (perror.includes("is not a known role for destination")) {
      output = "Unknown role";
    } else if (poutput.includes("unknown user")) {
      output = "Unknown user";
    } else if (poutput.includes("not connected")) {
      output ="Couldn't determine the correct destination";
    } else if (poutput.includes("Created grant")) {
      output = "Grant successfully created";
    } else if (poutput.includes("already exists")) {
      output = "Grant already exists";
    } else {
      output = "other";
    }
  
  } catch(err) {
    if (err.message === "no destination") {
      console.log("Not using an Infra Destination")
    }
  }
  
 
	return output;
};

export const getCurrentDestination = async () => {
  const p = Deno.run({
    cmd: ["kubectl", "config", "current-context"], 
    stdout: "piped"
  });
  let destination = "";
  const poutput = new TextDecoder().decode(await p.output()).replaceAll(/\n/g, "");
  if (poutput.startsWith("infra")) {
    destination = poutput.split(":")[1] || "";
  } else {
    console.log("You aren't logged into a cluster with Infra")
    throw new Error("no destination");
  }
  return destination
}
export const getCurrentNamespace = async () => {
  const p = Deno.run({
    cmd: ["kubectl", "ns", "-c"],
    stdout: "piped"
  });
  const poutput = new TextDecoder().decode(await p.output()).replaceAll(/\n/g, "");
  const namespace = poutput;

  return namespace;
}

export const getCurrentDestinationNamespace = async () => {
  return `${await getCurrentDestination()}.${await getCurrentNamespace()}`
}