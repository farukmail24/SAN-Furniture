exports.id=6175,exports.ids=[6175],exports.modules={16434:(a,b,c)=>{"use strict";c.d(b,{n:()=>g});var d=c(23615);let e=process.env.DB_HOST||"127.0.0.1",f={host:"localhost"===e.toLowerCase()?"127.0.0.1":e,port:Number.parseInt(process.env.DB_PORT||"3306",10),user:process.env.DB_USERNAME||process.env.DB_USER||"root",password:process.env.DB_PASSWORD||"",database:process.env.DB_DATABASE||process.env.DB_NAME||"san_furniture",waitForConnections:!0,connectionLimit:10,queueLimit:0};function g(){return globalThis.__sanDbPool||(globalThis.__sanDbPool=d.createPool(f)),globalThis.__sanDbPool}},80408:()=>{},87032:()=>{},88318:(a,b,c)=>{"use strict";c.d(b,{G8:()=>o,Gb:()=>w,Hx:()=>v,Tc:()=>s,X$:()=>l,Zc:()=>t,c7:()=>m,dX:()=>r,n3:()=>n,sF:()=>u,uQ:()=>j,vF:()=>i});var d=c(38917),e=c(16434),f=c(98979);let g=null,h=0;async function i(a=!1){let b=Date.now();if(!a&&g&&b<h)return g;try{let a=(0,e.n)(),[c]=await a.query(`SELECT setting_key, setting_value FROM system_settings 
       WHERE setting_key LIKE 'smtp_%' 
          OR setting_key LIKE 'sms_%' 
          OR setting_key LIKE 'email_%'
          OR setting_key IN ('support_email', 'support_phone')`),d={};if(Array.isArray(c))for(let a of c)a.setting_key&&(d[a.setting_key]=a.setting_value);return g=d,h=b+15e3,d}catch(a){return console.error("[Notifications] Failed to load notification settings from DB:",a),g||{}}}function j(){g=null,h=0}async function k(a){try{let b=(0,e.n)(),c=`notif_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;await b.query(`INSERT INTO notifications (id, recipient_type, recipient_id, type, title, message, link, is_read, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NOW())`,[c,a.recipientType,a.recipientId||null,a.type,a.title.slice(0,255),a.message,a.link||null,a.metadata?JSON.stringify(a.metadata):null])}catch(a){console.warn("[Notifications] Failed to write notification audit entry:",a?.message||a)}}function l(a){if("true"!==a.email_notifications_enabled||!a.smtp_host||!a.smtp_host.trim()||!a.smtp_user||!a.smtp_user.trim())return!1;let b=a.smtp_pass?.trim()||"";return!(!b||b.includes("••••"))&&!(b.length<3)}function m(a){if("true"!==a.sms_notifications_enabled&&"true"!==a.sms_dispatch_enabled)return!1;let b=a.sms_account_sid?.trim()||"",c=a.sms_auth_token?.trim()||"";return!(!b||b.startsWith("AC_SAN_FURNITURE_DEMO")||b.includes("DEMO")||!c||c.includes("••••")||c.length<8)}async function n(a){try{let b=await i();if(!l(b)){let a="true"!==b.email_notifications_enabled?"Email notifications are turned OFF in Admin Settings":"SMTP Host, User, or Password is missing or contains placeholder mask bullets";return{success:!1,error:a}}let c=Number.parseInt(b.smtp_port||"465",10),e=b.smtp_encryption?.toUpperCase()==="SSL"||465===c,f=d.Ay.createTransport({host:b.smtp_host,port:c,secure:e,auth:{user:b.smtp_user,pass:b.smtp_pass},tls:{rejectUnauthorized:!1},connectionTimeout:1e4,greetingTimeout:1e4,socketTimeout:15e3}),g=`"${b.smtp_from_name||"SAN Furniture"}" <${b.smtp_from_email||b.smtp_user}>`,h=await f.sendMail({from:g,to:a.to,subject:a.subject,text:a.text||a.subject,html:a.html,replyTo:b.support_email||b.smtp_from_email||b.smtp_user,headers:{"X-Priority":"1","X-MSMail-Priority":"High",Importance:"High","X-Mailer":"SAN Furniture UK Commerce Engine"}});return await k({recipientType:"customer",recipientId:a.to,type:"email_dispatched",title:a.subject,message:`Transactional email successfully sent to ${a.to}. MessageId: ${h.messageId||"delivered"}`,metadata:{gateway:"smtp",host:b.smtp_host,port:c,messageId:h.messageId,to:a.to}}),{success:!0,messageId:h.messageId}}catch(c){let b=c?.message||"Failed to send email via SMTP";return console.error("[Notifications] Email dispatch failed:",b,c?.code),await k({recipientType:"customer",recipientId:a.to,type:"email_failed",title:`Failed Email: ${a.subject}`,message:`SMTP dispatch error to ${a.to}: ${b}`,metadata:{gateway:"smtp",to:a.to,error:b,code:c?.code}}),{success:!1,error:b}}}async function o(a){try{let b=await i();if(!m(b))return{success:!1,error:"SMS gateway is not active. Please enable SMS in Admin Settings and provide a valid Twilio Account SID & Auth Token."};let c=function(a){if(!a)return null;let b=a.replace(/[^\d+]/g,"");return b.startsWith("+")?b.length>=10?b:null:b.startsWith("0")?`+44${b.slice(1)}`:b.startsWith("44")||b.length>=10?`+${b}`:null}(a.to);if(!c)return{success:!1,error:`Invalid telephone number format: ${a.to}`};let d=b.sms_account_sid.trim(),e=b.sms_auth_token.trim(),f=b.sms_sender_id?.trim()||"SANFURNITURE",g=`https://api.twilio.com/2010-04-01/Accounts/${d}/Messages.json`,h=Buffer.from(`${d}:${e}`).toString("base64"),j=new URLSearchParams;j.append("To",c),j.append("From",f),j.append("Body",a.message);let l=await fetch(g,{method:"POST",headers:{Authorization:`Basic ${h}`,"Content-Type":"application/x-www-form-urlencoded"},body:j.toString(),signal:AbortSignal.timeout(1e4)}),n=await l.json().catch(()=>({}));if(l.ok&&n.sid)return await k({recipientType:"customer",recipientId:c,type:"sms_dispatched",title:"SMS Alert Dispatched",message:`SMS sent to ${c}. SID: ${n.sid}`,metadata:{gateway:"twilio",to:c,sid:n.sid}}),{success:!0,sid:n.sid};let o=n.message||`Twilio HTTP ${l.status}`;return await k({recipientType:"customer",recipientId:c,type:"sms_failed",title:"SMS Alert Failed",message:`Failed to dispatch SMS to ${c}: ${o}`,metadata:{gateway:"twilio",to:c,error:o}}),{success:!1,error:o}}catch(c){let b=c?.message||"Failed to send SMS";return console.error("[Notifications] SMS dispatch failed:",b),await k({recipientType:"customer",recipientId:a.to,type:"sms_failed",title:"SMS Dispatch Exception",message:`Error sending SMS to ${a.to}: ${b}`,metadata:{gateway:"twilio",to:a.to,error:b}}),{success:!1,error:b}}}function p(){let a="http://localhost:3001";return a&&"string"==typeof a&&a.trim().length>0?a.replace(/\/+$/,""):"https://sanfurniture.co.uk"}function q(a,b){return p(),`<!DOCTYPE html>
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
</html>`}async function r(a){try{let b=await i(),c=l(b),d=m(b);if(!c&&!d)return{emailSent:!1,smsSent:!1};let e=p(),f=[];if(c&&a.email){let b=q("Welcome to SAN Furniture",`
        <h2 style="font-size: 20px; color: #0e1526; margin-top: 0;">Welcome, ${a.firstName}!</h2>
        <p>Thank you for joining <strong>SAN Furniture</strong>. Your private customer portal is now active, granting you seamless order management, real-time white-glove GPS consignment tracking, and verified UK VAT receipts.</p>
        
        <div class="card">
          <div class="card-title">Your Member Credentials</div>
          <p style="margin: 0 0 6px 0;"><strong>Registered Email:</strong> ${a.email}</p>
          <p style="margin: 0;"><strong>Customer Care:</strong> 2-Man Delivery Concierge &amp; Room of Choice Assembly included on eligible pieces.</p>
        </div>

        <p>Every piece in our collection is strictly compliant with UK Fire Safety Regulations 1988 and crafted for discerning British homes.</p>

        <div style="text-align: center;">
          <a href="${e}/account" class="button">Visit Your Customer Portal</a>
        </div>
        `);f.push(n({to:a.email,subject:"Welcome to SAN Furniture — Your Account is Ready",html:b,text:`Welcome ${a.firstName}! Your SAN Furniture customer account is ready. Visit ${e}/account`}))}d&&a.phone&&f.push(o({to:a.phone,message:`SAN Furniture: Welcome ${a.firstName}! Your luxury UK furniture account is now active. Explore collections at ${e}`}));let g=await Promise.race([Promise.allSettled(f),new Promise((a,b)=>setTimeout(()=>b(Error("Notification dispatch timed out")),8e3))]);return{emailSent:g[0]?.status==="fulfilled"&&g[0].value?.success,smsSent:g[1]?.status==="fulfilled"&&g[1].value?.success}}catch(a){return console.warn("[Notifications] Registration dispatch error:",a?.message||a),{error:a?.message||String(a)}}}async function s(a){try{let b=await i(),c=l(b),d=m(b);if(!c&&!d)return{emailSent:!1,smsSent:!1};let e=p(),g=[];if(c&&a.customerEmail){let b=(a.items||[]).map(a=>`
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #ede8de;">
              <strong>${a.title}</strong>
              ${a.finish?`<br><span style="font-size: 11px; color: #718096;">Finish: ${a.finish}</span>`:""}
            </td>
            <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #ede8de; font-family: monospace;">&times;${a.quantity}</td>
            <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #ede8de; font-weight: bold; font-family: monospace;">${(0,f.j5)(a.pricePennies*a.quantity)}</td>
          </tr>
        `).join(""),c="two_man_white_glove"===a.deliveryTier||"white_glove_assembly"===a.deliveryTier?"2-Man White Glove (Room of Choice + Assembly)":"pallet"===a.deliveryTier?"Pallet Curbside Delivery":"Standard UK Delivery",d=q(`Order Confirmation #${a.orderNumber}`,`
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
          <a href="${e}/account?tab=orders" class="button">Track Your Consignment</a>
        </div>
        `);g.push(n({to:a.customerEmail,subject:`SAN Furniture: Order #${a.orderNumber} Confirmed (${(0,f.j5)(a.totalPennies)})`,html:d,text:`Thank you ${a.customerName}! Order #${a.orderNumber} for ${(0,f.j5)(a.totalPennies)} is confirmed. Track at ${e}/account?tab=orders`}))}d&&a.customerPhone&&g.push(o({to:a.customerPhone,message:`SAN Furniture: Thank you ${a.customerName}! Order #${a.orderNumber} (${(0,f.j5)(a.totalPennies)}) is confirmed. We will SMS you once dispatched.`}));let h=await Promise.race([Promise.allSettled(g),new Promise((a,b)=>setTimeout(()=>b(Error("Notification dispatch timed out")),8e3))]);return{emailSent:h[0]?.status==="fulfilled"&&h[0].value?.success,smsSent:h[1]?.status==="fulfilled"&&h[1].value?.success}}catch(a){return console.warn("[Notifications] Order created dispatch error:",a?.message||a),{error:a?.message||String(a)}}}async function t(a){try{let b=await i(),c=l(b),d=m(b);if(!c&&!d)return{emailSent:!1,smsSent:!1};let e=p();"dispatched"===a.newStatus||"in_transit"===a.newStatus||"in_transit_two_man"===a.newStatus||a.newStatus;let f="delivered"===a.newStatus,g=a.carrier||"SAN Dedicated Delivery Fleet",h=a.trackingNumber||"Allocated on Route",j=[];if(c&&a.customerEmail){let b=q(`Order #${a.orderNumber} Status Update`,`
        <div style="margin-bottom: 20px;">
          ${f?'<span class="badge badge-success">Delivered &bull; Inspection Complete</span>':'<span class="badge badge-gold">In Transit &bull; Dispatched</span>'}
        </div>

        <h2 style="font-size: 20px; color: #0e1526; margin-top: 0;">${f?"Your Furniture Has Arrived!":"Your Order Is On Its Way!"}</h2>
        <p>Dear ${a.customerName}, your furniture order <strong style="font-family: monospace;">#${a.orderNumber}</strong> status has been updated to <strong>${a.newStatus.replace(/_/g," ").toUpperCase()}</strong>.</p>

        <div class="card">
          <div class="card-title">Consignment &amp; Carrier Information</div>
          <p style="margin: 0 0 6px 0;"><strong>Logistics Carrier:</strong> ${g}</p>
          <p style="margin: 0 0 6px 0;"><strong>Consignment Tracking Code:</strong> <span style="font-family: monospace; font-weight: bold;">${h}</span></p>
          <p style="margin: 0;"><strong>Service Tier:</strong> Dedicated UK Furniture Logistics</p>
        </div>

        <div style="text-align: center;">
          <a href="${e}/account?tab=orders" class="button">View Real-Time Tracking</a>
        </div>
        `);j.push(n({to:a.customerEmail,subject:`SAN Furniture: Order #${a.orderNumber} — ${f?"Delivered":"Dispatched"}`,html:b,text:`SAN Furniture: Order #${a.orderNumber} is now ${a.newStatus}. Carrier: ${g}, Tracking: ${h}. Track at ${e}/account?tab=orders`}))}if(d&&a.customerPhone){let b=f?`SAN Furniture: Order #${a.orderNumber} has been delivered. Thank you for choosing SAN Furniture.`:`SAN Furniture: Order #${a.orderNumber} is now dispatched with ${g}. Tracking: ${h}.`;j.push(o({to:a.customerPhone,message:b}))}let k=await Promise.race([Promise.allSettled(j),new Promise((a,b)=>setTimeout(()=>b(Error("Notification dispatch timed out")),8e3))]);return{emailSent:k[0]?.status==="fulfilled"&&k[0].value?.success,smsSent:k[1]?.status==="fulfilled"&&k[1].value?.success}}catch(a){return console.warn("[Notifications] Status update dispatch error:",a?.message||a),{error:a?.message||String(a)}}}async function u(a){try{let b=await i(),c=l(b),d=m(b);if(!c&&!d)return{emailSent:!1,smsSent:!1};let e=a.reason||"Customer requested cancellation before courier dispatch",g=a.cancelledBy||"Customer",h=a.totalPennies?(0,f.j5)(a.totalPennies):"100% Full Payment",j=[];if(c&&a.customerEmail){let b=q(`Order #${a.orderNumber} Cancelled`,`
        <div style="margin-bottom: 20px;">
          <span class="badge badge-cancel">Order Cancelled &bull; 100% Refund Scheduled</span>
        </div>

        <h2 style="font-size: 20px; color: #0e1526; margin-top: 0;">Cancellation Confirmation</h2>
        <p>Dear ${a.customerName}, this email confirms that order <strong style="font-family: monospace;">#${a.orderNumber}</strong> has been cancelled.</p>

        <div class="card">
          <div class="card-title">Cancellation &amp; Refund Audit</div>
          <p style="margin: 0 0 6px 0;"><strong>Cancelled By:</strong> ${g}</p>
          <p style="margin: 0 0 6px 0;"><strong>Recorded Reason:</strong> &ldquo;${e}&rdquo;</p>
          <p style="margin: 0 0 6px 0;"><strong>Refund Amount:</strong> <span style="font-family: monospace; font-weight: bold; color: #065f46;">${h}</span></p>
          <p style="margin: 0; font-size: 12px; color: #718096;">Refunds are processed back to your original payment method within 3-5 business days depending on your bank.</p>
        </div>

        <p>If you have any questions or require assistance with alternative selections, our London team is at your disposal.</p>
        `);j.push(n({to:a.customerEmail,subject:`SAN Furniture: Order #${a.orderNumber} Cancellation & Full Refund Confirmation`,html:b,text:`SAN Furniture: Order #${a.orderNumber} has been cancelled (${e}). A 100% full refund (${h}) has been scheduled.`}))}d&&a.customerPhone&&j.push(o({to:a.customerPhone,message:`SAN Furniture: Order #${a.orderNumber} has been cancelled. A 100% refund is scheduled to your payment card within 3-5 business days.`}));let k=await Promise.race([Promise.allSettled(j),new Promise((a,b)=>setTimeout(()=>b(Error("Notification dispatch timed out")),8e3))]);return{emailSent:k[0]?.status==="fulfilled"&&k[0].value?.success,smsSent:k[1]?.status==="fulfilled"&&k[1].value?.success}}catch(a){return console.warn("[Notifications] Cancel dispatch error:",a?.message||a),{error:a?.message||String(a)}}}async function v(a){try{let b=await i();if(!l(b)||!a.email)return{emailSent:!1,error:"Email notifications are disabled or recipient is empty"};let c=a.firstName?.trim()||"Valued Client",d=a.expiresInMinutes||60,e=q("Reset Your SAN Furniture Password",`
      <h2 style="font-size: 20px; color: #0e1526; margin-top: 0;">Password Reset Request</h2>
      <p>Hello ${c},</p>
      <p>We received a request to reset the password for your <strong>SAN Furniture</strong> customer account associated with <strong>${a.email}</strong>.</p>
      
      <div class="card">
        <div class="card-title">Security & Verification Notice</div>
        <p style="margin: 0 0 8px 0;">This password reset link is cryptographically protected and valid for <strong>${d} minutes</strong>.</p>
        <p style="margin: 0; color: #718096; font-size: 12px;">If you did not request this change, please ignore this email. Your existing password remains completely secure.</p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${a.resetUrl}" class="button" style="background-color: #0e1526; color: #fbf8f3 !important; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block;">
          Reset My Password
        </a>
      </div>

      <p style="font-size: 12px; color: #718096; word-break: break-all; margin-top: 24px;">
        If the button above does not work, copy and paste the following URL into your browser:<br/>
        <a href="${a.resetUrl}" style="color: #0e1526;">${a.resetUrl}</a>
      </p>
      `),f=await n({to:a.email,subject:"Reset Your SAN Furniture Account Password",html:e,text:`Hello ${c},

We received a request to reset your password. Use the link below to set a new password (valid for ${d} minutes):

${a.resetUrl}

If you did not request this, you can safely ignore this email.`});return await k({recipientType:"customer",recipientId:a.email,type:"password_reset_requested",title:"Password Reset Link Dispatched",message:`Password reset link sent to ${a.email}`,metadata:{to:a.email,resetUrl:a.resetUrl}}),{emailSent:f.success,error:f.error}}catch(a){return console.warn("[Notifications] Password reset dispatch error:",a?.message||a),{error:a?.message||String(a)}}}async function w(a){try{let b=await i();if(!l(b)||!a.email)return{emailSent:!1};let c=a.firstName?.trim()||"Valued Client",d=p(),e=q("Your SAN Furniture Password Was Changed",`
      <h2 style="font-size: 20px; color: #0e1526; margin-top: 0;">Password Successfully Updated</h2>
      <p>Hello ${c},</p>
      <p>The password for your <strong>SAN Furniture</strong> account (<strong>${a.email}</strong>) has been successfully updated.</p>
      
      <div class="card">
        <div class="card-title">Security Confirmation</div>
        <p style="margin: 0;">Your new password is now active. If you performed this update, no further action is required.</p>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${d}/account/login" class="button">Log In to Your Account</a>
      </div>

      <p style="font-size: 12px; color: #e53e3e; margin-top: 20px;">
        <strong>Didn't make this change?</strong> Please contact our London Concierge immediately at <a href="mailto:support@sanfurniture.co.uk" style="color: #c53030;">support@sanfurniture.co.uk</a> to secure your account.
      </p>
      `),f=await n({to:a.email,subject:"Security Alert: SAN Furniture Account Password Changed",html:e,text:`Hello ${c},

Your SAN Furniture account password has been successfully updated. If you did not make this change, please contact support@sanfurniture.co.uk immediately.`});return await k({recipientType:"customer",recipientId:a.email,type:"password_changed",title:"Password Changed Confirmation Dispatched",message:`Password changed alert sent to ${a.email}`,metadata:{to:a.email}}),{emailSent:f.success,error:f.error}}catch(a){return console.warn("[Notifications] Password changed dispatch error:",a?.message||a),{error:a?.message||String(a)}}}},99972:a=>{function b(a){var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b}b.keys=()=>[],b.resolve=b,b.id=99972,a.exports=b}};