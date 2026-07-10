/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { deleteFanart, fetchFanart, uploadFanart } from "./lib/fanart.js";
import { deleteHotclip, fetchHotclips, saveHotclip } from "./lib/hotclips.js";
import { deleteScheduleGroup, fetchSchedules, saveScheduleGroup } from "./lib/schedules.js";
import { deleteUpboFile, fetchUpboFiles, uploadUpboFile } from "./lib/upbo.js";
import "./style.css";

const LINKS = {
  soop: "https://www.sooplive.com/station/merryou",
  cafe: "https://cafe.naver.com/bichonb",
  youtube: "https://www.youtube.com/@qltydb",
  fansim: "https://fancimm.com/celebrity/181982",
};

const HERO_IMAGE_URL = "/hero.png";
const DEFAULT_LATEST_VOD_ID = "200178791";
const DEFAULT_LATEST_VOD_URL = `https://vod.sooplive.com/player/${DEFAULT_LATEST_VOD_ID}`;
const DEFAULT_LATEST_VOD_THUMBNAIL =
  "https://videoimg.sooplive.com/php/SnapshotLoad.php?rowKey=20260630_00FBB175_295216925_2_r";
const VOD_DISPLAY_LIMIT = 5;
const UPBO_PAGE_ID = "upbo";
const UPBO_ROUTE = "/upbo";

const MENU_ITEMS = [
  { id: "home", label: "HOME" },
  { id: "about", label: "ABOUT" },
  { id: "schedule", label: "SCHEDULE" },
  { id: "notice", label: "NOTICE" },
  { id: "clips", label: "HIGHLIGHTS" },
  { id: "hotclips", label: "HOT CLIPS" },
  { id: "gallery", label: "GALLERY" },
  { id: "contact", label: "COMMUNITY" },
  { id: UPBO_PAGE_ID, label: "시트지", route: UPBO_ROUTE },
];

const MENU_DESCRIPTIONS = {
  home: "홈",
  about: "비숑 소개",
  notice: "최근 공지",
  clips: "하이라이트",
  hotclips: "핫클립",
  gallery: "갤러리",
  schedule: "방송 일정",
  contact: "커뮤니티",
  upbo: "시트지",
};

const PROFILE_ITEMS = [
  ["이름", "비숑"],
  ["나이", "2000.06.18"],
  ["키", "170 같은 158"],
  ["MBTI", "ISTP"],
  ["별명", "비촌"],
  ["팬닉", "°ω°"],
  ["첫 방송시작일", "2024.04.12"],
  ["2026년 목표", "애청자 1만명 달성하기"],
];

const HISTORY = [
  ["2024.04", "첫 방송"],
  ["2024.11", "베스트 스트리머"],
  ["2025.04", "방송 1주년"],
  ["2026.04", "방송 2주년"],
];

const DEFAULT_CLIPS = [];
const FANART_GALLERY_ID = "fanart";
const FANART_ROUTE = "/fanart";
const HOTCLIP_PAGE_ID = "hotclips";
const HOTCLIP_ROUTE = "/hotclips";
const ABOUT_TAGS = ["게임", "버인", "소통", "배그", "힐링"];

const INTERNAL_ROUTES = {
  [FANART_ROUTE]: FANART_GALLERY_ID,
  [HOTCLIP_ROUTE]: HOTCLIP_PAGE_ID,
  [UPBO_ROUTE]: UPBO_PAGE_ID,
};

const HOTCLIP_CATEGORIES = [
  { id: "battlegrounds", label: "배틀그라운드", shortLabel: "배그" },
  { id: "minecraft", label: "마인크래프트", shortLabel: "마크" },
  { id: "jandi", label: "잔디", shortLabel: "잔디" },
  { id: "fulltrack", label: "풀트", shortLabel: "풀트" },
];

const DEFAULT_HOTCLIP_DRAFT = {
  category: HOTCLIP_CATEGORIES[0].id,
  url: "",
};

