"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Send,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Platform = "WhatsApp" | "X" | "Instagram" | "Other";
type Category = "Politics" | "Health" | "Finance" | "Other";

function analyzeRisk(claimText: string, sourceUrl: string) {
  const flags: string[] = [];

  const lowerText = claimText.toLowerCase();

  // Sensational wording
  if (
    lowerText.includes("breaking") ||
    lowerText.includes("shocking") ||
    lowerText.includes("share before deleted")
  ) {
    flags.push("sensational");
  }

  // More than 50% uppercase letters
  const letters = claimText.match(/[a-zA-Z]/g) || [];
  const uppercaseLetters = claimText.match(/[A-Z]/g) || [];

  if (
    letters.length > 0 &&
    uppercaseLetters.length / letters.length > 0.5
  ) {
    flags.push("shouting");
  }

  // No source URL
  if (!sourceUrl.trim()) {
    flags.push("unsourced");
  }

  // 2 or more flags = high risk
  const riskLevel = flags.length >= 2 ? "high" : "normal";

  return {
    flags,
    riskLevel,
  };
}

export default function SubmitClaimPage() {
  const [claimText, setClaimText] = useState("");
  const [platform, setPlatform] =
    useState<Platform>("WhatsApp");
  const [category, setCategory] =
    useState<Category>("Other");
  const [sourceUrl, setSourceUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      // Validate claim
      if (!claimText.trim()) {
        setError("Please enter a claim.");
        return;
      }

      // Analyze risk
      const { flags, riskLevel } = analyzeRisk(
        claimText,
        sourceUrl
      );

      // Insert claim
      const { data: claim, error: claimError } =
        await supabase
          .from("claims")
          .insert({
            claim_text: claimText.trim(),
            platform,
            category,
            source_url: sourceUrl.trim() || null,
            status: "unverified",
            risk_level: riskLevel,
          })
          .select()
          .single();

      if (claimError) {
        console.error("CLAIM INSERT ERROR:", claimError);

        throw new Error(
          claimError.message ||
            "Unable to save the claim."
        );
      }

      if (!claim) {
        throw new Error(
          "The claim was submitted but no claim record was returned."
        );
      }

      // Insert risk flags
      if (flags.length > 0) {
        const flagRows = flags.map((flag) => ({
          claim_id: claim.id,
          flag_type: flag,
        }));

        const { error: flagsError } =
          await supabase
            .from("risk_flags")
            .insert(flagRows);

        if (flagsError) {
          console.error(
            "RISK FLAGS INSERT ERROR:",
            flagsError
          );

          throw new Error(
            flagsError.message ||
              "Claim was saved, but risk flags could not be saved."
          );
        }
      }

      // Success message
      setSuccess(
        `Claim submitted successfully. Risk level: ${
          riskLevel === "high" ? "HIGH" : "NORMAL"
        }. Flags detected: ${flags.length}.`
      );

      // Clear form
      setClaimText("");
      setSourceUrl("");
      setPlatform("WhatsApp");
      setCategory("Other");
    } catch (err: unknown) {
      console.error("SUBMIT ERROR:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong while submitting the claim."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="news-shell min-h-screen text-slate-900">

      {/* Header */}
      <header className="news-header border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="brand-mark flex h-9 w-9 items-center justify-center text-white">
              <ShieldCheck size={20} />
            </div>

            <div>
              <div className="text-lg font-bold tracking-tight">
                CivicCheck
              </div>

              <div className="hidden text-[11px] font-medium uppercase tracking-widest text-slate-400 sm:block">
                Claim Verification
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to claims
          </Link>

        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">

        {/* Page heading */}
        <div className="mb-10 max-w-3xl">

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Public submission
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Submit a claim
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Report a viral or questionable claim for triage.
            CivicCheck will identify basic risk signals before a
            human reviewer evaluates the claim.
          </p>

        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="news-card overflow-hidden"
          >

            {/* Claim section */}
            <div className="border-b border-slate-200 bg-[var(--paper)] p-6 sm:p-8">

              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-950">
                  Claim information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Provide the original wording as it appeared.
                </p>
              </div>

              <label
                htmlFor="claim"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Viral claim
              </label>

              <textarea
                id="claim"
                value={claimText}
                onChange={(e) =>
                  setClaimText(e.target.value)
                }
                placeholder="Paste the viral post or claim here..."
                rows={8}
                className="w-full resize-y border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
              />

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Preserve the original wording where possible.
                Do not include unnecessary personal information.
              </p>

            </div>

            {/* Metadata */}
            <div className="border-b border-slate-200 bg-[var(--paper)] p-6 sm:p-8">

              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-950">
                  Claim details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tell us where the claim appeared and what it
                  concerns.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">

                {/* Platform */}
                <div>
                  <label
                    htmlFor="platform"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Source platform
                  </label>

                  <select
                    id="platform"
                    value={platform}
                    onChange={(e) =>
                      setPlatform(
                        e.target.value as Platform
                      )
                    }
                    className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-900"
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
                  <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Category
                  </label>

                  <select
                    id="category"
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value as Category
                      )
                    }
                    className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-900"
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

              </div>

              {/* Source URL */}
              <div className="mt-6">

                <label
                  htmlFor="source"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Source URL

                  <span className="ml-2 font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <input
                  id="source"
                  type="url"
                  value={sourceUrl}
                  onChange={(e) =>
                    setSourceUrl(e.target.value)
                  }
                  placeholder="https://example.com/source"
                  className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />

                <p className="mt-2 text-xs text-slate-400">
                  A source helps reviewers investigate the claim.
                </p>

              </div>

            </div>

            {/* Submit */}
            <div className="p-6 sm:p-8">

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 bg-[var(--ink)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={17} />

                {loading
                  ? "Submitting claim..."
                  : "Submit claim"}
              </button>

              {/* Success */}
              {success && (
                <div className="mt-5 flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">

                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0"
                  />

                  <p>{success}</p>

                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-5 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                  <AlertTriangle
                    size={19}
                    className="mt-0.5 shrink-0"
                  />

                  <p>{error}</p>

                </div>
              )}

            </div>

          </form>

          {/* Sidebar */}
          <aside className="space-y-6">

            <div className="news-card p-6">

              <div className="mb-4 flex h-9 w-9 items-center justify-center bg-[var(--lime)] text-[var(--ink)]">
                <ShieldCheck size={19} />
              </div>

              <h2 className="font-bold text-slate-950">
                What happens next?
              </h2>

              <ol className="mt-5 space-y-5">

                <li className="flex gap-3">

                  <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--ink)] text-xs font-bold text-white">
                    1
                  </span>

                  <div>
                    <p className="text-sm font-semibold">
                      Automatic triage
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Basic wording and sourcing signals are
                      detected automatically.
                    </p>
                  </div>

                </li>

                <li className="flex gap-3">

                  <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--ink)] text-xs font-bold text-white">
                    2
                  </span>

                  <div>
                    <p className="text-sm font-semibold">
                      Human review
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      A reviewer examines the available evidence.
                    </p>
                  </div>

                </li>

                <li className="flex gap-3">

                  <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--ink)] text-xs font-bold text-white">
                    3
                  </span>

                  <div>
                    <p className="text-sm font-semibold">
                      Public record
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      The claim and its review status become
                      visible in the public feed.
                    </p>
                  </div>

                </li>

              </ol>

            </div>

            <div className="border-l-2 border-slate-300 px-4 py-1">

              <p className="text-xs leading-5 text-slate-500">
                Risk flags are indicators for triage. They are
                not proof that a claim is true or false.
              </p>

            </div>

          </aside>

        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-[var(--paper)]">

        <div className="mx-auto max-w-7xl px-5 py-7 text-xs text-slate-400 sm:px-8">
          CivicCheck · Public claim verification
        </div>

      </footer>

    </main>
  );
}