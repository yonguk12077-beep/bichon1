import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_OPTIONS = ["배틀그라운드", "마인크래프트", "버인", "소통"];

const FORTUNE_MESSAGES = [
  "지금 185개를 주면 좋은 일이 생길 거예요. 아마도 방송인에게요.",
  "오늘 첫 별풍선 주인공은 방송 내내 자랑할 권리를 얻습니다.",
  "별풍선 1004개가 보이지만 쿠키가 숫자를 잘못 읽었을 수도 있어요.",
  "10개만 모이면 방송인이 갑자기 자신감이 생길 예정입니다.",
  "18개가 들어오면 오늘의 흑역사가 하나 봉인됩니다.",
  "777개보다 중요한 건 지금 채팅창의 박수 세 번입니다.",
  "오늘 별풍선 운은 상승세입니다. 받는 쪽 기준입니다.",
  "후원 알림이 울리면 방금 한 말은 명언이 됩니다.",
  "185라는 숫자가 자꾸 보인다면 기분 탓이 아닐지도 몰라요.",
  "오늘의 큰손은 아직 채팅창 어딘가에 숨어 있습니다.",
  "지금 들어온 사람은 오늘 방송의 행운 부적입니다.",
  "첫 채팅을 치면 방송인이 한 번 더 웃을 확률이 올라갑니다.",
  "채팅창에 ㅋㅋㅋ가 열 개 모이면 재미있는 사고가 납니다.",
  "오늘의 금지어는 ‘마지막 판’입니다. 말하는 순간 한 판이 늘어납니다.",
  "지금부터 30초 동안 방송인을 칭찬하면 의심부터 받을 수 있습니다.",
  "채팅창이 조용해지는 순간 방송인이 혼잣말을 시작합니다.",
  "오늘 한 명은 반드시 클립각을 목격합니다. 준비하세요.",
  "방금 팔로우한 솜뭉치에게 오늘의 주인공 버프가 적용됩니다.",
  "오늘은 훈수보다 감탄사가 더 잘 먹히는 날입니다.",
  "‘이건 된다’를 외치면 안 될 것도 될 수 있습니다. 아주 가끔요.",
  "첫 판 치킨의 기운이 있습니다. 단, 상대팀에도 같은 쿠키가 갔습니다.",
  "오늘 배그에서 프라이팬을 들면 영웅이 될 가능성이 3% 증가합니다.",
  "보급 상자를 먼저 본 사람이 오늘의 콘텐츠를 정합니다.",
  "다음 판은 평소 안 쓰던 무기가 대박을 낼 운세입니다.",
  "오늘의 안전지대는 방송인의 예상과 정반대에 생깁니다.",
  "한 번만 더를 외치면 정확히 세 판이 추가됩니다.",
  "오늘 마크에서 아래로 파면 다이아보다 웃음거리를 먼저 발견합니다.",
  "크리퍼 소리가 들리면 채팅창은 이미 알고 있을 겁니다.",
  "오늘 지은 집은 멋지거나 역사에 남을 만큼 이상할 예정입니다.",
  "길을 잃으면 콘텐츠를 찾은 것이니 당황하지 마세요.",
  "오늘 노래 첫 소절이 완벽하면 채팅창이 더 어려운 곡을 추천합니다.",
  "고음이 잘 올라가는 날입니다. 이웃의 반응은 쿠키가 책임지지 않습니다.",
  "선곡 고민이 생기면 채팅창 세 번째 추천을 믿어보세요.",
  "오늘의 신청곡은 방송인의 기억 속 제목과 다를 수 있습니다.",
  "흥얼거린 노래가 다음 콘텐츠가 될 가능성이 높습니다.",
  "지금 물 한 모금 마시면 다음 멘트가 20% 더 또렷해집니다.",
  "스트레칭을 하면 뜻밖의 레전드 장면을 피할 수 있습니다.",
  "오늘은 마이크 음소거를 한 번 더 확인하면 평화가 찾아옵니다.",
  "방송 시작 3분 안에 찾던 물건이 바로 옆에서 발견됩니다.",
  "오늘의 장비는 말을 잘 듣습니다. 케이블만 제외하고요.",
  "다음 선택지는 시청자 투표에 맡기면 예상 밖의 재미가 생깁니다.",
  "채팅창에서 가장 먼저 ‘가자’를 외친 사람이 임시 감독입니다.",
  "오늘 콘텐츠가 고민되면 랜덤 뽑기의 말을 따르세요. 책임은 랜덤에게 있습니다.",
  "왼쪽을 고르면 안정, 오른쪽을 고르면 클립각이 기다립니다.",
  "오늘은 계획보다 즉흥이 더 재미있는 날입니다.",
  "방송인이 망설이면 채팅창의 첫 답이 정답이 됩니다.",
  "5초 안에 고른 메뉴가 오늘의 행운 콘텐츠입니다.",
  "지금 떠오른 아이디어는 메모하지 않으면 엔딩 직전에 다시 생각납니다.",
  "오늘의 벌칙은 생각보다 귀엽게 끝날 가능성이 높습니다.",
  "도전 미션에 성공하면 채팅창이 더 어려운 미션을 준비합니다.",
  "오늘 한 번은 완벽한 타이밍에 재채기가 나올 예정입니다.",
  "진지한 말을 시작하면 누군가 정확히 그때 웃긴 채팅을 칩니다.",
  "오늘의 명장면은 준비하지 않은 순간에 나옵니다.",
  "방송인이 ‘진짜 마지막’을 말하면 솜뭉치들은 시간을 확인해 주세요.",
  "오늘은 실수가 편집점이 아니라 대표 장면이 되는 날입니다.",
  "방금 한 드립은 세 번 설명하면 재미가 돌아올 수도 있습니다.",
  "채팅창이 한마음이 되는 순간 방송인은 불안해집니다.",
  "오늘의 레전드 클립 제목은 이미 누군가 생각하고 있습니다.",
  "예상치 못한 손님이 오면 콘텐츠가 두 배로 늘어납니다.",
  "오늘 방송의 엔딩은 예정 시간보다 조금 늦을 운명입니다.",
  "칭찬 한마디가 방송인의 텐션을 한 칸 올립니다.",
  "오늘은 닉네임을 불린 솜뭉치에게 작은 행운이 따라옵니다.",
  "처음 온 시청자에게 인사하면 단골이 될 가능성이 올라갑니다.",
  "채팅창에서 같은 이모티콘이 다섯 번 모이면 비밀 이벤트가 시작됩니다.",
  "오늘의 MVP는 가장 타이밍 좋게 ‘ㅋㅋ’를 친 사람입니다.",
  "시청자 한 명의 엉뚱한 질문이 오늘의 메인 콘텐츠가 됩니다.",
  "지금 채팅창에 소원을 적으면 방송인이 읽고 당황할 수 있습니다.",
  "오늘은 서로의 드립을 한 번씩 살려주면 방송이 더 길어집니다.",
  "조용히 보고 있던 솜뭉치가 결정적인 순간에 나타납니다.",
  "오늘의 새 유행어는 실수로 탄생합니다.",
  "점심 메뉴를 묻는 순간 채팅창이 요리 대결장이 됩니다.",
  "야식 이야기를 시작하면 배고픈 사람이 급격히 늘어납니다.",
  "오늘의 운세는 ‘일단 해보기’입니다. 망하면 클립으로 남기면 됩니다.",
  "지금 웃으면 복이 옵니다. 크게 웃으면 마이크가 먼저 반응합니다.",
  "좋은 일이 생길 징조입니다. 방송이 무사히 켜졌다면 이미 하나 이뤘습니다.",
  "오늘의 행운색은 하늘색, 행운의 숫자는 185입니다.",
  "쿠키가 말합니다. 오늘은 공지보다 즉흥 공지가 더 중요할 수 있습니다.",
  "다음 휴식 전에 꼭 한 번은 ‘이게 왜 되지?’를 외치게 됩니다.",
  "방송 종료 버튼을 누르기 전에 오늘의 한 줄 소감을 남기면 행운이 저장됩니다.",
  "이 쿠키를 본 순간부터 오늘 방송은 이미 콘텐츠가 되었습니다.",
];

