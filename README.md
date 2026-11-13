# AlgoViz

**Data Structures & Algorithms, visualized.** Sorting, searching, trees, graphs and pathfinding — animated step by step, with live comparison counts, complexity notes and clean pseudocode.

![Status](https://img.shields.io/badge/status-actively%20building-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Why this project

Algorithms click when you can *see* them. AlgoViz turns the classic DSA syllabus into interactive animations: press play and watch bubble sort bubble, binary search halve, and (soon) Dijkstra flood a grid. Every visualizer shows real comparison/swap counts next to the Big-O, so the theory and the behaviour stay connected.

## Features

- 🎬 **Frame-accurate playback** — play, pause and single-step through every comparison and swap
- 🎚️ **Controls** — array size and animation speed sliders, instant reshuffle
- ⌨️ **Custom array input** — type your own numbers (comma or space separated) and visualize any array you like, with validation and clear error messages
- 📊 **Live stats** — step counter (Step X / Y), comparisons, swaps/writes and complexity for each run
- 📈 **Best / average / worst case notes** — the selected algorithm's complexity in each case, plus a one-line note on when it shines
- 📝 **Synced pseudocode** — the currently executing line is highlighted as the animation runs
- 🏁 **Race mode** — run two sorting algorithms side by side on the same array and see which finishes first
- 🔍 **Linear search visualizer** — watch the scan check each element in turn, with a target picker (type your own, or one is auto-picked from the array) and a clear found / not-found result
- 🎯 **Binary search visualizer** — the array is sorted first, then a purple mid-pointer halves the live search window each step while ruled-out bars dim, with best / average / worst case notes
- 🥞 **Stack visualizer** — push, pop and peek on a live vertical stack with slide-in / slide-out animations, a top marker, an operation log and a scripted demo that pushes 10, 20, 30, peeks, then pops back to empty
- 🚶 **Queue visualizer** — enqueue, dequeue and peek on a live horizontal queue with front / rear markers, slide-in / slide-out animations, an operation log and a scripted demo that enqueues 10, 20, 30, peeks, then dequeues back to empty
- 🌑 **Clean dark UI** — zero dependencies, zero build step; just open it in a browser

## Live now

| Area | Algorithms |
|---|---|
| Sorting | Bubble · Selection · Insertion · Merge · Quick · Heap |
| Searching | Linear · Binary |
| Data structures | Stack (push / pop / peek) · Queue (enqueue / dequeue / peek) |

## Roadmap

Stack ✓ → Queue ✓ → Linked List → BST & AVL → Hashing → BFS / DFS → Dijkstra & A* → Tower of Hanoi. Full day-by-day plan: [ROADMAP.md](ROADMAP.md).

## Run it

No build step. Either open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Project structure

```
AlgoViz/
├── index.html            # page + visualizer shell
├── assets/
│   ├── css/main.css      # theme and layout
│   └── js/
│       ├── visualizer.js # playback engine (frames, play/pause/step)
│       ├── sorting.js    # sorting algorithm frame-generators
│       ├── searching.js  # searching algorithm frame-generators
│       ├── structures.js # interactive structures (stack, queue)
│       └── app.js        # UI wiring
├── ROADMAP.md            # day-by-day build plan
└── LICENSE               # MIT
```

## Built in public

This repository is built in small, focused steps — one complete, tested feature at a time. The commit history *is* the progress log.

## License

MIT — see [LICENSE](LICENSE).
