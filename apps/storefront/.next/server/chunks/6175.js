exports.id=6175,exports.ids=[6175],exports.modules={16434:(a,b,c)=>{"use strict";c.d(b,{n:()=>g});var d=c(23615);let e=process.env.DB_HOST||"127.0.0.1",f={host:"localhost"===e.toLowerCase()?"127.0.0.1":e,port:Number.parseInt(process.env.DB_PORT||"3306",10),user:process.env.DB_USERNAME||process.env.DB_USER||"root",password:process.env.DB_PASSWORD||"",database:process.env.DB_DATABASE||process.env.DB_NAME||"san_furniture",waitForConnections:!0,connectionLimit:10,queueLimit:0};function g(){return globalThis.__sanDbPool||(globalThis.__sanDbPool=d.createPool(f)),globalThis.__sanDbPool}},80408:()=>{},87032:()=>{},88318:(a,b,c)=>{"use strict";c.d(b,{G8:()=>n,Tc:()=>q,X$:()=>k,Zc:()=>r,c7:()=>l,dX:()=>p,n3:()=>m,sF:()=>s,uQ:()=>j,vF:()=>i});var d=c(38917),e=c(16434),f=c(88467);let g=null,h=0;async function i(a=!1){let b=Date.now();if(!a&&g&&b<h)return g;try{let a=(0,e.n)(),[c]=await a.query(`SELECT setting_key, setting_value FROM system_settings 
       WHERE setting_key LIKE 'smtp_%' 
          OR setting_key LIKE 'sms_%' 
          OR setting_key LIKE 'email_%'
          OR setting_key IN ('support_email', 'support_phone')`),d={};if(Array.isArray(c))for(let a of c)a.setting_key&&(d[a.setting_key]=a.setting_value);return g=d,h=b+3e4,d}catch(a){return console.error("[Notifications] Failed to load notification settings:",a),g||{}}}function j(){g=null,h=0}function k(a){if("true"!==a.email_notifications_enabled||!a.smtp_host||!a.smtp_host.trim()||!a.smtp_user||!a.smtp_user.trim())return!1;let b=a.smtp_pass?.trim()||"";return!(!b||b.includes("••••"))&&!(b.length<3)}function l(a){if("true"!==a.sms_notifications_enabled&&"true"!==a.sms_dispatch_enabled)return!1;let b=a.sms_account_sid?.trim()||"",c=a.sms_auth_token?.trim()||"";return!(!b||b.startsWith("AC_SAN_FURNITURE_DEMO")||b.includes("DEMO")||!c||c.includes("••••")||c.length<8)}async function m(a){try{let b=await i();if(!k(b))return{success:!1,error:"Email gateway is not active in Admin Settings"};let c=Number.parseInt(b.smtp_port||"587",10),e=b.smtp_encryption?.toUpperCase()==="SSL"||465===c,f=d.Ay.createTransport({host:b.smtp_host,port:c,secure:e,auth:{user:b.smtp_user,pass:b.smtp_pass},connectionTimeout:8e3,greetingTimeout:8e3,socketTimeout:1e4}),g=`"${b.smtp_from_name||"SAN Furniture Concierge"}" <${b.smtp_from_email||b.smtp_user}>`,h=await f.sendMail({from:g,to:a.to,subject:a.subject,text:a.text||a.subject,html:a.html});return{success:!0,messageId:h.messageId}}catch(a){return console.error("[Notifications] Email dispatch failed:",a?.message||a),{success:!1,error:a?.message||"Failed to send email"}}}async function n(a){try{let b=await i();if(!l(b))return{success:!1,error:"SMS gateway is not active in Admin Settings"};let c=function(a){if(!a)return null;let b=a.replace(/[^\d+]/g,"");return b.startsWith("+")?b.length>=10?b:null:b.startsWith("0")?`+44${b.slice(1)}`:b.startsWith("44")||b.length>=10?`+${b}`:null}(a.to);if(!c)return{success:!1,error:`Invalid telephone number format: ${a.to}`};let d=b.sms_account_sid.trim(),e=b.sms_auth_token.trim(),f=b.sms_sender_id?.trim()||"SANFURNITURE",g=`https://api.twilio.com/2010-04-01/Accounts/${d}/Messages.json`,h=Buffer.from(`${d}:${e}`).toString("base64"),j=new URLSearchParams;j.append("To",c),j.append("From",f),j.append("Body",a.message);let k=await fetch(g,{method:"POST",headers:{Authorization:`Basic ${h}`,"Content-Type":"application/x-www-form-urlencoded"},body:j.toString(),signal:AbortSignal.timeout(7e3)}),m=await k.json().catch(()=>({}));if(k.ok&&m.sid)return{success:!0,sid:m.sid};return{success:!1,error:m.message||`Twilio HTTP ${k.status}`}}catch(a){return console.error("[Notifications] SMS dispatch failed:",a?.message||a),{success:!1,error:a?.message||"Failed to send SMS"}}}function o(a,b){return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${a}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f7f6f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a2233; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e2d9; box-shadow: 0 4px 20px rgba(17,24,39,0.06); }
    .header { background: linear-gradient(135deg, #0e1526 0%, #17243c 100%); padding: 32px 30px; text-align: center; }
    .logo { color: #fbf8f3; font-size: 24px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; margin: 0; font-family: Georgia, serif; }
    .logo-sub { color: #d4a359; font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; margin-top: 4px; }
    .content { padding: 36px 32px; font-size: 14px; line-height: 1.65; color: #2d3748; }
    .card { background-color: #fbf8f3; border: 1px solid #ede8de; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8c734b; font-weight: 800; margin: 0 0 10px 0; }
    .button { display: inline-block; background-color: #0e1526; color: #fbf8f3 !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-align: center; margin-top: 18px; }
    .footer { background-color: #f7f6f2; padding: 24px 30px; text-align: center; font-size: 11px; color: #718096; border-top: 1px solid #ede8de; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-success { background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-cancel { background-color: #fff1f2; color: #9f1239; border: 1px solid #fecdd3; }
    .badge-gold { background-color: #fefce8; color: #854d0e; border: 1px solid #fef08a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">SAN Furniture</h1>
      <div class="logo-sub">Artisanal Living &bull; United Kingdom</div>
    </div>
    <div class="content">
      ${b}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>SAN Furniture UK Ltd</strong> &bull; Registered in England &amp; Wales</p>
      <p style="margin: 0 0 10px 0;">UK Furniture &amp; Furnishings (Fire Safety) Regulations 1988 Compliant</p>
      <p style="margin: 0; color: #a0aec0;">Questions? Contact our London Concierge at support@sanfurniture.co.uk</p>
    </div>
  </div>
</body>
</html>`}async function p(a){let b=await i(),c=k(b),d=l(b);(c||d)&&(async()=>{try{if(c&&a.email){let b=o("Welcome to SAN Furniture",`
          <h2 style="font-size: 20px; color: #0e1526; margin-top: 0;">Welcome, ${a.firstName}!</h2>
          <p>Thank you for joining <strong>SAN Furniture</strong>. Your private customer portal is now active, granting you seamless order management, real-time white-glove GPS consignment tracking, and verified UK VAT receipts.</p>
          
          <div class="card">
            <div class="card-title">Your Member Credentials</div>
            <p style="margin: 0 0 6px 0;"><strong>Registered Email:</strong> ${a.email}</p>
            <p style="margin: 0;"><strong>Customer Care:</strong> 2-Man Delivery Concierge &amp; Room of Choice Assembly included on eligible pieces.</p>
          </div>

          <p>Every piece in our collection is strictly compliant with UK Fire Safety Regulations 1988 and crafted for discerning British homes.</p>

          <div style="text-align: center;">
            <a href="https://sanfurniture.co.uk/account" class="button">Visit Your Customer Portal</a>
          </div>
          `);await m({to:a.email,subject:"Welcome to SAN Furniture — Your Account is Ready",html:b,text:`Welcome ${a.firstName}! Your SAN Furniture customer account is ready. Visit https://sanfurniture.co.uk/account`})}d&&a.phone&&await n({to:a.phone,message:`SAN Furniture: Welcome ${a.firstName}! Your luxury UK furniture account is now active. Explore collections at sanfurniture.co.uk`})}catch(a){console.warn("[Notifications] Registration dispatch background error:",a)}})()}async function q(a){let b=await i(),c=k(b),d=l(b);(c||d)&&(async()=>{try{if(c&&a.customerEmail){let b=(a.items||[]).map(a=>`
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #ede8de;">
                <strong>${a.title}</strong>
                ${a.finish?`<br><span style="font-size: 11px; color: #718096;">Finish: ${a.finish}</span>`:""}
              </td>
              <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #ede8de; font-family: monospace;">&times;${a.quantity}</td>
              <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #ede8de; font-weight: bold; font-family: monospace;">${(0,f.j5)(a.pricePennies*a.quantity)}</td>
            </tr>
          `).join(""),c="two_man_white_glove"===a.deliveryTier?"2-Man White Glove (Room of Choice + Assembly)":"pallet"===a.deliveryTier?"Pallet Curbside Delivery":"Standard UK Delivery",d=o(`Order Confirmation #${a.orderNumber}`,`
          <div style="margin-bottom: 20px;">
            <span class="badge badge-success">Payment Confirmed &bull; Order Received</span>
          </div>

          <h2 style="font-size: 20px; color: #0e1526; margin-top: 0;">Thank you, ${a.customerName}!</h2>
          <p>We are delighted to confirm your furniture order <strong style="font-family: monospace;">#${a.orderNumber}</strong>. Our logistics team and craftsman network are preparing your items for transit.</p>

          <div class="card">
            <div class="card-title">Order Summary</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              ${b}
              <tr>
                <td colspan="2" style="padding-top: 12px; color: #718096;">Subtotal (Net):</td>
                <td style="padding-top: 12px; text-align: right; font-family: monospace;">${(0,f.j5)(a.subtotalPennies)}</td>
              </tr>
              <tr>
                <td colspan="2" style="color: #718096;">UK 20% VAT:</td>
                <td style="text-align: right; font-family: monospace;">${(0,f.j5)(a.vatPennies)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 8px 0; font-size: 15px; font-weight: bold; color: #0e1526;">Grand Total:</td>
                <td style="padding: 8px 0; text-align: right; font-size: 16px; font-weight: bold; font-family: monospace; color: #0e1526;">${(0,f.j5)(a.totalPennies)}</td>
              </tr>
            </table>
          </div>

          <div class="card">
            <div class="card-title">Delivery &amp; Logistics</div>
            <p style="margin: 0 0 6px 0;"><strong>Delivery Service:</strong> ${c}</p>
            <p style="margin: 0;"><strong>Destination Address:</strong> ${a.shippingAddress}</p>
          </div>

          <div style="text-align: center;">
            <a href="https://sanfurniture.co.uk/account?tab=orders" class="button">Track Your Consignment</a>
          </div>
          `);await m({to:a.customerEmail,subject:`SAN Furniture: Order #${a.orderNumber} Confirmed (${(0,f.j5)(a.totalPennies)})`,html:d,text:`Thank you ${a.customerName}! Order #${a.orderNumber} for ${(0,f.j5)(a.totalPennies)} is confirmed. Track at https://sanfurniture.co.uk/account?tab=orders`})}d&&a.customerPhone&&await n({to:a.customerPhone,message:`SAN Furniture: Thank you ${a.customerName}! Order #${a.orderNumber} (${(0,f.j5)(a.totalPennies)}) is confirmed. We will SMS you once dispatched.`})}catch(a){console.warn("[Notifications] Order created dispatch background error:",a)}})()}async function r(a){let b=await i(),c=k(b),d=l(b);(c||d)&&(async()=>{try{"dispatched"===a.newStatus||"in_transit"===a.newStatus||a.newStatus;let b="delivered"===a.newStatus,e=a.carrier||"SAN Dedicated Delivery Fleet",f=a.trackingNumber||"Allocated on Route";if(c&&a.customerEmail){let c=o(`Order #${a.orderNumber} Status Update`,`
          <div style="margin-bottom: 20px;">
            ${b?'<span class="badge badge-success">Delivered &bull; Inspection Complete</span>':'<span class="badge badge-gold">In Transit &bull; Dispatched</span>'}
          </div>

          <h2 style="font-size: 20px; color: #0e1526; margin-top: 0;">${b?"Your Furniture Has Arrived!":"Your Order Is On Its Way!"}</h2>
          <p>Dear ${a.customerName}, your furniture order <strong style="font-family: monospace;">#${a.orderNumber}</strong> status has been updated to <strong>${a.newStatus.replace(/_/g," ").toUpperCase()}</strong>.</p>

          <div class="card">
            <div class="card-title">Consignment &amp; Carrier Information</div>
            <p style="margin: 0 0 6px 0;"><strong>Logistics Carrier:</strong> ${e}</p>
            <p style="margin: 0 0 6px 0;"><strong>Consignment Tracking Code:</strong> <span style="font-family: monospace; font-weight: bold;">${f}</span></p>
            <p style="margin: 0;"><strong>Service Tier:</strong> Dedicated UK Furniture Logistics</p>
          </div>

          <div style="text-align: center;">
            <a href="https://sanfurniture.co.uk/account?tab=orders" class="button">View Real-Time Tracking</a>
          </div>
          `);await m({to:a.customerEmail,subject:`SAN Furniture: Order #${a.orderNumber} — ${b?"Delivered":"Dispatched"}`,html:c,text:`SAN Furniture: Order #${a.orderNumber} is now ${a.newStatus}. Carrier: ${e}, Tracking: ${f}. Track at https://sanfurniture.co.uk/account?tab=orders`})}if(d&&a.customerPhone){let c=b?`SAN Furniture: Order #${a.orderNumber} has been delivered. Thank you for choosing SAN Furniture.`:`SAN Furniture: Order #${a.orderNumber} is now dispatched with ${e}. Tracking: ${f}.`;await n({to:a.customerPhone,message:c})}}catch(a){console.warn("[Notifications] Status update dispatch background error:",a)}})()}async function s(a){let b=await i(),c=k(b),d=l(b);(c||d)&&(async()=>{try{let b=a.reason||"Customer requested cancellation before courier dispatch",e=a.cancelledBy||"Customer",g=a.totalPennies?(0,f.j5)(a.totalPennies):"100% Full Payment";if(c&&a.customerEmail){let c=o(`Order #${a.orderNumber} Cancelled`,`
          <div style="margin-bottom: 20px;">
            <span class="badge badge-cancel">Order Cancelled &bull; 100% Refund Scheduled</span>
          </div>

          <h2 style="font-size: 20px; color: #0e1526; margin-top: 0;">Cancellation Confirmation</h2>
          <p>Dear ${a.customerName}, this email confirms that order <strong style="font-family: monospace;">#${a.orderNumber}</strong> has been cancelled.</p>

          <div class="card">
            <div class="card-title">Cancellation &amp; Refund Audit</div>
            <p style="margin: 0 0 6px 0;"><strong>Cancelled By:</strong> ${e}</p>
            <p style="margin: 0 0 6px 0;"><strong>Recorded Reason:</strong> &ldquo;${b}&rdquo;</p>
            <p style="margin: 0 0 6px 0;"><strong>Refund Amount:</strong> <span style="font-family: monospace; font-weight: bold; color: #065f46;">${g}</span></p>
            <p style="margin: 0; font-size: 12px; color: #718096;">Refunds are processed back to your original payment method within 3-5 business days depending on your bank.</p>
          </div>

          <p>If you have any questions or require assistance with alternative selections, our London team is at your disposal.</p>
          `);await m({to:a.customerEmail,subject:`SAN Furniture: Order #${a.orderNumber} Cancellation & Full Refund Confirmation`,html:c,text:`SAN Furniture: Order #${a.orderNumber} has been cancelled (${b}). A 100% full refund (${g}) has been scheduled.`})}d&&a.customerPhone&&await n({to:a.customerPhone,message:`SAN Furniture: Order #${a.orderNumber} has been cancelled. A 100% refund is scheduled to your payment card within 3-5 business days.`})}catch(a){console.warn("[Notifications] Cancel dispatch background error:",a)}})()}},99972:a=>{function b(a){var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b}b.keys=()=>[],b.resolve=b,b.id=99972,a.exports=b}};