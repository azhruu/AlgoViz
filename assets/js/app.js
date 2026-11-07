/* AlgoViz — UI wiring, including race mode (two algorithms, one array). */
"use strict";

const $ = (id) => document.getElementById(id);
const ALGO_NAMES = {
  bubble: "Bubble Sort", selection: "Selection Sort", insertion: "Insertion Sort",
  merge: "Merge Sort", quick: "Quick Sort", heap: "Heap Sort",
};

const player = new Player($("stage"), {
  comparisons: $("statComparisons"),
  swaps: $("statSwaps"),
  complexity: $("statComplexity"),
  status: $("statStatus"),
});
const playerB = new Player($("stageB"), {
  comparisons: $("statComparisonsB"),
  swaps: $("statSwapsB"),
  complexity: $("statComplexityB"),
  status: $("statStatusB"),
});

let pseudoLines = [];
let pseudoLinesB = [];
let raceMode = false;
let raceDeclared = false;

player.onLine = (line) => {
  $("pseudocode").innerHTML = pseudoLines
    .map((l, i) => (i === line ? `<span class="hl">▸ ${l}</span>` : `  ${l}`))
    .join("\n");
};
playerB.onLine = (line) => {
  $("pseudocodeB").innerHTML = pseudoLinesB
    .map((l, i) => (i === line ? `<span class="hl">▸ ${l}</span>` : `  ${l}`))
    .join("\n");
};

/* The winner is decided by total frames (fewer steps = faster finish);
   equal frames fall back to fewer comparisons, then a dead heat. */
function declareWinner() {
  if (!raceMode || raceDeclared) return;
  const doneA = player.pos >= player.frames.length - 1;
  const doneB = playerB.pos >= playerB.frames.length - 1;
  if (!doneA || !doneB) return;
  raceDeclared = true;
  const framesA = player.frames.length, framesB = playerB.frames.length;
  const nameA = ALGO_NAMES[$("algoSelect").value];
  const nameB = ALGO_NAMES[$("algoSelectB").value];
  const lastA = player.frames[framesA - 1] || { comparisons: 0 };
  const lastB = playerB.frames[framesB - 1] || { comparisons: 0 };
  const el = $("raceResult");
  let text, winner = null;
  if (framesA < framesB) {
    text = `🏆 ${nameA} wins — ${framesA} steps vs ${framesB} for ${nameB}.`;
    winner = "A";
  } else if (framesB < framesA) {
    text = `🏆 ${nameB} wins — ${framesB} steps vs ${framesA} for ${nameA}.`;
    winner = "B";
  } else if (lastA.comparisons !== lastB.comparisons) {
    const aWins = lastA.comparisons < lastB.comparisons;
    text = `🏆 ${aWins ? nameA : nameB} wins on comparisons `
      + `(${Math.min(lastA.comparisons, lastB.comparisons)} vs `
      + `${Math.max(lastA.comparisons, lastB.comparisons)}) — same ${framesA} steps.`;
    winner = aWins ? "A" : "B";
  } else {
    text = `Dead heat — ${nameA} and ${nameB} both finished in ${framesA} steps `
      + `with ${lastA.comparisons} comparisons.`;
  }
  el.textContent = text;
  el.hidden = false;
  if (winner === "A") $("stageWrapA").classList.add("winner");
  if (winner === "B") $("stageWrapB").classList.add("winner");
  if (!winner) {
    $("stageWrapA").classList.add("winner");
    $("stageWrapB").classList.add("winner");
  }
}
player.onFinish = declareWinner;
playerB.onFinish = declareWinner;

function build() {
  const size = parseInt($("sizeRange").value, 10);
  const arr = randomArray(size);   // one shared array: a fair race
  const algo = $("algoSelect").value;
  const { frames, complexity, pseudocode } = SORTING[algo](arr);
  pseudoLines = pseudocode.split("\n");
  player.speed = parseInt($("speedRange").value, 10);
  player.load(frames, complexity);
  $("pseudocode").textContent = pseudocode;
  $("stageLabelA").textContent = ALGO_NAMES[algo];

  raceDeclared = false;
  $("raceResult").hidden = true;
  $("raceResult").textContent = "";
  $("stageWrapA").classList.remove("winner");
  $("stageWrapB").classList.remove("winner");

  if (raceMode) {
    const algoB = $("algoSelectB").value;
    const resB = SORTING[algoB](arr);
    pseudoLinesB = resB.pseudocode.split("\n");
    playerB.speed = player.speed;
    playerB.load(resB.frames, resB.complexity);
    $("pseudocodeB").textContent = resB.pseudocode;
    $("stageLabelB").textContent = ALGO_NAMES[algoB];
  } else {
    playerB.stop();
  }
}

$("algoSelect").addEventListener("change", build);
$("algoSelectB").addEventListener("change", build);
$("sizeRange").addEventListener("input", build);
$("shuffleBtn").addEventListener("click", build);
$("speedRange").addEventListener("input", (e) => {
  player.speed = parseInt(e.target.value, 10);
  playerB.speed = player.speed;
});
$("raceToggle").addEventListener("change", (e) => {
  raceMode = e.target.checked;
  $("algoBLabel").hidden = !raceMode;
  $("stageWrapB").hidden = !raceMode;
  $("statsB").hidden = !raceMode;
  $("pseudocodeB").hidden = !raceMode;
  document.body.classList.toggle("racing", raceMode);
  build();
});
$("playBtn").addEventListener("click", (e) => {
  if (raceMode) {
    if (player.playing || playerB.playing) { player.stop(); playerB.stop(); }
    else { player.play(); playerB.play(); }
    e.target.textContent = (player.playing || playerB.playing) ? "⏸ Pause" : "▶ Play";
  } else {
    player.toggle();
    e.target.textContent = player.playing ? "⏸ Pause" : "▶ Play";
  }
});
$("stepBtn").addEventListener("click", () => {
  player.stop();
  player.step();
  if (raceMode) { playerB.stop(); playerB.step(); }
});

build();