const COMMUNITY_LINKS = [
  { title: "SOOP 방송국", text: "비숑 방송국", href: LINKS.soop },
  { title: "YOUTUBE", text: "다시보기 채널", href: LINKS.youtube },
  { title: "FAN CAFE", text: "팬카페 바로가기", href: LINKS.cafe },
  { title: "FANSIM", text: "팬심M", href: LINKS.fansim },
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONDAY_WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
const BROADCAST_TYPES = ["방송 진행", "장기 컨텐츠", "휴방", "공지 대기 (미정)"];
const DEFAULT_SCHEDULE = {
  type: "공지 대기 (미정)",
  startTime: "",
  memo: "",
  rangeStart: "",
  rangeEnd: "",
};
const CLIPS_STORAGE_KEY = "bichon-user-clips-v1";
const ENTRANCE_STORAGE_KEY = "bichon-entry-opened-v1";

const SOOP_NOTICE_POST_URL = "https://www.sooplive.com/station/merryou/post/200299679";
const SOOP_NOTICE_API_URL = "/soop-channel/v1.1/channel/merryou/board?bbsNo=82048012&perPage=20&page=1";
const SOOP_VOD_API_URLS = [
  "/soop-sch/api.php?l=DF&m=vodSearch&w=webk&isMobile=0&szType=json&c=UTF-8&v=5.0&szKeyword=merryou&nPageNo=1&nListCnt=5&tab=vod&location=total_search&szOrder=reg_date&szFileType=REVIEW&szTerm=all",
  "/soop-sch/api.php?l=DF&m=vodSearch&w=webk&isMobile=0&szType=json&c=UTF-8&v=5.0&szKeyword=merryou&nPageNo=1&nListCnt=5&tab=vod&location=total_search&szOrder=reg_date&szFileType=ALL&szTerm=all",
  "/soop-api/api/merryou/vods?per_page=5&page=1",
  "/soop-api/api/merryou/station/vods?per_page=5&page=1",
  "/soop-api/api/merryou/station/videos?per_page=5&page=1",
];
const SOOP_STATION_VOD_URL = "/soop-station/station/merryou/vod";
const NOTICE_REFRESH_MS = 5 * 60 * 1000;
const VOD_REFRESH_MS = 60 * 1000;
const FALLBACK_NOTICE = {
  id: "fallback-notice-200299679",
  title: "07.02▽・ω・▽",
  date: "2026-07-02 10:34:22",
  body: "오늘은 드디엉\n배그 멸망전 첫날임니당\n\n내일 풀트 컨텐츠도 있구\nvr맵 수정 및 세팅도 이썽서\n여유롭게 18시까지 오도록 하겠슴니다!!!!",
  url: SOOP_NOTICE_POST_URL,
};

const FALLBACK_VODS = [{
  id: `soop-latest-vod-${DEFAULT_LATEST_VOD_ID}`,
  title: "멸망전 멤버로 워크룰 킬내기",
  text: "",
  href: DEFAULT_LATEST_VOD_URL,
  thumbnail: DEFAULT_LATEST_VOD_THUMBNAIL,
  badge: "최신 VOD",
}];

function htmlToPlainText(html) {
  if (!html) return "";

  const document = new DOMParser().parseFromString(html, "text/html");
  const blocks = Array.from(document.body.querySelectorAll("p, div, li"))
    .map((node) => node.textContent.trim())
    .filter(Boolean);

  return blocks.length ? blocks.join("\n") : document.body.textContent.trim();
}

function normalizeSoopNotice(data) {
  const source = data?.contents || data?.data?.contents || data?.data?.list || data?.list || [];
  const item = Array.isArray(source) ? source[0] : source;

  if (!item || typeof item !== "object") return null;

  return {
    id: `notice-${item.titleNo || item.id || item.regDate}`,
    title: item.titleName || item.title || item.subject || FALLBACK_NOTICE.title,
    date: item.regDate || item.created_at || item.date || FALLBACK_NOTICE.date,
    body:
      htmlToPlainText(item.content?.content) ||
      item.content?.summary ||
      item.content?.textContent ||
      FALLBACK_NOTICE.body,
    url: item.titleNo
      ? `https://www.sooplive.com/station/merryou/post/${item.titleNo}`
      : FALLBACK_NOTICE.url,
  };
}

async function requestLatestSoopNotice() {
  const response = await fetch(SOOP_NOTICE_API_URL, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) throw new Error("SOOP notice request failed");

  return normalizeSoopNotice(await response.json());
}

function createEmptyGallery() {
  return {
    [FANART_GALLERY_ID]: [],
  };
}

function readUserClips() {
  if (typeof window === "undefined") return [];

  try {
    const rawClips = window.localStorage.getItem(CLIPS_STORAGE_KEY);
    return rawClips ? JSON.parse(rawClips) : [];
  } catch {
    return [];
  }
}

function readEntranceState() {
  if (typeof window === "undefined") return false;

  try {
    return window.sessionStorage.getItem(ENTRANCE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function saveUserClips(clips) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CLIPS_STORAGE_KEY, JSON.stringify(clips));
  } catch {
    // Ignore storage quota errors for clip links.
  }
}

function normalizeUrl(url) {
  if (!url) return "";

  return String(url)
    .replace(/^http:\/\//, "https://")
    .replace("vod.afreecatv.com", "vod.sooplive.com");
}

function getVodSource(data) {
  const source =
    data?.DATA ||
    data?.data?.list ||
    data?.data?.items ||
    data?.data?.vods ||
    data?.data?.contents ||
    data?.list ||
    data?.items ||
    data?.vods ||
    data?.contents ||
    data?.data ||
    [];

  return Array.isArray(source) ? source : [source];
}

function normalizeSoopVodItem(item, index = 0) {
  if (!item || typeof item !== "object") return null;

  const titleNo = item.title_no || item.titleNo || item.vod_no || item.video_no || item.id;
  const href = normalizeUrl(
    item.url ||
    item.link ||
    item.vod_url ||
    item.video_url ||
    (titleNo ? `https://vod.sooplive.com/player/${titleNo}` : LINKS.soop)
  );
  const thumbnail = normalizeUrl(
    item.thumbnail ||
    item.thumbnail_url ||
    item.thumbnail_path ||
    item.mobile_thumbnail_path ||
    item.thumb ||
    item.thumb_url ||
    item.thumbH ||
    item.webp_path ||
    item.image ||
    item.poster ||
    ""
  );
  const title = item.title || item.subject || item.vod_title || item.video_title || item.titleName || "SOOP 최신 다시보기";

  return {
    id: `soop-vod-${titleNo || href || index}`,
    title: title.trim(),
    text: "",
    href,
    thumbnail,
    badge: index === 0 ? "최신 VOD" : "다시보기",
    createdAt: item.reg_date || item.regDate || item.created_at || "",
    sortValue: Number(item.timestamp) || Date.parse(item.reg_date || item.regDate || item.created_at || "") || 0,
  };
}

function normalizeSoopVodList(data) {
  const seen = new Set();

  return getVodSource(data)
    .map((item, index) => normalizeSoopVodItem(item, index))
    .filter((vod) => vod?.href)
    .sort((a, b) => b.sortValue - a.sortValue)
    .filter((vod) => {
      const key = getVodIdFromUrl(vod.href) || vod.href;

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, VOD_DISPLAY_LIMIT);
}

function getMetaContent(document, selector) {
  return document.querySelector(selector)?.getAttribute("content")?.trim() || "";
}

function getVodIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/player\/(\d+)/);
    return match?.[1] || "";
  } catch {
    return "";
  }
}

async function requestVodPageMeta(vodId = DEFAULT_LATEST_VOD_ID) {
  const response = await fetch(`/soop-vod/player/${vodId}`, {
    headers: { accept: "text/html" },
  });

  if (!response.ok) throw new Error("SOOP VOD page request failed");

  const html = await response.text();
  const document = new DOMParser().parseFromString(html, "text/html");
  const title = getMetaContent(document, 'meta[property="og:title"]');
  const thumbnail =
    getMetaContent(document, 'meta[property="og:image"]') ||
    getMetaContent(document, 'meta[name="twitter:image"]');

  return {
    id: `soop-vod-${vodId}`,
    title: title || FALLBACK_VODS[0].title,
    text: "",
    href: `https://vod.sooplive.com/player/${vodId}`,
    thumbnail: thumbnail || FALLBACK_VODS[0].thumbnail,
    badge: "최신 VOD",
  };
}

