#!/usr/bin/env node
/**
 * SEO F144 — build synthetic example.test fixture for a REAL Nginx container.
 * This is not a generator of customer SEO pages or production nginx rules.
 */
import {mkdir,chmod,writeFile,realpath} from 'node:fs/promises';
import {join,resolve,sep,isAbsolute} from 'node:path';
import {fingerprintCompiledSite} from
  '../../src/compiled-site-fingerprint.mjs';

const ORIGIN='https://example.test/';
function html(route,lang,heading,copy){
 const canonical=new URL(route,ORIGIN).href;
 return '<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8">'+
 '<title>'+heading+'</title>'+
 '<meta name="description" content="Original sample service documentation for staging verification">'+
 '<meta name="robots" content="index,follow">'+
 '<meta property="og:url" content="'+canonical+'">'+
 '<link rel="canonical" href="'+canonical+'">'+
 '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>'+
 '</head><body><h1>'+heading+'</h1><p>'+copy+'</p></body></html>';
}
function nginx(digest,invalidBody){
 const wrong=invalidBody?
   '    location = /en/ { try_files /index.html =404; }\n':'';
 return `worker_processes 1;
pid /tmp/nginx.pid;
error_log /dev/stderr warn;
events { worker_connections 256; }
http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  access_log off;
  sendfile off;
  gzip off;
  client_body_temp_path /tmp/client-body;
  proxy_temp_path /tmp/proxy;
  fastcgi_temp_path /tmp/fastcgi;
  uwsgi_temp_path /tmp/uwsgi;
  scgi_temp_path /tmp/scgi;
  server {
    listen 8080 default_server;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    add_header X-Imagine-SEO-Build-SHA256 "${digest}" always;
    if ($request_uri = "/en-us/") { return 301 https://example.test/en/; }
    if ($host = "www.example.test") { return 301 https://example.test$request_uri; }
    if ($http_x_forwarded_proto = "http") { return 301 https://example.test$request_uri; }
${wrong}    location / { try_files $uri $uri/ =404; }
  }
}
`;
}
function legacy(){
 return {
   sourceType:'operator_supplied_legacy_urls_unverified',
   siteDomain:'example.test',canonicalOrigin:ORIGIN,
   legacyUrls:[
     'http://www.example.test/',
     'https://www.example.test/en-us/'
   ],
   targetRoutes:['/','/en/'],
   candidates:[
     {fromUrl:'http://www.example.test/',toPath:'/',status:301},
     {fromUrl:'https://www.example.test/en-us/',toPath:'/en/',status:301}
   ]
 };
}
function gsc(){
 const row=(url,clicks,impressions)=>({
   keys:[url],clicks,impressions,
   ctr:impressions?clicks/impressions:0,position:15
 });
 return {
   sourceType:'operator_supplied_gsc_pages_unverified',
   property:'sc-domain:example.test',canonicalOrigin:ORIGIN,
   startDate:'2026-10-17',endDate:'2026-11-13',
   dataState:'final',dimensions:['page'],
   rows:[
     row('http://www.example.test/',2,100),
     row('https://www.example.test/en-us/',1,12),
     row('https://example.test/',0,7),
     row('https://example.test/en/',1,14)
   ],hasMore:false
 };
}
async function main(){
 const [root]=process.argv.slice(2);
 if(process.argv.length!==3||typeof root!=='string'||
    !isAbsolute(root)||root.length>2048)
   throw Error('SEO F144: synthetic absolute fixture path required');
 const folder=resolve(root);
 const checkout=await realpath(process.cwd());
 if(folder===checkout||folder.startsWith(checkout+sep))
   throw Error('SEO F144: do not write synthetic fixtures inside checkout');
 await mkdir(folder,{recursive:true});
 await chmod(folder,0o755);
 const dist=join(folder,'dist');
 await mkdir(join(dist,'en'),{recursive:true});
 await chmod(dist,0o755);
 await chmod(join(dist,'en'),0o755);
 await writeFile(join(dist,'index.html'),html('/','pt-BR',
  'Imagine Original Services','Sample regional editorial content in Portuguese'),{
    flag:'wx',mode:0o644
  });
 await writeFile(join(dist,'en','index.html'),html('/en/','en',
  'Imagine International Services','Independent original international editorial content'),{
    flag:'wx',mode:0o644
  });
 await writeFile(join(dist,'robots.txt'),
  'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'sitemap.xml\n',{
    flag:'wx',mode:0o644
  });
 await writeFile(join(dist,'sitemap.xml'),
  '<urlset><url><loc>'+ORIGIN+'</loc></url>'+
  '<url><loc>'+ORIGIN+'en/</loc></url></urlset>',{
    flag:'wx',mode:0o644
  });
 await writeFile(join(folder,'legacy-private.json'),JSON.stringify(legacy()),{
   flag:'wx',mode:0o600
 });
 await writeFile(join(folder,'gsc-private.json'),JSON.stringify(gsc()),{
   flag:'wx',mode:0o600
 });
 const digest=(await fingerprintCompiledSite(dist)).sha256;
 await writeFile(join(folder,'nginx-valid.conf'),nginx(digest,false),{
   flag:'wx',mode:0o644
 });
 // The BAD fixture deliberately serves PT HTML from /en/ while claiming
 // the correct build digest, to prove GET parity detects the mismatch.
 await writeFile(join(folder,'nginx-stale-content.conf'),nginx(digest,true),{
   flag:'wx',mode:0o644
 });
 process.stdout.write('SEO F144: isolated synthetic Nginx staging fixture prepared\n');
}
main().catch(()=>{
 process.stderr.write('SEO F144: synthetic fixture cannot be created safely\n');
 process.exitCode=1;
});
