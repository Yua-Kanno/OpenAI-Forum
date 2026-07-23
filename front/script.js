// =========================================================
// ダミーデータ定義
// =========================================================
// 監修：公益財団法人パブリックヘルスリサーチセンター ストレス科学研究所
// 「ストレスのセルフケア」で紹介されている7技法を参考に構成
// https://www.phrf.jp/ssl/learn/selfcare
const RECOMMENDATIONS = {
  low: {
    label: "ストレス低め",
    comment: "今日は落ち着いた声のトーンでした。この調子で過ごせるといいですね。",
    tips: [
      "呼吸法：ゆっくり深呼吸を3回",
      "サポートシステム：誰かと近況を話してみる",
      "軽いストレッチで体をほぐす",
    ],
    music: ["落ち着くピアノ", "自然音", "Lo-fi"],
  },
  mid: {
    label: "ストレスやや高め",
    comment: "話す速さがいつもより少し早めでした。こまめに一息つく時間を作りましょう。",
    tips: [
      "認知の見直し：「うまくいかなかった」を「今日はこう感じた」に言い換えてみる",
      "断行訓練：「今日はよく頑張った」と自分に言い聞かせる",
      "カフェなどで一息つく時間を作る",
    ],
    music: ["リラックス系ボーカル", "Lo-fi", "自然音"],
  },
  high: {
    label: "ストレス高め",
    comment: "声のトーンが硬めで、間の取り方も少ないようでした。無理をせず休む時間を優先してください。",
    tips: [
      "自己表現：話す・書き出すなどで気持ちを外に出す",
      "サポートシステム：信頼できる人に相談する",
      "呼吸法でリラクセーション",
      "十分な睡眠をとる",
    ],
    music: ["ヒーリングミュージック", "自然音", "落ち着くピアノ"],
  },
};

const WEATHER_SUGGESTIONS = [
  { condition: "雨", text: "雨の日なので、部屋の中でできるストレッチや瞑想がおすすめです。" },
  { condition: "晴れ", text: "気持ちのいい晴れです。少し外に出て、散歩してみませんか。" },
  { condition: "くもり", text: "くもり空の下、静かな音楽を聴きながらゆっくり過ごすのも良さそうです。" },
];

// 週間のダミー推移（月〜日、0=低 100=高）
const WEEK_DUMMY = [
  { day: "月", value: 78 },
  { day: "火", value: 55 },
  { day: "水", value: 40 },
  { day: "木", value: 62 },
  { day: "金", value: 48 },
  { day: "土", value: 25 },
  { day: "日", value: 33 },
];

// =========================================================
// 画面遷移
// =========================================================
const screens = document.querySelectorAll(".screen");
const dots = document.querySelectorAll(".dot");

function showScreen(id) {
  const current = document.querySelector(".screen.is-active");
  const target = document.getElementById(id);
  if (!target) return;

  const applySwitch = () => {
    screens.forEach((s) => {
      s.classList.remove("is-leaving");
      s.classList.toggle("is-active", s.id === id);
    });
    const stepAttr = target.dataset.screen;
    const stepNum = Number(stepAttr);
    dots.forEach((d) => {
      const dStep = Number(d.dataset.step);
      d.classList.toggle("is-current", dStep === stepNum);
      d.classList.toggle("is-done", stepNum && dStep < stepNum);
    });
    document.getElementById("progress-dots").style.visibility =
      Number.isFinite(stepNum) ? "visible" : "hidden";
  };

  if (current && current !== target) {
    current.classList.add("is-leaving");
    current.classList.remove("is-active");
    setTimeout(applySwitch, 180);
  } else {
    applySwitch();
  }
}

// =========================================================
// 録音シミュレーション
// =========================================================
const waveBars = document.getElementById("wave-bars");
for (let i = 0; i < 18; i++) {
  const bar = document.createElement("span");
  bar.style.animationDelay = `${(i * 0.07).toFixed(2)}s`;
  waveBars.appendChild(bar);
}

