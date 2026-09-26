// English is written in index.html; this holds Korean plus status messages in both languages.
const KO = {
  skip: "스튜디오로 건너뛰기",
  navGallery: "갤러리",
  navStudio: "스튜디오",
  navHow: "원리",
  star: "★ 스타",
  startTitle: "내 초상 만들기",
  ghLabel: "GitHub 아이디",
  ghGo: "만들기",
  tabId: "GitHub 아이디",
  tabImage: "이미지 파일",
  dropTitle: "이미지를 끌어다 놓거나 눌러서 고르기",
  dropHint: "PNG · JPG · WebP · Ctrl+V로 붙여넣기도 됩니다",
  stays: "모든 처리는 브라우저 안에서 끝납니다. 아무것도 업로드되지 않습니다.",
  pickTitle: "명화로 시작해 보기",
  headline: "당신의 얼굴을 README에 <span class=\"typed\">타이핑</span>하다.",
  galleryTitle: "명화 여섯 점. 한 점에 6,820글자.",
  galleryLead: "아래 카드는 모두 이 페이지가 퍼블릭 도메인 작품으로 실제로 만든 결과입니다. 한 장 한 장이 GitHub README 안에서 그대로 재생되는 SVG 파일입니다.",
  open: "열기",
  studioTitle: "스튜디오.",
  studioLead: "원본 위의 틀을 끌어 구도를 잡고, 대비 방식을 바꾸면서 변환 단계가 어떻게 달라지는지 확인하세요.",
  sourceHelp: "틀 끌기 · 스크롤이나 +/−로 확대 · 방향키로 이동",
  gCells: "칸",
  cols: "가로 칸 수",
  contrast: "대비",
  cGlobal: "전체",
  cLocal: "국소",
  cNone: "끄기",
  zoom: "확대",
  gColour: "색",
  mode: "색 모드",
  modeColor: "사진 색 그대로",
  modeGray: "흑백",
  modeGreen: "터미널 초록",
  modeAmber: "호박색",
  brightness: "밝기",
  saturation: "채도",
  gTerminal: "터미널",
  title: "창 제목",
  name: "whoami",
  animate: "애니메이션",
  animStyle: "등장 방식",
  animType: "한 줄씩 타이핑",
  animReveal: "가운데부터 드러나기",
  animScan: "스캔라인",
  animMatrix: "매트릭스 비",
  speed: "한 줄에 걸리는 초",
  card: "카드 크기",
  cardSide: "카드 560×635 · 다른 카드 옆에",
  cardWide: "가로형 880×500 · 한 장만",
  replay: "다시 재생",
  share: "링크 복사",
  download: ".svg 내려받기",
  wHalf: "49% · 카드 옆에",
  wFull: "100% · 한 장만",
  copyCode: "README 코드 복사",
  credit: "「made with」 작은 링크 넣기",
  how1: "<code>아이디/아이디</code> 저장소의 <code>assets/portrait.svg</code>로 파일을 올립니다.",
  how2: "코드를 <code>README.md</code>에 붙여 넣습니다.",
  how3: "커밋하면 프로필에서 한 줄씩 타이핑됩니다.",
  aiTitle: "AI 코딩 에이전트에게 맡기기",
  copy: "프롬프트 복사",
  howTitle: "필터가 아니라, 소프트웨어처럼.",
  f1l: "Pillow와 일치",
  f1: "JS 구현이 참고용 파이썬(Pillow) 스크립트와 칸 단위로 같은 결과를 냅니다. 6,820칸의 글자와 색이 모두 같고 SVG는 바이트 단위로 같습니다. 국소 대비는 OpenCV CLAHE와 픽셀 99.98%가 같습니다.",
  f2l: "&lt;img&gt; 안에서 동작",
  f2: "GitHub는 README의 SVG 코드를 지우고, 이미지 안의 스크립트와 글꼴을 막습니다. 타이핑은 순수 SMIL로 만들고, 줄마다 textLength로 폭을 고정해서 macOS·Windows·Linux에서 모두 맞습니다.",
  f3l: "빈 칸이 되지 않음",
  f3: "모든 줄은 기본적으로 보이고, 지연은 keyTimes에만 넣었습니다. 메일 미리보기, 공유 카드, 캡처에서도 초상 전체가 보입니다.",
  n1: "참고 구현과 칸 일치",
  n2: "기본 파일, 110×62칸",
  n3: "외부로 보내는 이미지 바이트",
  n4: "오픈 소스, 추적 없음",
  faqTitle: "묻고, 답하다.",
  q1: "README에 &lt;svg&gt; 코드를 바로 넣으면 안 되나요?",
  a1: "GitHub는 Markdown 안의 SVG 코드를 지웁니다. 파일로 두고 &lt;img&gt;로 불러야 하는데, 이때 스크립트와 웹 글꼴은 막히고 SMIL 애니메이션만 동작합니다.",
  q2: "사진이 서버로 올라가나요?",
  a2: "아니요. 픽셀은 브라우저 안에서 읽고 변환합니다. 네트워크를 쓰는 것은 아이디를 넣었을 때 GitHub API로 아바타를 받아 오는 요청뿐입니다.",
  q4: "전체 대비와 국소 대비는 무엇이 다른가요?",
  a4: "전체 대비(평활화)는 실루엣이 굵고 선명합니다. 국소 대비(CLAHE)는 배경이 밝거나 복잡할 때 얼굴 안의 명암을 살립니다. 내 이미지로 둘 다 해 보세요. 파이프라인 창에서 차이가 보입니다.",
  q3: "메일 미리보기에서 빈 칸으로 보여요.",
  a3: "그럴 일은 없도록 만들었습니다. 모든 줄은 기본적으로 보이고, 애니메이션이 재생되는 동안에만 잠깐 가려집니다. 완전히 정지된 파일이 필요하면 애니메이션을 끄세요.",
  q5: "예시 그림은 어디서 가져왔나요?",
  a5: "위키미디어 커먼즈의 퍼블릭 도메인 작품입니다. 출처는 CREDITS.md에 적어 두었습니다.",
  foot: "MIT 라이선스 · 추적 없음 · 업로드 없음",
  dropHere: "놓으면 바로 변환합니다",
};

