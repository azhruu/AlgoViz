/* Sorting algorithms — each returns { frames, complexity, pseudocode }.
   Frames are snapshots so playback is deterministic and step-able. */
"use strict";

function baseFrame(arr, extra) {
  return Object.assign(
    { arr: arr.slice(), compare: null, swap: null, done: [], line: 0, comparisons: 0, swaps: 0 },
    extra || {}
  );
}

function bubbleSort(input) {
  const a = input.slice(), frames = [];
  let comparisons = 0, swaps = 0;
  const done = [];
  frames.push(baseFrame(a, {}));
  for (let end = a.length - 1; end > 0; end--) {
    for (let i = 0; i < end; i++) {
      comparisons++;
      frames.push(baseFrame(a, { compare: [i, i + 1], done: done.slice(), line: 2, comparisons, swaps }));
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swaps++;
        frames.push(baseFrame(a, { swap: [i, i + 1], done: done.slice(), line: 3, comparisons, swaps }));
      }
    }
    done.push(end);
  }
  done.push(0);
  frames.push(baseFrame(a, { done: done.slice(), line: 5, comparisons, swaps }));
  return { frames, complexity: "O(n²)", pseudocode:
`for end = n-1 … 1
  for i = 0 … end-1
    if a[i] > a[i+1]        ← compare
      swap a[i], a[i+1]     ← swap
  last element is locked in place` };
}

function selectionSort(input) {
  const a = input.slice(), frames = [];
  let comparisons = 0, swaps = 0;
  const done = [];
  frames.push(baseFrame(a, {}));
  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) {
      comparisons++;
      frames.push(baseFrame(a, { compare: [min, j], done: done.slice(), line: 3, comparisons, swaps }));
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      swaps++;
      frames.push(baseFrame(a, { swap: [i, min], done: done.slice(), line: 5, comparisons, swaps }));
    }
    done.push(i);
  }
  done.push(a.length - 1);
  frames.push(baseFrame(a, { done: done.slice(), line: 6, comparisons, swaps }));
  return { frames, complexity: "O(n²)", pseudocode:
`for i = 0 … n-2
  min = i
  for j = i+1 … n-1
    if a[j] < a[min]  →  min = j   ← scan for minimum
  swap a[i], a[min]                ← one swap per pass` };
}

function insertionSort(input) {
  const a = input.slice(), frames = [];
  let comparisons = 0, swaps = 0;
  const done = [];
  frames.push(baseFrame(a, {}));
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0) {
      comparisons++;
      frames.push(baseFrame(a, { compare: [j, j + 1], done: done.slice(), line: 3, comparisons, swaps }));
      if (a[j] <= key) break;
      a[j + 1] = a[j];
      swaps++;
      frames.push(baseFrame(a, { swap: [j, j + 1], done: done.slice(), line: 4, comparisons, swaps }));
      j--;
    }
    a[j + 1] = key;
    frames.push(baseFrame(a, { done: done.slice(), line: 5, comparisons, swaps }));
  }
  frames.push(baseFrame(a, { done: a.map((_, i) => i), line: 6, comparisons, swaps }));
  return { frames, complexity: "O(n²)", pseudocode:
`for i = 1 … n-1
  key = a[i]
  j = i - 1
  while j ≥ 0 and a[j] > key     ← shift bigger elements right
    a[j+1] = a[j];  j--
  a[j+1] = key                   ← insert key into the gap` };
}

const SORTING = { bubble: bubbleSort, selection: selectionSort, insertion: insertionSort };