let recordInterval = null;
let recordSeconds = 0;
const RECORD_HINTS = [
  "今の気分は、どうですか？",
  "今日、何か印象に残ったことは？",
  "うまくまとまらなくても大丈夫です",
];

function startRecording() {
  showScreen("screen-record");
  recordSeconds = 0;
  document.getElementById("record-timer").textContent = "0:00";
  document.getElementById("record-hint").textContent = RECORD_HINTS[0];

  recordInterval = setInterval(() => {
    recordSeconds += 1;
    const m = Math.floor(recordSeconds / 60);
    const s = String(recordSeconds % 60).padStart(2, "0");
    document.getElementById("record-timer").textContent = `${m}:${s}`;

    if (recordSeconds === 6) {
      document.getElementById("record-hint").textContent = RECORD_HINTS[1];
    }
    if (recordSeconds === 14) {
      document.getElementById("record-hint").textContent = RECORD_HINTS[2];
    }
    // 20秒でも自動では止めず、ユーザーの「話し終わった」を待つ（UIのみのため上限だけ設ける）
    if (recordSeconds >= 30) {
      stopRecording();
    }
  }, 1000);
}

function stopRecording() {
  clearInterval(recordInterval);
  runAnalysis();
}

// =========================================================
// 解析シミュレーション
// =========================================================
function runAnalysis() {
  showScreen("screen-analyze");
  const items = document.querySelectorAll("#analyze-list li");
  items.forEach((li) => li.classList.remove("is-checking", "is-done"));

  let i = 0;
  const step = () => {
    if (i > 0) items[i - 1].classList.replace("is-checking", "is-done");
    if (i < items.length) {
      items[i].classList.add("is-checking");
      i += 1;
      setTimeout(step, 480);
    } else {
      setTimeout(showResult, 500);
    }
  };
  step();
}

// =========================================================
// 結果表示（判定ロジック：声・内容・プロフィールの3つに分割）
//
// 今はすべてダミーだが、将来的にそれぞれ本物の処理に差し替える想定：
//   ・getVoiceBias    → 声の特徴量(速さ・高さ等)の解析結果に差し替え
//   ・getContentBias  → 音声をテキスト化(STT)し、AIに内容分析させた結果に差し替え
//   ・getProfileAdjustment → 年代・性別ごとの標準値との比較ロジックに差し替え
// =========================================================

// ① 声の特徴からの判定（現状はダミー：録音時間だけを軽く反映）
function getVoiceBias() {
  return recordSeconds < 8 ? [0.5, 0.3, 0.2] : recordSeconds < 16 ? [0.3, 0.4, 0.3] : [0.2, 0.35, 0.45];
}

// ② 発言内容からの判定（本実装ではSTT + AI分析の結果をここに入れる）
// 今はまだ文字起こし機能が無いため、声のバイアスと同じ分布を返すダミーのまま
function getContentBias() {
  return [1 / 3, 1 / 3, 1 / 3]; // 「わからない」ことを示す均等な仮の値
}

// ③ プロフィールによる補正（年代・性別ごとの標準値との差を見る想定）
// 今は補正なし(そのまま)。将来は setting.ageGroup / setting.gender を見て
// 「その属性の平均値と比べてどれくらいズレているか」で重みを調整する
function getProfileAdjustment(bias) {
  const settings = loadSettings();
  void settings.ageGroup; // 現状未使用（将来ここで参照する）
  void settings.gender; // 現状未使用（将来ここで参照する）
  return bias;
}

function combineBias(voiceBias, contentBias) {
  return voiceBias.map((v, i) => (v + contentBias[i]) / 2);
}

function pickLevel() {
  const levels = ["low", "mid", "high"];
  const voiceBias = getVoiceBias();
  const contentBias = getContentBias();
  const combined = getProfileAdjustment(combineBias(voiceBias, contentBias));

  const r = Math.random();
  let acc = 0;
  for (let k = 0; k < levels.length; k++) {
    acc += combined[k];
    if (r <= acc) return levels[k];
  }
  return "mid";
}

