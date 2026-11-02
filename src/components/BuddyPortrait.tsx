import type { BuddyId } from "../types";

const colors: Record<Exclude<BuddyId, "berrus">, { face: string; detail: string; eye: string }> = {
  beerus: { face: "#e5b55f", detail: "#7a5937", eye: "#397b7b" },
  panda: { face: "#f8f6ef", detail: "#273442", eye: "#273442" },
  fox: { face: "#e88b55", detail: "#7b4935", eye: "#345f6a" },
  robot: { face: "#91b9d8", detail: "#476276", eye: "#2b6374" },
  owl: { face: "#c5a77c", detail: "#69533e", eye: "#d68b45" },
  dino: { face: "#82a982", detail: "#44654c", eye: "#415e67" },
  cat: { face: "#c1a8ca", detail: "#715e7b", eye: "#557d78" },
};

export function BuddyPortrait({ buddyId, label }: { buddyId: BuddyId; label: string }) {
  const id = buddyId === "berrus" ? "beerus" : buddyId;
  const palette = colors[id];
  return (
    <svg
      className={`buddy-portrait buddy-portrait-${id}`}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${label} avatar`}
      focusable="false"
    >
      {id === "panda" ? (
        <>
          <circle cx="25" cy="27" r="17" fill={palette.detail} />
          <circle cx="75" cy="27" r="17" fill={palette.detail} />
          <ellipse cx="50" cy="55" rx="39" ry="36" fill={palette.face} stroke={palette.detail} strokeWidth="3" />
          <ellipse cx="34" cy="50" rx="10" ry="14" fill={palette.detail} transform="rotate(22 34 50)" />
          <ellipse cx="66" cy="50" rx="10" ry="14" fill={palette.detail} transform="rotate(-22 66 50)" />
          <circle cx="36" cy="49" r="3" fill="#fff" />
          <circle cx="64" cy="49" r="3" fill="#fff" />
          <ellipse cx="50" cy="65" rx="7" ry="5" fill={palette.detail} />
          <path d="M50 70q-5 8-12 2m12-2q5 8 12 2" fill="none" stroke={palette.detail} strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          {id === "fox" && <path d="M21 43 16 13l26 17m16 0 26-17-5 30" fill={palette.face} stroke={palette.detail} strokeWidth="4" strokeLinejoin="round" />}
          {id === "robot" && <path d="M50 10v12m-5-12h10" stroke={palette.detail} strokeWidth="4" strokeLinecap="round" />}
          {id === "owl" && <path d="m23 35 6-17 15 13m18 0 15-13 6 17" fill={palette.face} stroke={palette.detail} strokeWidth="4" strokeLinejoin="round" />}
          {id === "dino" && <path d="m27 34 8-18 10 16 9-19 10 20 9-13 4 25" fill={palette.face} stroke={palette.detail} strokeWidth="4" strokeLinejoin="round" />}
          {id === "cat" && <path d="m22 44 2-29 25 18 27-18 2 31" fill={palette.face} stroke={palette.detail} strokeWidth="4" strokeLinejoin="round" />}
          {id === "beerus" ? (
            <circle cx="50" cy="56" r="36" fill={palette.face} stroke={palette.detail} strokeWidth="4" />
          ) : id === "robot" ? (
            <rect x="15" y="25" width="70" height="62" rx="20" fill={palette.face} stroke={palette.detail} strokeWidth="4" />
          ) : (
            <path d="M18 53c0-22 13-34 32-34s32 12 32 34v9c0 18-13 29-32 29S18 80 18 62z" fill={palette.face} stroke={palette.detail} strokeWidth="4" />
          )}
          {id === "owl" ? (
            <>
              <circle cx="37" cy="53" r="13" fill="#fff6df" />
              <circle cx="63" cy="53" r="13" fill="#fff6df" />
              <circle cx="39" cy="54" r="5" fill={palette.eye} />
              <circle cx="61" cy="54" r="5" fill={palette.eye} />
              <path d="m45 67 5 7 5-7" fill="#d68b45" />
            </>
          ) : (
            <>
              {id !== "robot" && <path d="M27 57q10-8 19 0m8 0q10-8 19 0" fill="none" stroke={palette.detail} strokeWidth="4" strokeLinecap="round" />}
              {id === "robot" ? (
                <>
                  <rect x="26" y="45" width="18" height="12" rx="6" fill={palette.eye} />
                  <rect x="56" y="45" width="18" height="12" rx="6" fill={palette.eye} />
                </>
              ) : (
                <>
                  <circle cx="36" cy="52" r="3" fill={palette.eye} />
                  <circle cx="64" cy="52" r="3" fill={palette.eye} />
                </>
              )}
              {id === "fox" && <path d="m40 66 10-7 10 7-10 8z" fill="#fff1df" />}
              {id === "beerus" && <><circle cx="27" cy="68" r="4" fill="#e98b75" opacity=".65" /><circle cx="73" cy="68" r="4" fill="#e98b75" opacity=".65" /></>}
              <path d="M43 72q7 6 14 0" fill="none" stroke={palette.detail} strokeWidth="3" strokeLinecap="round" />
            </>
          )}
          {id === "dino" && <path d="M34 79h5m8 0h5m8 0h5" stroke="#f8f6ef" strokeWidth="3" strokeLinecap="round" />}
        </>
      )}
    </svg>
  );
}
