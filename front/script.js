
// ダミーデータ定義
// =========================================================
const RECOMMENDATIONS = {
  low: {
    label: "ストレス低め",
    comment: "今日は落ち着いた声のトーンでした。この調子で過ごせるといいですね。",
    tips: ["散歩15分", "好きな音楽を1曲", "軽いストレッチ"],
    music: ["落ち着くピアノ", "自然音", "Lo-fi"],
  },
  mid: {
    label: "ストレスやや高め",
    comment: "話す速さがいつもより少し早めでした。こまめに一息つく時間を作りましょう。",
    tips: ["深呼吸3分", "カフェで休憩", "リラックス系プレイリスト"],
    music: ["リラックス系ボーカル", "Lo-fi", "自然音"],
  },
  high: {
    label: "ストレス高め",
    comment: "声のトーンが硬めで、間の取り方も少ないようでした。無理をせず休む時間を優先してください。",
    tips: ["ヒーリングミュージック", "瞑想5分", "信頼できる人と話す", "十分な睡眠をとる"],
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
// 結果表示（ダミー判定：ランダムだが録音時間を軽く反映）
// =========================================================
function pickLevel() {
  const levels = ["low", "mid", "high"];
  // 録音時間が短いほど low に寄せるなど、雰囲気だけ再現するダミーロジック
  const bias = recordSeconds < 8 ? [0.5, 0.3, 0.2] : recordSeconds < 16 ? [0.3, 0.4, 0.3] : [0.2, 0.35, 0.45];
  const r = Math.random();
  let acc = 0;
  for (let k = 0; k < levels.length; k++) {
    acc += bias[k];
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
  chips.innerHTML = "";
  data.music.forEach((m, i) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = m;
    chip.style.animationDelay = `${0.25 + i * 0.06}s`;
    chips.appendChild(chip);
  });
 
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
// イベント登録
// =========================================================
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
    return raw ? JSON.parse(raw) : { reminder: false, saveVoice: false, baselineDone: false };
  } catch (e) {
    return { reminder: false, saveVoice: false, baselineDone: false };
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
 
  reminderToggle.checked = settings.reminder;
  saveVoiceToggle.checked = settings.saveVoice;
  setBaselineButtonState(baselineBtn, settings.baselineDone);
 
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
 
document.getElementById("btn-settings").addEventListener("click", () => showScreen("screen-settings"));
document.getElementById("btn-back-from-settings").addEventListener("click", () => showScreen("screen-intro"));
 
// 初期表示
showScreen("screen-intro");