function showResult() {
  const level = pickLevel();
  const data = RECOMMENDATIONS[level];

  showScreen("screen-result");

  const orb = document.getElementById("orb-result");
  orb.classList.remove("level-low", "level-mid", "level-high");
  orb.classList.add(`level-${level}`);

  document.getElementById("result-label").textContent = data.label;
  document.getElementById("ai-comment").textContent = data.comment;

  const list = document.getElementById("recommend-list");
  list.innerHTML = "";
  data.tips.forEach((tip, i) => {
    const li = document.createElement("li");
    li.textContent = tip;
    li.style.animationDelay = `${0.15 + i * 0.07}s`;
    list.appendChild(li);
  });

  const chips = document.getElementById("music-chips");
  if (chips) {
    chips.innerHTML = "";
  }
  // Apple Music の埋め込みプレイヤーを表示（気分ジャンルの先頭を採用）
  renderMusicEmbed(data.music[0]);

  // 育成コンパニオン：今日のチェックを記録して見た目を更新
  const streakCount = updateStreakForToday();
  renderCompanion(streakCount);

  const weather = WEATHER_SUGGESTIONS[Math.floor(Math.random() * WEATHER_SUGGESTIONS.length)];
  document.getElementById("weather-line").textContent = `${weather.condition}の予報 ー ${weather.text}`;
}

// =========================================================
// 週間グラフ（ダミー）
// =========================================================
function renderWeekChart() {
  const chart = document.getElementById("week-chart");
  chart.innerHTML = "";

  const maxVal = Math.max(...WEEK_DUMMY.map((d) => d.value));
  const worst = WEEK_DUMMY.reduce((a, b) => (b.value > a.value ? b : a));

  WEEK_DUMMY.forEach((d) => {
    const col = document.createElement("div");
    col.className = "bar-col";

    const bar = document.createElement("div");
    bar.className = "bar";
    const heightPct = Math.max(8, Math.round((d.value / maxVal) * 100));
    bar.style.height = `${heightPct}%`;
    bar.style.background =
      d.value >= 65 ? "var(--dusk-rose)" : d.value >= 40 ? "var(--warm-amber)" : "var(--calm-sage)";

    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = d.day;

    col.appendChild(bar);
    col.appendChild(label);
    chart.appendChild(col);
  });

  document.getElementById(
    "week-comment"
  ).textContent = `今週は${worst.day}曜日が一番ストレスが高い傾向でした。次の${worst.day}曜日は、少し早めに休憩を挟んでみましょう。`;
}

// =========================================================
// Apple Music 埋め込み（Developer Program不要の埋め込みプレイヤー方式）
// =========================================================
// 各ジャンルに対応する Apple Music の共有リンク（日本版の公式プレイリスト）
// 気に入らなければ、Apple Musicアプリでプレイリストを開き「シェア」→「リンクをコピー」で差し替え可能
const MUSIC_EMBED_LINKS = {
  "落ち着くピアノ": "https://music.apple.com/jp/playlist/心穏やかになるピアノ音楽/pl.37383766a6784fee8f303b5067b899b9",
  "自然音": "https://music.apple.com/jp/playlist/オーシャンサウンド/pl.1321db8d70d64d389e9ffb9e875933fe",
  "Lo-fi": "https://music.apple.com/jp/playlist/lo-fi-japan/pl.38eb70f47b834187a21cf4e8e5833f35",
  "リラックス系ボーカル": "https://music.apple.com/jp/playlist/リラックス/pl.5cc71a7325f8405c8c420ea382d66040",
  "ヒーリングミュージック": "https://music.apple.com/jp/playlist/ベスト-オブ-ヒーリング-ミュージック/pl.030445494eae405da337422464acc8e6",
};

function toEmbedUrl(appleMusicUrl) {
  return appleMusicUrl.replace("https://music.apple.com", "https://embed.music.apple.com");
}

