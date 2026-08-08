import PercentileBar from "./PercentileBar";
import LockedSection from "./LockedSection";
import VisualBreakdown from "./VisualBreakdown";
import EvolutionTracking from "./EvolutionTracking";
import { imageUrl } from "../api/client";

export default function ScoreReport({ plan, report, coverId }) {
  const isPaid = plan === "paid";

  return (
    <div className="score-report">
      <h2>Your cover: "{report.title_text}"</h2>
      <p className="overall-score">Overall score: {Math.round(report.overall_score)}</p>

      {isPaid ? (
        <>
          <PercentileBar
            label="Title size"
            value={report.title_height_percent}
            percentile={report.title_height_percentile}
            unit="%"
          />
          <PercentileBar
            label="Contrast"
            value={report.contrast_ratio}
            percentile={report.contrast_percentile}
            unit=":1"
          />
          <PercentileBar
            label="Whitespace"
            value={report.whitespace_percent}
            percentile={report.whitespace_percentile}
            unit="%"
          />

          <section className="explanations">
            <h3>Why these numbers</h3>
            <p>{report.title_explanation}</p>
            <p>{report.contrast_explanation}</p>
            <p>{report.whitespace_explanation}</p>
          </section>

          <section>
            <h3>Visual Breakdown</h3>
            <VisualBreakdown imageSrc={imageUrl(coverId, report.filename)} />
          </section>

          <section>
            <EvolutionTracking bookProjectId={report.book_project_id} />
          </section>
        </>
      ) : (
        <>
          <section className="improvements">
            <h3>Here are three things to improve</h3>
            <ol>
              {report.improvements.map((text, i) => (
                <li key={i}>{text}</li>
              ))}
            </ol>
          </section>

          <LockedSection title="Full percentile breakdown" />
          <LockedSection title="Competitive Pattern Summary" />
          <LockedSection title="Visual Breakdown" />
          <LockedSection title="Evolution Tracking" />
        </>
      )}
    </div>
  );
}
