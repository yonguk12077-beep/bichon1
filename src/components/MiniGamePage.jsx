import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_OPTIONS = ["배틀그라운드", "마인크래프트", "버인", "소통"];
const WHEEL_COLORS = [
  "#72c9ef",
  "#8fd9c8",
  "#ffd477",
  "#f4a7c5",
  "#aeb8f4",
  "#7ed7e5",
  "#f5b58b",
  "#a8d891",
  "#d3a9e8",
  "#86b8ed",
];
const WHEEL_SPIN_DURATION_MS = 3200;

const LADDER_MIN_PLAYERS = 2;
const LADDER_MAX_PLAYERS = 8;
const LADDER_DEFAULT_PLAYERS = 4;
const LADDER_VIEWBOX_WIDTH = 800;
const LADDER_VIEWBOX_HEIGHT = 420;
const LADDER_SIDE_PADDING = 48;
const LADDER_TOP_Y = 28;
const LADDER_BOTTOM_Y = 392;
const LADDER_RUN_DURATION_MS = 2800;

const QUIZ_PAGE_SIZE = 4;
const QUIZ_LEADERBOARD_KEY = "bichon-quiz-leaderboard-v1";
const QUIZ_QUESTIONS = [
  {
    id: "first-stream",
    question: "비숑의 첫 방송일은 언제일까요?",
    choices: ["2023년 7월 15일", "2024년 4월 12일", "2025년 4월 12일", "2026년 4월 12일"],
    answer: 1,
  },
  {
    id: "mbti",
    question: "비숑의 MBTI는 무엇일까요?",
    choices: ["ENFP", "ISTP", "ISFJ", "ENTJ"],
    answer: 1,
  },
  {
    id: "day-off",
    question: "비숑의 정기 휴방일은 무슨 요일일까요?",
    choices: ["월요일", "수요일", "토요일", "일요일"],
    answer: 3,
  },
  {
    id: "fandom",
    question: "비숑과 함께하는 팬들의 이름은 무엇일까요?",
    choices: ["별사탕", "솜뭉치", "구름단", "복슬이"],
    answer: 1,
  },
  {
    id: "goal",
    question: "비숑의 2026년 목표는 무엇일까요?",
    choices: ["애청자 1천 명", "애청자 5천 명", "애청자 1만 명", "애청자 10만 명"],
    answer: 2,
  },
  {
    id: "nickname",
    question: "비숑의 닉네임으로 소개된 이름은 무엇일까요?",
    choices: ["비츈", "비숑이", "솜숑", "비쭈"],
    answer: 0,
  },
  {
    id: "height",
    question: "비숑 프로필에 적힌 신장은 무엇일까요?",
    choices: ["150 cm", "155 cm", "170 같은 158 cm", "170 cm"],
    answer: 2,
  },
  {
    id: "platform",
    question: "비숑의 방송국을 볼 수 있는 플랫폼은 어디일까요?",
    choices: ["SOOP", "치지직", "트위치", "틱톡"],
    answer: 0,
  },
];

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

function polarPoint(centerX, centerY, radius, angle) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
}

