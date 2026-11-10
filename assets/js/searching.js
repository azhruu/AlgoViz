/* Searching algorithms — each returns { frames, complexity, pseudocode, cases, foundIndex }.
   Frames follow the same snapshot shape as the sorting generators, plus a
   `found` field: the index holding the target, highlighted once it is hit. */
"use strict";

function searchFrame(arr, extra) {
  return Object.assign(
    { arr: arr.slice(), compare: null, swap: null, pivot: null, found: null, done: [], line: 0, comparisons: 0, swaps: 0 },
    extra || {}
  );
}

function linearSearch(input, target) {
  const a = input.slice(), frames = [];
  let comparisons = 0, foundIndex = -1;
  frames.push(searchFrame(a, {}));
  for (let i = 0; i < a.length; i++) {
    comparisons++;
    frames.push(searchFrame(a, { compare: [i], line: 1, comparisons }));
    if (a[i] === target) {
      foundIndex = i;
      frames.push(searchFrame(a, { found: [i], done: [i], line: 2, comparisons }));
      break;
    }
  }
  if (foundIndex === -1)
    frames.push(searchFrame(a, { line: 3, comparisons }));
  return { frames, complexity: "O(n)", foundIndex, cases: {
    best: "O(1) — the target is the first element",
    average: "O(n) — about half the array is scanned",
    worst: "O(n) — the target is last, or not in the array at all",
    note: "The only search that works on unsorted data — it checks every element in order until it finds a match.",
  }, pseudocode:
`for i = 0 … n-1
  if a[i] == target   ← compare
    return i          ← found!
return -1             ← not in the array` };
}

const SEARCHING = { linear: linearSearch };
