import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <span className="text-xs uppercase tracking-widest text-brass-600 font-semibold">
        Page Not Found
      </span>
      <h1 className="mt-2 text-4xl font-display font-bold text-navy-950 sm:text-5xl">
        404 – Item Unavailable
      </h1>
      <p className="mt-4 text-sm text-navy-600 max-w-md mx-auto">
        The furniture piece, category, or page you were searching for has moved or is no longer in our current catalogue.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-navy-950 text-sand-50 text-sm font-medium hover:bg-navy-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-sand-100 border border-sand-300 text-navy-950 text-sm font-medium hover:bg-sand-200 transition-colors"
        >
          Browse All Furniture
        </Link>
      </div>
    </div>
  );
}
