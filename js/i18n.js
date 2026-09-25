// English is written in index.html; this holds Korean plus status messages in both languages.
const KO = {
  skip: "변환기로 건너뛰기",
  star: "★ GitHub에서 스타 주기",
  h1: "GitHub README에 한 줄씩 타이핑되는 글자 초상",
  lead: "사진을 올리거나 GitHub 아이디를 넣으세요. SVG 파일 하나와 붙여 넣을 코드 한 줄을 드립니다. 모든 처리는 브라우저 안에서 끝납니다.",
  input: "1. 이미지",
  ghLabel: "GitHub 아이디",
  ghGo: "아바타 쓰기",
  try: "예시:",
  or: "또는",
  dropTitle: "이미지를 여기에 끌어다 놓기",
  dropHint: "또는 눌러서 고르기 · PNG, JPG, WebP · 기기 밖으로 나가지 않습니다",
  options: "2. 옵션",
  cols: "가로 칸 수",
  mode: "색",
  modeColor: "사진 색 그대로",
  modeGray: "흑백",
  modeGreen: "터미널 초록",
  modeAmber: "호박색",
  equalize: "명암 대비 키우기(히스토그램 평활화)",
  brightness: "밝기",
  saturation: "채도",
  crop: "자를 위치",
  cropTop: "위",
  cropCenter: "가운데",
  cropBottom: "아래",
  title: "창 제목 이름",
  name: "whoami 이름",
  animate: "타이핑 애니메이션",
  speed: "한 줄에 걸리는 초",
  card: "카드 크기",
  cardSide: "560×635 · 다른 카드 옆에 두기",
  cardWide: "880×500 · 가로형, 한 장만",
  output: "3. 결과",
  example: "예시 결과입니다. 내 이미지로 만들어 보세요.",
  download: "portrait.svg 내려받기",
  codeHalf: "README · 다른 카드 옆에 (49%)",
  codeFull: "README · 한 장만 (100%)",
  copy: "복사",
  credit: "「made with readme_portrait」 작은 링크 넣기",
  howTitle: "3단계로 넣기",
  how1: "프로필 저장소 <code>아이디/아이디</code>를 열고 파일을 <code>assets/portrait.svg</code>로 올립니다.",
  how2: "위 코드를 <code>README.md</code>에 붙여 넣습니다.",
  how3: "커밋하면 프로필 화면에서 타이핑 애니메이션이 재생됩니다.",
  aiTitle: "또는 AI 코딩 에이전트에게 맡기기",
  faqTitle: "자주 묻는 질문",
  q1: "README에 &lt;svg&gt; 코드를 바로 넣으면 안 되나요?",
  a1: "GitHub는 Markdown 안의 SVG 코드를 지웁니다. 파일로 두고 &lt;img&gt;로 불러야 하는데, 이때 스크립트와 웹 폰트는 막히고 SMIL 애니메이션만 동작합니다. 이 도구는 SMIL로 타이핑 효과를 만들고 줄마다 폭을 고정해서 어느 OS에서나 같게 보이도록 합니다.",
  q2: "사진이 서버로 올라가나요?",
  a2: "아니요. 픽셀은 브라우저 안에서 읽고 변환합니다. 네트워크를 쓰는 것은 아이디를 넣었을 때 GitHub API로 아바타를 받아 오는 요청뿐입니다.",
  q3: "메일 미리보기나 캡처에서 빈 칸으로 보여요.",
  a3: "그럴 일은 없도록 만들었습니다. 모든 줄은 기본적으로 보이고, 애니메이션이 재생되는 동안에만 잠깐 가려집니다. 완전히 정지된 파일이 필요하면 애니메이션을 끄세요.",
  foot: "MIT 라이선스 · 추적 없음 · 만든 사람",
};

const MESSAGES = {
  en: {
    loading: "Loading image…",
    ready: (kb) => `Done · ${kb} KB`,
    tooBig: (kb) => `${kb} KB is over 300 KB. GitHub may load it slowly. Try fewer columns.`,
    copied: "Copied to clipboard.",
    copyFailed: "Copy failed. Select the text and copy it manually.",
    downloaded: "portrait.svg downloaded.",
    caption: "Your portrait. Change options to redraw it.",
    username: "That does not look like a GitHub username.",
    notFound: "No GitHub user with that name.",
    rateLimit: "GitHub API limit reached. Wait a few minutes or upload the image instead.",
    network: "Could not reach GitHub. Check your connection or upload the image instead.",
    type: "Please use a PNG, JPG or WebP image.",
    decode: "This image could not be read.",
    langButton: "한국어",
    langLabel: "한국어로 보기",
  },
  ko: {
    loading: "이미지를 불러오는 중…",
    ready: (kb) => `완성 · ${kb}KB`,
    tooBig: (kb) => `${kb}KB로 300KB를 넘습니다. GitHub에서 늦게 뜰 수 있으니 칸 수를 줄여 보세요.`,
    copied: "클립보드에 복사했습니다.",
    copyFailed: "복사하지 못했습니다. 글자를 직접 선택해 복사해 주세요.",
    downloaded: "portrait.svg를 내려받았습니다.",
    caption: "내 초상입니다. 옵션을 바꾸면 바로 다시 그립니다.",
    username: "GitHub 아이디 형식이 아닙니다.",
    notFound: "그 아이디의 GitHub 사용자가 없습니다.",
    rateLimit: "GitHub API 호출 한도에 걸렸습니다. 몇 분 뒤에 다시 하거나 이미지를 직접 올려 주세요.",
    network: "GitHub에 연결하지 못했습니다. 연결을 확인하거나 이미지를 직접 올려 주세요.",
    type: "PNG, JPG, WebP 이미지를 써 주세요.",
    decode: "이 이미지를 읽지 못했습니다.",
    langButton: "English",
    langLabel: "View in English",
  },
};

const english = new Map();
let lang = "en";

export function currentLang() {
  return lang;
}

export function msg(key, ...args) {
  const m = MESSAGES[lang][key] ?? MESSAGES.en[key] ?? key;
  return typeof m === "function" ? m(...args) : m;
}

// Strings are our own constants above, so innerHTML keeps the <code> tags safely
export function applyLang(next) {
  lang = next === "ko" ? "ko" : "en";
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll("[data-i18n]")) {
    if (!english.has(el)) english.set(el, el.innerHTML);
    el.innerHTML = lang === "ko" ? KO[el.dataset.i18n] ?? english.get(el) : english.get(el);
  }
  const button = document.getElementById("lang");
  button.textContent = msg("langButton");
  button.setAttribute("aria-label", msg("langLabel"));
  button.lang = lang === "ko" ? "en" : "ko";
}

export function initialLang() {
  try {
    const saved = localStorage.getItem("lang");
    if (saved) return saved;
  } catch {
    // storage may be blocked; fall back to the browser language
  }
  return navigator.language?.toLowerCase().startsWith("ko") ? "ko" : "en";
}

export function saveLang(value) {
  try {
    localStorage.setItem("lang", value);
  } catch {
    // not critical
  }
}
