import { useQuery } from "@tanstack/react-query";
import { listVersions } from "../api/client";
import LockedSection from "./LockedSection";

export default function EvolutionTracking({ bookProjectId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["versions", bookProjectId],
    queryFn: () => listVersions(bookProjectId),
    enabled: !!bookProjectId,
  });

  if (!bookProjectId) {
    return <p className="hint">Attach this cover to a book project to track versions over time.</p>;
  }

  if (isLoading) return <p>Loading version history...</p>;

  if (data?.locked) {
    return <LockedSection title="Evolution Tracking" />;
  }

  return (
    <div className="evolution-tracking">
      <h3>Version history</h3>
      <ul>
        {data?.versions?.map((version) => (
          <li key={version.id}>
            v{version.version_number} — score {Math.round(version.overall_score)} —{" "}
            {new Date(version.created_at).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
