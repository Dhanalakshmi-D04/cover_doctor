import UpgradeButton from "./UpgradeButton";

// Shows that a paid section exists, blurred, with an upgrade CTA —
// deliberately never hidden entirely. See docs/05-pricing-and-plans.md:
// "locked sections are shown but blurred ... never silently omitted."
export default function LockedSection({ title }) {
  return (
    <div className="locked-section">
      <div className="locked-section-blur">
        <div className="fake-line" />
        <div className="fake-line short" />
        <div className="fake-line" />
      </div>
      <div className="locked-section-overlay">
        <p>🔒 {title} is a paid feature</p>
        <UpgradeButton />
      </div>
    </div>
  );
}
