import {mkdir,copyFile,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
const files = ["index.html","styles.css","manifest.webmanifest","sw.js","LICENSE",
  "src/app.js","src/core.js","src/storage.js","icons/pig.svg",
  "icons/icon-192.png","icons/icon-512.png","icons/icon-maskable.png"];
const hash = createHash("sha256");
for (const file of files) hash.update(file).update(await readFile(new URL("../"+file,import.meta.url)));
const version = hash.digest("hex").slice(0,16);
for (const file of files) {
  const source = new URL("../"+file,import.meta.url);
  const destination = new URL("../dist/"+file,import.meta.url);
  await mkdir(new URL(".",destination),{recursive:true});
  if (file === "sw.js") {
    const worker = (await readFile(source,"utf8")).replace(/"dev-\d+"/,JSON.stringify(version));
    await writeFile(destination,worker);
  } else await copyFile(source,destination);
}
console.log("Build statica "+version+" pronta in webapp/dist/. Nessuna pubblicazione effettuata.");