const GAMES = [
  {
    id: "random",
    label: "랜덤 뽑기",
    eyebrow: "RANDOM PICK",
    icon: "⚄",
  },
  {
    id: "fortune",
    label: "포춘쿠키",
    eyebrow: "FORTUNE COOKIE",
    icon: "🍪",
  },
];

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
  const [fortune, setFortune] = useState("");
  const [isOpeningFortune, setIsOpeningFortune] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const fortuneTimeoutRef = useRef(null);
  const options = useMemo(() => parseOptions(draft), [draft]);

  useEffect(() => () => {
    window.clearInterval(intervalRef.current);
    window.clearTimeout(timeoutRef.current);
    window.clearTimeout(fortuneTimeoutRef.current);
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

  const openFortune = () => {
    window.clearTimeout(fortuneTimeoutRef.current);
    setIsOpeningFortune(true);

    fortuneTimeoutRef.current = window.setTimeout(() => {
      setFortune((currentFortune) => {
        const candidates = FORTUNE_MESSAGES.filter((message) => message !== currentFortune);
        return candidates[Math.floor(Math.random() * candidates.length)];
      });
      setIsOpeningFortune(false);
    }, 720);
  };

  const returnToLounge = () => {
    window.clearInterval(intervalRef.current);
    window.clearTimeout(timeoutRef.current);
    window.clearTimeout(fortuneTimeoutRef.current);
    setIsDrawing(false);
    setIsOpeningFortune(false);
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
          {GAMES.map((game) => (
            <button
              className={`minigame-hub-card is-${game.id}`}
              type="button"
              onClick={() => setActiveGame(game.id)}
              aria-label={`${game.label} 열기`}
              key={game.id}
            >
              <span className="minigame-hub-icon" aria-hidden="true">{game.icon}</span>
              <small>{game.eyebrow}</small>
              <strong>{game.label}</strong>
            </button>
          ))}
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

      {activeGame === "fortune" && (
        <section
          className={`fortune-cookie-game ${fortune ? "is-open" : ""} ${isOpeningFortune ? "is-opening" : ""}`}
          aria-labelledby="fortune-cookie-title"
        >
          <div className="minigame-panel-title">
            <span aria-hidden="true">🍪</span>
            <div>
              <small>FORTUNE COOKIE</small>
              <h2 id="fortune-cookie-title">오늘의 방송 포춘</h2>
            </div>
          </div>

          <button
            className="fortune-cookie-button"
            type="button"
            onClick={openFortune}
            disabled={isOpeningFortune}
            aria-label={fortune ? "다른 포춘쿠키 열기" : "포춘쿠키 열기"}
          >
            <span className="fortune-cookie-visual" aria-hidden="true">🍪</span>
          </button>

          <div className="fortune-ticket" aria-live="polite">
            <small>{isOpeningFortune ? "쿠키를 여는 중" : "오늘의 포춘"}</small>
            <strong>
              {isOpeningFortune
                ? "바삭..."
                : fortune || "쿠키를 눌러 오늘 방송의 한마디를 확인해보세요."}
            </strong>
          </div>

          <button
            className="minigame-draw-button fortune-draw-button"
            type="button"
            onClick={openFortune}
            disabled={isOpeningFortune}
          >
            {isOpeningFortune ? "쿠키 여는 중" : fortune ? "다른 쿠키 열기" : "쿠키 열기"}
          </button>
        </section>
      )}
    </section>
  );
}
