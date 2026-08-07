import { useQuery } from "@tanstack/react-query";
import { getReport } from "../api/client";
import ScoreReport from "../components/ScoreReport";

export default function Report({ coverId, onReset }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["report", coverId],
    queryFn: () => getReport(coverId),
  });

  if (isLoading) return <p>Scoring your cover...</p>;
  if (isError) return <p className="error">{error.message}</p>;

  return (
    <div className="report-page">
      <ScoreReport report={data} />
      <button onClick={onReset}>Score another cover</button>
    </div>
  );
}
