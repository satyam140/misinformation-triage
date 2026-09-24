"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Claim = {
  id: string;
  claim_text: string;
  platform: string;
  category: string;
  source_url: string | null;
  status: "unverified" | "true" | "false" | "misleading";
  risk_level: "normal" | "high";
  created_at: string;
  reviewed_at: string | null;
};

type RiskFlag = {
  id: string;
  flag_type: "sensational" | "shouting" | "unsourced";
};

type Review = {
  id: string;
  decision: "true" | "false" | "misleading";
  note: string;
  created_at: string;
};

const flagLabels: Record<string, string> = {
  sensational: "Sensational language",
  shouting: "Excessive capitalization",
  unsourced: "No source link provided",
};

const flagDescriptions: Record<string, string> = {
  sensational: "Contains language commonly used to create urgency or alarm.",
  shouting: "More than half of the alphabetic characters are uppercase.",
  unsourced: "No source URL was included with the submission.",
};

const statusLabels: Record<string, string> = {
  unverified: "Unverified",
  true: "Verified True",
  false: "False",
  misleading: "Misleading",
};

function getStatusClass(status: Claim["status"]) {
  switch (status) {
    case "true":
      return "border-green-200 bg-green-50 text-green-700";
    case "false":
      return "border-red-200 bg-red-50 text-red-700";
    case "misleading":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getReviewClass(decision: Review["decision"]) {
  switch (decision) {
    case "true":
      return "border-green-200 bg-green-50 text-green-700";
    case "false":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default function ClaimDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [claim, setClaim] = useState<Claim | null>(null);
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadClaim() {
    setLoading(true);
    setError("");

    try {
      const { data: claimData, error: claimError } = await supabase
        .from("claims")
        .select("*")
        .eq("id", id)
        .single();

      if (claimError) {
        throw claimError;
      }

      const { data: flagData, error: flagError } = await supabase
        .from("risk_flags")
        .select("*")
        .eq("claim_id", id);

      if (flagError) {
        throw flagError;
      }

      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("*")
        .eq("claim_id", id)
        .order("created_at", { ascending: false });

      if (reviewError) {
        throw reviewError;
      }

      setClaim(claimData);
      setFlags(flagData || []);
      setReviews(reviewData || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load this claim.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadClaim();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="news-shell min-h-screen text-slate-900">
        <header className="news-header border-b">
          <div className="mx-auto max-w-6xl px-6 py-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Back to claims
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm text-slate-500">Loading claim...</p>
        </div>
      </main>
    );
  }

  if (error || !claim) {
    return (
      <main className="news-shell min-h-screen text-slate-900">
        <header className="news-header border-b">
          <div className="mx-auto max-w-6xl px-6 py-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Back to claims
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-medium">
              {error || "Claim not found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="news-shell min-h-screen text-slate-900">
      {/* Header */}
      <header className="news-header border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="brand-mark flex h-9 w-9 items-center justify-center text-white">
              <ShieldCheck size={19} />
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight">
                CivicCheck
              </p>
              <p className="text-[11px] text-slate-500">
                Claim Verification
              </p>
            </div>
          </Link>

          <Link
            href="/submit"
            className="border border-slate-300 bg-[var(--paper)] px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-900"
          >
            Submit a claim
          </Link>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={15} />
          Back to public claims
        </Link>

        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Public record
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Claim details
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                A transparent record of the submitted claim, automated
                risk signals, and human review.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`border px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                  claim.status
                )}`}
              >
                {statusLabels[claim.status]}
              </span>

              {claim.risk_level === "high" ? (
                <span className="flex items-center gap-1.5 border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                  <AlertTriangle size={13} />
                  High risk
                </span>
              ) : (
                <span className="border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Normal risk
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main column */}
          <div className="space-y-6">
            {/* Claim */}
            <section className="news-card">
              <div className="border-b border-slate-200 px-6 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  Submitted claim
                </p>
              </div>

              <div className="px-6 py-7 sm:px-8">
                <p className="whitespace-pre-wrap text-xl font-medium leading-9 tracking-tight text-slate-950 sm:text-2xl">
                  {claim.claim_text}
                </p>

                <div className="mt-8 grid border-t border-slate-200 pt-6 sm:grid-cols-3">
                  <div className="border-b border-slate-200 pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Platform
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {claim.platform}
                    </p>
                  </div>

                  <div className="border-b border-slate-200 py-4 sm:border-b-0 sm:border-r sm:px-5 sm:py-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Category
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {claim.category}
                    </p>
                  </div>

                  <div className="pt-4 sm:pl-5 sm:pt-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Submitted
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <Clock size={14} />
                      {new Date(claim.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {claim.source_url && (
                  <div className="mt-6 border-t border-slate-200 pt-6">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Source
                    </p>

                    <a
                      href={claim.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-2 break-all text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
                    >
                      {claim.source_url}
                      <ExternalLink
                        size={14}
                        className="shrink-0"
                      />
                    </a>
                  </div>
                )}
              </div>
            </section>

            {/* Risk flags */}
            <section className="news-card">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                    Automated triage
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-950">
                    Risk signals
                  </h2>
                </div>

                <ShieldAlert
                  size={20}
                  className="text-slate-400"
                />
              </div>

              <div className="px-6 py-6">
                {flags.length === 0 ? (
                  <div className="flex items-start gap-3 border border-green-200 bg-green-50 p-4">
                    <CheckCircle
                      size={18}
                      className="mt-0.5 shrink-0 text-green-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        No automatic risk signals detected
                      </p>

                      <p className="mt-1 text-xs leading-5 text-green-700">
                        This does not establish whether the claim is
                        true or false. It only means these basic
                        triage signals were not detected.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {flags.map((flag) => (
                      <div
                        key={flag.id}
                        className="flex items-start gap-3 border border-slate-200 p-4"
                      >
                        <AlertTriangle
                          size={17}
                          className="mt-0.5 shrink-0 text-amber-600"
                        />

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {flagLabels[flag.flag_type]}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {flagDescriptions[flag.flag_type]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Overall triage level
                    </p>

                    <p
                      className={`mt-1 text-sm font-bold ${
                        claim.risk_level === "high"
                          ? "text-red-700"
                          : "text-green-700"
                      }`}
                    >
                      {claim.risk_level === "high"
                        ? "HIGH RISK"
                        : "NORMAL RISK"}
                    </p>
                  </div>

                  <p className="max-w-[220px] text-right text-xs leading-5 text-slate-400">
                    Risk signals support review prioritization; they are
                    not a fact-check result.
                  </p>
                </div>
              </div>
            </section>

            {/* Review history */}
            <section className="news-card">
              <div className="border-b border-slate-200 px-6 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  Human review
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  Review history
                </h2>
              </div>

              <div className="px-6 py-6">
                {reviews.length === 0 ? (
                  <div className="border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-semibold text-amber-800">
                      This claim has not been reviewed yet.
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-700">
                      It remains publicly visible with an Unverified
                      status until a reviewer records a decision.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {reviews.map((review, index) => (
                      <div
                        key={review.id}
                        className="border-l-2 border-slate-200 pl-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span
                            className={`border px-3 py-1 text-xs font-bold ${getReviewClass(
                              review.decision
                            )}`}
                          >
                            {statusLabels[review.decision]}
                          </span>

                          <span className="text-xs text-slate-400">
                            {new Date(
                              review.created_at
                            ).toLocaleString()}
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          {review.note}
                        </p>

                        {index === 0 && (
                          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Latest review
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Status */}
            <section className="news-card">
              <div className="border-b border-slate-200 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  Current status
                </p>
              </div>

              <div className="px-5 py-5">
                <span
                  className={`inline-flex border px-3 py-1.5 text-sm font-bold ${getStatusClass(
                    claim.status
                  )}`}
                >
                  {statusLabels[claim.status]}
                </span>

                {claim.reviewed_at && (
                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    Last reviewed{" "}
                    {new Date(claim.reviewed_at).toLocaleString()}
                  </p>
                )}
              </div>
            </section>

            {/* About */}
            <section className="news-card">
              <div className="border-b border-slate-200 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  About this record
                </p>
              </div>

              <div className="space-y-4 px-5 py-5 text-sm leading-6 text-slate-600">
                <p>
                  CivicCheck separates automated triage from human
                  verification.
                </p>

                <p>
                  Risk flags identify signals that may deserve closer
                  review. They do not determine whether a claim is
                  factually correct.
                </p>

                <p>
                  Review decisions and notes are preserved as part of
                  the public record.
                </p>
              </div>
            </section>

            {/* Submit CTA */}
            <section className="hero-grid border border-slate-800 p-5 text-white">
              <p className="text-sm font-bold">
                Found another viral claim?
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Submit it to the public triage queue for review.
              </p>

              <Link
                href="/submit"
                className="mt-5 inline-flex w-full items-center justify-center border border-white/20 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
              >
                Submit a claim
              </Link>
            </section>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-[var(--paper)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            CivicCheck — a public record for viral claims.
          </p>

          <p>
            Automated signals are indicators, not proof.
          </p>
        </div>
      </footer>
    </main>
  );
}