// Visual Breakdown is deliberately a pure presentation feature: it reuses
// the already-uploaded cover image and just composites it into different
// mockup frames with CSS. No new backend measurement/rendering pipeline —
// see docs/05-pricing-and-plans.md.
export default function VisualBreakdown({ imageSrc }) {
  return (
    <div className="visual-breakdown">
      <div className="mockup mockup-full">
        <p className="mockup-label">Full size</p>
        <img src={imageSrc} alt="Full size cover" />
      </div>

      <div className="mockup mockup-thumbnail">
        <p className="mockup-label">Thumbnail (as seen in search results)</p>
        <img src={imageSrc} alt="Thumbnail preview" className="thumbnail-img" />
      </div>

      <div className="mockup mockup-amazon">
        <p className="mockup-label">Amazon listing</p>
        <div className="amazon-frame">
          <img src={imageSrc} alt="Amazon listing preview" />
          <div className="amazon-details">
            <div className="fake-line" />
            <div className="fake-line short" />
            <div className="fake-stars">★★★★☆</div>
          </div>
        </div>
      </div>

      <div className="mockup mockup-mobile">
        <p className="mockup-label">Mobile</p>
        <div className="phone-frame">
          <img src={imageSrc} alt="Mobile preview" />
        </div>
      </div>
    </div>
  );
}
