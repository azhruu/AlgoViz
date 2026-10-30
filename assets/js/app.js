/* AlgoViz — UI wiring. */
"use strict";

const $ = (id) => document.getElementById(id);
const player = new Player($("stage"), {
  comparisons: $("statComparisons"),
  swaps: $("statSwaps"),
  complexity: $("statComplexity"),
  status: $("statStatus"),
});

let pseudoLines = [];
player.onLine = (line) => {
  $("pseudocode").innerHTML = pseudoLines
    .map((l, i) => (i === line ? `<span class="hl">▸ ${l}</span>` : `  ${l}`))
    .join("\n");
};

function build() {
  const algo = $("algoSelect").value;
  const size = parseInt($("sizeRange").value, 10);
  const gen = SORTING[algo];
  const { frames, complexity, pseudocode } = gen(randomArray(size));
  pseudoLines = pseudocode.split("\n");
  player.speed = parseInt($("speedRange").value, 10);
  player.load(frames, complexity);
  $("pseudocode").textContent = pseudocode;
}

$("algoSelect").addEventListener("change", build);
$("sizeRange").addEventListener("input", build);
$("shuffleBtn").addEventListener("click", build);
$("speedRange").addEventListener("input", (e) => { player.speed = parseInt(e.target.value, 10); });
$("playBtn").addEventListener("click", (e) => {
  player.toggle();
  e.target.textContent = player.playing ? "⏸ Pause" : "▶ Play";
});
$("stepBtn").addEventListener("click", () => { player.stop(); player.step(); });

build();
