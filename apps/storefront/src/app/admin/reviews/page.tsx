"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Trash2,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Sparkles
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { apiUrl } from "@/lib/api-config";
import { fetchWithSwr, invalidateCache } from "@/lib/api-cache";

interface ReviewItem {
  id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: number;
  room_image_url?: string;
  status: string;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      fetchWithSwr(
        apiUrl("/api/admin/reviews"),
        (data: any, isCached) => {
          if (data.reviews) {
            setReviews(data.reviews);
            setLoading(false);
          }
        }
      ).finally(() => setLoading(false));
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (reviewId: string, nextStatus: string) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/reviews/${reviewId}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      invalidateCache("/api/admin/reviews");
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: nextStatus } : r))
      );
      setSuccessMessage(`Review ${reviewId} marked as "${nextStatus}".`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert("Error updating review: " + err.message);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm(`Are you sure you want to delete review "${reviewId}"?`)) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/reviews/${reviewId}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete review");

      invalidateCache("/api/admin/reviews");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setSuccessMessage(`Review ${reviewId} removed from database.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert("Error deleting review: " + err.message);
    }
  };

  const columns: ColumnDef<ReviewItem>[] = useMemo(
    () => [
      {
        key: "customer_name",
        header: "Reviewer & Contact",
        sortable: true,
        cell: (r) => (
          <div>
            <p className="font-semibold text-navy-950">{r.customer_name}</p>
            <span className="text-[10px] text-navy-500 font-mono">{r.customer_email}</span>
          </div>
        ),
      },
      {
        key: "product_id",
        header: "Product SKU",
        sortable: true,
        cell: (r) => (
          <span className="font-mono text-xs text-brass-800 font-bold bg-sand-200/50 px-2 py-0.5 rounded">
            {r.product_id}
          </span>
        ),
      },
      {
        key: "rating",
        header: "Rating",
        sortable: true,
        cell: (r) => (
          <div className="flex items-center gap-0.5 text-brass-500">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < r.rating ? "fill-brass-400 text-brass-400" : "text-sand-300"
                }`}
              />
            ))}
          </div>
        ),
      },
      {
        key: "comment",
        header: "Headline & Feedback",
        cell: (r) => (
          <div className="max-w-md">
            <p className="font-bold text-navy-950 text-xs">{r.title}</p>
            <p className="text-navy-700 text-xs mt-0.5 line-clamp-2 leading-relaxed">{r.comment}</p>
          </div>
        ),
      },
      {
        key: "verified_purchase",
        header: "Verification",
        cell: (r) => (
          Boolean(r.verified_purchase) ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified UK Buyer
            </span>
          ) : (
            <span className="text-[10px] text-navy-500">Unverified</span>
          )
        ),
      },
      {
        key: "status",
        header: "Moderation Status",
        sortable: true,
        cell: (r) => {
          if (r.status === "published") {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Live on Site
              </span>
            );
          }
          if (r.status === "rejected") {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full">
                <XCircle className="w-3 h-3 text-red-600" />
                Rejected
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Pending
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "Moderation Actions",
        cell: (r) => (
          <div className="flex items-center justify-end gap-1.5">
            {r.status !== "published" && (
              <button
                type="button"
                onClick={() => handleUpdateStatus(r.id, "published")}
                className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors"
                title="Approve & Publish to Storefront"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
            )}
            {r.status !== "rejected" && (
              <button
                type="button"
                onClick={() => handleUpdateStatus(r.id, "rejected")}
                className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50 transition-colors"
                title="Reject Review"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDeleteReview(r.id)}
              className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
              title="Delete review"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <div className="space-y-6">
      {/* Header */}
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
            Moderate customer feedback &bull; Automated Schema.org AggregateRating sync &bull; Verified UK Buyer badges
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Total Feedback</span>
          <p className="text-2xl font-display font-bold text-navy-950 mt-1">{reviews.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Average Rating</span>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-2xl font-display font-bold text-navy-950">{avgRating}</p>
            <Star className="w-4 h-4 fill-brass-500 text-brass-500" />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Published Live</span>
          <p className="text-2xl font-display font-bold text-emerald-700 mt-1">
            {reviews.filter((r) => r.status === "published").length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 shadow-sm">
          <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">Database Source</span>
          <p className="text-sm font-mono font-bold text-navy-900 mt-2">MySQL / customer_reviews</p>
        </div>
      </div>

      {/* Advanced DataTable */}
      <DataTable
        data={reviews}
        columns={columns}
        keyExtractor={(r) => r.id}
        title="Customer Reviews Queue"
        subtitle="Approve or decline customer testimonials before publishing to product landing pages"
        searchPlaceholder="Search reviewer, SKU, comment text..."
        loading={loading}
        onRefresh={fetchReviews}
        exportFileName="san_furniture_reviews"
      />
    </div>
  );
}
