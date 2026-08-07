export default function PercentileBar({ label, value, percentile, unit = "" }) {
  return (
    <div className="percentile-bar">
      <div className="percentile-bar-header">
        <span>{label}</span>
        <span>
          {value.toFixed(2)}
          {unit} — {Math.round(percentile)}th percentile
        </span>
      </div>
      <div className="percentile-bar-track">
        <div className="percentile-bar-fill" style={{ width: `${percentile}%` }} />
      </div>
    </div>
  );
}
