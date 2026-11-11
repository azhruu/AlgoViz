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

/* Binary search needs a sorted array, so the input is sorted first
   (the player shows the sorted array). Each step highlights the mid
   pointer (purple) and dims everything outside the live [lo, hi]
   window, so you can watch the search space halve. */
function binarySearch(input, target) {
  const a = input.slice().sort((x, y) => x - y), frames = [];
  let comparisons = 0, foundIndex = -1;
  let lo = 0, hi = a.length - 1;
  frames.push(searchFrame(a, { range: [lo, hi], line: 0 }));
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    comparisons++;
    frames.push(searchFrame(a, { range: [lo, hi], pivot: [mid], line: 2, comparisons }));
    frames.push(searchFrame(a, { range: [lo, hi], compare: [mid], pivot: [mid], line: 3, comparisons }));
    if (a[mid] === target) {
      foundIndex = mid;
      frames.push(searchFrame(a, { range: [lo, hi], found: [mid], done: [mid], line: 4, comparisons }));
      break;
    }
    if (a[mid] < target) {
      lo = mid + 1;
      frames.push(searchFrame(a, { range: [lo, hi], line: 6, comparisons }));
    } else {
      hi = mid - 1;
      frames.push(searchFrame(a, { range: [lo, hi], line: 8, comparisons }));
    }
  }
  if (foundIndex === -1)
    frames.push(searchFrame(a, { range: [lo, hi], line: 9, comparisons }));
  return { frames, complexity: "O(log n)", foundIndex, cases: {
    best: "O(1) — the target is the middle element on the first check",
    average: "O(log n) — each step halves the search window",
    worst: "O(log n) — about log₂(n) + 1 comparisons, even when the target is absent",
    note: "Only works on a sorted array — AlgoViz sorts the array first. Each step discards half the remaining window, so 1,000,000 elements take at most 20 checks.",
  }, pseudocode:
`lo = 0, hi = n - 1           ← search window
while lo <= hi
  mid = (lo + hi) / 2       ← mid pointer
  if a[mid] == target
    return mid              ← found!
  else if a[mid] < target
    lo = mid + 1            ← search right half
  else
    hi = mid - 1            ← search left half
return -1                   ← not in the array` };
}

const SEARCHING = { linear: linearSearch, binary: binarySearch };
