(()=>{var a={};a.id=3333,a.ids=[3333],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},5260:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>L,patchFetch:()=>K,routeModule:()=>G,serverHooks:()=>J,workAsyncStorage:()=>H,workUnitAsyncStorage:()=>I});var d={};c.r(d),c.d(d,{GET:()=>F,dynamic:()=>D});var e=c(26421),f=c(97714),g=c(85681),h=c(22369),i=c(37587),j=c(261),k=c(46537),l=c(3463),m=c(1889),n=c(85250),o=c(23620),p=c(29790),q=c(67876),r=c(57749),s=c(86439),t=c(51538),u=c(40139),v=c(53444),w=c(73024),x=c.n(w),y=c(76760),z=c.n(y),A=c(16434),B=c(98979),C=c(69378);let D="force-dynamic";function E(a){return null==a?"":String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}async function F(a,{params:b}){try{let{id:c}=await b,d=(0,A.n)(),[e]=await d.query("SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1",[c,c]);if(!e||0===e.length)return new v.NextResponse("Order not found",{status:404});let f=e[0],g=await (0,C.rA)(a),h=await (0,C.Ed)(a),{searchParams:i}=new URL(a.url),j=(i.get("postcode")||"").trim().toUpperCase().replace(/\s+/g,""),k=h&&f.customer_email&&h.email.toLowerCase()===f.customer_email.toLowerCase();if(!g&&!k){if(!j)return new v.NextResponse("Unauthorized: Please sign in or provide the delivery postcode to view this invoice.",{status:401});let a=(f.shipping_postcode||"").trim().toUpperCase().replace(/\s+/g,"");if(j!==a)return new v.NextResponse("Forbidden: Postcode does not match the order delivery address.",{status:403})}let l=Number(f.total_pennies)||0,m=(0,B.SB)(l),n=[];try{n="string"==typeof f.items_json?JSON.parse(f.items_json):f.items_json||[]}catch{n=[]}let[o]=await d.query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('company_name', 'company_number', 'vat_number', 'registered_address', 'support_email', 'support_phone', 'site_logo_light')").catch(()=>[[]]),p={};if(Array.isArray(o))for(let a of o)p[a.setting_key]=a.setting_value;let q=p.company_name||"SAN Furniture Ltd",r=p.registered_address||"Mainland UK Logistics Hub, London, United Kingdom",s=p.company_number||"14829103",t=p.vat_number||"GB 429 8812 04",u="/SanFurnitureLogo.png",w=(p.site_logo_light||"/SanFurnitureLogo.png").replace(/^\//,"");for(let a of[z().join(process.cwd(),"public",w),z().join(process.cwd(),"public","SanFurnitureLogo.png"),z().join(process.cwd(),"apps","storefront","public",w),z().join(process.cwd(),"apps","storefront","public","SanFurnitureLogo.png"),z().resolve(__dirname,"../../../../../public",w),z().resolve(__dirname,"../../../../../public","SanFurnitureLogo.png"),z().resolve(__dirname,"../../../../../../public",w),z().resolve(__dirname,"../../../../../../public","SanFurnitureLogo.png")])try{if(x().existsSync(a)){let b=x().readFileSync(a);u=`data:image/png;base64,${b.toString("base64")}`;break}}catch{}let y=n.map(a=>{let b=(a.pricePennies||a.price_pennies||0)*(a.quantity||1),c=(0,B.SB)(b),d=E(a.title||a.name||"Bespoke Furniture Piece");return`
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a;">${d}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #334155;">${Number(a.quantity)||1}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #334155;">${c.formattedNet}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #334155;">20% (${c.formattedVat})</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: 700; color: #0f172a;">${c.formattedGross}</td>
          </tr>
        `}).join(""),D=new Date(f.created_at||Date.now()).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}),F=E(q),G=E(r),H=E(s),I=E(t),J=E(p.support_email||"support@sanfurniture.com"),K=E(f.order_number),L=E(f.customer_name),M=E(f.customer_email),N=E(f.shipping_address||"UK Mainland Shipping"),O=E(f.shipping_postcode||""),P=E(f.delivery_tier||"Mainland Free"),Q=`<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <title>VAT Invoice ${K} - ${F}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #f8fafc; margin: 0; padding: 40px 20px; }
    .invoice-card { max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 48px; border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00072d; padding-bottom: 24px; margin-bottom: 32px; gap: 24px; }
    .brand-block { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
    .invoice-logo { height: 52px; width: auto; max-width: 260px; object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .badge { display: inline-block; background: #00072d; color: #f8fafc; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-header { text-align: right; }
    .meta-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #00072d; }
    .meta-header p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
    .meta-box h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0; letter-spacing: 0.5px; }
    .meta-box p { font-size: 13px; line-height: 1.6; margin: 0; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    th { background: #f1f5f9; padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; text-align: left; }
    .totals { margin-left: auto; width: 320px; border-top: 2px solid #e2e8f0; padding-top: 16px; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 8px; }
    .grand-total { font-size: 18px; font-weight: 800; color: #00072d; border-top: 2px solid #00072d; padding-top: 12px; margin-top: 12px; }
    .footer-note { border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 40px; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6; }
    @media print { body { background: #ffffff; padding: 0; } .invoice-card { box-shadow: none; border: none; padding: 0; } .invoice-logo { max-height: 54px; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="brand-block">
        <img src="${u}" alt="${F}" class="invoice-logo" />
        <span class="badge">Official UK VAT Invoice</span>
      </div>
      <div class="meta-header">
        <h3>Invoice #${K}</h3>
        <p>Tax Point: <strong>${D}</strong></p>
        <p>VAT Reg No: <strong>${I}</strong></p>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h4>Supplier Information</h4>
        <p><strong>${F}</strong></p>
        <p>${G}</p>
        <p>Company Registration: ${H}</p>
        <p>Email: ${J}</p>
      </div>
      <div class="meta-box" style="text-align: right;">
        <h4>Billed / Delivered To</h4>
        <p><strong>${L}</strong></p>
        <p>${M}</p>
        <p>${N}</p>
        <p>Postcode: <strong>${O}</strong></p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Net (GBP)</th>
          <th style="text-align: right;">VAT Rate</th>
          <th style="text-align: right;">Gross (GBP)</th>
        </tr>
      </thead>
      <tbody>
        ${y||'<tr><td colspan="5" style="padding: 16px; text-align: center; color: #64748b;">Bespoke Furniture Commission - Free UK Mainland Delivery</td></tr>'}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal (Net):</span>
        <span>${m.formattedNet}</span>
      </div>
      <div class="total-row">
        <span>Standard UK VAT (20.0%):</span>
        <span>${m.formattedVat}</span>
      </div>
      <div class="total-row">
        <span>Delivery (${P}):</span>
        <span>${(0,B.j5)(Number(f.shipping_pennies)||0)}</span>
      </div>
      <div class="total-row grand-total">
        <span>Total Gross Payable:</span>
        <span>${m.formattedGross}</span>
      </div>
    </div>

    <div class="footer-note">
      <p>Thank you for choosing ${F}. Every piece is quality checked and protected under UK Consumer Rights Act 2015.</p>
      <p>${F} • Registered in England & Wales (#${H}) • VAT Registration: ${I}</p>
    </div>
  </div>
</body>
</html>`;return new v.NextResponse(Q,{status:200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-cache, no-store, must-revalidate"}})}catch(a){return new v.NextResponse(`Invoice generation error: ${a.message}`,{status:500})}}let G=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/orders/[id]/invoice/route",pathname:"/api/orders/[id]/invoice",filename:"route",bundlePath:"app/api/orders/[id]/invoice/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"D:\\xampp\\htdocs\\SAN Furniture\\apps\\storefront\\src\\app\\api\\orders\\[id]\\invoice\\route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:H,workUnitAsyncStorage:I,serverHooks:J}=G;function K(){return(0,g.patchFetch)({workAsyncStorage:H,workUnitAsyncStorage:I})}async function L(a,b,c){var d;let e="/api/orders/[id]/invoice/route";"/index"===e&&(e="/");let g=await G.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:v,params:w,nextConfig:x,isDraftMode:y,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!z.routes[D]&&(G.isDev||(0,t.isRouteCacheOwner)(D,G.cacheOwner,z.routes[D])),H=!!(z.dynamicRoutes[E]||F);if(H&&!y){let a=z.dynamicRoutes[E];if(a&&!1===a.fallback&&!F)throw new s.NoFallbackError}let I=null;!H||G.isDev||y||(I="/index"===(I=D)?"/":I);let J=!0===G.isDev||!H,K=H&&!J,L=a.method||"GET",M=(0,i.getTracer)(),N=M.getActiveScopeSpan(),O={params:w,prerenderManifest:z,renderOpts:{experimental:{cacheComponents:!!x.experimental.cacheComponents,authInterrupts:!!x.experimental.authInterrupts},supportsDynamicResponse:J,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=x.experimental)?void 0:d.cacheLife,isRevalidate:K,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>G.onRequestError(a,b,d,A)},sharedContext:{buildId:v}},P=new k.NodeNextRequest(a),Q=new k.NodeNextResponse(b),R=l.NextRequestAdapter.fromNodeNextRequest(P,(0,l.signalFromNodeResponse)(b));try{let d=async c=>G.handle(R,O).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=M.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${L} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${L} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=O.renderOpts.fetchMetrics;let i=O.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=O.renderOpts.collectedTags;if(!H)return await (0,o.I)(P,Q,e,O.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==O.renderOpts.collectedRevalidate&&!(O.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&O.renderOpts.collectedRevalidate,d=void 0===O.renderOpts.collectedExpire||O.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:O.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await G.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:K,isOnDemandRevalidate:B})},A),b}},l=await G.handleResponse({req:a,nextConfig:x,cacheKey:I,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!H)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&H||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(P,Q,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};N?await g(N):await M.withPropagatedContext(a.headers,()=>M.trace(m.BaseServerSpan.handleRequest,{spanName:`${L} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":L,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await G.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:K,isOnDemandRevalidate:B})}),H)throw b;return await (0,o.I)(P,Q,new Response(null,{status:500})),null}}},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},16434:(a,b,c)=>{"use strict";c.d(b,{n:()=>g});var d=c(23615);let e=process.env.DB_HOST||"127.0.0.1",f={host:"localhost"===e.toLowerCase()?"127.0.0.1":e,port:Number.parseInt(process.env.DB_PORT||"3306",10),user:process.env.DB_USERNAME||process.env.DB_USER||"root",password:process.env.DB_PASSWORD||"",database:process.env.DB_DATABASE||process.env.DB_NAME||"san_furniture",waitForConnections:!0,connectionLimit:10,queueLimit:0};function g(){return globalThis.__sanDbPool||(globalThis.__sanDbPool=d.createPool(f)),globalThis.__sanDbPool}},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},19771:a=>{"use strict";a.exports=require("process")},27910:a=>{"use strict";a.exports=require("stream")},28354:a=>{"use strict";a.exports=require("util")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{"use strict";a.exports=require("path")},34631:a=>{"use strict";a.exports=require("tls")},41204:a=>{"use strict";a.exports=require("string_decoder")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:a=>{"use strict";a.exports=require("crypto")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66136:a=>{"use strict";a.exports=require("timers")},69378:(a,b,c)=>{"use strict";c.d(b,{BE:()=>n,Ed:()=>l,Er:()=>m,hD:()=>h,rA:()=>k});var d=c(77598),e=c.n(d),f=c(16434);let g=process.env.SAN_AUTH_SECRET||process.env.JWT_SECRET||process.env.AUTH_SECRET||"san_furniture_uk_master_jwt_secret_998124_prod";function h(a,b){let c=JSON.stringify({type:a,id:b,ts:Date.now(),nonce:e().randomBytes(8).toString("hex")}),d=Buffer.from(c).toString("base64url"),f=e().createHmac("sha256",g).update(d).digest("hex");return`san_${a}.${d}.${f}`}function i(a,b){if(!a||"string"!=typeof a)return null;let c=a.trim().split(".");if(3!==c.length)return null;let[d,f,h]=c;if(d!==`san_${b}`)return null;let i=e().createHmac("sha256",g).update(f).digest("hex"),j=Buffer.from(h),k=Buffer.from(i);if(j.length!==k.length||!e().timingSafeEqual(j,k))return null;try{let a=JSON.parse(Buffer.from(f,"base64url").toString("utf8"));if(a.type!==b||!a.id||Date.now()-a.ts>2592e6)return null;return a}catch{return null}}function j(a,b){let c=a.headers.get("authorization")||"";if(c.startsWith("Bearer "))return c.substring(7).trim();let d=a.headers.get("cookie")||"";if(d){let a=d.split(";").reduce((a,b)=>{let[c,d]=b.trim().split("=");return c&&d&&(a[c]=decodeURIComponent(d)),a},{});if(a[b])return a[b]}return null}async function k(a){let b=j(a,"san_admin_token");if(!b)return null;let c=i(b,"adm");if(!c||!c.id)return null;try{let a=(0,f.n)(),[b]=await a.query("SELECT id, email, full_name, role, is_active FROM admin_users WHERE id = ? LIMIT 1",[c.id]);if(!b||0===b.length||!b[0].is_active)return null;return{id:b[0].id,email:b[0].email,fullName:b[0].full_name,role:b[0].role}}catch(a){return console.error("[getAdminFromRequest] DB error:",a),null}}async function l(a){let b=j(a,"san_customer_token");if(!b)return null;let c=i(b,"cust");if(!c||!c.id)return null;try{let a=(0,f.n)(),[b]=await a.query("SELECT id, email, first_name, last_name, phone FROM customers WHERE id = ? LIMIT 1",[c.id]);if(!b||0===b.length)return null;return{id:b[0].id,email:b[0].email,firstName:b[0].first_name,lastName:b[0].last_name,phone:b[0].phone}}catch(a){return console.error("[getCustomerFromRequest] DB error:",a),null}}function m(a){let b=e().randomBytes(16).toString("hex"),c=e().pbkdf2Sync(a,b,1e5,64,"sha512").toString("hex");return`${b}:${c}`}function n(a,b){if(!b||!b.includes(":"))return!1;let[c,d]=b.split(":"),f=e().pbkdf2Sync(a,c,1e5,64,"sha512").toString("hex"),g=Buffer.from(d),h=Buffer.from(f);return g.length===h.length&&e().timingSafeEqual(g,h)}},73024:a=>{"use strict";a.exports=require("node:fs")},74075:a=>{"use strict";a.exports=require("zlib")},75434:a=>{"use strict";a.exports=require("node:diagnostics_channel")},76760:a=>{"use strict";a.exports=require("node:path")},77598:a=>{"use strict";a.exports=require("node:crypto")},79428:a=>{"use strict";a.exports=require("buffer")},79551:a=>{"use strict";a.exports=require("url")},80408:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},87032:()=>{},91645:a=>{"use strict";a.exports=require("net")},94735:a=>{"use strict";a.exports=require("events")},99972:a=>{function b(a){var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b}b.keys=()=>[],b.resolve=b,b.id=99972,a.exports=b}};var b=require("../../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[846,3615,8825,4200,8979],()=>b(b.s=5260));module.exports=c})();