import {readdir,readFile} from "node:fs/promises";
import assert from "node:assert/strict";
const expected = ["icons/icon-192.png","icons/icon-512.png","icons/icon-maskable.png","icons/pig.svg",
  "index.html","manifest.webmanifest","src/app.js","src/core.js","src/storage.js","styles.css","sw.js"];
const root = new URL("../dist/",import.meta.url);
async function walk(prefix="") {
  const result = [];
  for (const entry of await readdir(new URL(prefix,root),{withFileTypes:true})) {
    assert(!entry.isSymbolicLink(),"Link non ammesso nella build");
    if(entry.isDirectory()) result.push(...await walk(prefix+entry.name+"/"));
    else result.push(prefix+entry.name);
  }
  return result;
}
const actual = await walk();
assert.deepEqual(actual.sort(),expected.sort(),"La build deve contenere soltanto gli asset approvati");
for(const file of expected.filter(file=>!file.endsWith(".png"))) {
  const content=await readFile(new URL(file,root),"utf8");
  assert(!content.includes("/Users/"),"Percorso personale nella build: "+file);
}
const worker=await readFile(new URL("sw.js",root),"utf8");
assert.match(worker,/const CACHE = PREFIX \+ "[a-f0-9]{16}";/,"Cache release priva di hash");
const manifest=JSON.parse(await readFile(new URL("manifest.webmanifest",root),"utf8"));
assert.equal(manifest.start_url,"./");
assert.equal(manifest.scope,"./");
console.log("Build verificata: 11 asset, percorsi relativi, cache versionata e nessun file estraneo.");
