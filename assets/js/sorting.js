/* Sorting algorithms — each returns { frames, complexity, pseudocode }.
   Frames are snapshots so playback is deterministic and step-able. */
"use strict";

function baseFrame(arr, extra) {
  return Object.assign(
    { arr: arr.slice(), compare: null, swap: null, pivot: null, done: [], line: 0, comparisons: 0, swaps: 0 },
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

function mergeSort(input) {
  const a = input.slice(), frames = [];
  let comparisons = 0, swaps = 0; // swaps counts merged writes back into the array
  frames.push(baseFrame(a, {}));
  function merge(lo, mid, hi) {
    const left = a.slice(lo, mid + 1), right = a.slice(mid + 1, hi + 1);
    let i = 0, j = 0, k = lo;
    while (i < left.length && j < right.length) {
      comparisons++;
      frames.push(baseFrame(a, { compare: [lo + i, mid + 1 + j], line: 4, comparisons, swaps }));
      if (left[i] <= right[j]) { a[k] = left[i]; i++; }
      else { a[k] = right[j]; j++; }
      swaps++;
      frames.push(baseFrame(a, { swap: [k], line: 4, comparisons, swaps }));
      k++;
    }
    while (i < left.length) {
      a[k] = left[i]; i++;
      swaps++;
      frames.push(baseFrame(a, { swap: [k], line: 4, comparisons, swaps }));
      k++;
    }
    while (j < right.length) {
      a[k] = right[j]; j++;
      swaps++;
      frames.push(baseFrame(a, { swap: [k], line: 4, comparisons, swaps }));
      k++;
    }
  }
  function sort(lo, hi) {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    sort(lo, mid);
    sort(mid + 1, hi);
    merge(lo, mid, hi);
  }
  sort(0, a.length - 1);
  frames.push(baseFrame(a, { done: a.map((_, i) => i), line: 5, comparisons, swaps }));
  return { frames, complexity: "O(n log n)", pseudocode:
`mergeSort(a, lo, hi)
  if lo >= hi: return
  mid = (lo + hi) / 2
  mergeSort(a, lo, mid); mergeSort(a, mid+1, hi)
  merge the two sorted halves     ← compare heads, write smaller
array fully sorted` };
}

function quickSort(input) {
  const a = input.slice(), frames = [];
  let comparisons = 0, swaps = 0;
  const done = [];
  frames.push(baseFrame(a, {}));
  function partition(lo, hi) {
    const pivot = a[hi];
    frames.push(baseFrame(a, { pivot: [hi], done: done.slice(), line: 5, comparisons, swaps }));
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      comparisons++;
      frames.push(baseFrame(a, { compare: [j], pivot: [hi], done: done.slice(), line: 7, comparisons, swaps }));
      if (a[j] < pivot) {
        i++;
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          swaps++;
          frames.push(baseFrame(a, { swap: [i, j], pivot: [hi], done: done.slice(), line: 8, comparisons, swaps }));
        }
      }
    }
    if (i + 1 !== hi) {
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      swaps++;
    }
    frames.push(baseFrame(a, { swap: [i + 1, hi], pivot: [i + 1], done: done.slice(), line: 9, comparisons, swaps }));
    return i + 1;
  }
  function sort(lo, hi) {
    if (lo >= hi) return;
    const p = partition(lo, hi);
    done.push(p);
    frames.push(baseFrame(a, { done: done.slice(), line: 2, comparisons, swaps }));
    sort(lo, p - 1);
    sort(p + 1, hi);
  }
  sort(0, a.length - 1);
  frames.push(baseFrame(a, { done: a.map((_, i) => i), line: 10, comparisons, swaps }));
  return { frames, complexity: "O(n log n) avg", pseudocode:
`quickSort(a, lo, hi)
  if lo < hi
    p = partition(a, lo, hi)   ← pivot = a[hi]
    quickSort(a, lo, p-1); quickSort(a, p+1, hi)
partition(a, lo, hi)
  pivot = a[hi]; i = lo-1
  for j = lo … hi-1
    if a[j] < pivot
      i++; swap a[i], a[j]
  swap a[i+1], a[hi]; return i+1
array fully sorted` };
}

function heapSort(input) {
  const a = input.slice(), frames = [];
  let comparisons = 0, swaps = 0;
  const done = [];
  frames.push(baseFrame(a, {}));
  // Sift the element at i down until the heap property holds in a[0..end).
  // line 1 = build-heap phase, line 4 = extraction phase.
  function siftDown(i, end, line) {
    while (true) {
      const left = 2 * i + 1, right = left + 1;
      let largest = i;
      if (left < end) {
        comparisons++;
        frames.push(baseFrame(a, { compare: [largest, left], done: done.slice(), line, comparisons, swaps }));
        if (a[left] > a[largest]) largest = left;
      }
      if (right < end) {
        comparisons++;
        frames.push(baseFrame(a, { compare: [largest, right], done: done.slice(), line, comparisons, swaps }));
        if (a[right] > a[largest]) largest = right;
      }
      if (largest === i) break;
      [a[i], a[largest]] = [a[largest], a[i]];
      swaps++;
      frames.push(baseFrame(a, { swap: [i, largest], done: done.slice(), line, comparisons, swaps }));
      i = largest;
    }
  }
  // Build a max-heap: heapify every parent, bottom-up.
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) siftDown(i, a.length, 1);
  // Repeatedly move the root (the max) to the end and restore the heap.
  for (let end = a.length - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    swaps++;
    frames.push(baseFrame(a, { swap: [0, end], done: done.slice(), line: 3, comparisons, swaps }));
    done.push(end);
    siftDown(0, end, 4);
  }
  if (a.length) done.push(0);
  frames.push(baseFrame(a, { done: done.slice(), line: 5, comparisons, swaps }));
  return { frames, complexity: "O(n log n)", pseudocode:
`buildMaxHeap(a)                  ← heapify every parent, bottom-up
  siftDown(a, i, n)              ← largest child bubbles up
for end = n-1 … 1
  swap a[0], a[end]              ← root is the max, lock it in place
  siftDown(a, 0, end)            ← restore the heap
array fully sorted` };
}

const SORTING = { bubble: bubbleSort, selection: selectionSort, insertion: insertionSort, merge: mergeSort, quick: quickSort, heap: heapSort };
