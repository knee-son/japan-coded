import { useState, useEffect, useCallback } from "react";

const HIRAGANA = [
  { glyph: "あ", romaji: "a" }, { glyph: "い", romaji: "i" }, { glyph: "う", romaji: "u" },
  { glyph: "え", romaji: "e" }, { glyph: "お", romaji: "o" },
  { glyph: "か", romaji: "ka" }, { glyph: "き", romaji: "ki" }, { glyph: "く", romaji: "ku" },
  { glyph: "け", romaji: "ke" }, { glyph: "こ", romaji: "ko" },
  { glyph: "さ", romaji: "sa" }, { glyph: "し", romaji: "shi" }, { glyph: "す", romaji: "su" },
  { glyph: "せ", romaji: "se" }, { glyph: "そ", romaji: "so" },
  { glyph: "た", romaji: "ta" }, { glyph: "ち", romaji: "chi" }, { glyph: "つ", romaji: "tsu" },
  { glyph: "て", romaji: "te" }, { glyph: "と", romaji: "to" },
  { glyph: "な", romaji: "na" }, { glyph: "に", romaji: "ni" }, { glyph: "ぬ", romaji: "nu" },
  { glyph: "ね", romaji: "ne" }, { glyph: "の", romaji: "no" },
  { glyph: "は", romaji: "ha" }, { glyph: "ひ", romaji: "hi" }, { glyph: "ふ", romaji: "fu" },
  { glyph: "へ", romaji: "he" }, { glyph: "ほ", romaji: "ho" },
  { glyph: "ま", romaji: "ma" }, { glyph: "み", romaji: "mi" }, { glyph: "む", romaji: "mu" },
  { glyph: "め", romaji: "me" }, { glyph: "も", romaji: "mo" },
  { glyph: "や", romaji: "ya" }, { glyph: "ゆ", romaji: "yu" }, { glyph: "よ", romaji: "yo" },
  { glyph: "ら", romaji: "ra" }, { glyph: "り", romaji: "ri" }, { glyph: "る", romaji: "ru" },
  { glyph: "れ", romaji: "re" }, { glyph: "ろ", romaji: "ro" },
  { glyph: "わ", romaji: "wa" }, { glyph: "を", romaji: "wo" }, { glyph: "ん", romaji: "n" },
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getChoices(correct, all) {
  const others = shuffle(all.filter(h => h.romaji !== correct.romaji)).slice(0, 3);
  return shuffle([correct, ...others]);
}

// weight = 1 + consecutive mistakes for that character
function weightedRandom(all, weights) {
  const total = all.reduce((sum, h) => sum + 1 + (weights[h.romaji] ?? 0), 0);
  let r = Math.random() * total;
  for (const h of all) {
    r -= 1 + (weights[h.romaji] ?? 0);
    if (r <= 0) return h;
  }
  return all[all.length - 1];
}

function nextQuestion(all, weights) {
  const correct = weightedRandom(all, weights);
  return { correct, choices: getChoices(correct, all) };
}

export default function HiraganaTrainer() {
  const [weights, setWeights] = useState({});
  const [{ correct, choices }, setQuestion] = useState(() => nextQuestion(HIRAGANA, {}));
  const [selected, setSelected] = useState(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const advance = useCallback((nextWeights) => {
    setSelected(null);
    setQuestion(nextQuestion(HIRAGANA, nextWeights));
  }, []);

  const handleChoice = useCallback((choice) => {
    if (selected) return;
    const isCorrect = choice.romaji === correct.romaji;
    setSelected({ romaji: choice.romaji, isCorrect });

    const nextWeights = { ...weights };
    if (isCorrect) {
      nextWeights[correct.romaji] = 0;
      setStreak(s => {
        const next = s + 1;
        setBestStreak(b => Math.max(b, next));
        return next;
      });
    } else {
      nextWeights[correct.romaji] = (nextWeights[correct.romaji] ?? 0) + 1;
      setStreak(0);
    }
    setWeights(nextWeights);
  }, [selected, correct, weights]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.key === " " || e.key === "Enter") && selected) advance(weights);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, advance, weights]);

  const getButtonStyle = (choice) => {
    const base = {
      padding: "14px 10px",
      borderRadius: "12px",
      fontSize: "1.1rem",
      fontWeight: "600",
      cursor: selected ? "default" : "pointer",
      border: "2px solid transparent",
      transition: "all 0.2s",
      letterSpacing: "0.05em",
    };

    if (!selected) {
      return { ...base, background: "#e8e3d4", color: "#3b3a2f", border: "2px solid #cdc9b4" };
    }

    if (choice.romaji === correct.romaji) {
      return { ...base, background: "#c2d9a0", color: "#2a3d1a", border: "2px solid #a8c478" };
    }
    if (choice.romaji === selected.romaji) {
      return { ...base, background: "#e8a89a", color: "#3d1a1a", border: "2px solid #d4806e" };
    }
    return { ...base, background: "#e8e3d4", color: "#b8b49a", border: "2px solid #cdc9b4" };
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f2efe6",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#3b3a2f",
      padding: "24px",
    }}>
      {/* Streak */}
      <div style={{ display: "flex", gap: "32px", marginBottom: "48px", color: "#9a9780", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
        <span>STREAK <span style={{ color: streak > 0 ? "#5a8a5a" : "#b8b49a", fontWeight: "700" }}>{streak}</span></span>
        <span>BEST <span style={{ color: "#b07d3a", fontWeight: "700" }}>{bestStreak}</span></span>
      </div>

      {/* Glyph */}
      <div style={{
        fontSize: "9rem",
        lineHeight: 1,
        marginBottom: "56px",
        userSelect: "none",
        filter: selected ? "none" : "drop-shadow(0 0 18px #5a8a5a40)",
        transition: "filter 0.3s",
      }}>
        {correct.glyph}
      </div>

      {/* Choices */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        width: "100%",
        maxWidth: "320px",
      }}>
        {choices.map((choice) => (
          <button
            key={choice.romaji}
            onClick={() => handleChoice(choice)}
            style={getButtonStyle(choice)}
          >
            {choice.romaji}
          </button>
        ))}
      </div>

      {/* Feedback + Next inline */}
      <div style={{
        marginTop: "28px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        opacity: selected ? 1 : 0,
        transition: "opacity 0.2s",
      }}>
        <span style={{ fontSize: "0.85rem", color: "#9a9780", letterSpacing: "0.06em" }}>
          {selected
            ? selected.isCorrect
              ? "✓ correct"
              : `✗ it was ${correct.romaji}`
            : ""}
        </span>
        {selected && (
          <button
            onClick={() => advance(weights)}
            style={{
              padding: "6px 18px",
              background: "transparent",
              border: "1px solid #cdc9b4",
              borderRadius: "8px",
              color: "#9a9780",
              cursor: "pointer",
              fontSize: "0.85rem",
              letterSpacing: "0.05em",
            }}
          >
            next →
          </button>
        )}
      </div>
    </div>
  );
}