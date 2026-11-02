import { BRAND, BRAND_ASSETS } from "./brand";

export function LoadingScreen() {
  return (
    <main className="loading-screen" role="status" aria-live="polite">
      <div className="loading-brand">
        <img className="loading-brand-emblem" src={BRAND_ASSETS.floralMark} alt="" aria-hidden="true" />
        <span><strong>{BRAND.name}</strong><small>A Reality Lab</small></span>
      </div>
      <div className="loading-map" aria-hidden="true">
        <svg viewBox="0 0 900 390" role="presentation">
          <path className="loading-mountain far" d="M0 245 110 112l78 92 103-151 112 158 104-116 106 139 103-101 184 131v126H0Z" />
          <path className="loading-mountain near" d="m0 276 122-72 105 53 130-81 101 94 118-81 107 69 98-50 119 74v108H0Z" />
          <path className="loading-waterfall" d="m230 254 18 2-9 93-15-2Zm429-7 14-4 18 86-15 4Z" />
          <path className="loading-island" d="M74 272q106-62 215 4l-31 45H96Zm474 8q105-72 225-1l-35 47H574Z" />
          <path className="loading-bridge" d="M247 291q51-65 101 0m-101 1h101" />
          <g className="loading-castle">
            <path d="M399 233v-57h30v-37h32v37h27v-62h37v62h28v-36h31v36h20v57Z" />
            <path className="loading-castle-roof" d="m395 178 19-38 19 38Zm59-36 23-45 23 45Zm65-5 25-51 26 51Zm57 42 20-37 20 37Z" />
            <path className="loading-castle-detail" d="M477 233v-43q20-29 40 0v43Zm67-70v24m-103 10v20m129-21v20m-47-74v17" />
          </g>
          <g className="loading-trees">
            <path d="M132 285v-48m-19 18 19-40 20 40Zm29 30v-58m-22 21 22-46 22 46Zm539 16v-62m-24 25 24-51 25 51Zm32 37v-48m-19 18 19-40 20 40Z" />
          </g>
          <g className="loading-portal">
            <ellipse cx="507" cy="248" rx="54" ry="14" />
            <path d="M474 248v-42a33 37 0 0 1 66 0v42" />
            <path d="M487 235v-29a20 23 0 0 1 40 0v29" />
            <circle cx="507" cy="205" r="5" />
          </g>
          <g className="loading-lights">
            <circle cx="429" cy="190" r="4" /><circle cx="542" cy="188" r="4" />
            <circle cx="603" cy="190" r="4" /><circle cx="493" cy="216" r="3" />
          </g>
          <g className="loading-particles">
            <circle cx="330" cy="145" r="2" /><circle cx="684" cy="158" r="2" />
            <circle cx="374" cy="220" r="2" /><circle cx="601" cy="116" r="2" />
            <circle cx="280" cy="193" r="2" /><circle cx="720" cy="234" r="2" />
          </g>
        </svg>
      </div>
      <div className="loading-copy">
        <p className="loading-eyebrow">YOUR FOREST KINGDOM AWAITS</p>
        <h1>Preparing your learning space</h1>
        <p>Gathering your lessons and opening the path ahead…</p>
        <div className="loading-progress" role="progressbar" aria-label="Preparing your learning space">
          <span />
        </div>
      </div>
    </main>
  );
}
