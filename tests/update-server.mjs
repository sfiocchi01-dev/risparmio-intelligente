// Local-only fixture to exercise real service worker release changes.
// Not included in dist/ and never used by the deployed app.
import http from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(fileURLToPath(new URL("../",import.meta.url)));
const prefix="/update-test";
let release="A";
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".webmanifest":"application/manifest+json",".png":"image/png",".svg":"image/svg+xml"};
http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,"http://localhost");
    if(req.method==="POST" && url.pathname===prefix+"/__test/release") {
      const value=url.searchParams.get("version");
      if(!/^[A-Z]$/.test(value??"")) {res.writeHead(400);res.end();return;}
      release=value;res.writeHead(200);res.end(release);return;
    }
    if(req.method!=="GET" || !url.pathname.startsWith(prefix+"/")) throw new Error();
    let file=resolve(root,"."+decodeURIComponent(url.pathname.slice(prefix.length)));
    if(file!==root && !file.startsWith(root+sep)) throw new Error();
    if((await stat(file)).isDirectory())file=resolve(file,"index.html");
    let data=await readFile(file);
    if(file===resolve(root,"sw.js")) data=Buffer.from(data.toString().replace(/"dev-\d+"/,JSON.stringify("test-"+release)));
    res.writeHead(200,{"Content-Type":mime[extname(file)]??"application/octet-stream","Cache-Control":"no-store"});
    res.end(data);
  }catch{res.writeHead(404);res.end();}
}).listen(4180,"127.0.0.1",()=>console.log("Fixture aggiornamenti: http://localhost:4180/update-test/"));
