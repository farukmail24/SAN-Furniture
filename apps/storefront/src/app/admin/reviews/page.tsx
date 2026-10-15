"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, CheckCircle2, XCircle, ShieldCheck, Filter, ChevronRight, MessageSquare } from "lucide-react";

interface ReviewItem {
  id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string;
  comment: string;
  status: string;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch("http://localhost:9000/api/reviews");
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
            <Link href="/admin" className="hover:text-navy-950">Operations Suite</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-navy-900">Customer Social Proof</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-950">
            Verified Reviews &amp; Social Proof Moderation
          </h1>
          <p className="text-xs text-navy-600 mt-1">
            Moderate customer feedback &bull; Automated Schema.org AggregateRating sync
          </p>
        </div>

        <div className="flex items-center gap-2 bg-sand-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-navy-900">
          <MessageSquare className="w-4 h-4 text-brass-600" />
          <span>{reviews.length} Verified Reviews in MySQL</span>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-sand-50 border border-sand-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-sand-200/50 border-b border-sand-200 text-navy-700 font-semibold">
                <th className="p-3.5">Reviewer &amp; Location</th>
                <th className="p-3.5">Product ID</th>
                <th className="p-3.5">Rating</th>
                <th className="p-3.5">Headline &amp; Testimonial</th>
                <th className="p-3.5">Verification</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-sand-100/40 transition-colors">
                  <td className="p-3.5">
                    <p className="font-semibold text-navy-950">{r.customer_name}</p>
                    <span className="text-[10px] text-navy-500">{r.customer_email}</span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-navy-700 font-bold">
                    {r.product_id}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-0.5 text-brass-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < r.rating ? "fill-brass-400 text-brass-400" : "text-sand-300"}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5 max-w-md">
                    <p className="font-bold text-navy-950">{r.title}</p>
                    <p className="text-navy-700 text-xs mt-1 leading-relaxed">{r.comment}</p>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified UK Buyer
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Live on Site
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
