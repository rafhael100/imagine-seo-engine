/**
 * SEO F145 — render an Nginx configuration for an isolated, loopback-only
 * operator staging environment from EXACT F127 301 mappings and a REAL
 * compiled build that already passed F128.
 *
 * This function returns PRIVATE configuration source. Never write it to a
 * GitHub PR, publish it, or print it to a public log. No network or deploy.
 */
import {reviewLegacyOriginAndLocaleRedirects} from
  '../../src/legacy-origin-locale-redirect-review.mjs';
import {reviewCompiledLegacyRedirectTargets} from
  '../../src/legacy-redirect-built-site-gate.mjs';
import {fingerprintCompiledSite} from
  '../../src/compiled-site-fingerprint.mjs';

const MAX_ROUTES=80;
const SAFE_PATH=/^\/[a-z0-9/._~-]*$/;
function exact(value,fields){
  if(!value||typeof value!=='object'||Array.isArray(value)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(value)))return false;
  const keys=Reflect.ownKeys(value);
  return keys.length===fields.length&&keys.every(k=>{
    const d=Object.getOwnPropertyDescriptor(value,k);
    return typeof k==='string'&&fields.includes(k)&&d?.enumerable===true&&
      Object.hasOwn(d,'value');
  });
}
export async function renderIsolatedNginxStagingConfig(input){
  if(!exact(input,['migrationInput','buildDirectory'])||
     typeof input.buildDirectory!=='string'||input.buildDirectory.length>2048)
    throw Error('SEO F145: exact bounded private input required');
  const old=reviewLegacyOriginAndLocaleRedirects(input.migrationInput);
  if(old.reviewStatus==='blocked')
    throw Error('SEO F145: unresolved legacy redirect manifest');
  const plan=input.migrationInput;
  if(plan.candidates.length===0||plan.candidates.length>MAX_ROUTES||
     plan.targetRoutes.length===0||plan.targetRoutes.length>MAX_ROUTES)
    throw Error('SEO F145: at most 80 fully reviewed routes per staging batch');
  for(const route of [
    ...plan.legacyUrls.map(u=>new URL(u).pathname),
    ...plan.targetRoutes,
    ...plan.candidates.map(c=>c.toPath)
  ]){
    if(route.length>512||!SAFE_PATH.test(route))
      throw Error('SEO F145: unsafe or case-sensitive route for Nginx map');
  }
  const compiled=await reviewCompiledLegacyRedirectTargets({
    planInput:plan,buildDirectory:input.buildDirectory
  });
  if(compiled.reviewStatus==='blocked')
    throw Error('SEO F145: compiled build did not meet F128');
  const digest=await fingerprintCompiledSite(input.buildDirectory);
  const home=plan.siteDomain,canonical=plan.canonicalOrigin.slice(0,-1);
  const aliases=plan.candidates.map(c=>{
    const src=new URL(c.fromUrl);
    const key=src.protocol.slice(0,-1)+'|'+src.hostname+'|'+src.pathname;
    const target=canonical+c.toPath;
    // Both are safe for double-quoted Nginx map arguments after F127 +
    // reduced STRICT ASCII route policy. No $, quotes, semicolons, spaces.
    return '    "'+key+'" "'+target+'";';
  });
  const config=[
    'worker_processes 1;',
    'pid /tmp/nginx.pid;',
    'error_log /dev/stderr warn;',
    'events { worker_connections 256; }',
    'http {',
    '  include /etc/nginx/mime.types;',
    '  default_type application/octet-stream;',
    '  access_log off;',
    '  sendfile off;',
    '  gzip off;',
    '  client_body_temp_path /tmp/client-body;',
    '  proxy_temp_path /tmp/proxy;',
    '  fastcgi_temp_path /tmp/fastcgi;',
    '  uwsgi_temp_path /tmp/uwsgi;',
    '  scgi_temp_path /tmp/scgi;',
    '  map "$http_x_forwarded_proto|$host|$request_uri" $seo_f145_redirect {',
    '    default "";',
    ...aliases,
    '  }',
    '  map "$http_x_forwarded_proto|$host" $seo_f145_allowed_origin {',
    '    default 0;',
    '    "https|'+home+'" 1;',
    '    "|127.0.0.1" 1;',
    '  }',
    '  server {',
    '    listen 8080 default_server;',
    '    server_name _;',
    '    root /usr/share/nginx/html;',
    '    index index.html;',
    '    add_header X-Imagine-SEO-Build-SHA256 "'+digest.sha256+'" always;',
    '    if ($request_method !~ ^(GET|HEAD)$) { return 405; }',
    '    if ($seo_f145_redirect != "") { return 301 $seo_f145_redirect; }',
    '    if ($seo_f145_allowed_origin = 0) { return 444; }',
    '    location / { try_files $uri $uri/ =404; }',
    '  }',
    '}',
    ''
  ].join('\n');
  return {
    privateConfig:config,
    digest:digest.sha256,
    review:{
      contractVersion:'seo-f145-offline-private-nginx-staging-render-v1',
      reviewStatus:'human_staging_proxy_review_required',
      compiledTargetRoutes:plan.targetRoutes.length,
      redirectsRendered:aliases.length,
      realStaticFilesHashed:digest.filesHashed,
      localBuildShaComputed:true,
      generatedConfigIsPrivate:true,
      networkPerformed:false,
      stagingConfigurationApplied:false,
      liveHttpOrTlsVerified:false,
      productionReleaseAuthorized:false,
      releaseStatus:'HOLD_NGINX_SYNTAX_STAGING_IDENTITY_AND_HUMAN_APPROVAL'
    }
  };
}