async function requestStationVodPageVods() {
  const response = await fetch(SOOP_STATION_VOD_URL, {
    headers: { accept: "text/html" },
  });

  if (!response.ok) throw new Error("SOOP station VOD page request failed");

  const html = await response.text();
  const vodIds = Array.from(html.matchAll(/(?:vod\.sooplive\.com|vod\.afreecatv\.com)\/player\/(\d+)/g))
    .map((match) => match[1])
    .filter((vodId, index, self) => self.indexOf(vodId) === index)
    .slice(0, VOD_DISPLAY_LIMIT);

  return Promise.all(vodIds.map((vodId, index) => requestVodPageMeta(vodId).then((vod) => ({
    ...vod,
    badge: index === 0 ? "최신 VOD" : "다시보기",
  }))));
}

async function requestLatestSoopVods() {
  let lastError = null;

  for (const apiUrl of SOOP_VOD_API_URLS) {
    try {
      const response = await fetch(apiUrl, {
        headers: { accept: "application/json" },
      });

      if (!response.ok) throw new Error("SOOP VOD request failed");

      const vods = normalizeSoopVodList(await response.json());

      if (vods.length) {
        return Promise.all(vods.map(async (vod, index) => {
          const vodId = getVodIdFromUrl(vod.href);

          if (vodId && (!vod.thumbnail || vod.title === "SOOP 최신 다시보기")) {
            return {
              ...vod,
              ...(await requestVodPageMeta(vodId)),
              badge: index === 0 ? "최신 VOD" : "다시보기",
            };
          }

          return {
            ...vod,
            badge: index === 0 ? "최신 VOD" : "다시보기",
          };
        }));
      }
    } catch (error) {
      lastError = error;
    }
  }

  try {
    const vods = await requestStationVodPageVods();
    if (vods.length) return vods;
  } catch (error) {
    lastError = error;
  }

  try {
    return [await requestVodPageMeta(DEFAULT_LATEST_VOD_ID)];
  } catch {
    throw lastError || new Error("SOOP VOD data was empty");
  }
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPageFromPath(pathname) {
  return INTERNAL_ROUTES[pathname] || "index";
}

function parseDateKey(dateKey) {
  if (!dateKey) return null;

  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function getDateKeysBetween(startKey, endKey) {
  const startDate = parseDateKey(startKey);
  const endDate = parseDateKey(endKey || startKey);

  if (!startDate || !endDate || startDate > endDate) return [startKey];

  const keys = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    keys.push(getDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

function formatShortDateKey(dateKey) {
  const date = parseDateKey(dateKey);

  return date ? `${date.getMonth() + 1}/${date.getDate()}` : "";
}

function formatKoreanDate(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function getMonthDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }

  for (let day = 1; day <= lastDate; day++) {
    const dayDate = new Date(year, month, day);

    days.push({
      day,
      date: dayDate,
      key: getDateKey(dayDate),
    });
  }

  return days;
}

function getMondayWeekDates(date) {
  const current = new Date(date);
  const monday = new Date(current);
  const day = current.getDay();
  const offset = day === 0 ? -6 : 1 - day;

  monday.setDate(current.getDate() + offset);

  return MONDAY_WEEKDAYS.map((weekday, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);

    return {
      weekday,
      date: d,
      key: getDateKey(d),
      label: `${d.getMonth() + 1}/${d.getDate()}`,
    };
  });
}

function SectionTitle({ number, title, eyebrow }) {
  return (
    <div className="section-title">
      <span>{number}</span>
      <div>
        {eyebrow && <small>{eyebrow}</small>}
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function getVideoEmbedUrl(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
    }
  } catch {
    return "";
  }

  return "";
}

function getYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v") || "";
    }

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "");
    }
  } catch {
    return "";
  }

  return "";
}

function getVideoThumbnailUrl(url) {
  const youtubeId = getYouTubeVideoId(url);

  return youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : "";
}

function getHotclipCategory(categoryId) {
  return HOTCLIP_CATEGORIES.find((category) => category.id === categoryId) || HOTCLIP_CATEGORIES[0];
}

function getHotclipsByCategory(hotclips, categoryId) {
  return hotclips.filter((clip) => clip.category === categoryId);
}

