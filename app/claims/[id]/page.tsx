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
  Pencil,
  Save,
  ShieldAlert,
  ShieldCheck,
  X,
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

type ClaimVersion = {
  id: string;
  claim_id: string;
  claim_text: string;
  platform: string;
  category: string;
  source_url: string | null;
  status: Claim["status"];
  risk_level: Claim["risk_level"];
  created_at: string;
};

const flagLabels: Record<string, string> = {
  sensational: "Sensational language",
  shouting: "Excessive capitalization",
  unsourced: "No source link provided",
};

const flagDescriptions: Record<string, string> = {
  sensational:
    "Contains language commonly used to create urgency or alarm.",
  shouting:
    "More than half of the alphabetic characters are uppercase.",
  unsourced:
    "No source URL was included with the submission.",
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

function analyzeRisk(claimText: string, sourceUrl: string) {
  const flags: (
    | "sensational"
    | "shouting"
    | "unsourced"
  )[] = [];

  const lowerText = claimText.toLowerCase();

  if (
    lowerText.includes("breaking") ||
    lowerText.includes("shocking") ||
    lowerText.includes("share before deleted")
  ) {
    flags.push("sensational");
  }

  const letters = claimText.match(/[a-zA-Z]/g) || [];
  const uppercaseLetters = claimText.match(/[A-Z]/g) || [];

  if (
    letters.length > 0 &&
    uppercaseLetters.length / letters.length > 0.5
  ) {
    flags.push("shouting");
  }

  if (!sourceUrl.trim()) {
    flags.push("unsourced");
  }

  const riskLevel =
    flags.length >= 2 ? "high" : "normal";

  return {
    flags,
    riskLevel,
  };
}

export default function ClaimDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [claim, setClaim] = useState<Claim | null>(null);
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [versions, setVersions] = useState<ClaimVersion[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [editClaimText, setEditClaimText] = useState("");
  const [editPlatform, setEditPlatform] = useState("WhatsApp");
  const [editCategory, setEditCategory] = useState("Other");
  const [editSourceUrl, setEditSourceUrl] = useState("");

  async function loadClaim() {
    setLoading(true);
    setError("");

    try {
      const { data: claimData, error: claimError } =
        await supabase
          .from("claims")
          .select("*")
          .eq("id", id)
          .single();

      if (claimError) {
        throw claimError;
      }

      const { data: flagData, error: flagError } =
        await supabase
          .from("risk_flags")
          .select("*")
          .eq("claim_id", id);

      if (flagError) {
        throw flagError;
      }

      const { data: reviewData, error: reviewError } =
        await supabase
          .from("reviews")
          .select("*")
          .eq("claim_id", id)
          .order("created_at", { ascending: false });

      if (reviewError) {
        throw reviewError;
      }

      const { data: versionData, error: versionError } =
        await supabase
          .from("claim_versions")
          .select("*")
          .eq("claim_id", id)
          .order("created_at", { ascending: false });

      if (versionError) {
        throw versionError;
      }

      setClaim(claimData);
      setFlags(flagData || []);
      setReviews(reviewData || []);
      setVersions(versionData || []);
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

  function openEdit() {
    if (!claim) return;

    setEditClaimText(claim.claim_text);
    setEditPlatform(claim.platform);
    setEditCategory(claim.category);
    setEditSourceUrl(claim.source_url || "");
    setEditError("");
    setEditing(true);
  }

  function closeEdit() {
    if (saving) return;

    setEditing(false);
    setEditError("");
  }

  async function saveEdit() {
    if (!claim) return;

    setEditError("");

    if (!editClaimText.trim()) {
      setEditError("Claim text is required.");
      return;
    }

    setSaving(true);

    try {
      /*
       * DP3:
       * Preserve the current version before changing the claim.
       */
      const { error: versionError } = await supabase
        .from("claim_versions")
        .insert({
          claim_id: claim.id,
          claim_text: claim.claim_text,
          platform: claim.platform,
          category: claim.category,
          source_url: claim.source_url,
          status: claim.status,
          risk_level: claim.risk_level,
        });

      if (versionError) {
        throw versionError;
      }

      /*
       * Recalculate risk from the edited claim.
       */
      const analysis = analyzeRisk(
        editClaimText,
        editSourceUrl
      );

      /*
       * Remove the previous risk flags.
       */
      const { error: deleteFlagsError } = await supabase
        .from("risk_flags")
        .delete()
        .eq("claim_id", claim.id);

      if (deleteFlagsError) {
        throw deleteFlagsError;
      }

      /*
       * Add the new risk flags.
       */
      if (analysis.flags.length > 0) {
        const newFlags = analysis.flags.map((flag) => ({
          claim_id: claim.id,
          flag_type: flag,
        }));

        const { error: insertFlagsError } =
          await supabase
            .from("risk_flags")
            .insert(newFlags);

        if (insertFlagsError) {
          throw insertFlagsError;
        }
      }

      /*
       * The content changed, so the old verification
       * decision must not remain as the current status.
       *
       * The claim becomes Unverified again.
       */
      const { data: updatedClaim, error: updateError } =
        await supabase
          .from("claims")
          .update({
            claim_text: editClaimText.trim(),
            platform: editPlatform,
            category: editCategory,
            source_url: editSourceUrl.trim() || null,
            status: "unverified",
            risk_level: analysis.riskLevel,
            reviewed_at: null,
          })
          .eq("id", claim.id)
          .select()
          .single();

      if (updateError) {
        throw updateError;
      }

      setClaim(updatedClaim);

      setFlags(
        analysis.flags.map((flag, index) => ({
          id: `new-${index}`,
          flag_type: flag,
        }))
      );

      setEditing(false);

      await loadClaim();
    } catch (err) {
      console.error(err);

      setEditError(
        "Unable to save the edit. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf8ff] text-slate-900">
        <header className="border-b border-slate-200 bg-white">
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
          <p className="text-sm text-slate-500">
            Loading claim...
          </p>
        </div>
      </main>
    );
  }

  if (error || !claim) {
    return (
      <main className="min-h-screen bg-[#faf8ff] text-slate-900">
        <header className="border-b border-slate-200 bg-white">
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
    <main className="min-h-screen bg-[#faf8ff] text-slate-900">

      {/* ================= HEADER ================= */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#004ac6] text-white">
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

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={openEdit}
              className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-900"
            >
              <Pencil size={15} />
              Edit claim
            </button>

            <Link
              href="/submit"
              className="hidden border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-900 sm:block"
            >
              Submit a claim
            </Link>

          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}

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
                A transparent record of the submitted claim,
                automated risk signals, and human review.
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

        {/* ================= EDIT NOTICE ================= */}

        {versions.length > 0 && (
          <div className="mb-6 border border-blue-200 bg-blue-50 px-5 py-4">

            <div className="flex items-start gap-3">

              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-blue-700"
              />

              <div>

                <p className="text-sm font-semibold text-blue-900">
                  This claim has been edited
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  Previous submissions are preserved in the edit
                  history below. The current version was returned to
                  Unverified status and its risk signals were
                  recalculated.
                </p>

              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

          {/* ================= MAIN COLUMN ================= */}

          <div className="space-y-6">

            {/* CLAIM */}

            <section className="border border-slate-200 bg-white">

              <div className="border-b border-slate-200 px-6 py-5">

                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  Current submitted claim
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
                      {new Date(
                        claim.created_at
                      ).toLocaleString()}
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

            {/* ================= RISK FLAGS ================= */}

            <section className="border border-slate-200 bg-white">

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
                    Risk signals support review prioritization; they
                    are not a fact-check result.
                  </p>

                </div>

              </div>
            </section>

            {/* ================= REVIEW HISTORY ================= */}

            <section className="border border-slate-200 bg-white">

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

            {/* ================= EDIT HISTORY ================= */}

            <section className="border border-slate-200 bg-white">

              <div className="border-b border-slate-200 px-6 py-5">

                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  DP3 · Editing
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  Edit history
                </h2>

              </div>

              <div className="px-6 py-6">

                {versions.length === 0 ? (

                  <div className="border border-slate-200 bg-slate-50 p-5">

                    <p className="text-sm font-semibold text-slate-800">
                      No previous versions
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      This claim has not been edited since submission.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-6">

                    {versions.map((version, index) => (

                      <div
                        key={version.id}
                        className="border-l-2 border-blue-200 pl-5"
                      >

                        <div className="flex flex-wrap items-center justify-between gap-3">

                          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                            Previous version {versions.length - index}
                          </span>

                          <span className="text-xs text-slate-400">
                            {new Date(
                              version.created_at
                            ).toLocaleString()}
                          </span>

                        </div>

                        <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">
                          {version.claim_text}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">

                          <span className="border border-slate-200 bg-slate-50 px-2 py-1">
                            {version.platform}
                          </span>

                          <span className="border border-slate-200 bg-slate-50 px-2 py-1">
                            {version.category}
                          </span>

                          <span
                            className={`border px-2 py-1 ${getStatusClass(
                              version.status
                            )}`}
                          >
                            {statusLabels[version.status]}
                          </span>

                          <span className="border border-slate-200 bg-slate-50 px-2 py-1">
                            {version.risk_level === "high"
                              ? "High risk"
                              : "Normal risk"}
                          </span>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>
            </section>

          </div>

          {/* ================= SIDEBAR ================= */}

          <aside className="space-y-6">

            {/* CURRENT STATUS */}

            <section className="border border-slate-200 bg-white">

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
                    {new Date(
                      claim.reviewed_at
                    ).toLocaleString()}
                  </p>
                )}

              </div>
            </section>

            {/* DP3 EXPLANATION */}

            <section className="border border-blue-200 bg-blue-50">

              <div className="border-b border-blue-200 px-5 py-4">

                <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">
                  DP3 · Editing
                </p>

              </div>

              <div className="space-y-4 px-5 py-5">

                <div>
                  <p className="text-sm font-semibold text-blue-950">
                    Can this claim be edited?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    Yes. Use the Edit claim button to update the
                    submitted information.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-blue-950">
                    What happens to the flags?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    The previous flags are removed and recalculated
                    from the edited claim.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-blue-950">
                    Why?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    This prevents outdated risk signals from being
                    attached to a changed claim while preserving the
                    previous version for transparency.
                  </p>
                </div>

              </div>
            </section>

            {/* ABOUT */}

            <section className="border border-slate-200 bg-white">

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
                  Previous versions and reviewer decisions are
                  preserved separately as part of the public record.
                </p>

              </div>
            </section>

            {/* SUBMIT CTA */}

            <section className="border border-slate-800 bg-slate-950 p-5 text-white">

              <p className="text-sm font-bold">
                Found another viral claim?
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Submit it to the public triage queue for review.
              </p>

              <Link
                href="/submit"
                className="mt-5 inline-flex w-full items-center justify-center bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
              >
                Submit a claim
              </Link>

            </section>

          </aside>
        </div>
      </div>

      {/* ================= EDIT MODAL ================= */}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-slate-300 bg-white shadow-2xl">

            {/* Modal header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">
                  DP3 · Editing
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Edit claim
                </h2>

              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-900"
              >
                <X size={18} />
              </button>

            </div>

            {/* DP3 warning */}

            <div className="mx-6 mt-6 border border-blue-200 bg-blue-50 p-4">

              <p className="text-sm font-semibold text-blue-900">
                Editing creates a new current version.
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                The current version will be preserved in Edit History.
                Risk flags will be recalculated and the claim will
                return to Unverified status.
              </p>

            </div>

            {/* Form */}

            <div className="space-y-5 px-6 py-6">

              {/* Claim text */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Claim text
                </label>

                <textarea
                  value={editClaimText}
                  onChange={(e) =>
                    setEditClaimText(e.target.value)
                  }
                  rows={6}
                  className="w-full resize-y border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-blue-600"
                  placeholder="Enter the claim..."
                />

              </div>

              {/* Platform */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Source platform
                </label>

                <select
                  value={editPlatform}
                  onChange={(e) =>
                    setEditPlatform(e.target.value)
                  }
                  className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-600"
                >
                  <option value="WhatsApp">
                    WhatsApp
                  </option>

                  <option value="X">
                    X
                  </option>

                  <option value="Instagram">
                    Instagram
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>

              </div>

              {/* Category */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Category
                </label>

                <select
                  value={editCategory}
                  onChange={(e) =>
                    setEditCategory(e.target.value)
                  }
                  className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-600"
                >
                  <option value="Politics">
                    Politics
                  </option>

                  <option value="Health">
                    Health
                  </option>

                  <option value="Finance">
                    Finance
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>

              </div>

              {/* Source URL */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Source URL
                </label>

                <input
                  type="url"
                  value={editSourceUrl}
                  onChange={(e) =>
                    setEditSourceUrl(e.target.value)
                  }
                  className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600"
                  placeholder="https://example.com/source"
                />

              </div>

              {/* Error */}

              {editError && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {editError}
                </div>
              )}

            </div>

            {/* Modal actions */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-500"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 bg-[#004ac6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#003a9e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />

                {saving
                  ? "Saving changes..."
                  : "Save changes"}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}

      <footer className="mt-12 border-t border-slate-200 bg-white">

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