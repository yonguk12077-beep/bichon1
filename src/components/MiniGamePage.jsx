import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_OPTIONS = ["배틀그라운드", "마인크래프트", "버인", "소통"];
const LADDER_MIN_PLAYERS = 2;
const LADDER_MAX_PLAYERS = 8;
const LADDER_DEFAULT_PLAYERS = 4;
const LADDER_VIEWBOX_WIDTH = 800;
const LADDER_VIEWBOX_HEIGHT = 420;
const LADDER_SIDE_PADDING = 48;
const LADDER_TOP_Y = 28;
const LADDER_BOTTOM_Y = 392;

const DEFAULT_LADDER_NAMES = Array.from(
  { length: LADDER_MAX_PLAYERS },
  (_, index) => `참가자 ${index + 1}`
);
const DEFAULT_LADDER_RESULTS = Array.from(
  { length: LADDER_MAX_PLAYERS },
  (_, index) => `결과 ${index + 1}`
);

function parseOptions(value) {
  return [...new Set(
    value
      .split(/[\n,]/)
      .map((option) => option.trim())
      .filter(Boolean)
  )].slice(0, 10);
}

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function createLadderRows(playerCount) {
  const rowCount = Math.max(10, playerCount * 2);
  const rows = Array.from({ length: rowCount }, () => []);
  const edges = shuffle(Array.from({ length: playerCount - 1 }, (_, index) => index));

  edges.forEach((edge) => {
    const candidateRows = shuffle(Array.from({ length: rowCount }, (_, index) => index));
    const targetRow = candidateRows.find((rowIndex) => (
      !rows[rowIndex].includes(edge - 1) && !rows[rowIndex].includes(edge + 1)
    ));

    if (targetRow !== undefined) rows[targetRow].push(edge);
  });

  rows.forEach((row) => {
    for (let edge = 0; edge < playerCount - 1; edge += 1) {
      const touchesAnotherRung = row.includes(edge - 1) || row.includes(edge) || row.includes(edge + 1);
      if (!touchesAnotherRung && Math.random() < 0.32) row.push(edge);
    }

    row.sort((left, right) => left - right);
  });

  return rows;
}

function getLadderColumnPositions(playerCount) {
  const availableWidth = LADDER_VIEWBOX_WIDTH - LADDER_SIDE_PADDING * 2;
  const gap = availableWidth / (playerCount - 1);

  return Array.from(
    { length: playerCount },
    (_, index) => LADDER_SIDE_PADDING + gap * index
  );
}

function getLadderRowY(rowIndex, rowCount) {
  const top = 62;
  const bottom = 354;
  if (rowCount <= 1) return (top + bottom) / 2;

  return top + ((bottom - top) * rowIndex) / (rowCount - 1);
}

function traceLadderPath(startIndex, rows, playerCount) {
  const columnPositions = getLadderColumnPositions(playerCount);
  const points = [[columnPositions[startIndex], LADDER_TOP_Y]];
  let currentColumn = startIndex;

  rows.forEach((row, rowIndex) => {
    const rowY = getLadderRowY(rowIndex, rows.length);
    points.push([columnPositions[currentColumn], rowY]);

    if (row.includes(currentColumn)) {
      currentColumn += 1;
      points.push([columnPositions[currentColumn], rowY]);
    } else if (row.includes(currentColumn - 1)) {
      currentColumn -= 1;
      points.push([columnPositions[currentColumn], rowY]);
    }
  });

  points.push([columnPositions[currentColumn], LADDER_BOTTOM_Y]);

  return {
    destination: currentColumn,
    points: points.map(([x, y]) => `${x},${y}`).join(" "),
  };
}

function getDisplayValue(value, fallback) {
  return value.trim() || fallback;
}

