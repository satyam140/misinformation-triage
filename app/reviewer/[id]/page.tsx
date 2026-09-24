"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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

const statusLabels: Record<string, string> = {
  unverified: "Unverified",
  true: "Verified True",
  false: "False",
  misleading: "Misleading",
};

export default function ReviewClaimPage() {
  const params = useParams();
  const router = useRouter();

  const claimId = params.id as string;

  const [claim, setClaim] = useState<Claim | null>(null);
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [existingReview, setExistingReview] =
    useState<Review | null>(null);

  const [decision, setDecision] = useState<
    "true" | "false" | "misleading" | ""
  >("");

  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load claim directly without authentication
  useEffect(() => {
    if (claimId) {
      loadClaim();
    }
  }, [claimId]);

  async function loadClaim() {
    setLoading(true);
    setError("");

    const { data: claimData, error: claimError } =
      await supabase
        .from("claims")
        .select("*")
        .eq("id", claimId)
        .single();

    if (claimError) {
      console.error(claimError);
      setError("Unable to load this claim.");
      setLoading(false);
      return;
    }

    const { data: flagData, error: flagError } = await supabase
      .from("risk_flags")
      .select("*")
      .eq("claim_id", claimId);

    if (flagError) {
      console.error(flagError);
    }

    const { data: reviewData, error: reviewError } =
      await supabase
        .from("reviews")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: false })
        .limit(1);

    if (reviewError) {
      console.error(reviewError);
    }

    setClaim(claimData);
    setFlags(flagData || []);
    setExistingReview(reviewData?.[0] || null);

    setLoading(false);
  }

  async function handleSubmit() {
    setError("");

    if (!decision) {
      setError("Please select a verification decision.");
      return;
    }

    if (!note.trim()) {
      setError("Please write a short reviewer note.");
      return;
    }

    if (!claim) {
      setError("Claim data is missing.");
      return;
    }

    /*
      Re-check the claim immediately before saving.

      This prevents a reviewer from submitting a second
      review if the claim was reviewed in another tab/window.
    */
    const { data: latestClaim, error: latestClaimError } =
      await supabase
        .from("claims")
        .select("status")
        .eq("id", claim.id)
        .single();

    if (latestClaimError) {
      console.error(latestClaimError);
      setError("Unable to verify the current claim status.");
      return;
    }

    if (latestClaim.status !== "unverified") {
      setError(
        `This claim has already been reviewed as "${statusLabels[latestClaim.status]}".`
      );

      await loadClaim();
      return;
    }

    setSubmitting(true);

    const { error: reviewError } = await supabase
      .from("reviews")
      .insert({
        claim_id: claim.id,
        decision,
        note: note.trim(),
      });

    if (reviewError) {
      console.error(reviewError);
      setError("Unable to save the review.");
      setSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("claims")
      .update({
        status: decision,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", claim.id)
      .eq("status", "unverified");

    if (updateError) {
      console.error(updateError);
      setError(
        "Review was saved, but the claim status could not be updated."
      );
      setSubmitting(false);
      return;
    }

    router.push(`/claims/${claim.id}`);
  }

  function getFlagLabel(flagType: RiskFlag["flag_type"]) {
    if (flagType === "sensational") {
      return "Sensational wording";
    }

    if (flagType === "shouting") {
      return "Excessive uppercase";
    }

    return "No source link";
  }

  function getDecisionStyle(decision: Review["decision"]) {
    if (decision === "true") {
      return "border-green-500/30 bg-green-500/10 text-green-300";
    }

    if (decision === "false") {
      return "border-red-500/30 bg-red-500/10 text-red-300";
    }

    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  }

  if (loading) {
    return (
      <main className="review-room min-h-screen">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="review-panel p-10 text-center text-slate-400">
            Loading claim...
          </div>
        </div>
      </main>
    );
  }

  if (error && !claim) {
    return (
      <main className="review-room min-h-screen">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="review-panel border-red-800 bg-red-950/30 p-8 text-center">
            <p className="text-red-300">{error}</p>

            <Link
              href="/reviewer"
              className="mt-6 inline-flex rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950"
            >
              Back to Reviewer Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!claim) {
    return null;
  }

  const alreadyReviewed = claim.status !== "unverified";

  return (
    <main className="review-room min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#12201c]/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link
            href="/reviewer"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft size={17} />
            Reviewer Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <ShieldCheck
              size={20}
              className="text-cyan-400"
            />

            <span className="font-semibold">
              Review Claim
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">
            Verification Review
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Review submitted claim
          </h1>

          <p className="mt-3 text-slate-400">
            Review the available information and assign a neutral
            verification status.
          </p>
        </div>

        {/* Already reviewed notice */}
        {alreadyReviewed && (
          <section className="mb-6 border border-green-500/20 bg-green-500/5 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle
                size={20}
                className="mt-0.5 shrink-0 text-green-400"
              />

              <div>
                <p className="font-semibold text-green-300">
                  This claim has already been reviewed
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  This claim is no longer available for a new
                  verification decision.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Claim */}
        <section className="review-panel p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-300">
              {statusLabels[claim.status]}
            </span>

            {claim.risk_level === "high" && (
              <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                <AlertTriangle size={13} />
                High Risk
              </span>
            )}
          </div>

          <p className="text-xl leading-8 text-white">
            {claim.claim_text}
          </p>

          <div className="mt-6 grid gap-4 border-t border-slate-800 pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Platform
              </p>

              <p className="mt-1 font-medium">
                {claim.platform}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Category
              </p>

              <p className="mt-1 font-medium">
                {claim.category}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Submitted
              </p>

              <p className="mt-1 font-medium">
                {new Date(
                  claim.created_at
                ).toLocaleString()}
              </p>
            </div>
          </div>

          {claim.source_url && (
            <div className="mt-5 border-t border-slate-800 pt-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Source
              </p>

              <a
                href={claim.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block break-all text-cyan-400 hover:underline"
              >
                {claim.source_url}
              </a>
            </div>
          )}
        </section>

        {/* Risk Flags */}
        <section className="review-panel mt-6 p-6">
          <h2 className="text-lg font-bold">
            Risk Flags
          </h2>

          {flags.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No automatic risk flags detected.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              {flags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  <AlertTriangle size={16} />
                  {getFlagLabel(flag.flag_type)}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Existing Review */}
        {alreadyReviewed && (
          <section className="review-panel mt-6 p-6">
            <h2 className="text-lg font-bold">
              Existing Review
            </h2>

            {existingReview ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`border px-3 py-1.5 text-xs font-bold ${getDecisionStyle(
                      existingReview.decision
                    )}`}
                  >
                    {statusLabels[existingReview.decision]}
                  </span>

                  <span className="text-xs text-slate-500">
                    {new Date(
                      existingReview.created_at
                    ).toLocaleString()}
                  </span>
                </div>

                <div className="mt-5 border-t border-slate-800 pt-5">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Reviewer Note
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {existingReview.note}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                The claim has a completed status, but no review
                record was found.
              </p>
            )}

            <Link
              href={`/claims/${claim.id}`}
              className="mt-6 inline-flex border border-white/20 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white hover:text-white"
            >
              View public claim record
            </Link>
          </section>
        )}

        {/* Decision */}
        {!alreadyReviewed && (
          <section className="review-panel mt-6 p-6">
            <h2 className="text-lg font-bold">
              Verification Decision
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Select the status supported by the available evidence.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setDecision("true")}
                className={`review-choice p-4 text-left ${
                  decision === "true"
                    ? "border-green-400 bg-green-500/10 text-green-300"
                    : "text-white"
                }`}
              >
                <p className="font-bold">
                  Verified True
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Evidence supports the claim.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDecision("false")}
                className={`review-choice p-4 text-left ${
                  decision === "false"
                    ? "border-red-400 bg-red-500/10 text-red-300"
                    : "text-white"
                }`}
              >
                <p className="font-bold">
                  False
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Evidence contradicts the claim.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDecision("misleading")}
                className={`review-choice p-4 text-left ${
                  decision === "misleading"
                    ? "border-yellow-400 bg-yellow-500/10 text-yellow-300"
                    : "text-white"
                }`}
              >
                <p className="font-bold">
                  Misleading
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  The claim lacks important context.
                </p>
              </button>
            </div>

            {/* Note */}
            <div className="mt-6">
              <label
                htmlFor="review-note"
                className="mb-2 block text-sm font-semibold"
              >
                Reviewer Note
              </label>

              <textarea
                id="review-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Briefly explain the evidence or reasoning behind the decision..."
                rows={5}
                className="review-input w-full resize-none px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[var(--lime)]"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-6 w-full bg-[var(--lime)] px-5 py-3 font-bold text-[var(--ink)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Saving Review..."
                : "Submit Review"}
            </button>
          </section>
        )}

        {/* Back button */}
        <div className="mt-8">
          <Link
            href="/reviewer"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to reviewer dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}