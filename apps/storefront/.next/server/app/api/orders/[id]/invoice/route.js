(()=>{var a={};a.id=3333,a.ids=[3333],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},5260:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>F,patchFetch:()=>E,routeModule:()=>A,serverHooks:()=>D,workAsyncStorage:()=>B,workUnitAsyncStorage:()=>C});var d={};c.r(d),c.d(d,{GET:()=>z,dynamic:()=>y});var e=c(26421),f=c(97714),g=c(85681),h=c(22369),i=c(37587),j=c(261),k=c(46537),l=c(3463),m=c(1889),n=c(85250),o=c(23620),p=c(29790),q=c(67876),r=c(57749),s=c(86439),t=c(51538),u=c(40139),v=c(53444),w=c(16434),x=c(88467);let y="force-dynamic";async function z(a,{params:b}){try{let{id:a}=await b,c=(0,w.n)(),[d]=await c.query("SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1",[a,a]);if(!d||0===d.length)return new v.NextResponse("Order not found",{status:404});let e=d[0],f=Number(e.total_pennies)||0,g=(0,x.SB)(f),h=[];try{h="string"==typeof e.items_json?JSON.parse(e.items_json):e.items_json||[]}catch{h=[]}let[i]=await c.query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('company_name', 'company_number', 'vat_number', 'registered_address', 'support_email', 'support_phone')").catch(()=>[[]]),j={};if(Array.isArray(i))for(let a of i)j[a.setting_key]=a.setting_value;let k=j.company_name||"SAN Furniture Ltd",l=j.registered_address||"Mainland UK Logistics Hub, London, United Kingdom",m=j.company_number||"14829103",n=j.vat_number||"GB 429 8812 04",o=h.map(a=>{let b=(a.pricePennies||a.price_pennies||0)*(a.quantity||1),c=(0,x.SB)(b);return`
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #0f172a;">${a.title||a.name||"Bespoke Furniture Piece"}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #334155;">${a.quantity||1}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #334155;">${c.formattedNet}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #334155;">20% (${c.formattedVat})</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: 700; color: #0f172a;">${c.formattedGross}</td>
          </tr>
        `}).join(""),p=new Date(e.created_at||Date.now()).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}),q=`<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <title>VAT Invoice ${e.order_number} - ${k}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #f8fafc; margin: 0; padding: 40px 20px; }
    .invoice-card { max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 48px; border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00072d; padding-bottom: 24px; margin-bottom: 32px; }
    .brand-title { font-size: 24px; font-weight: 800; color: #00072d; letter-spacing: -0.5px; margin: 0; }
    .badge { display: inline-block; background: #00072d; color: #f8fafc; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; margin-top: 6px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
    .meta-box h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0; letter-spacing: 0.5px; }
    .meta-box p { font-size: 13px; line-height: 1.6; margin: 0; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    th { background: #f1f5f9; padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; text-align: left; }
    .totals { margin-left: auto; width: 320px; border-top: 2px solid #e2e8f0; padding-top: 16px; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 8px; }
    .grand-total { font-size: 18px; font-weight: 800; color: #00072d; border-top: 2px solid #00072d; padding-top: 12px; margin-top: 12px; }
    .footer-note { border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 40px; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6; }
    @media print { body { background: #ffffff; padding: 0; } .invoice-card { box-shadow: none; border: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h1 class="brand-title">${k}</h1>
        <span class="badge">Official UK VAT Invoice</span>
      </div>
      <div style="text-align: right;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #00072d;">Invoice #${e.order_number}</h3>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Tax Point: ${p}</p>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">VAT Reg No: <strong>${n}</strong></p>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h4>Supplier Information</h4>
        <p><strong>${k}</strong></p>
        <p>${l}</p>
        <p>Company Registration: ${m}</p>
        <p>Email: ${j.support_email||"support@sanfurniture.com"}</p>
      </div>
      <div class="meta-box" style="text-align: right;">
        <h4>Billed / Delivered To</h4>
        <p><strong>${e.customer_name}</strong></p>
        <p>${e.customer_email}</p>
        <p>${e.shipping_address||"UK Mainland Shipping"}</p>
        <p>Postcode: <strong>${e.shipping_postcode}</strong></p>
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
        ${o||'<tr><td colspan="5" style="padding: 16px; text-align: center; color: #64748b;">Bespoke Furniture Commission - Free UK Mainland Delivery</td></tr>'}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal (Net):</span>
        <span>${g.formattedNet}</span>
      </div>
      <div class="total-row">
        <span>Standard UK VAT (20.0%):</span>
        <span>${g.formattedVat}</span>
      </div>
      <div class="total-row">
        <span>Delivery (${e.delivery_tier||"Mainland Free"}):</span>
        <span>${(0,x.j5)(Number(e.shipping_pennies)||0)}</span>
      </div>
      <div class="total-row grand-total">
        <span>Total Gross Payable:</span>
        <span>${g.formattedGross}</span>
      </div>
    </div>

    <div class="footer-note">
      <p>Thank you for choosing ${k}. Every piece is quality checked and protected under UK Consumer Rights Act 2015.</p>
      <p>${k} • Registered in England & Wales (#${m}) • VAT Registration: ${n}</p>
    </div>
  </div>
</body>
</html>`;return new v.NextResponse(q,{status:200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"public, max-age=300"}})}catch(a){return new v.NextResponse(`Invoice generation error: ${a.message}`,{status:500})}}let A=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/orders/[id]/invoice/route",pathname:"/api/orders/[id]/invoice",filename:"route",bundlePath:"app/api/orders/[id]/invoice/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"D:\\xampp\\htdocs\\SAN Furniture\\apps\\storefront\\src\\app\\api\\orders\\[id]\\invoice\\route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:B,workUnitAsyncStorage:C,serverHooks:D}=A;function E(){return(0,g.patchFetch)({workAsyncStorage:B,workUnitAsyncStorage:C})}async function F(a,b,c){var d;let e="/api/orders/[id]/invoice/route";"/index"===e&&(e="/");let g=await A.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:v,params:w,nextConfig:x,isDraftMode:y,prerenderManifest:z,routerServerContext:B,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,resolvedPathname:E}=g,F=(0,j.normalizeAppPath)(e),G=!!z.routes[E]&&(A.isDev||(0,t.isRouteCacheOwner)(E,A.cacheOwner,z.routes[E])),H=!!(z.dynamicRoutes[F]||G);if(H&&!y){let a=z.dynamicRoutes[F];if(a&&!1===a.fallback&&!G)throw new s.NoFallbackError}let I=null;!H||A.isDev||y||(I="/index"===(I=E)?"/":I);let J=!0===A.isDev||!H,K=H&&!J,L=a.method||"GET",M=(0,i.getTracer)(),N=M.getActiveScopeSpan(),O={params:w,prerenderManifest:z,renderOpts:{experimental:{cacheComponents:!!x.experimental.cacheComponents,authInterrupts:!!x.experimental.authInterrupts},supportsDynamicResponse:J,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=x.experimental)?void 0:d.cacheLife,isRevalidate:K,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>A.onRequestError(a,b,d,B)},sharedContext:{buildId:v}},P=new k.NodeNextRequest(a),Q=new k.NodeNextResponse(b),R=l.NextRequestAdapter.fromNodeNextRequest(P,(0,l.signalFromNodeResponse)(b));try{let d=async c=>A.handle(R,O).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=M.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${L} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${L} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&C&&D&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=O.renderOpts.fetchMetrics;let i=O.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=O.renderOpts.collectedTags;if(!H)return await (0,o.I)(P,Q,e,O.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==O.renderOpts.collectedRevalidate&&!(O.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&O.renderOpts.collectedRevalidate,d=void 0===O.renderOpts.collectedExpire||O.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:O.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await A.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:K,isOnDemandRevalidate:C})},B),b}},l=await A.handleResponse({req:a,nextConfig:x,cacheKey:I,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,responseGenerator:k,waitUntil:c.waitUntil});if(!H)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",C?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&H||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(P,Q,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};N?await g(N):await M.withPropagatedContext(a.headers,()=>M.trace(m.BaseServerSpan.handleRequest,{spanName:`${L} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":L,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await A.onRequestError(a,b,{routerKind:"App Router",routePath:F,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:K,isOnDemandRevalidate:C})}),H)throw b;return await (0,o.I)(P,Q,new Response(null,{status:500})),null}}},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},16434:(a,b,c)=>{"use strict";c.d(b,{n:()=>g});var d=c(23615);let e=process.env.DB_HOST||"127.0.0.1",f={host:"localhost"===e.toLowerCase()?"127.0.0.1":e,port:Number.parseInt(process.env.DB_PORT||"3306",10),user:process.env.DB_USERNAME||process.env.DB_USER||"root",password:process.env.DB_PASSWORD||"",database:process.env.DB_DATABASE||process.env.DB_NAME||"san_furniture",waitForConnections:!0,connectionLimit:10,queueLimit:0};function g(){return globalThis.__sanDbPool||(globalThis.__sanDbPool=d.createPool(f)),globalThis.__sanDbPool}},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},19771:a=>{"use strict";a.exports=require("process")},27910:a=>{"use strict";a.exports=require("stream")},28354:a=>{"use strict";a.exports=require("util")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{"use strict";a.exports=require("path")},34631:a=>{"use strict";a.exports=require("tls")},41204:a=>{"use strict";a.exports=require("string_decoder")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:a=>{"use strict";a.exports=require("crypto")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66136:a=>{"use strict";a.exports=require("timers")},74075:a=>{"use strict";a.exports=require("zlib")},75434:a=>{"use strict";a.exports=require("node:diagnostics_channel")},79428:a=>{"use strict";a.exports=require("buffer")},79551:a=>{"use strict";a.exports=require("url")},80408:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},87032:()=>{},91645:a=>{"use strict";a.exports=require("net")},94735:a=>{"use strict";a.exports=require("events")},99972:a=>{function b(a){var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b}b.keys=()=>[],b.resolve=b,b.id=99972,a.exports=b}};var b=require("../../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[846,3615,8825,4200,8467],()=>b(b.s=5260));module.exports=c})();