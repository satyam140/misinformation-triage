"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clapperboard,
  Clock,
  Hash,
  MessageCircle,
  Radio,
  Search,
  Send,
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
};

const statusLabels: Record<Claim["status"], string> = {
  unverified: "Unverified",
  true: "Verified True",
  false: "False",
  misleading: "Misleading",
};

const platformSignals = [
  { name: "WhatsApp", count: "24", icon: MessageCircle, tone: "text-emerald-300" },
  { name: "X / Twitter", count: "18", icon: Hash, tone: "text-sky-300" },
  { name: "Instagram", count: "12", icon: Camera, tone: "text-pink-300" },
  { name: "TikTok", count: "09", icon: Radio, tone: "text-cyan-300" },
  { name: "YouTube", count: "07", icon: Clapperboard, tone: "text-red-300" },
  { name: "Telegram", count: "05", icon: Send, tone: "text-blue-300" },
];

function StatusLabel({ status }: { status: Claim["status"] }) {
  const styles = {
    unverified: "border-slate-300 bg-slate-50 text-slate-600",
    true: "border-emerald-200 bg-emerald-50 text-emerald-700",
    false: "border-red-200 bg-red-50 text-red-700",
    misleading: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status === "true" && <CheckCircle2 size={13} />}
      {statusLabels[status]}
    </span>
  );
}

function RiskLabel({ risk }: { risk: Claim["risk_level"] }) {
  if (risk === "high") {
    return (
      <span className="inline-flex items-center gap-1.5 border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <AlertTriangle size={13} />
        High risk
      </span>
    );
  }

  return (
    <span className="text-xs text-slate-400">
      Standard review
    </span>
  );
}

export default function HomePage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

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

  useEffect(() => {
    loadClaims();
  }, []);

  const filteredClaims = claims.filter((claim) => {
    const categoryMatches =
      categoryFilter === "All" ||
      claim.category === categoryFilter;

    const statusMatches =
      statusFilter === "All" ||
      claim.status === statusFilter;

    const searchMatches =
      !search.trim() ||
      claim.claim_text
        .toLowerCase()
        .includes(search.toLowerCase());

    return (
      categoryMatches &&
      statusMatches &&
      searchMatches
    );
  });

  return (
    <main className="news-shell min-h-screen text-slate-900">

      {/* HEADER */}
      <header className="news-header border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

          <Link href="/" className="flex items-center gap-3">
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

          <nav className="flex items-center gap-2 sm:gap-5">
            <Link
              href="/reviewer"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:block"
            >
              Reviewer
            </Link>

            <Link
              href="/submit"
              className="inline-flex items-center gap-2 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Submit a claim
              <ArrowRight size={15} />
            </Link>
          </nav>
        </div>
      </header>

      {/* INTRO */}
      <section className="hero-grid border-b border-slate-800 text-white">
        <div className="relative z-10 mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">

          <div className="max-w-3xl">
            <div className="rise-in mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--lime)]">
              <span className="signal-pulse h-2 w-2 rounded-full bg-[var(--lime)]" />
              Live verification desk · 06 platforms monitored
            </div>

            <h1 className="rise-in rise-in-delay-1 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Find the signal
              <br />
              inside the noise.
            </h1>

            <p className="rise-in rise-in-delay-2 mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              CivicCheck watches the public web for stories moving fast,
              surfaces the claims that need context, and keeps every human
              decision visible.
            </p>

            <div className="rise-in rise-in-delay-3 mt-8 flex flex-wrap gap-3">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 bg-[var(--lime)] px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-white"
              >
                Submit a claim
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/reviewer"
                className="inline-flex items-center border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:border-white"
              >
                Open review desk
              </Link>
            </div>
          </div>

          <div className="rise-in rise-in-delay-3 mt-14 max-w-5xl border-y border-slate-700 py-5">
            <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              <span>Cross-platform pulse</span>
              <span className="flex items-center gap-2 text-[var(--lime)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--lime)]" /> Syncing now</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {platformSignals.map((platform) => {
                const Icon = platform.icon;
                return (
                  <div key={platform.name} className="platform-tile relative overflow-hidden p-3">
                    <span className="signal-scan absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="relative flex items-center justify-between">
                      <Icon size={17} className={platform.tone} />
                      <span className="text-sm font-bold text-white">{platform.count}</span>
                    </div>
                    <p className="relative mt-3 text-[11px] font-medium text-slate-300">{platform.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FEED */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">

        {/* FEED HEADER */}
        <div className="mb-7 flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Public record
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Recent claims
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredClaims.length}{" "}
              {filteredClaims.length === 1
                ? "claim"
                : "claims"}{" "}
              shown
            </p>
          </div>

          <Link
            href="/submit"
            className="inline-flex items-center gap-2 self-start border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-500 sm:self-auto"
          >
            Submit new claim
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* FILTERS */}
        <div className="mb-8 grid gap-3 border-b border-slate-200 pb-7 md:grid-cols-[1fr_190px_190px]">

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3.5 top-3.5 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search claims..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
            className="border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-900"
          >
            <option value="All">All categories</option>
            <option value="Politics">Politics</option>
            <option value="Health">Health</option>
            <option value="Finance">Finance</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-900"
          >
            <option value="All">All statuses</option>
            <option value="unverified">Unverified</option>
            <option value="true">Verified True</option>
            <option value="false">False</option>
            <option value="misleading">Misleading</option>
          </select>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="border border-slate-200 bg-white px-6 py-16 text-center">
            <p className="text-sm text-slate-500">
              Loading claims...
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          filteredClaims.length === 0 && (
            <div className="news-card border-dashed px-6 py-16 text-center">
              <Search
                size={30}
                className="mx-auto mb-4 text-slate-300"
              />

              <h3 className="font-semibold text-slate-900">
                No claims found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try changing the search or filters.
              </p>
            </div>
          )}

        {/* CLAIM LIST */}
        {!loading &&
          filteredClaims.length > 0 && (
            <div className="space-y-3">

              {filteredClaims.map((claim) => (
                <Link
                  href={`/claims/${claim.id}`}
                  key={claim.id}
                  className="news-card group block px-5 py-6 sm:px-7"
                >

                  <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">

                    <div className="min-w-0 max-w-4xl">

                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <StatusLabel status={claim.status} />

                        <RiskLabel risk={claim.risk_level} />

                        <span className="text-xs text-slate-400">
                          {claim.platform}
                        </span>

                        <span className="text-slate-300">
                          /
                        </span>

                        <span className="text-xs text-slate-400">
                          {claim.category}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold leading-7 text-slate-900 group-hover:text-slate-600 sm:text-xl">
                        {claim.claim_text}
                      </h3>

                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                        <Clock size={13} />

                        {new Date(
                          claim.created_at
                        ).toLocaleString()}
                      </div>

                    </div>

                    <div className="flex shrink-0 items-center text-sm font-semibold text-slate-500 group-hover:text-slate-900">
                      View claim
                      <ArrowRight
                        size={16}
                        className="ml-2 transition-transform group-hover:translate-x-1"
                      />
                    </div>

                  </div>

                </Link>
              ))}

            </div>
          )}

      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">

          <div>
            <span className="font-semibold text-slate-600">
              CivicCheck
            </span>{" "}
            · Public claim verification
          </div>

          <div>
            Claims are reviewed by humans, not automatically
            declared true or false.
          </div>

        </div>
      </footer>

    </main>
  );
}