function App() {
  const today = new Date();
  const todayKey = getDateKey(today);

  const [menuOpen, setMenuOpen] = useState(false);
  const [monthDate, setMonthDate] = useState(today);
  const [schedules, setSchedules] = useState({});
  const [editingDate, setEditingDate] = useState(null);
  const [scheduleDraft, setScheduleDraft] = useState(DEFAULT_SCHEDULE);
  const [latestNotice, setLatestNotice] = useState(FALLBACK_NOTICE);
  const [noticeExpanded, setNoticeExpanded] = useState(false);
  const [noticeStatus, setNoticeStatus] = useState("loading");
  const [activePage, setActivePage] = useState(() => getPageFromPath(window.location.pathname));
  const [galleryItems, setGalleryItems] = useState(() => createEmptyGallery());
  const [clipComposerOpen, setClipComposerOpen] = useState(false);
  const [clipDraftUrl, setClipDraftUrl] = useState("");
  const [clipError, setClipError] = useState("");
  const [latestVods, setLatestVods] = useState(FALLBACK_VODS);
  const [vodStatus, setVodStatus] = useState("loading");
  const [userClips, setUserClips] = useState(() => readUserClips());
  const [hotclips, setHotclips] = useState([]);
  const [hotclipDraft, setHotclipDraft] = useState(DEFAULT_HOTCLIP_DRAFT);
  const [hotclipError, setHotclipError] = useState("");
  const [hotclipStatus, setHotclipStatus] = useState("loading");
  const [upboFiles, setUpboFiles] = useState([]);
  const [upboStatus, setUpboStatus] = useState("loading");
  const [fanpageStatus, setFanpageStatus] = useState("loading");
  const [entranceOpened, setEntranceOpened] = useState(() => readEntranceState());
  const [entranceOpening, setEntranceOpening] = useState(false);

  const monthDays = getMonthDays(monthDate);
  const verticalWeekDates = getMondayWeekDates(today);
  const activeGalleryItems = galleryItems[FANART_GALLERY_ID] || [];
  const galleryPreviewItems = activeGalleryItems
    .slice(0, 5)
    .map((item) => ({ ...item, variant: "" }));
  const vodCards = latestVods.length ? latestVods : FALLBACK_VODS;
  const clipCards = [...vodCards, ...userClips, ...DEFAULT_CLIPS];
  const hotclipPreviewGroups = HOTCLIP_CATEGORIES.map((category) => ({
    category,
    clips: getHotclipsByCategory(hotclips, category.id).slice(0, 1),
  })).filter((group) => group.clips.length);
  const showEntrance = activePage === "index" && !entranceOpened;

  const loadLatestVod = useCallback(async () => {
    try {
      setVodStatus("loading");
      const vods = await requestLatestSoopVods();
      setLatestVods(vods.length ? vods : FALLBACK_VODS);
      setVodStatus("ready");
    } catch {
      setLatestVods(FALLBACK_VODS);
      setVodStatus("error");
    }
  }, []);

  useEffect(() => {
    let alive = true;

    const loadSoopNotices = async () => {
      try {
        setNoticeStatus("loading");
        const notice = await requestLatestSoopNotice();

        if (!alive) return;

        setLatestNotice(notice || FALLBACK_NOTICE);
        setNoticeStatus(notice ? "ready" : "empty");
      } catch {
        if (!alive) return;
        setLatestNotice(FALLBACK_NOTICE);
        setNoticeStatus("error");
      }
    };

    loadSoopNotices();
    const timer = window.setInterval(loadSoopNotices, NOTICE_REFRESH_MS);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const firstLoad = window.setTimeout(loadLatestVod, 0);
    const timer = window.setInterval(loadLatestVod, VOD_REFRESH_MS);
    const refreshWhenVisible = () => {
      if (!document.hidden) loadLatestVod();
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", loadLatestVod);

    return () => {
      window.clearTimeout(firstLoad);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", loadLatestVod);
    };
  }, [loadLatestVod]);

  useEffect(() => {
    const syncInternalRoute = () => {
      setActivePage(getPageFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", syncInternalRoute);

    return () => {
      window.removeEventListener("popstate", syncInternalRoute);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const loadFanpageData = async () => {
      try {
        setFanpageStatus("loading");

        const [nextSchedules, nextFanart] = await Promise.all([
          fetchSchedules(),
          fetchFanart(),
        ]);

        if (!alive) return;

        setSchedules(nextSchedules);
        setGalleryItems({
          ...createEmptyGallery(),
          [FANART_GALLERY_ID]: nextFanart,
        });
        setFanpageStatus("ready");
      } catch {
        if (alive) setFanpageStatus("offline");
      }

      try {
        setHotclipStatus("loading");
        const nextHotclips = await fetchHotclips();

        if (!alive) return;

        setHotclips(nextHotclips);
        setHotclipStatus("ready");
      } catch {
        if (alive) setHotclipStatus("offline");
      }

      try {
        setUpboStatus("loading");
        const nextUpboFiles = await fetchUpboFiles();

        if (!alive) return;

        setUpboFiles(nextUpboFiles);
        setUpboStatus("ready");
      } catch {
        if (alive) setUpboStatus("offline");
      }
    };

    loadFanpageData();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    saveUserClips(userClips);
  }, [userClips]);

  const openInternalPage = (route) => {
    window.history.pushState({}, "", route);
    setActivePage(getPageFromPath(route));
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jumpToSection = (sectionId) => {
    if (activePage !== "index") {
      window.history.pushState({}, "", "/");
      setActivePage("index");
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
      setMenuOpen(false);
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  const openEntranceDoor = () => {
    if (entranceOpening) return;

    setEntranceOpening(true);
    window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(ENTRANCE_STORAGE_KEY, "true");
      } catch {
        // Ignore private-mode storage failures.
      }

      setEntranceOpened(true);
      setEntranceOpening(false);
    }, 980);
  };

  const moveMonth = (value) => {
    setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + value, 1));
  };

  const openScheduleEditor = (date) => {
    const dateKey = getDateKey(date);
    const existingSchedule = schedules[dateKey];

    setEditingDate({ date, key: dateKey });
    setScheduleDraft({
      ...DEFAULT_SCHEDULE,
      ...(existingSchedule || {}),
      rangeStart: existingSchedule?.rangeStart || dateKey,
      rangeEnd: existingSchedule?.rangeEnd || "",
    });
  };

  const closeScheduleEditor = () => {
    setEditingDate(null);
    setScheduleDraft(DEFAULT_SCHEDULE);
  };

  const updateDraft = (field, value) => {
    setScheduleDraft((prev) => ({ ...prev, [field]: value }));
  };

  const saveSchedule = async (event) => {
    event.preventDefault();

    if (!editingDate) return;

    const existingSchedule = schedules[editingDate.key];
    const groupId = existingSchedule?.groupId || `schedule-${Date.now()}-${editingDate.key}`;
    const rangeStart = scheduleDraft.rangeStart || editingDate.key;
    const rangeEnd = scheduleDraft.rangeEnd || rangeStart;
    const rangeKeys = getDateKeysBetween(rangeStart, rangeEnd);

    try {
      const updatedSchedules = await saveScheduleGroup({
        groupId,
        existingGroupId: existingSchedule?.groupId,
        type: scheduleDraft.type,
        startTime: scheduleDraft.startTime.trim(),
        memo: scheduleDraft.memo.trim(),
        rangeStart,
        rangeEnd,
        rangeKeys,
      });

      setSchedules(updatedSchedules);
      setFanpageStatus("ready");
      closeScheduleEditor();
    } catch {
      window.alert("일정 저장에 실패했습니다. 공용 저장소 설정을 확인해주세요.");
    }
  };

  const deleteSchedule = async () => {
    if (!editingDate) return;
    if (!window.confirm("이 일정을 삭제할까요?")) return;

    const targetGroupId = schedules[editingDate.key]?.groupId;

    if (!targetGroupId) {
      closeScheduleEditor();
      return;
    }

    try {
      const updatedSchedules = await deleteScheduleGroup(targetGroupId);
      setSchedules(updatedSchedules);
      setFanpageStatus("ready");
      closeScheduleEditor();
    } catch {
      window.alert("일정 삭제에 실패했습니다.");
    }
  };

  const renderSchedule = (dateKey) => {
    const schedule = schedules[dateKey];

    if (!schedule) return null;

    const isRange = schedule.rangeStart && schedule.rangeEnd && schedule.rangeStart !== schedule.rangeEnd;
    const rangeLabel = isRange ? `${formatShortDateKey(schedule.rangeStart)} - ${formatShortDateKey(schedule.rangeEnd)}` : "";

    return (
      <span className={`schedule-preview ${isRange ? "is-range" : ""} ${schedule.type === "휴방" ? "is-off" : ""}`}>
        <span>{schedule.type}</span>
        {rangeLabel && <small>{rangeLabel}</small>}
        {schedule.startTime && <small>{schedule.startTime}</small>}
        {schedule.memo && <em>{schedule.memo}</em>}
      </span>
    );
  };

  const getScheduleStateClass = (dateKey) => {
    const schedule = schedules[dateKey];
    if (!schedule) return "";

    const classes = [];
    const isRange = schedule.rangeStart && schedule.rangeEnd && schedule.rangeStart !== schedule.rangeEnd;

    if (schedule.type === "휴방") classes.push("is-off");

    if (isRange) {
      classes.push("is-range-day");
      if (dateKey === schedule.rangeStart) classes.push("is-range-start");
      else if (dateKey === schedule.rangeEnd) classes.push("is-range-end");
      else classes.push("is-range-middle");
    }

    return classes.join(" ");
  };

  const openFanartPage = () => {
    openInternalPage(FANART_ROUTE);
  };

  const openHotclipPage = () => {
    openInternalPage(HOTCLIP_ROUTE);
  };

  const closeUpboPage = () => {
    window.history.pushState({}, "", "/");
    setActivePage("index");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeHotclipPage = () => {
    window.history.pushState({}, "", "/");
    setActivePage("index");
    window.setTimeout(() => {
      document.getElementById("hotclips")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const closeGalleryPage = () => {
    window.history.pushState({}, "", "/");
    setActivePage("index");
    window.setTimeout(() => {
      document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const addGalleryFiles = async (event, categoryId) => {
    const input = event.currentTarget;
    const files = Array.from(event.target.files || []);
    const images = files.filter((file) => file.type.startsWith("image/"));

    if (!images.length) return;

    try {
      const uploadedImages = (await Promise.all(
        images.map((file) => uploadFanart(file))
      )).filter(Boolean);

      if (!uploadedImages.length) return;

      setGalleryItems((prev) => ({
        ...prev,
        [categoryId]: [
          ...uploadedImages,
          ...(prev[categoryId] || []),
        ],
      }));
    } catch {
      window.alert("팬아트 업로드에 실패했습니다. 공용 저장소 설정을 확인해주세요.");
    }

    input.value = "";
  };

  const addUpboFiles = async (event) => {
    const input = event.currentTarget;
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    try {
      const uploadedFiles = (await Promise.all(
        files.map((file) => uploadUpboFile(file))
      )).filter(Boolean);

      if (!uploadedFiles.length) return;

      setUpboFiles((prev) => [
        ...uploadedFiles,
        ...prev,
      ]);
      setUpboStatus("ready");
    } catch (error) {
      window.alert(`시트지 업로드에 실패했습니다. ${error?.message || "공용 저장소 설정을 확인해주세요."}`);
    }

    input.value = "";
  };

  const deleteUpboItem = async (fileId) => {
    const targetItem = upboFiles.find((item) => item.id === fileId);

    if (!targetItem) return;
    if (!window.confirm("이 시트지를 삭제할까요?")) return;

    try {
      const nextUpboFiles = await deleteUpboFile(targetItem);

      setUpboFiles(nextUpboFiles);
      setUpboStatus("ready");
    } catch {
      window.alert("시트지 삭제에 실패했습니다.");
    }
  };

  const deleteGalleryImage = async (categoryId, imageId) => {
    const targetItem = (galleryItems[categoryId] || []).find((item) => item.id === imageId);

    if (!targetItem) return;
    if (!window.confirm("이 팬아트를 삭제할까요?")) return;

    try {
      await deleteFanart(targetItem);

      setGalleryItems((prev) => ({
        ...prev,
        [categoryId]: (prev[categoryId] || []).filter((item) => item.id !== imageId),
      }));
    } catch {
      window.alert("팬아트 삭제에 실패했습니다.");
    }
  };

  const addClipLink = async (event) => {
    event.preventDefault();

    const url = clipDraftUrl.trim();
    if (!url) {
      setClipError("영상 링크를 입력해주세요.");
      return;
    }

    try {
      new URL(url);
    } catch {
      setClipError("http:// 또는 https://로 시작하는 링크를 넣어주세요.");
      return;
    }

    const vodId = getVodIdFromUrl(url);
    let nextClip = {
      id: `${Date.now()}-${url}`,
      title: "시청자 추천 영상",
      text: "직접 추가한 클립 / 다시보기 링크입니다.",
      href: url,
      badge: getVideoEmbedUrl(url) ? "VIDEO" : "LINK",
      embedUrl: getVideoEmbedUrl(url),
    };

    if (vodId) {
      try {
        nextClip = {
          ...(await requestVodPageMeta(vodId)),
          id: `${Date.now()}-${url}`,
        };
      } catch {
        nextClip = {
          ...nextClip,
          title: "SOOP 다시보기",
          text: "직접 추가한 SOOP 다시보기 링크입니다.",
          badge: "SOOP",
        };
      }
    }

    setUserClips((prev) => [
      nextClip,
      ...prev,
    ]);
    setClipDraftUrl("");
    setClipError("");
    setClipComposerOpen(false);
  };

  const addHotclipLink = async (event) => {
    event.preventDefault();

    const url = hotclipDraft.url.trim();
    if (!url) {
      setHotclipError("영상 링크를 입력해주세요.");
      return;
    }

    try {
      new URL(url);
    } catch {
      setHotclipError("http:// 또는 https://로 시작하는 링크를 넣어주세요.");
      return;
    }

    const category = getHotclipCategory(hotclipDraft.category);
    const vodId = getVodIdFromUrl(url);
    let nextHotclip = {
      category: category.id,
      title: "핫클립",
      href: url,
      thumbnail: getVideoThumbnailUrl(url),
      embedUrl: getVideoEmbedUrl(url),
    };

    if (vodId) {
      try {
        const meta = await requestVodPageMeta(vodId);
        nextHotclip = {
          ...nextHotclip,
          title: meta.title,
          href: meta.href,
          thumbnail: meta.thumbnail,
          embedUrl: meta.embedUrl || "",
        };
      } catch {
        nextHotclip = {
          ...nextHotclip,
          title: "SOOP 핫클립",
        };
      }
    }

    try {
      const savedHotclip = await saveHotclip(nextHotclip);

      setHotclips((prev) => [
        savedHotclip,
        ...prev,
      ]);
      setHotclipDraft((prev) => ({ ...prev, url: "" }));
      setHotclipError("");
      setHotclipStatus("ready");
    } catch {
      setHotclipError("핫클립 추가에 실패했습니다. 공용 저장소 설정을 확인해주세요.");
    }
  };

  const deleteHotclipItem = async (hotclipId) => {
    if (!window.confirm("이 핫클립을 삭제할까요?")) return;

    try {
      const nextHotclips = await deleteHotclip(hotclipId);

      setHotclips(nextHotclips);
      setHotclipStatus("ready");
    } catch {
      window.alert("핫클립 삭제에 실패했습니다.");
    }
  };

  if (activePage === UPBO_PAGE_ID) {
    return (
      <div className="app-shell">
        <main className="site-frame fanart-page-frame">
          <section className="page-section upbo-route-section">
            <div className="gallery-page-shell">
              <button className="gallery-back-button" type="button" onClick={closeUpboPage}>
                ← 메인으로 돌아가기
              </button>

              <div className="gallery-page-header">
                <SectionTitle number="ST" title="시트지" eyebrow="SHEET" />
                <div className="gallery-page-actions">
                  <label className="fanart-add-button upbo-add-button">
                    파일 추가
                    <input type="file" multiple onChange={addUpboFiles} />
                  </label>
                </div>
              </div>

              {upboStatus === "offline" && (
                <small className="fanpage-status fanpage-status-offline">
                  시트지 저장소 연결 실패 — Supabase 스키마와 Vercel 환경 변수를 확인해주세요
                </small>
              )}

              {upboFiles.length > 0 && (
                <div className="upbo-file-list">
                  {upboFiles.map((file) => (
                    <article className="upbo-file-item" key={file.id}>
                      <a href={file.href} target="_blank" rel="noreferrer">
                        <strong>{file.fileName || file.title}</strong>
                      </a>
                      <button
                        className="upbo-delete-button"
                        type="button"
                        onClick={() => deleteUpboItem(file.id)}
                        aria-label={`${file.fileName || file.title} 삭제`}
                      >
                        ×
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (activePage === HOTCLIP_PAGE_ID) {
    return (
      <div className="app-shell">
        <main className="site-frame fanart-page-frame">
          <section className="page-section hotclips-section hotclips-route-section">
            <div className="gallery-page-shell">
              <button className="gallery-back-button" type="button" onClick={closeHotclipPage}>
                ← 메인으로 돌아가기
              </button>

              <div className="gallery-page-header">
                <SectionTitle number="05" title="핫클립" eyebrow="hot clips" />
              </div>

              <form className="hotclip-link-form" onSubmit={addHotclipLink}>
                <select
                  value={hotclipDraft.category}
                  onChange={(event) => {
                    setHotclipDraft((prev) => ({ ...prev, category: event.target.value }));
                    setHotclipError("");
                  }}
                  aria-label="핫클립 분류"
                >
                  {HOTCLIP_CATEGORIES.map((category) => (
                    <option value={category.id} key={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <input
                  value={hotclipDraft.url}
                  onChange={(event) => {
                    setHotclipDraft((prev) => ({ ...prev, url: event.target.value }));
                    setHotclipError("");
                  }}
                  placeholder="영상 링크 붙여넣기"
                />
                <button type="submit">추가하기</button>
              </form>

              {hotclipError && <strong className="form-error">{hotclipError}</strong>}

              <div className="hotclip-category-stack">
                {HOTCLIP_CATEGORIES.map((category) => {
                  const categoryHotclips = getHotclipsByCategory(hotclips, category.id);

                  if (!categoryHotclips.length) return null;

                  return (
                    <section className="hotclip-category-block" key={category.id}>
                      <div className="hotclip-category-heading">
                        <strong>{category.label}</strong>
                        <span>{categoryHotclips.length} clips</span>
                      </div>

                      <div className="clip-grid hotclip-page-grid">
                        {categoryHotclips.map((clip) => (
                          <article className="clip-card hotclip-card" key={clip.id}>
                            <button
                              className="hotclip-delete-button"
                              type="button"
                              onClick={() => deleteHotclipItem(clip.id)}
                              aria-label={`${clip.title} 삭제`}
                            >
                              ×
                            </button>
                            <a href={clip.href} target="_blank" rel="noreferrer">
                              <span>{category.shortLabel}</span>
                              <img src={clip.thumbnail || HERO_IMAGE_URL} alt="" />
                              <strong>{clip.title}</strong>
                            </a>
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (activePage === FANART_GALLERY_ID) {
    return (
      <div className="app-shell">
        <main className="site-frame fanart-page-frame">
          <section className="page-section gallery-section fanart-route-section">
            <div className="gallery-page-shell">
              <button className="gallery-back-button" type="button" onClick={closeGalleryPage}>
                ← 메인으로 돌아가기
              </button>

              <div className="gallery-page-header">
                <SectionTitle number="06" title="팬아트 갤러리" eyebrow="fanart gallery" />
                <div className="gallery-page-actions">
                  <label className="fanart-add-button">
                    추가하기
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => addGalleryFiles(event, FANART_GALLERY_ID)}
                    />
                  </label>
                </div>
              </div>

              {activeGalleryItems.length > 0 && (
                <div className="fanart-grid">
                  {activeGalleryItems.map((image) => (
                    <article className="fanart-card fanart-image-card" key={image.id}>
                      <button
                        className="fanart-delete-button"
                        type="button"
                        onClick={() => deleteGalleryImage(FANART_GALLERY_ID, image.id)}
                        aria-label={`${image.title} 삭제`}
                      >
                        ×
                      </button>
                      <img src={image.src} alt={image.title} />
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {showEntrance && (
        <div className={`entrance-screen ${entranceOpening ? "is-opening" : ""}`}>
          <button
            className="entrance-door"
            type="button"
            onClick={openEntranceDoor}
            aria-label="솜뭉치가 문을 열고 입장하기"
          >
            <span className="entrance-panel entrance-panel-left"></span>
            <span className="entrance-panel entrance-panel-right"></span>
            <span className="entrance-light"></span>
            <span className="entrance-fluff" aria-hidden="true">
              <span></span>
            </span>
          </button>
        </div>
      )}

      <header className="top-bar">
        <button className="brand-word" onClick={() => jumpToSection("home")}>
          BICHON
        </button>
        <button
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴 열기"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      {menuOpen && <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />}

      <aside className={`side-menu ${menuOpen ? "show" : ""}`}>
        <button className="menu-close" onClick={() => setMenuOpen(false)} aria-label="메뉴 닫기">
          ×
        </button>
        <div className="side-menu-brand">
          <strong>BICHON</strong>
          <small>VIRTUAL STREAMER</small>
        </div>
        <nav>
          {MENU_ITEMS.map((item) => (
            <button key={item.id} onClick={() => (item.route ? openInternalPage(item.route) : jumpToSection(item.id))}>
              <span>{item.label}</span>
              <small>{MENU_DESCRIPTIONS[item.id]}</small>
            </button>
          ))}
        </nav>
        <div className="menu-socials">
          <a href={LINKS.soop} target="_blank" rel="noreferrer">SOOP</a>
          <a href={LINKS.cafe} target="_blank" rel="noreferrer">CAFE</a>
          <a href={LINKS.youtube} target="_blank" rel="noreferrer">YT</a>
          <a href={LINKS.fansim} target="_blank" rel="noreferrer">M</a>
        </div>
      </aside>

      <main className="site-frame">
        <section className="hero-section" id="home">
          <div className="hero-art">
            <div className="hero-portrait">
              <img className="hero-character" src={HERO_IMAGE_URL} alt="비숑 프로필" />
            </div>
          </div>

          <div className="hero-copy">
            <span>오늘도 같이 놀자!</span>
            <h1>BICHON</h1>
            <strong>VIRTUAL STREAMER</strong>
            <p>게임과 소통을 좋아하는 비숑과 솜뭉치의 팬페이지입니다.</p>
          </div>

          <button className="scroll-cue" onClick={() => jumpToSection("about")}>
            SCROLL DOWN
          </button>
        </section>

        <section className="hero-status-strip" aria-label="방송 요약">
          <article>
            <span>RECENT NOTICE</span>
            <strong>{noticeStatus === "loading" ? "공지 확인 중" : latestNotice.title}</strong>
            <p>{noticeStatus === "loading" ? "SOOP 공지를 불러오는 중" : latestNotice.date}</p>
          </article>
          <article>
            <span>FANDOM NAME</span>
            <strong>솜뭉치</strong>
            <p>비숑의 소중한 친구들</p>
          </article>
          <article>
            <span>DEBUT</span>
            <strong>2024.04.12</strong>
            <p>비숑의 첫 방송</p>
          </article>
        </section>

        <section className="page-section about-section" id="about">
          <div className="section-copy">
            <SectionTitle number="01" title="비숑을 소개합니다" eyebrow="ABOUT BICHON" />
            <p className="lead-text">
              장난기 많은 비숑입니다. 배그와 종겜을 좋아하고 소통도 좋아해요.
            </p>
            <div className="tag-list">
              {ABOUT_TAGS.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
            <div className="mini-history" aria-label="비숑 히스토리">
              {HISTORY.map(([date, text]) => (
                <article key={date}>
                  <strong>{date}</strong>
                  <span>{text}</span>
                </article>
              ))}
            </div>
          </div>

          <article className="profile-panel">
            {PROFILE_ITEMS.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </article>

        </section>

        <section className="page-section schedule-section" id="schedule">
          <div className="section-row">
            <SectionTitle number="02" title="방송 일정" eyebrow="SCHEDULE" />
            {fanpageStatus === "loading" && <small className="fanpage-status">일정 불러오는 중</small>}
            {fanpageStatus === "offline" && (
              <small className="fanpage-status fanpage-status-offline">
                공용 저장소 연결 실패 — Vercel 환경 변수를 확인해주세요
              </small>
            )}
          </div>

          <div className="schedule-showcase">
            <aside className="weekly-side-card">
              <div className="weekly-side-heading">
                <span>WEEKLY SCHEDULE</span>
                <strong>{verticalWeekDates[0].label} - {verticalWeekDates[6].label}</strong>
              </div>
              <div className="vertical-week-list">
                {verticalWeekDates.map((item) => {
                  const schedule = schedules[item.key];

                  return (
                    <button
                      className={`vertical-week-row ${item.key === todayKey ? "today" : ""} ${getScheduleStateClass(item.key)}`}
                      type="button"
                      key={item.key}
                      onClick={() => openScheduleEditor(item.date)}
                    >
                      <span>
                        <b>{item.weekday}</b>
                        <em>{item.label}</em>
                      </span>
                      <strong>{schedule?.type || "일정 대기"}</strong>
                      {schedule?.startTime && <small>{schedule.startTime}</small>}
                      {schedule?.memo && <p>{schedule.memo}</p>}
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="schedule-card">
              <div className="calendar-control">
                <button onClick={() => moveMonth(-1)} aria-label="이전 달">‹</button>
                <span>{monthDate.getFullYear()}년 {monthDate.getMonth() + 1}월</span>
                <button onClick={() => moveMonth(1)} aria-label="다음 달">›</button>
              </div>
              <div className="calendar-head">
                {WEEKDAYS.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="calendar-grid">
                {monthDays.map((item, index) =>
                  item ? (
                    <button
                      className={`day ${item.key === todayKey ? "today" : ""} ${getScheduleStateClass(item.key)}`}
                      key={item.key}
                      onClick={() => openScheduleEditor(item.date)}
                    >
                      <b>{item.day}</b>
                      {renderSchedule(item.key)}
                    </button>
                  ) : (
                    <div className="day empty" key={`empty-${index}`} />
                  )
                )}
              </div>
            </section>
          </div>
        </section>

        <section className="page-section notice-section" id="notice">
          <div className="section-row">
            <SectionTitle number="03" title="최신 공지" eyebrow="NOTICE" />
            <a className="notice-link-button" href={latestNotice.url} target="_blank" rel="noreferrer">
              원문으로 이동하기
            </a>
          </div>
          <article className={`notice-post-card ${noticeExpanded ? "is-open" : ""}`}>
            <button
              className="notice-post-summary"
              type="button"
              onClick={() => setNoticeExpanded((value) => !value)}
              aria-expanded={noticeExpanded}
            >
              <small>{noticeStatus === "loading" ? "공지 불러오는 중" : latestNotice.date}</small>
              <strong>{latestNotice.title}</strong>
              <span>{noticeExpanded ? "접기" : "내용 보기"}</span>
            </button>

            {noticeExpanded && (
              <div className="notice-post-detail">
                <p>{latestNotice.body}</p>
                <a href={latestNotice.url} target="_blank" rel="noreferrer">
                  원문으로 이동하기
                </a>
              </div>
            )}
          </article>
        </section>

        <section className="page-section highlights-section" id="clips">
          <div className="section-row">
            <SectionTitle number="04" title="비숑 VOD" eyebrow="HIGHLIGHTS" />
            <div className="clip-actions">
              <button className="vod-refresh-button" type="button" onClick={loadLatestVod}>
                {vodStatus === "loading" ? "다시보기 확인 중" : "최신 다시보기 새로고침"}
              </button>
              <button className="clip-add-button" type="button" onClick={() => setClipComposerOpen(true)}>
                영상 추가
              </button>
            </div>
          </div>
          <div className="clip-grid">
            {clipCards.map((clip) => (
              <a className="clip-card" href={clip.href} target="_blank" rel="noreferrer" key={clip.id || clip.title}>
                <span>{clip.badge}</span>
                {clip.embedUrl ? (
                  <iframe src={clip.embedUrl} title={clip.title} allowFullScreen />
                ) : (
                  <img src={clip.thumbnail || HERO_IMAGE_URL} alt="" />
                )}
                <strong>{clip.title}</strong>
                {clip.text && <p>{clip.text}</p>}
              </a>
            ))}
          </div>
        </section>

        <section className="page-section hotclips-section" id="hotclips">
          <div className="section-row gallery-heading">
            <SectionTitle number="05" title="핫클립" eyebrow="HOT CLIPS" />
            <button className="gallery-manage-button" type="button" onClick={openHotclipPage}>
              이동하기
            </button>
          </div>

          {hotclipStatus === "offline" && (
            <small className="fanpage-status fanpage-status-offline">
              핫클립 저장소 연결 실패 — Supabase 스키마와 Vercel 환경 변수를 확인해주세요
            </small>
          )}

          {hotclipPreviewGroups.length > 0 && (
            <div
              className={`hotclip-preview-grid ${
                hotclipPreviewGroups.length > 1 ? "has-divider" : "is-single"
              }`}
            >
              {hotclipPreviewGroups.map(({ category, clips }) => (
                <div className="hotclip-preview-column" key={category.id}>
                  {clips.map((clip) => (
                    <button
                      className="clip-card hotclip-preview-card"
                      type="button"
                      onClick={openHotclipPage}
                      key={clip.id}
                    >
                      <span>{category.shortLabel}</span>
                      <img src={clip.thumbnail || HERO_IMAGE_URL} alt="" />
                      <strong>{clip.title}</strong>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="page-section gallery-section" id="gallery">
          <div className="section-row gallery-heading">
            <SectionTitle number="06" title="비숑팬아트" eyebrow="GALLERY" />
            <button className="gallery-manage-button" type="button" onClick={openFanartPage}>
              이동하기
            </button>
          </div>

          <div className="gallery-mosaic">
            {galleryPreviewItems.map((image) => (
              <button
                className={`gallery-tile ${image.variant ? `is-${image.variant}` : ""}`}
                type="button"
                key={image.id}
                onClick={openFanartPage}
              >
                <img src={image.src} alt={image.title} />
              </button>
            ))}
          </div>
        </section>

        <section className="page-section community-section" id="contact">
          <SectionTitle number="07" title="함께해요, 솜뭉치!" eyebrow="COMMUNITY" />
          <div className="community-grid">
            {COMMUNITY_LINKS.map((link) => (
              <a href={link.href} target="_blank" rel="noreferrer" key={link.title}>
                <strong>{link.title}</strong>
                <span>{link.text}</span>
              </a>
            ))}
          </div>
        </section>

        <footer className="footer-section">
          <div>
            <strong>Thank you for always being here!</strong>
            <p>언제나 비숑을 응원해줘서 고마워요. 앞으로도 오래오래 함께해요!</p>
          </div>
        </footer>
      </main>

      {clipComposerOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setClipComposerOpen(false);
            setClipError("");
          }}
        >
          <form className="clip-modal" onSubmit={addClipLink} onClick={(event) => event.stopPropagation()}>
            <button
              className="modal-close"
              type="button"
              onClick={() => {
                setClipComposerOpen(false);
                setClipError("");
              }}
              aria-label="닫기"
            >
              ×
            </button>

            <h2>영상 링크 추가</h2>
            <p>유튜브 링크는 카드 안에 미리보기로 표시되고, SOOP 다시보기 링크는 바로가기 카드로 추가됩니다.</p>

            <label>
              영상 링크
              <input
                value={clipDraftUrl}
                onChange={(event) => {
                  setClipDraftUrl(event.target.value);
                  setClipError("");
                }}
                placeholder="https://..."
                autoFocus
              />
            </label>

            {clipError && <strong className="form-error">{clipError}</strong>}

            <button className="save-button" type="submit">
              추가하기
            </button>
          </form>
        </div>
      )}

      {editingDate && (
        <div className="modal-backdrop" onClick={closeScheduleEditor}>
          <form className="schedule-modal" onSubmit={saveSchedule} onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={closeScheduleEditor} aria-label="닫기">
              ×
            </button>

            <h2>{formatKoreanDate(editingDate.date)} 일정 수정</h2>

            <label>
              방송 구분
              <select value={scheduleDraft.type} onChange={(event) => updateDraft("type", event.target.value)}>
                {BROADCAST_TYPES.map((type) => (
                  <option value={type} key={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              방송 시작 시간
              <input
                value={scheduleDraft.startTime}
                onChange={(event) => updateDraft("startTime", event.target.value)}
                placeholder="예: 오후 8시"
              />
            </label>

            <label>
              방송 내용 / 비고
              <input
                value={scheduleDraft.memo}
                onChange={(event) => updateDraft("memo", event.target.value)}
                placeholder="예: 마크 하코 대결"
              />
            </label>

            <div className="schedule-range-fields">
              <label>
                장기 컨텐츠 시작일
                <input
                  type="date"
                  value={scheduleDraft.rangeStart}
                  onChange={(event) => updateDraft("rangeStart", event.target.value)}
                />
              </label>
              <label>
                장기 컨텐츠 종료일
                <input
                  type="date"
                  value={scheduleDraft.rangeEnd}
                  min={scheduleDraft.rangeStart || editingDate.key}
                  onChange={(event) => updateDraft("rangeEnd", event.target.value)}
                  placeholder="선택 안 하면 하루 일정"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button className="delete-button" type="button" onClick={deleteSchedule}>
                삭제하기
              </button>
              <button className="save-button" type="submit">
                저장하기
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
