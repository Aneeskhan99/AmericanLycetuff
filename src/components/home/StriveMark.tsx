/**
 * "Strive for the highest" handwritten mark from the hero (Figma lottie export).
 * Rebuilt as an SVG so the two masked layers (yellow script + underline) scale together.
 * Geometry is in the original 483.78 × 71.233 frame units.
 */
export default function StriveMark({ id, className = "" }: { id: string; className?: string }) {
  const textMask = `${id}-text`;
  const lineMask = `${id}-line`;
  return (
    <svg
      viewBox="0 0 483.78 71.233"
      role="img"
      aria-label="Strive for the highest"
      className={`block h-auto overflow-visible ${className}`}
    >
      <defs>
        <mask id={textMask} maskUnits="userSpaceOnUse" x="-10" y="-10" width="504" height="92" style={{ maskType: "alpha" }}>
          <image href="/images/home/strive-mask-text.svg" x="12.288" y="15.276" width="437.021" height="51.168" preserveAspectRatio="none" />
        </mask>
        <mask id={lineMask} maskUnits="userSpaceOnUse" x="-10" y="-10" width="504" height="92" style={{ maskType: "alpha" }}>
          <image href="/images/home/strive-mask-underline.svg" x="47.859" y="23.661" width="423.609" height="9.082" preserveAspectRatio="none" />
        </mask>
      </defs>
      <image
        href="/images/home/strive-text.svg"
        x="10.995"
        y="-2.077"
        width="439.693"
        height="70.513"
        preserveAspectRatio="none"
        mask={`url(#${textMask})`}
      />
      <image
        href="/images/home/strive-underline.svg"
        x="40.919"
        y="19.182"
        width="435.655"
        height="18.81"
        preserveAspectRatio="none"
        mask={`url(#${lineMask})`}
      />
    </svg>
  );
}
