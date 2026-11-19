"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import type { StorefrontTrackingSettings } from "@/lib/tracking-server";

const CONSENT_STORAGE_KEY = "san_cookie_consent_v1";

interface CookieConsentState {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function StorefrontAnalytics({
  tracking,
}: {
  tracking: StorefrontTrackingSettings;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const [mounted, setMounted] = useState(false);

  const [consent, setConsent] = useState<CookieConsentState>({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConsent({
          essential: true,
          functional: Boolean(parsed.functional),
          analytics: Boolean(parsed.analytics),
          marketing: Boolean(parsed.marketing),
        });
      }
    } catch {}

    const onConsentUpdated = (e: any) => {
      if (e?.detail) {
        setConsent({
          essential: true,
          functional: Boolean(e.detail.functional),
          analytics: Boolean(e.detail.analytics),
          marketing: Boolean(e.detail.marketing),
        });
      }
    };

    window.addEventListener("san:consent-updated", onConsentUpdated);
    return () => window.removeEventListener("san:consent-updated", onConsentUpdated);
  }, []);

  // Never execute on SSR or internal admin routes
  if (!mounted || isAdminRoute) {
    return null;
  }

  const {
    gtm_enabled,
    gtm_container_id,
    ga4_enabled,
    ga4_measurement_id,
    meta_pixel_enabled,
    meta_pixel_id,
  } = tracking;

  const cleanGtmId = gtm_container_id ? gtm_container_id.trim() : "";
  const cleanGa4Id = ga4_measurement_id ? ga4_measurement_id.trim() : "";
  const cleanMetaPixelId = meta_pixel_id ? meta_pixel_id.trim() : "";

  return (
    <>
      {/* 1. Google Tag Manager (GTM) */}
      {gtm_enabled && cleanGtmId && (
        <>
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${cleanGtmId}');`,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${cleanGtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      )}

      {/* 2. Google Analytics 4 (GA4) Direct Fallback */}
      {ga4_enabled && cleanGa4Id && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${cleanGa4Id}`}
          />
          <Script
            id="google-analytics-ga4"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${cleanGa4Id}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true
                });
              `,
            }}
          />
        </>
      )}

      {/* 3. Meta (Facebook) Pixel */}
      {meta_pixel_enabled && cleanMetaPixelId && (
        <>
          <Script
            id="meta-pixel-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${cleanMetaPixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${cleanMetaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
    </>
  );
}
