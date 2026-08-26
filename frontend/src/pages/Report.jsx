import { useQuery } from "@tanstack/react-query";
import { getReport } from "../api/client";
import ScoreReport from "../components/ScoreReport";
import PillButton from "../components/PillButton";

// Sentinel error class so we can distinguish a job-failed error (don't retry)
// from a transient network error (React Query should retry).
class JobFailedError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "JobFailedError";
  }
}

export default function Report({ coverId, onReset, onNavigate }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["report", coverId],
    queryFn: async () => {
      const res = await getReport(coverId);
      // If the worker exhausted all retries and marked the cover failed,
      // throw a typed error so React Query does NOT retry (retry:false below
      // only fires when we explicitly tell it to stop).
      if (res.report?.status === "failed") {
        throw new JobFailedError("failed");
      }
      return res;
    },
    // Keep polling every 2 s while the job is still processing.
    // Stop polling once status is "complete" (data is truthy and not pending),
    // or immediately when a JobFailedError is thrown (retry:false handles that).
    refetchInterval: (query) => {
      const status = query.state?.data?.report?.status;
      if (status === "complete") return false;  // done — stop polling
      if (query.state?.error instanceof JobFailedError) return false; // failed — stop polling
      return 2000; // pending or first load — keep polling
    },
    // Never retry a JobFailedError: it's a permanent terminal state, not a
    // transient network blip. Retry up to 3 times for all other errors
    // (network timeouts, 5xx, etc.).
    retry: (failureCount, err) => {
      if (err instanceof JobFailedError) return false;
      return failureCount < 3;
    },
  });

  const isFailed  = error instanceof JobFailedError;
  const isError   = !!error && !isFailed; // transient/network errors only
  const isPending = !data || data.report?.status === "pending";

  // ── Job processing failed (OCR / measurement failure) ──────────────────────
  if (isFailed) {
    return (
      <div className="spring-card" style={{ textAlign: "center", padding: "3rem 2rem", margin: "2rem auto", maxWidth: "600px" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔍</div>
        <h3 style={{ color: "#DC2626", fontFamily: "var(--font-serif)" }}>
          We couldn't read the title text on this cover
        </h3>
        <p style={{ color: "var(--theme-text-muted)", margin: "0.75rem 0 0.5rem 0" }}>
          Our OCR engine couldn't detect readable title text. This usually happens with:
        </p>
        <ul style={{ color: "var(--theme-text-muted)", textAlign: "left", display: "inline-block", margin: "0 0 1.5rem 0" }}>
          <li>Very low-resolution images (under ~500 px tall)</li>
          <li>Highly stylised, script, or hand-lettered fonts</li>
          <li>Title text that blends into a complex background</li>
        </ul>
        <p style={{ color: "var(--theme-text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Try uploading a higher-resolution version, or a cover where the title text
          contrasts clearly with the background.
        </p>
        <PillButton onClick={onReset}>Try Another Cover</PillButton>
      </div>
    );
  }

  // ── Transient / network error ───────────────────────────────────────────────
  if (isError) {
    return (
      <div className="spring-card" style={{ textAlign: "center", padding: "3rem 2rem", margin: "2rem auto", maxWidth: "600px" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚠️</div>
        <h3 style={{ color: "#DC2626" }}>Unable to load score report</h3>
        <p style={{ color: "var(--theme-text-muted)", margin: "0.5rem 0 1.5rem 0" }}>
          {error.message}
        </p>
        <PillButton onClick={onReset}>Try Scoring Another Cover</PillButton>
      </div>
    );
  }

  // ── Still processing ────────────────────────────────────────────────────────
  if (isLoading || isPending) {
    return (
      <div className="spring-card animate-fade-in" style={{ textAlign: "center", padding: "4rem 2rem", margin: "2rem auto", maxWidth: "600px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--theme-primary)" }}>
          Analyzing &amp; Scoring Your Cover...
        </h2>
        <p style={{ color: "var(--theme-text-muted)", marginTop: "0.5rem" }}>
          Computing title height ratio, contrast ratio, and bestseller benchmark percentiles.
        </p>
      </div>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  return (
    <div className="report-page animate-fade-in">
      <ScoreReport plan={data.plan} report={data.report} coverId={coverId} onReset={onReset} onNavigate={onNavigate} />
    </div>
  );
}