function renderMusicEmbed(genreLabel) {
  const wrap = document.getElementById("music-embed-wrap");
  const caption = document.getElementById("music-caption");
  caption.textContent = genreLabel;

  const shareUrl = MUSIC_EMBED_LINKS[genreLabel];
  if (!shareUrl) {
    wrap.innerHTML = `<p style="padding:14px;font-size:12px;color:var(--mist-400)">「${genreLabel}」のプレイリストリンクが未設定です</p>`;
    return;
  }

  const embedUrl = toEmbedUrl(shareUrl);
  wrap.innerHTML = `
    <iframe
      allow="autoplay *; encrypted-media *;"
      frameborder="0"
      height="150"
      style="width:100%;overflow:hidden;background:transparent;"
      sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
      src="${embedUrl}">
    </iframe>`;
}

// =========================================================
// 育成コンパニオン（連続チェック日数ベース）
// =========================================================
const STREAK_KEY = "koelog:streak";

const GROWTH_STAGES = [
  { key: "seed", label: "たね", min: 1, max: 7, cssClass: "stage-seed" },
  { key: "sprout", label: "め", min: 8, max: 14, cssClass: "stage-sprout" },
  { key: "sapling", label: "わかば", min: 15, max: 21, cssClass: "stage-sapling" },
  { key: "bloom", label: "花ひらく木", min: 22, max: Infinity, cssClass: "stage-bloom" },
];

function loadStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : { count: 0, lastDate: null, nickname: "" };
  } catch (e) {
    return { count: 0, lastDate: null, nickname: "" };
  }
}

function saveStreak(streak) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch (e) {
    // 保存できない環境では無視
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

// 今日のチェックを記録し、最新の連続日数を返す
function updateStreakForToday() {
  const streak = loadStreak();
  const today = todayStr();

  if (streak.lastDate === today) {
    // 今日すでにチェック済みなら日数は増やさない
  } else if (streak.lastDate && daysBetween(streak.lastDate, today) === 1) {
    streak.count += 1;
  } else {
    // 初回、または1日以上あいた場合はリセットして1からスタート
    streak.count = 1;
  }
  streak.lastDate = today;
  saveStreak(streak);
  return streak.count;
}

function getStageInfo(count) {
  const stage = GROWTH_STAGES.find((s) => count >= s.min && count <= s.max) || GROWTH_STAGES[0];
  const dayInStage = count - stage.min + 1;
  const stageLength = stage.max === Infinity ? null : stage.max - stage.min + 1;
  const progressPct = stageLength ? Math.min(100, Math.round((dayInStage / stageLength) * 100)) : 100;
  const daysToNext = stage.max === Infinity ? null : stage.max - count + 1;
  return { stage, count, progressPct, daysToNext };
}

function renderCompanion(count) {
  if (!count || count < 1) {
    document.querySelectorAll(".companion-avatar").forEach((el) => {
      el.className = "companion-avatar stage-seed";
      el.style.opacity = "0.4";
    });
    document.querySelectorAll(".companion-name").forEach((el) => {
      el.textContent = "まだ記録がありません";
    });
    document.querySelectorAll(".companion-next").forEach((el) => {
      el.textContent = "今日話すと育ち始めます";
    });
    document.querySelectorAll(".companion-bar-fill").forEach((el) => {
      el.style.width = "0%";
    });
    return;
  }

  const info = getStageInfo(count);
  const nickname = loadStreak().nickname;
  const displayName = nickname && nickname.trim() ? nickname.trim() : info.stage.label;

  document.querySelectorAll(".companion-avatar").forEach((el) => {
    el.style.opacity = "";
    el.className = `companion-avatar ${info.stage.cssClass}`;
  });
  document.querySelectorAll(".companion-name").forEach((el) => {
    el.textContent = `${displayName}・${count}日目`;
  });
  document.querySelectorAll(".companion-next").forEach((el) => {
    el.textContent =
      info.daysToNext !== null ? `次の成長まであと${info.daysToNext}日` : "最終段階まで育ちました";
  });
  document.querySelectorAll(".companion-bar-fill").forEach((el) => {
    el.style.width = `${info.progressPct}%`;
  });
}


document.getElementById("btn-start-record").addEventListener("click", startRecording);
document.getElementById("btn-stop-record").addEventListener("click", stopRecording);
document.getElementById("btn-retry").addEventListener("click", () => showScreen("screen-intro"));

document.getElementById("btn-history").addEventListener("click", () => {
  renderWeekChart();
  showScreen("screen-history");
});
document.getElementById("btn-back-from-history").addEventListener("click", () => showScreen("screen-intro"));
document.getElementById("btn-back-to-intro").addEventListener("click", () => showScreen("screen-intro"));

// =========================================================
// 設定画面
// =========================================================
const SETTINGS_KEY = "koelog:settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw
      ? JSON.parse(raw)
      : { reminder: false, saveVoice: false, baselineDone: false, ageGroup: "unknown", gender: "unknown" };
  } catch (e) {
    return { reminder: false, saveVoice: false, baselineDone: false, ageGroup: "unknown", gender: "unknown" };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    // 保存できない環境では無視する
  }
}

