import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

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

const TIERS = [
  { min: 0,    cls: "tier-zen",       label: null },
  { min: 100,  cls: "tier-gold",      label: "🌾 pale gold unlocked" },
  { min: 250,  cls: "tier-green",     label: "🌿 verdant unlocked" },
  { min: 500,  cls: "tier-diamond",   label: "💎 diamond unlocked" },
  { min: 1000, cls: "tier-blackbelt", label: "🥋 black belt unlocked" },
];

function getTierClass(streak) {
  let cls = TIERS[0].cls;
  for (const t of TIERS) {
    if (streak >= t.min) cls = t.cls;
  }
  return cls;
}

function getTierLabel(prev, next) {
  for (const t of TIERS) {
    if (prev < t.min && next >= t.min) return t.label;
  }
  return null;
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getChoices(correct, all) {
  const others = shuffle(all.filter(h => h.romaji !== correct.romaji)).slice(0, 3);
  return shuffle([correct, ...others]);
}

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
  const [unlockMsg, setUnlockMsg] = useState(null);
  const unlockTimer = useRef(null);

  const tierClass = getTierClass(streak);

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

  useEffect(() => () => clearTimeout(unlockTimer.current), []);

  const getChoiceClass = (choice) => {
    if (!selected) return "choice-btn";
    if (choice.romaji === correct.romaji) return "choice-btn correct";
    if (choice.romaji === selected.romaji) return "choice-btn wrong";
    return "choice-btn dimmed";
  };

  return (
    <div className={`app-root ${tierClass}`}>
      {/* Tier unlock toast */}
      <div className={`tier-unlock ${unlockMsg ? "show" : ""}`}>
        {unlockMsg}
      </div>

      {/* Stats */}
      <div className="app-stats">
        <span>STREAK <span className="stat-streak">{streak}</span></span>
        <span>BEST <span className="stat-best">{bestStreak}</span></span>
      </div>

      {/* Glyph */}
      <div className={`app-glyph ${selected ? "" : "unanswered"}`}>
        {correct.glyph}
      </div>

      {/* Choices */}
      <div className="app-choices">
        {choices.map((choice) => (
          <button
            key={choice.romaji}
            onClick={() => handleChoice(choice)}
            disabled={!!selected}
            className={getChoiceClass(choice)}
          >
            {choice.romaji}
          </button>
        ))}
      </div>

      {/* Feedback + Next */}
      <div className={`app-feedback ${selected ? "visible" : ""}`}>
        <span className="feedback-text">
          {selected
            ? selected.isCorrect
              ? "✓ correct"
              : `✗ it was ${correct.romaji}`
            : ""}
        </span>
        {selected && (
          <button className="next-btn" onClick={() => advance(weights)}>
            next →
          </button>
        )}
      </div>
    </div>
  );
}
