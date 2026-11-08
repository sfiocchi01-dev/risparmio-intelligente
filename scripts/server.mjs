import http from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(fileURLToPath(new URL(process.env.SERVE_DIST === "1" ? "../dist/" : "../",import.meta.url)));
const port=Number(process.env.PORT ?? 4173);
const prefix=process.env.BASE_PATH ?? "";
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".webmanifest":"application/manifest+json"};
http.createServer(async(req,res)=>{
  try {
    let path=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    if(prefix && !path.startsWith(prefix+"/")) { res.writeHead(302,{Location:prefix+"/"});res.end();return; }
    path=path.slice(prefix.length);
    let file=resolve(root,"."+path);
    if(file !== root && !file.startsWith(root+sep)) throw new Error("Invalid path");
    if((await stat(file)).isDirectory()) file=resolve(file,"index.html");
    const data=await readFile(file);
    res.writeHead(200,{"Content-Type":mime[extname(file)]??"application/octet-stream","Cache-Control":"no-cache","X-Content-Type-Options":"nosniff"});
    res.end(data);
  } catch {res.writeHead(404);res.end("Not found");}
}).listen(port,"127.0.0.1",()=>console.log("Risparmio intelligente: http://localhost:"+port+prefix+"/"));
