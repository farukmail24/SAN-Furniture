"use client";

import React, { useState } from "react";
import {
  Rss,
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Download,
  ShoppingBag,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Tag
} from "lucide-react";

export default function AdminMarketingPage() {
  const [copiedFeed, setCopiedFeed] = useState<string | null>(null);

  const googleFeedUrl = "http://localhost:9000/api/feeds/google-merchant.xml";
  const metaFeedUrl = "http://localhost:9000/api/feeds/meta-catalog.csv";

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFeed(id);
    setTimeout(() => setCopiedFeed(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E2D5]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C89B3C] mb-1">
            <Share2 className="w-4 h-4" />
            <span>Growth & Social Commerce Feeds</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#0B132B]">
            Google & Meta Product Catalogs
          </h1>
          <p className="text-sm text-[#4F6D7A] mt-1">
            Automated syndicated product feeds for Google Shopping UK and Meta / Instagram Commerce with live UK VAT & GTINs.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E8E2D5] shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4F6D7A]">
            <span>Google Shopping UK</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-serif text-[#0B132B] mt-2">XML RSS 2.0</div>
          <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Tax & Shipping Compliant
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8E2D5] shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4F6D7A]">
            <span>Meta Commerce (IG/FB)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-serif text-[#0B132B] mt-2">CSV Catalog</div>
          <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Dynamic Product Ads (DPA) Ready
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E8E2D5] shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#4F6D7A]">
            <span>Meta CAPI Match Score</span>
            <TrendingUp className="w-4 h-4 text-[#C89B3C]" />
          </div>
          <div className="text-2xl font-serif text-[#0B132B] mt-2">8.8 / 10</div>
          <div className="text-xs text-[#4F6D7A] mt-1">
            SHA-256 hashed emails & postcodes
          </div>
        </div>
      </div>

      {/* Feeds Detail Cards */}
      <div className="grid grid-cols-1 gap-5">
        {/* Google Merchant Center */}
        <div className="bg-white p-6 rounded-xl border border-[#E8E2D5] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                G
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-[#0B132B]">
                  Google Merchant Center Feed (XML)
                </h2>
                <p className="text-xs text-[#4F6D7A]">
                  Primary feed format required for Google Free Listings and Performance Max campaigns in Great Britain.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(googleFeedUrl, "google")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E8E2D5] hover:bg-[#F4F1EA] text-[#0B132B] rounded-lg text-xs font-semibold transition-colors"
              >
                {copiedFeed === "google" ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <a
                href={googleFeedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <span>Open XML Feed</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E8E2D5] font-mono text-xs text-[#0B132B] break-all">
            {googleFeedUrl}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#4F6D7A] pt-2">
            <div>• Currency: <strong>GBP (£)</strong></div>
            <div>• Tax included: <strong>20% UK VAT</strong></div>
            <div>• Shipping: <strong>2-Man White Glove</strong></div>
          </div>
        </div>

        {/* Meta / Instagram Catalog */}
        <div className="bg-white p-6 rounded-xl border border-[#E8E2D5] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                M
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-[#0B132B]">
                  Meta / Instagram Commerce Catalog (CSV)
                </h2>
                <p className="text-xs text-[#4F6D7A]">
                  Scheduled catalog upload for Instagram Shop tagging and Facebook Advantage+ catalog ads.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(metaFeedUrl, "meta")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E8E2D5] hover:bg-[#F4F1EA] text-[#0B132B] rounded-lg text-xs font-semibold transition-colors"
              >
                {copiedFeed === "meta" ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <a
                href={metaFeedUrl}
                download="san_furniture_meta_catalog.csv"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </a>
            </div>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E8E2D5] font-mono text-xs text-[#0B132B] break-all">
            {metaFeedUrl}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#4F6D7A] pt-2">
            <div>• Availability: <strong>in_stock</strong></div>
            <div>• Condition: <strong>new</strong></div>
            <div>• Brand: <strong>SAN Furniture</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