function initSettingsScreen() {
  const settings = loadSettings();
  const reminderToggle = document.getElementById("toggle-reminder");
  const saveVoiceToggle = document.getElementById("toggle-save-voice");
  const baselineBtn = document.getElementById("btn-baseline");
  const ageSelect = document.getElementById("profile-age");
  const genderSelect = document.getElementById("profile-gender");
  const nicknameInput = document.getElementById("companion-nickname");

  nicknameInput.value = loadStreak().nickname || "";
  nicknameInput.addEventListener("change", () => {
    const streak = loadStreak();
    streak.nickname = nicknameInput.value.slice(0, 12);
    saveStreak(streak);
    renderCompanion(streak.count);
  });

  reminderToggle.checked = settings.reminder;
  saveVoiceToggle.checked = settings.saveVoice;
  ageSelect.value = settings.ageGroup || "unknown";
  genderSelect.value = settings.gender || "unknown";
  setBaselineButtonState(baselineBtn, settings.baselineDone);

  ageSelect.addEventListener("change", () => {
    const s = loadSettings();
    s.ageGroup = ageSelect.value;
    saveSettings(s);
  });

  genderSelect.addEventListener("change", () => {
    const s = loadSettings();
    s.gender = genderSelect.value;
    saveSettings(s);
  });

  reminderToggle.addEventListener("change", () => {
    const s = loadSettings();
    s.reminder = reminderToggle.checked;
    saveSettings(s);
  });

  saveVoiceToggle.addEventListener("change", () => {
    const s = loadSettings();
    s.saveVoice = saveVoiceToggle.checked;
    saveSettings(s);
  });

  baselineBtn.addEventListener("click", () => {
    if (baselineBtn.dataset.busy === "true") return;
    baselineBtn.dataset.busy = "true";
    baselineBtn.textContent = "録音中… 平常時の声を聞いています";
    setTimeout(() => {
      const s = loadSettings();
      s.baselineDone = true;
      saveSettings(s);
      setBaselineButtonState(baselineBtn, true);
      baselineBtn.dataset.busy = "false";
    }, 2200);
  });
}

function setBaselineButtonState(btn, done) {
  btn.classList.toggle("btn-baseline-done", done);
  btn.textContent = done ? "登録ずみ（もう一度登録する）" : "平常時の声を登録する";
}

initSettingsScreen();

document.getElementById("btn-settings").addEventListener("click", () => {
  renderCompanion(loadStreak().count);
  showScreen("screen-settings");
});
document.getElementById("btn-back-from-settings").addEventListener("click", () => showScreen("screen-intro"));

// 初期表示
showScreen("screen-intro");