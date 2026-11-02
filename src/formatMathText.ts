const mathSymbols: Record<string, string> = {
  alpha: "α", beta: "β", theta: "θ", pi: "π", infinity: "∞",
  times: "×", cdot: "·", div: "÷", leq: "≤", geq: "≥",
  neq: "≠", approx: "≈", in: "∈", notin: "∉", sum: "∑",
  lambda: "λ", mu: "μ", sigma: "σ", delta: "Δ", phi: "φ",
  rightarrow: "→", therefore: "∴", pm: "±",
};

function readGroup(value: string, start: number): [string, number] {
  if (value[start] !== "{") return [value[start] ?? "", start + 1];
  let depth = 1;
  let cursor = start + 1;
  while (cursor < value.length && depth > 0) {
    if (value[cursor] === "{") depth += 1;
    if (value[cursor] === "}") depth -= 1;
    cursor += 1;
  }
  return [value.slice(start + 1, cursor - 1), cursor];
}

export function formatMathText(source: string): string {
  let text = source.replace(/\$\$?/g, "").replace(/\\(?:left|right)\b/g, "");
  const groupedCommands = ["frac", "sqrt", "text", "mathrm", "mathbf", "mathbb", "overline"];
  for (let pass = 0; pass < 3; pass += 1) {
    for (const command of groupedCommands) {
      const marker = `\\${command}{`;
      let index = text.lastIndexOf(marker);
      while (index >= 0) {
        const firstStart = index + marker.length - 1;
        const [first, afterFirst] = readGroup(text, firstStart);
        let replacement = first;
        let after = afterFirst;
        if (command === "frac" && text[afterFirst] === "{") {
          const [second, afterSecond] = readGroup(text, afterFirst);
          replacement = `(${first})/(${second})`;
          after = afterSecond;
        } else if (command === "sqrt") {
          replacement = `√(${first})`;
        } else if (command === "mathbb") {
          replacement = ({ N: "ℕ", Z: "ℤ", Q: "ℚ", R: "ℝ", C: "ℂ" } as Record<string, string>)[first] ?? first;
        }
        text = `${text.slice(0, index)}${replacement}${text.slice(after)}`;
        index = text.lastIndexOf(marker, index - 1);
      }
    }
  }
  text = text.replace(/\\([A-Za-z]+)/g, (_match, command: string) => mathSymbols[command] ?? command);
  return text.replace(/\\([{}])/g, "$1").replace(/[{}]/g, "").replace(/~/g, " ").replace(/\s+/g, " ").trim();
}
