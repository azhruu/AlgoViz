/* AlgoViz — core playback engine.
   Algorithms precompute a list of frames; the player renders and steps through them.
   Frame: { arr, compare:[i,j]|null, swap:[i,j]|null, pivot:[i]|null,
            found:[i]|null, range:[lo,hi]|null, done:[indices], line,
            comparisons, swaps }                                            */
"use strict";

class Player {
  constructor(stageEl, stats) {
    this.stage = stageEl;
    this.stats = stats;              // {steps, comparisons, swaps, complexity, status} elements
    this.frames = [];
    this.pos = -1;
    this.playing = false;
    this.speed = 55;                 // 1..100
    this.timer = null;
    this.onLine = () => {};
    this.onFinish = () => {};         // called once when the last frame renders
    this.endStatus = null;            // overrides "Sorted ✓" (e.g. search results)
  }

  load(frames, complexity) {
    this.stop();
    this.frames = frames;
    this.pos = -1;
    this.stats.complexity.textContent = complexity;
    this.render(frames[0] || { arr: [], comparisons: 0, swaps: 0 });
    this.stats.status.textContent = "Ready";
  }

  delay() { return Math.max(4, 260 - this.speed * 2.55); }

  render(frame) {
    if (!frame) return;
    const max = Math.max(...frame.arr, 1);
    this.stage.innerHTML = "";
    const done = new Set(frame.done || []);
    frame.arr.forEach((v, i) => {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = (v / max * 100) + "%";
      if (frame.compare && frame.compare.includes(i)) bar.classList.add("compare");
      if (frame.swap && frame.swap.includes(i)) bar.classList.add("swap");
      if (frame.pivot && frame.pivot.includes(i)) bar.classList.add("pivot");
      if (frame.found && frame.found.includes(i)) bar.classList.add("found");
      // Search window: bars outside [lo, hi] are already ruled out.
      if (frame.range && (i < frame.range[0] || i > frame.range[1])) bar.classList.add("out");
      if (done.has(i)) bar.classList.add("sorted");
      this.stage.appendChild(bar);
    });
    this.stats.comparisons.textContent = frame.comparisons;
    this.stats.swaps.textContent = frame.swaps;
    // Step counter: "0 / N" before the first step, "N / N" when sorted.
    if (this.stats.steps)
      this.stats.steps.textContent = (this.pos + 1) + " / " + this.frames.length;
    this.onLine(frame.line);
  }

  step() {
    if (this.pos < this.frames.length - 1) {
      this.pos++;
      this.render(this.frames[this.pos]);
      if (this.pos === this.frames.length - 1) {
        this.stats.status.textContent = this.endStatus || "Sorted ✓";
        this.stop();
        this.onFinish();
      }
      return true;
    }
    return false;
  }

  play() {
    if (this.pos >= this.frames.length - 1) this.pos = -1;
    this.playing = true;
    this.stats.status.textContent = "Running…";
    const tick = () => {
      if (!this.playing) return;
      if (this.step()) this.timer = setTimeout(tick, this.delay());
      else this.stop();
    };
    tick();
  }

  stop() {
    this.playing = false;
    if (this.timer) clearTimeout(this.timer);
    if (this.pos >= 0 && this.pos < this.frames.length - 1)
      this.stats.status.textContent = "Paused";
  }

  toggle() { this.playing ? this.stop() : this.play(); }
}

function randomArray(n, min = 5, max = 100) {
  return Array.from({ length: n }, () => min + Math.floor(Math.random() * (max - min)));
}