const MESSAGES = {
  en: {
    loading: "Loading image…",
    ready: (kb) => `Done · ${kb} KB`,
    tooBig: (kb) => `${kb} KB is over 300 KB. GitHub may load it slowly. Try fewer columns.`,
    copied: "Copied to clipboard.",
    shareCopied: "Link copied. It opens with the same image and settings.",
    shareLocal: "Link copied with your settings. Your image stays on your device, so the link opens with a sample image.",
    copyFailed: "Copy failed. Select the text and copy it manually.",
    downloaded: "portrait.svg downloaded.",
    exported: (kind, kb) => `${kind} saved · ${kb} KB`,
    exportFailed: "Export failed. Try again or use the SVG.",
    gifProgress: (i, n) => `Rendering GIF frame ${i}/${n}…`,
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
    shareCopied: "링크를 복사했습니다. 같은 이미지와 설정으로 열립니다.",
    shareLocal: "설정을 담은 링크를 복사했습니다. 내 이미지는 기기 밖으로 나가지 않으므로 링크는 예시 이미지로 열립니다.",
    copyFailed: "복사하지 못했습니다. 글자를 직접 선택해 복사해 주세요.",
    downloaded: "portrait.svg를 내려받았습니다.",
    exported: (kind, kb) => `${kind} 저장 완료 · ${kb}KB`,
    exportFailed: "내보내지 못했습니다. 다시 시도하거나 SVG를 쓰세요.",
    gifProgress: (i, n) => `GIF 프레임 그리는 중 ${i}/${n}…`,
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
