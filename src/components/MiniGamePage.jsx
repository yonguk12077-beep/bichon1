import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_OPTIONS = ["배틀그라운드", "마인크래프트", "버인", "소통"];

function parseOptions(value) {
  return [...new Set(
    value
      .split(/[\n,]/)
      .map((option) => option.trim())
      .filter(Boolean)
  )].slice(0, 10);
}

export default function MiniGamePage({ onBack }) {
  const [activeGame, setActiveGame] = useState("");
  const [draft, setDraft] = useState(DEFAULT_OPTIONS.join("\n"));
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const options = useMemo(() => parseOptions(draft), [draft]);

  useEffect(() => () => {
    window.clearInterval(intervalRef.current);
    window.clearTimeout(timeoutRef.current);
  }, []);

  const drawOption = () => {
    if (options.length < 2) {
      setError("두 개 이상의 후보를 적어주세요.");
      setResult("");
      return;
    }

    window.clearInterval(intervalRef.current);
    window.clearTimeout(timeoutRef.current);
    setError("");
    setIsDrawing(true);

    intervalRef.current = window.setInterval(() => {
      setResult(options[Math.floor(Math.random() * options.length)]);
    }, 80);

    timeoutRef.current = window.setTimeout(() => {
      window.clearInterval(intervalRef.current);
      setResult(options[Math.floor(Math.random() * options.length)]);
      setIsDrawing(false);
    }, 960);
  };

  const returnToLounge = () => {
    window.clearInterval(intervalRef.current);
    window.clearTimeout(timeoutRef.current);
    setIsDrawing(false);
    setActiveGame("");
  };

  return (
    <section className="page-section minigame-route-section">
      <button className="gallery-back-button" type="button" onClick={activeGame ? returnToLounge : onBack}>
        {activeGame ? "← 쉼터로 돌아가기" : "← 메인으로 돌아가기"}
      </button>

      <header className="minigame-page-heading">
        <span>BICHON LOUNGE</span>
        <h1>솜뭉치 쉼터</h1>
        <p>{activeGame ? "오늘의 놀이" : "잠깐 쉬어가는 시간"}</p>
      </header>

      {!activeGame && (
        <nav className="minigame-hub-grid" aria-label="쉼터 놀이 선택">
          <button
            className="minigame-hub-card is-random"
            type="button"
            onClick={() => setActiveGame("random")}
            aria-label="랜덤 뽑기 열기"
          >
            <span className="minigame-hub-icon" aria-hidden="true">⚄</span>
            <small>RANDOM PICK</small>
            <strong>랜덤 뽑기</strong>
          </button>
        </nav>
      )}

      {activeGame === "random" && (
        <div className="minigame-workspace">
          <section className="minigame-picker" aria-labelledby="random-picker-title">
            <div className="minigame-panel-title">
              <span aria-hidden="true">⚄</span>
              <div>
                <small>RANDOM PICK</small>
                <h2 id="random-picker-title">랜덤 뽑기</h2>
              </div>
            </div>

            <label className="minigame-option-field">
              뽑기 후보
              <textarea
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setError("");
                }}
                rows="6"
                placeholder={"후보를 한 줄에 하나씩 적어주세요.\n예: 배틀그라운드"}
              />
            </label>

            <div className="minigame-option-chips" aria-label="현재 뽑기 후보">
              {options.map((option) => (
                <span key={option}>{option}</span>
              ))}
            </div>

            {error && <strong className="form-error">{error}</strong>}

            <button className="minigame-draw-button" type="button" onClick={drawOption} disabled={isDrawing}>
              {isDrawing ? "뽑는 중" : "하나 뽑기"}
            </button>
          </section>

          <section className={`minigame-result ${result ? "has-result" : ""}`} aria-live="polite">
            <small>TODAY&apos;S PICK</small>
            <div aria-hidden="true">?</div>
            <strong>{result || "결과를 기다리고 있어요"}</strong>
          </section>
        </div>
      )}
    </section>
  );
}
