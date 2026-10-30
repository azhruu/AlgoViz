# AlgoViz

**Data Structures & Algorithms, visualized.** Sorting, searching, trees, graphs and pathfinding — animated step by step, with live comparison counts, complexity notes and clean pseudocode.

![Status](https://img.shields.io/badge/status-actively%20building-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Commits](https://img.shields.io/badge/commits-2%C3%97%20daily-orange)

## Why this project

Algorithms click when you can *see* them. AlgoViz turns the classic DSA syllabus into interactive animations: press play and watch bubble sort bubble, binary search halve, and (soon) Dijkstra flood a grid. Every visualizer shows real comparison/swap counts next to the Big-O, so the theory and the behaviour stay connected.

## Features

- 🎬 **Frame-accurate playback** — play, pause and single-step through every comparison and swap
- 🎚️ **Controls** — array size and animation speed sliders, instant reshuffle
- 📊 **Live stats** — comparisons, swaps/writes and complexity for each run
- 📝 **Synced pseudocode** — the currently executing line is highlighted as the animation runs
- 🌑 **Clean dark UI** — zero dependencies, zero build step; just open it in a browser

## Live now

| Area | Algorithms |
|---|---|
| Sorting | Bubble · Selection · Insertion |

## Roadmap

Merge / Quick / Heap sort → Linear & Binary search → Stack & Queue → Linked List → BST & AVL → Hashing → BFS / DFS → Dijkstra & A* → Tower of Hanoi. Full day-by-day plan: [ROADMAP.md](ROADMAP.md).

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
│       └── app.js        # UI wiring
├── ROADMAP.md            # day-by-day build plan
└── LICENSE               # MIT
```

## Built in public

This repository grows on a fixed schedule — **two commits a day** (00:00 & 12:00 PKT), one focused feature at a time. The commit history *is* the progress log.

## License

MIT — see [LICENSE](LICENSE).
