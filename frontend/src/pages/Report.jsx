import { useQuery } from "@tanstack/react-query";
import { getReport } from "../api/client";
import ScoreReport from "../components/ScoreReport";

export default function Report({ coverId, onReset, onNavigate }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["report", coverId],
    queryFn: () => getReport(coverId),
  });

  if (isLoading) {
    return (
      <div className="spring-card animate-fade-in" style={{ textAlign: "center", padding: "4rem 2rem", margin: "2rem auto", maxWidth: "600px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--theme-primary)" }}>Analyzing & Scoring Your Cover...</h2>
        <p style={{ color: "var(--theme-text-muted)", marginTop: "0.5rem" }}>Computing title height ratio, contrast ratio, and bestseller benchmark percentiles.</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="spring-card" style={{ textAlign: "center", padding: "3rem 2rem", margin: "2rem auto", maxWidth: "600px" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚠️</div>
        <h3 style={{ color: "#DC2626" }}>Unable to generate score report</h3>
        <p style={{ color: "var(--theme-text-muted)", margin: "0.5rem 0 1.5rem 0" }}>{error.message}</p>
        <button className="btn-primary" onClick={onReset}>Try Scoring Another Cover</button>
      </div>
    );
  }

  return (
    <div className="report-page animate-fade-in">
      <ScoreReport plan={data.plan} report={data.report} coverId={coverId} onReset={onReset} onNavigate={onNavigate} />
    </div>
  );
}
