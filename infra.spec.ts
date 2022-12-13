// import { execSync } from "https://deno.land/std@0.160.0/node/child_process.ts";
import { Stub } from "https://deno.land/x/rhum@v2.0.0/mod.ts"
import { getCurrentDestination, getCurrentNamespace } from "./infra.ts";
import {
	assertEquals,
	// assertStrictEquals,
	// assertThrows,
} from "https://deno.land/std@0.160.0/testing/asserts.ts";



const denoRunStubErr =  (output: string)=> {
  const testout: Promise<Uint8Array> = new Promise((resolve) => { resolve(new TextEncoder().encode(output))});

  return {stderrOutput: ()=>{return testout}, close: ()=>{}}
}
const denoRunStubOut =  (output: string)=> {
  const testout: Promise<Uint8Array> = new Promise((resolve) => { resolve(new TextEncoder().encode(output))});

  return {output: ()=>{return testout}, close: ()=>{}}
}

// Deno.test("knows is logged in", async () => {
//   Stub(Deno, "run", denoRunStubErr(""));
// 	const result = await loggedIn();
// 	assertEquals(result, true);
// });

// Deno.test("knows is logged out", async () => {
//   Stub(Deno, "run", denoRunStubErr("Access key is expired"));
// 	const result = await loggedIn();
// 	assertEquals(result, false);
// });

Deno.test("check the destination", async () => {
  Stub(Deno, "run", denoRunStubOut("infra:do"));
  const result = await getCurrentDestination();
  assertEquals(result, "do")
})

Deno.test("check the current namespace", async ()=> {
  Stub(Deno, "run", denoRunStubOut("default"));
  const result = await getCurrentNamespace();
  assertEquals(result, "default");
})