export default function MiniGamePage({ onBack }) {
  const [activeGame, setActiveGame] = useState("");
  const [draft, setDraft] = useState(DEFAULT_OPTIONS.join("\n"));
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [ladderPlayerCount, setLadderPlayerCount] = useState(LADDER_DEFAULT_PLAYERS);
  const [ladderNames, setLadderNames] = useState(DEFAULT_LADDER_NAMES);
  const [ladderResults, setLadderResults] = useState(DEFAULT_LADDER_RESULTS);
  const [ladderRows, setLadderRows] = useState([]);
  const [selectedLadderStart, setSelectedLadderStart] = useState(null);
  const [showAllLadderResults, setShowAllLadderResults] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const options = useMemo(() => parseOptions(draft), [draft]);
  const ladderColumnPositions = useMemo(
    () => getLadderColumnPositions(ladderPlayerCount),
    [ladderPlayerCount]
  );
  const selectedLadderPath = useMemo(() => (
    selectedLadderStart === null || !ladderRows.length
      ? null
      : traceLadderPath(selectedLadderStart, ladderRows, ladderPlayerCount)
  ), [ladderPlayerCount, ladderRows, selectedLadderStart]);
  const allLadderMappings = useMemo(() => (
    ladderRows.length
      ? Array.from({ length: ladderPlayerCount }, (_, index) => ({
          start: index,
          destination: traceLadderPath(index, ladderRows, ladderPlayerCount).destination,
        }))
      : []
  ), [ladderPlayerCount, ladderRows]);

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

  const updateLadderPlayerCount = (nextCount) => {
    const safeCount = Math.min(LADDER_MAX_PLAYERS, Math.max(LADDER_MIN_PLAYERS, nextCount));
    setLadderPlayerCount(safeCount);
    setLadderRows([]);
    setSelectedLadderStart(null);
    setShowAllLadderResults(false);
  };

  const updateLadderEntry = (setter, index, value) => {
    setter((currentValues) => (
      currentValues.map((currentValue, valueIndex) => (
        valueIndex === index ? value : currentValue
      ))
    ));
  };

  const buildLadder = () => {
    setLadderRows(createLadderRows(ladderPlayerCount));
    setSelectedLadderStart(null);
    setShowAllLadderResults(false);
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
          <button
            className="minigame-hub-card is-ladder"
            type="button"
            onClick={() => setActiveGame("ladder")}
            aria-label="사다리 타기 열기"
          >
            <span className="minigame-hub-icon ladder-hub-icon" aria-hidden="true">╫</span>
            <small>GHOST LEG</small>
            <strong>사다리 타기</strong>
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

      {activeGame === "ladder" && (
        <div className="ladder-game">
          <section className="ladder-setup" aria-labelledby="ladder-title">
            <div className="minigame-panel-title">
              <span aria-hidden="true">╫</span>
              <div>
                <small>GHOST LEG</small>
                <h2 id="ladder-title">사다리 타기</h2>
              </div>
            </div>

            <div className="ladder-count-row">
              <strong>참가 인원</strong>
              <div className="ladder-count-stepper" aria-label="참가 인원 설정">
                <button
                  type="button"
                  onClick={() => updateLadderPlayerCount(ladderPlayerCount - 1)}
                  disabled={ladderPlayerCount <= LADDER_MIN_PLAYERS}
                  aria-label="참가 인원 줄이기"
                >
                  −
                </button>
                <output aria-live="polite">{ladderPlayerCount}명</output>
                <button
                  type="button"
                  onClick={() => updateLadderPlayerCount(ladderPlayerCount + 1)}
                  disabled={ladderPlayerCount >= LADDER_MAX_PLAYERS}
                  aria-label="참가 인원 늘리기"
                >
                  +
                </button>
              </div>
              <small>최소 2명 · 최대 8명</small>
            </div>

            <div className="ladder-entry-table">
              <div className="ladder-entry-heading" aria-hidden="true">
                <span>번호</span>
                <span>출발 이름</span>
                <span>결과</span>
              </div>
              {Array.from({ length: ladderPlayerCount }, (_, index) => (
                <div className="ladder-entry-row" key={index}>
                  <b>{index + 1}</b>
                  <input
                    type="text"
                    value={ladderNames[index]}
                    onChange={(event) => updateLadderEntry(setLadderNames, index, event.target.value)}
                    maxLength="12"
                    aria-label={`${index + 1}번 참가자 이름`}
                  />
                  <input
                    type="text"
                    value={ladderResults[index]}
                    onChange={(event) => updateLadderEntry(setLadderResults, index, event.target.value)}
                    maxLength="16"
                    aria-label={`${index + 1}번 결과`}
                  />
                </div>
              ))}
            </div>

            <button className="minigame-draw-button ladder-build-button" type="button" onClick={buildLadder}>
              {ladderRows.length ? "사다리 다시 만들기" : "사다리 만들기"}
            </button>
          </section>

          {ladderRows.length > 0 && (
            <section className="ladder-board-section" aria-labelledby="ladder-board-title">
              <div className="ladder-board-heading">
                <div>
                  <small>SELECT A START</small>
                  <h3 id="ladder-board-title">출발 이름을 선택하세요</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllLadderResults((current) => !current)}
                  aria-pressed={showAllLadderResults}
                >
                  {showAllLadderResults ? "전체 결과 숨기기" : "전체 결과 보기"}
                </button>
              </div>

              <div className="ladder-board" style={{ "--ladder-count": ladderPlayerCount }}>
                <div className="ladder-label-row ladder-start-labels">
                  {Array.from({ length: ladderPlayerCount }, (_, index) => (
                    <button
                      className={selectedLadderStart === index ? "is-selected" : ""}
                      type="button"
                      onClick={() => setSelectedLadderStart(index)}
                      key={index}
                    >
                      {getDisplayValue(ladderNames[index], `참가자 ${index + 1}`)}
                    </button>
                  ))}
                </div>

                <svg
                  className="ladder-svg"
                  viewBox={`0 0 ${LADDER_VIEWBOX_WIDTH} ${LADDER_VIEWBOX_HEIGHT}`}
                  role="img"
                  aria-label="생성된 사다리 경로"
                  preserveAspectRatio="none"
                >
                  {ladderColumnPositions.map((x, index) => (
                    <line
                      className="ladder-vertical-line"
                      x1={x}
                      y1={LADDER_TOP_Y}
                      x2={x}
                      y2={LADDER_BOTTOM_Y}
                      key={`vertical-${index}`}
                    />
                  ))}

                  {ladderRows.flatMap((row, rowIndex) => (
                    row.map((edge) => (
                      <line
                        className="ladder-rung-line"
                        x1={ladderColumnPositions[edge]}
                        y1={getLadderRowY(rowIndex, ladderRows.length)}
                        x2={ladderColumnPositions[edge + 1]}
                        y2={getLadderRowY(rowIndex, ladderRows.length)}
                        key={`rung-${rowIndex}-${edge}`}
                      />
                    ))
                  ))}

                  {selectedLadderPath && (
                    <polyline className="ladder-selected-path" points={selectedLadderPath.points} />
                  )}
                </svg>

                <div className="ladder-label-row ladder-result-labels">
                  {Array.from({ length: ladderPlayerCount }, (_, index) => (
                    <span
                      className={selectedLadderPath?.destination === index ? "is-selected" : ""}
                      key={index}
                    >
                      {getDisplayValue(ladderResults[index], `결과 ${index + 1}`)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="ladder-selected-result" aria-live="polite">
                {selectedLadderPath ? (
                  <strong>
                    {getDisplayValue(
                      ladderNames[selectedLadderStart],
                      `참가자 ${selectedLadderStart + 1}`
                    )}
                    <span aria-hidden="true">→</span>
                    {getDisplayValue(
                      ladderResults[selectedLadderPath.destination],
                      `결과 ${selectedLadderPath.destination + 1}`
                    )}
                  </strong>
                ) : (
                  <span>위쪽 이름을 누르면 경로가 표시됩니다.</span>
                )}
              </div>

              {showAllLadderResults && (
                <div className="ladder-all-results">
                  {allLadderMappings.map(({ start, destination }) => (
                    <p key={start}>
                      <strong>{getDisplayValue(ladderNames[start], `참가자 ${start + 1}`)}</strong>
                      <span aria-hidden="true">→</span>
                      <b>{getDisplayValue(ladderResults[destination], `결과 ${destination + 1}`)}</b>
                    </p>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </section>
  );
}
