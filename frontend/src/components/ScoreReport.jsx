import PercentileBar from "./PercentileBar";

export default function ScoreReport({ report }) {
  return (
    <div className="score-report">
      <h2>Your cover: "{report.title_text}"</h2>
      <p className="overall-score">Overall score: {Math.round(report.overall_score)}</p>

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
    </div>
  );
}
