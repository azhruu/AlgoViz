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
- 🌑 **Clean dark UI** — zero dependencies, zero build step; just open it in a browser

## Live now

| Area | Algorithms |
|---|---|
| Sorting | Bubble · Selection · Insertion · Merge · Quick · Heap |
| Searching | Linear |

## Roadmap

Binary search → Stack & Queue → Linked List → BST & AVL → Hashing → BFS / DFS → Dijkstra & A* → Tower of Hanoi. Full day-by-day plan: [ROADMAP.md](ROADMAP.md).

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
│       └── app.js        # UI wiring
├── ROADMAP.md            # day-by-day build plan
└── LICENSE               # MIT
```

## Built in public

This repository is built in small, focused steps — one complete, tested feature at a time. The commit history *is* the progress log.

## License

MIT — see [LICENSE](LICENSE).
