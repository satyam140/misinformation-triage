"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Clock,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Claim = {
  id: string;
  claim_text: string;
  platform: string;
  category: string;
  status: "unverified" | "true" | "false" | "misleading";
  risk_level: "normal" | "high";
  created_at: string;
};

export default function ReviewerDashboard() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");

  useEffect(() => {
    loadClaims();
  }, []);

  async function loadClaims() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("claims")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError("Unable to load claims.");
    } else {
      setClaims(data || []);
    }

    setLoading(false);
  }

  const unverifiedClaims = claims.filter(
    (claim) => claim.status === "unverified"
  );

  const highRiskClaims = claims.filter(
    (claim) => claim.risk_level === "high"
  );

  // Apply reviewer filters
  const filteredClaims = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return unverifiedClaims.filter((claim) => {
      const matchesSearch =
        !searchText ||
        claim.claim_text.toLowerCase().includes(searchText) ||
        claim.platform.toLowerCase().includes(searchText) ||
        claim.category.toLowerCase().includes(searchText);

      const matchesCategory =
        categoryFilter === "All" ||
        claim.category === categoryFilter;

      const matchesRisk =
        riskFilter === "All" ||
        claim.risk_level === riskFilter;

      return matchesSearch && matchesCategory && matchesRisk;
    });
  }, [unverifiedClaims, search, categoryFilter, riskFilter]);

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryFilter !== "All" ||
    riskFilter !== "All";

  function clearFilters() {
    setSearch("");
    setCategoryFilter("All");
    setRiskFilter("All");
  }

  return (
    <main className="news-shell min-h-screen text-slate-900">
      {/* Header */}
      <header className="news-header border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="brand-mark flex h-9 w-9 items-center justify-center text-white">
              <ShieldCheck size={19} />
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight">
                CivicCheck
              </p>

              <p className="text-[11px] text-slate-500">
                Reviewer Workspace
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Public feed
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            <span className="signal-pulse h-2 w-2 rounded-full bg-emerald-500" />
            Review queue · live triage
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Claims awaiting review
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Review submitted claims and record a neutral
                verification decision based on available evidence.
              </p>
            </div>

            <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 bg-amber-500" />
              {unverifiedClaims.length} awaiting review
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="news-card p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total claims
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {claims.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              All submitted claims
            </p>
          </div>

          <div className="news-card p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Awaiting review
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight text-amber-700">
              {unverifiedClaims.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Claims requiring a decision
            </p>
          </div>

          <div className="news-card p-5">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <BarChart3 size={13} />
              High risk
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight text-red-700">
              {highRiskClaims.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Claims with multiple risk signals
            </p>
          </div>
        </div>

        {/* Filters */}
        {!loading && !error && unverifiedClaims.length > 0 && (
          <section className="mb-8 border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                    Queue filters
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Narrow the review queue by claim text, category, or
                    risk level.
                  </p>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-slate-500 hover:text-slate-950 sm:self-auto"
                  >
                    <X size={13} />
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_180px_160px]">
              {/* Search */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Search
                </label>

                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search claim text..."
                    className="w-full border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Category
                </label>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                >
                  <option value="All">All categories</option>
                  <option value="Politics">Politics</option>
                  <option value="Health">Health</option>
                  <option value="Finance">Finance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Risk */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Risk
                </label>

                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                >
                  <option value="All">All risk levels</option>
                  <option value="high">High risk</option>
                  <option value="normal">Normal risk</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredClaims.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {unverifiedClaims.length}
              </span>{" "}
              claims awaiting review.
            </div>
          </section>
        )}

        {/* Loading */}
        {loading && (
          <div className="news-card p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading review queue...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              onClick={loadClaims}
              className="mt-4 border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading &&
          !error &&
          unverifiedClaims.length === 0 && (
            <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center border border-green-200 bg-green-50 text-green-600">
                <ShieldCheck size={24} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-950">
                Review queue is clear
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are currently no unverified claims waiting
                for review.
              </p>
            </div>
          )}

        {/* No filter results */}
        {!loading &&
          !error &&
          unverifiedClaims.length > 0 &&
          filteredClaims.length === 0 && (
            <div className="border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center border border-slate-200 bg-slate-50 text-slate-500">
                <Search size={22} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-950">
                No matching claims
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try changing your search or clearing one of the
                filters.
              </p>

              <button
                onClick={clearFilters}
                className="mt-5 border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-950"
              >
                Clear filters
              </button>
            </div>
          )}

        {/* Review queue */}
        {!loading &&
          !error &&
          filteredClaims.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  Pending claims
                </p>

                <p className="text-xs text-slate-400">
                  Newest first
                </p>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 bg-[var(--paper)]">
                {filteredClaims.map((claim) => (
                  <Link
                    key={claim.id}
                    href={`/reviewer/${claim.id}`}
                    className="group block p-6 transition hover:bg-emerald-50/40"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        {/* Labels */}
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                            Unverified
                          </span>

                          {claim.risk_level === "high" && (
                            <span className="flex items-center gap-1 border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700">
                              <AlertTriangle size={12} />
                              High risk
                            </span>
                          )}

                          <span className="border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                            {claim.category}
                          </span>
                        </div>

                        {/* Claim text */}
                        <p className="max-w-4xl text-lg font-semibold leading-7 tracking-tight text-slate-900 transition group-hover:text-slate-700">
                          {claim.claim_text}
                        </p>

                        {/* Metadata */}
                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-400">
                          <span>{claim.platform}</span>

                          <span aria-hidden="true">·</span>

                          <span className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {new Date(
                              claim.created_at
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Review action */}
                      <div className="shrink-0">
                        <span className="inline-flex items-center border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white">
                          Review
                          <span className="ml-2 transition-transform group-hover:translate-x-0.5">
                            →
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>CivicCheck — reviewer workspace.</p>

          <p>
            Automated risk signals support triage; reviewers make the
            verification decision.
          </p>
        </div>
      </footer>
    </main>
  );
}