function createWheelSlicePath(index, count) {
  const segmentAngle = 360 / count;
  const startAngle = index * segmentAngle;
  const endAngle = startAngle + segmentAngle;
  const start = polarPoint(180, 180, 166, endAngle);
  const end = polarPoint(180, 180, 166, startAngle);
  const largeArcFlag = segmentAngle > 180 ? 1 : 0;

  return [
    "M 180 180",
    `L ${start.x} ${start.y}`,
    `A 166 166 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function getWheelNumberPoint(index, count) {
  return polarPoint(180, 180, 112, (index + 0.5) * (360 / count));
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
  const pointPairs = [[columnPositions[startIndex], LADDER_TOP_Y]];
  let currentColumn = startIndex;

  rows.forEach((row, rowIndex) => {
    const rowY = getLadderRowY(rowIndex, rows.length);
    pointPairs.push([columnPositions[currentColumn], rowY]);

    if (row.includes(currentColumn)) {
      currentColumn += 1;
      pointPairs.push([columnPositions[currentColumn], rowY]);
    } else if (row.includes(currentColumn - 1)) {
      currentColumn -= 1;
      pointPairs.push([columnPositions[currentColumn], rowY]);
    }
  });

  pointPairs.push([columnPositions[currentColumn], LADDER_BOTTOM_Y]);

  return {
    destination: currentColumn,
    pointPairs,
  };
}

function getLadderProgressPath(pointPairs, progress) {
  if (!pointPairs?.length) return null;

  const segments = pointPairs.slice(1).map((point, index) => {
    const previousPoint = pointPairs[index];
    return {
      start: previousPoint,
      end: point,
      length: Math.hypot(point[0] - previousPoint[0], point[1] - previousPoint[1]),
    };
  });
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  let remainingLength = totalLength * Math.min(1, Math.max(0, progress));
  const visiblePoints = [pointPairs[0]];

  for (const segment of segments) {
    if (remainingLength >= segment.length) {
      visiblePoints.push(segment.end);
      remainingLength -= segment.length;
      continue;
    }

    const segmentProgress = segment.length ? remainingLength / segment.length : 0;
    visiblePoints.push([
      segment.start[0] + (segment.end[0] - segment.start[0]) * segmentProgress,
      segment.start[1] + (segment.end[1] - segment.start[1]) * segmentProgress,
    ]);
    break;
  }

  const position = visiblePoints.at(-1);
  return {
    points: visiblePoints.map(([x, y]) => `${x},${y}`).join(" "),
    position,
  };
}

function getDisplayValue(value, fallback) {
  return value.trim() || fallback;
}

function readQuizLeaderboard() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(QUIZ_LEADERBOARD_KEY) || "[]");
    return Array.isArray(saved) ? saved.slice(0, 10) : [];
  } catch {
    return [];
  }
}

function sortQuizLeaderboard(entries) {
  return [...entries]
    .sort((left, right) => (
      right.score - left.score
      || left.elapsedSeconds - right.elapsedSeconds
      || left.createdAt - right.createdAt
    ))
    .slice(0, 10);
}

function GamePanelTitle({ icon, eyebrow, title, titleId }) {
  return (
    <div className="minigame-panel-title">
      <span aria-hidden="true">{icon}</span>
      <div>
        <small>{eyebrow}</small>
        <h2 id={titleId}>{title}</h2>
      </div>
    </div>
  );
}

function RouletteGame() {
  const [draft, setDraft] = useState(DEFAULT_OPTIONS.join("\n"));
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const timeoutRef = useRef(null);
  const options = useMemo(() => parseOptions(draft), [draft]);

  useEffect(() => () => {
    window.clearTimeout(timeoutRef.current);
  }, []);

  const drawOption = () => {
    if (options.length < 2) {
      setError("두 개 이상의 후보를 적어주세요.");
      setResult("");
      return;
    }

    window.clearTimeout(timeoutRef.current);
    const nextWinnerIndex = Math.floor(Math.random() * options.length);
    const segmentAngle = 360 / options.length;
    const targetRotation = (360 - (nextWinnerIndex + 0.5) * segmentAngle) % 360;

    setError("");
    setResult("");
    setWinnerIndex(null);
    setIsDrawing(true);
    setWheelRotation((currentRotation) => {
      const normalizedRotation = ((currentRotation % 360) + 360) % 360;
      const remainingRotation = (targetRotation - normalizedRotation + 360) % 360;
      return currentRotation + 1800 + remainingRotation;
    });

    timeoutRef.current = window.setTimeout(() => {
      setResult(options[nextWinnerIndex]);
      setWinnerIndex(nextWinnerIndex);
      setIsDrawing(false);
    }, WHEEL_SPIN_DURATION_MS);
  };

  return (
    <div className="roulette-workspace">
      <section className="minigame-picker roulette-settings" aria-labelledby="random-picker-title">
        <GamePanelTitle
          icon="◉"
          eyebrow="RANDOM WHEEL"
          title="랜덤 뽑기"
          titleId="random-picker-title"
        />

        <label className="minigame-option-field">
          뽑기 후보
          <textarea
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError("");
              setResult("");
              setWinnerIndex(null);
            }}
            rows="6"
            placeholder={"후보를 한 줄에 하나씩 적어주세요.\n예: 배틀그라운드"}
            disabled={isDrawing}
          />
        </label>

        <div className="roulette-option-list" aria-label="현재 뽑기 후보">
          {options.map((option, index) => (
            <span className={winnerIndex === index ? "is-winner" : ""} key={option}>
              <b style={{ background: WHEEL_COLORS[index % WHEEL_COLORS.length] }}>{index + 1}</b>
              {option}
            </span>
          ))}
        </div>

        {error && <strong className="form-error">{error}</strong>}

        <button className="minigame-draw-button" type="button" onClick={drawOption} disabled={isDrawing}>
          {isDrawing ? "룰렛 회전 중" : "룰렛 돌리기"}
        </button>
      </section>

      <section className="roulette-result-panel" aria-live="polite">
        <div className="roulette-stage">
          <span className="roulette-pointer" aria-hidden="true" />
          <div
            className={`roulette-wheel-rotor ${isDrawing ? "is-spinning" : ""}`}
            style={{ transform: `rotate(${wheelRotation}deg)` }}
          >
            <svg viewBox="0 0 360 360" role="img" aria-label="랜덤 뽑기 룰렛">
              {options.map((option, index) => {
                const numberPoint = getWheelNumberPoint(index, options.length);
                return (
                  <g key={option}>
                    <path
                      d={createWheelSlicePath(index, options.length)}
                      fill={WHEEL_COLORS[index % WHEEL_COLORS.length]}
                    />
                    <text
                      x={numberPoint.x}
                      y={numberPoint.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {index + 1}
                    </text>
                  </g>
                );
              })}
              <circle cx="180" cy="180" r="40" className="roulette-wheel-center" />
              <text x="180" y="182" className="roulette-wheel-brand" textAnchor="middle">
                B
              </text>
            </svg>
          </div>
        </div>
        <div className={`roulette-result-copy ${result ? "has-result" : ""}`}>
          <small>TODAY&apos;S PICK</small>
          <strong>{isDrawing ? "룰렛이 선택하고 있어요" : result || "룰렛을 돌려보세요"}</strong>
        </div>
      </section>
    </div>
  );
}

function LadderGame() {
  const [ladderPlayerCount, setLadderPlayerCount] = useState(LADDER_DEFAULT_PLAYERS);
  const [ladderNames, setLadderNames] = useState(DEFAULT_LADDER_NAMES);
  const [ladderResults, setLadderResults] = useState(DEFAULT_LADDER_RESULTS);
  const [ladderRows, setLadderRows] = useState([]);
  const [selectedLadderStart, setSelectedLadderStart] = useState(null);
  const [revealedLadderResult, setRevealedLadderResult] = useState(null);
  const [showAllLadderResults, setShowAllLadderResults] = useState(false);
  const [ladderProgress, setLadderProgress] = useState(0);
  const [isLadderRunning, setIsLadderRunning] = useState(false);
  const ladderAnimationFrameRef = useRef(null);
  const ladderRunningRef = useRef(false);

  const ladderColumnPositions = useMemo(
    () => getLadderColumnPositions(ladderPlayerCount),
    [ladderPlayerCount]
  );
  const selectedLadderPath = useMemo(() => (
    selectedLadderStart === null || !ladderRows.length
      ? null
      : traceLadderPath(selectedLadderStart, ladderRows, ladderPlayerCount)
  ), [ladderPlayerCount, ladderRows, selectedLadderStart]);
  const visibleLadderPath = useMemo(() => (
    selectedLadderPath
      ? getLadderProgressPath(selectedLadderPath.pointPairs, ladderProgress)
      : null
  ), [ladderProgress, selectedLadderPath]);
  const allLadderMappings = useMemo(() => (
    ladderRows.length
      ? Array.from({ length: ladderPlayerCount }, (_, index) => ({
          start: index,
          destination: traceLadderPath(index, ladderRows, ladderPlayerCount).destination,
        }))
      : []
  ), [ladderPlayerCount, ladderRows]);

  useEffect(() => () => {
    window.cancelAnimationFrame(ladderAnimationFrameRef.current);
  }, []);

  const clearLadderRun = () => {
    window.cancelAnimationFrame(ladderAnimationFrameRef.current);
    ladderRunningRef.current = false;
    setIsLadderRunning(false);
    setSelectedLadderStart(null);
    setRevealedLadderResult(null);
    setShowAllLadderResults(false);
    setLadderProgress(0);
  };

  const updateLadderPlayerCount = (nextCount) => {
    const safeCount = Math.min(LADDER_MAX_PLAYERS, Math.max(LADDER_MIN_PLAYERS, nextCount));
    setLadderPlayerCount(safeCount);
    setLadderRows([]);
    clearLadderRun();
  };

  const updateLadderEntry = (setter, index, value) => {
    setter((currentValues) => (
      currentValues.map((currentValue, valueIndex) => (
        valueIndex === index ? value : currentValue
      ))
    ));
  };

  const buildLadder = () => {
    clearLadderRun();
    setLadderRows(createLadderRows(ladderPlayerCount));
  };

  const runLadder = (startIndex) => {
    if (ladderRunningRef.current || !ladderRows.length) return;

    window.cancelAnimationFrame(ladderAnimationFrameRef.current);
    ladderRunningRef.current = true;
    setIsLadderRunning(true);
    setShowAllLadderResults(false);
    setRevealedLadderResult(null);
    setSelectedLadderStart(startIndex);
    setLadderProgress(0);

    const destination = traceLadderPath(startIndex, ladderRows, ladderPlayerCount).destination;
    const startedAt = window.performance.now();
    const advanceLadder = (currentTime) => {
      const progress = Math.min(1, (currentTime - startedAt) / LADDER_RUN_DURATION_MS);
      setLadderProgress(progress);

      if (progress < 1) {
        ladderAnimationFrameRef.current = window.requestAnimationFrame(advanceLadder);
        return;
      }

      ladderRunningRef.current = false;
      setIsLadderRunning(false);
      setRevealedLadderResult(destination);
    };

    ladderAnimationFrameRef.current = window.requestAnimationFrame(advanceLadder);
  };

  return (
    <div className="ladder-game">
      <section className="ladder-setup" aria-labelledby="ladder-title">
        <GamePanelTitle icon="╫" eyebrow="GHOST LEG" title="사다리 타기" titleId="ladder-title" />

        <div className="ladder-count-row">
          <strong>참가 인원</strong>
          <div className="ladder-count-stepper" aria-label="참가 인원 설정">
            <button
              type="button"
              onClick={() => updateLadderPlayerCount(ladderPlayerCount - 1)}
              disabled={ladderPlayerCount <= LADDER_MIN_PLAYERS || isLadderRunning}
              aria-label="참가 인원 줄이기"
            >
              −
            </button>
            <output aria-live="polite">{ladderPlayerCount}명</output>
            <button
              type="button"
              onClick={() => updateLadderPlayerCount(ladderPlayerCount + 1)}
              disabled={ladderPlayerCount >= LADDER_MAX_PLAYERS || isLadderRunning}
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
                disabled={isLadderRunning}
              />
              <input
                type="text"
                value={ladderResults[index]}
                onChange={(event) => updateLadderEntry(setLadderResults, index, event.target.value)}
                maxLength="16"
                aria-label={`${index + 1}번 결과`}
                disabled={isLadderRunning}
              />
            </div>
          ))}
        </div>

        <button
          className="minigame-draw-button ladder-build-button"
          type="button"
          onClick={buildLadder}
          disabled={isLadderRunning}
        >
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
              disabled={isLadderRunning || revealedLadderResult === null}
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
                  onClick={() => runLadder(index)}
                  disabled={isLadderRunning}
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

              {visibleLadderPath && (
                <g>
                  <polyline
                    className="ladder-selected-path"
                    points={visibleLadderPath.points}
                  />
                  <circle
                    className="ladder-runner"
                    cx={visibleLadderPath.position[0]}
                    cy={visibleLadderPath.position[1]}
                    r="10"
                  />
                </g>
              )}
            </svg>

            <div className="ladder-label-row ladder-result-labels">
              {Array.from({ length: ladderPlayerCount }, (_, index) => (
                <span
                  className={revealedLadderResult === index ? "is-selected" : ""}
                  key={index}
                >
                  {revealedLadderResult === index
                    ? getDisplayValue(ladderResults[index], `결과 ${index + 1}`)
                    : "?"}
                </span>
              ))}
            </div>
          </div>

          <div className="ladder-selected-result" aria-live="polite">
            {isLadderRunning && <span>경로를 따라 내려가는 중입니다.</span>}
            {!isLadderRunning && revealedLadderResult !== null && (
              <strong>
                {getDisplayValue(
                  ladderNames[selectedLadderStart],
                  `참가자 ${selectedLadderStart + 1}`
                )}
                <span aria-hidden="true">→</span>
                {getDisplayValue(
                  ladderResults[revealedLadderResult],
                  `결과 ${revealedLadderResult + 1}`
                )}
              </strong>
            )}
            {!isLadderRunning && revealedLadderResult === null && (
              <span>위쪽 이름을 한 번 누르면 출발합니다.</span>
            )}
          </div>

          {showAllLadderResults && !isLadderRunning && (
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
  );
}

function QuizGame() {
  const [nickname, setNickname] = useState("");
  const [quizError, setQuizError] = useState("");
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [quizPage, setQuizPage] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState(readQuizLeaderboard);
  const quizStartedAtRef = useRef(0);

  const totalPages = Math.ceil(QUIZ_QUESTIONS.length / QUIZ_PAGE_SIZE);
  const pageQuestions = QUIZ_QUESTIONS.slice(
    quizPage * QUIZ_PAGE_SIZE,
    (quizPage + 1) * QUIZ_PAGE_SIZE
  );
  const isCurrentPageComplete = pageQuestions.every(
    (question) => quizAnswers[question.id] !== undefined
  );

  const startQuiz = () => {
    if (!nickname.trim()) {
      setQuizError("이름을 적어주세요.");
      return;
    }

    setQuizError("");
    setQuizAnswers({});
    setQuizPage(0);
    setQuizResult(null);
    setIsQuizStarted(true);
    quizStartedAtRef.current = Date.now();
  };

  const submitQuiz = () => {
    if (!isCurrentPageComplete) return;

    const score = QUIZ_QUESTIONS.reduce(
      (total, question) => total + (quizAnswers[question.id] === question.answer ? 1 : 0),
      0
    );
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - quizStartedAtRef.current) / 1000));
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nickname: nickname.trim(),
      score,
      total: QUIZ_QUESTIONS.length,
      elapsedSeconds,
      createdAt: Date.now(),
    };
    const nextLeaderboard = sortQuizLeaderboard([...leaderboard, entry]);
    const rank = nextLeaderboard.findIndex((item) => item.id === entry.id) + 1;

    setLeaderboard(nextLeaderboard);
    setQuizResult({ ...entry, rank: rank || nextLeaderboard.length + 1 });

    try {
      window.localStorage.setItem(QUIZ_LEADERBOARD_KEY, JSON.stringify(nextLeaderboard));
    } catch {
      // The current result still displays when browser storage is unavailable.
    }
  };

  const resetQuiz = () => {
    setIsQuizStarted(false);
    setQuizPage(0);
    setQuizAnswers({});
    setQuizResult(null);
    setQuizError("");
  };

  if (!isQuizStarted) {
    return (
      <section className="quiz-cover" aria-labelledby="quiz-cover-title">
        <div className="quiz-paper-mark" aria-hidden="true">B</div>
        <small>BICHON QUIZ</small>
        <h2 id="quiz-cover-title">비숑 탐구 시험</h2>
        <div className="quiz-cover-rule" />
        <dl>
          <div>
            <dt>문항</dt>
            <dd>{QUIZ_QUESTIONS.length}문제</dd>
          </div>
          <div>
            <dt>구성</dt>
            <dd>한 장에 4문제</dd>
          </div>
        </dl>
        <label>
          응시자 이름
          <input
            type="text"
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value);
              setQuizError("");
            }}
            maxLength="12"
            placeholder="이름을 적어주세요"
          />
        </label>
        {quizError && <strong className="form-error">{quizError}</strong>}
        <button className="quiz-primary-button" type="button" onClick={startQuiz}>
          시험 시작
        </button>
      </section>
    );
  }

  if (quizResult) {
    return (
      <div className="quiz-result-layout">
        <section className="quiz-score-sheet" aria-labelledby="quiz-score-title">
          <small>RESULT CARD</small>
          <h2 id="quiz-score-title">비숑 탐구 성적표</h2>
          <div className="quiz-score-stamp">
            <strong>{Math.round((quizResult.score / quizResult.total) * 100)}</strong>
            <span>점</span>
          </div>
          <dl>
            <div>
              <dt>응시자</dt>
              <dd>{quizResult.nickname}</dd>
            </div>
            <div>
              <dt>정답</dt>
              <dd>{quizResult.score} / {quizResult.total}</dd>
            </div>
            <div>
              <dt>풀이 시간</dt>
              <dd>{quizResult.elapsedSeconds}초</dd>
            </div>
            <div>
              <dt>현재 순위</dt>
              <dd>{quizResult.rank}위</dd>
            </div>
          </dl>
          <button className="quiz-primary-button" type="button" onClick={resetQuiz}>
            다시 풀기
          </button>
        </section>

        <section className="quiz-leaderboard" aria-labelledby="quiz-ranking-title">
          <div>
            <small>TOP 10</small>
            <h3 id="quiz-ranking-title">퀴즈 순위</h3>
          </div>
          <ol>
            {leaderboard.map((entry, index) => (
              <li className={entry.id === quizResult.id ? "is-current" : ""} key={entry.id}>
                <b>{index + 1}</b>
                <strong>{entry.nickname}</strong>
                <span>{entry.score}/{entry.total}</span>
                <small>{entry.elapsedSeconds}초</small>
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  return (
    <section className="quiz-exam-paper" aria-labelledby="quiz-exam-title">
      <header>
        <div>
          <small>BICHON QUIZ · {quizPage + 1} / {totalPages}</small>
          <h2 id="quiz-exam-title">비숑 탐구 시험</h2>
        </div>
        <dl>
          <div>
            <dt>이름</dt>
            <dd>{nickname.trim()}</dd>
          </div>
          <div>
            <dt>문항</dt>
            <dd>{quizPage * QUIZ_PAGE_SIZE + 1} - {quizPage * QUIZ_PAGE_SIZE + pageQuestions.length}</dd>
          </div>
        </dl>
      </header>

      <div className="quiz-question-list">
        {pageQuestions.map((question, pageIndex) => {
          const questionNumber = quizPage * QUIZ_PAGE_SIZE + pageIndex + 1;
          return (
            <fieldset key={question.id}>
              <legend>
                <b>{questionNumber}.</b>
                {question.question}
              </legend>
              <div className="quiz-choice-grid">
                {question.choices.map((choice, choiceIndex) => (
                  <label
                    className={quizAnswers[question.id] === choiceIndex ? "is-selected" : ""}
                    key={choice}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={quizAnswers[question.id] === choiceIndex}
                      onChange={() => setQuizAnswers((currentAnswers) => ({
                        ...currentAnswers,
                        [question.id]: choiceIndex,
                      }))}
                    />
                    <span>{choiceIndex + 1}</span>
                    {choice}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>

      <footer>
        <button
          type="button"
          onClick={() => setQuizPage((currentPage) => Math.max(0, currentPage - 1))}
          disabled={quizPage === 0}
        >
          이전 장
        </button>
        <div aria-label="퀴즈 페이지">
          {Array.from({ length: totalPages }, (_, index) => (
            <span className={quizPage === index ? "is-current" : ""} key={index}>
              {index + 1}
            </span>
          ))}
        </div>
        {quizPage < totalPages - 1 ? (
          <button
            type="button"
            onClick={() => setQuizPage((currentPage) => currentPage + 1)}
            disabled={!isCurrentPageComplete}
          >
            다음 장
          </button>
        ) : (
          <button type="button" onClick={submitQuiz} disabled={!isCurrentPageComplete}>
            답안 제출
          </button>
        )}
      </footer>
    </section>
  );
}

export default function MiniGamePage({ onBack }) {
  const [activeGame, setActiveGame] = useState("");

  return (
    <section className="page-section minigame-route-section">
      <button
        className="gallery-back-button"
        type="button"
        onClick={activeGame ? () => setActiveGame("") : onBack}
      >
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
            <span className="minigame-hub-icon" aria-hidden="true">◉</span>
            <small>RANDOM WHEEL</small>
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
          <button
            className="minigame-hub-card is-quiz"
            type="button"
            onClick={() => setActiveGame("quiz")}
            aria-label="비숑 퀴즈 열기"
          >
            <span className="minigame-hub-icon" aria-hidden="true">Q</span>
            <small>BICHON QUIZ</small>
            <strong>비숑 퀴즈</strong>
          </button>
        </nav>
      )}

      {activeGame === "random" && <RouletteGame />}
      {activeGame === "ladder" && <LadderGame />}
      {activeGame === "quiz" && <QuizGame />}
    </section>
  );
}
