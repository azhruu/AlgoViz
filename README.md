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
- 🔗 **Linked list visualizer** — nodes joined by pointer arrows ending at NULL, with head / tail markers; insert at head, tail or any index, delete by value, search and reverse, an operation log and a scripted demo that builds 10 → 20 → 30, finds 20, adds 5 at the head, deletes 20 and reverses back to empty
- 🔀 **Doubly linked list visualizer** — every node carries a prev (←) and a next (→) pointer, drawn as `NULL ← node ↔ node ↔ node → NULL`; walk the list forward from the head or backward from the tail one node at a time, with the current node lit up, visited nodes marked and each node's neighbours named, plus insert at head / tail / index, delete by value, search, reverse, an operation log and a scripted demo
- 🌳 **Binary search tree visualizer** — nodes drawn as circles on a canvas, laid out by inorder position and depth and joined by edges; insert and search walk down from the root one comparison at a time, lighting up each node they visit, with the root labelled, size / height / root stats, an operation log and a scripted demo that builds a balanced 50 / 30 / 70 / 20 / 40 / 60 / 80 tree, finds 40 and misses 99, then walks it inorder
- 🚶 **BST traversals** — walk the tree inorder, preorder or postorder one node at a time, with each visited node lit up in order and the visit order building live in the output line (inorder comes out sorted, preorder starts at the root, postorder ends at the root); the scripted demo finishes with an inorder walk
- 🌳 **AVL tree visualizer** — a self-balancing BST on the same node canvas, with every node's balance factor shown as a badge; insert walks down comparing, then walks back up checking balance factors, and the first ancestor that breaks is fixed on the spot with a step-by-step rotation — LL (right rotation), RR (left rotation), LR (left then right) or RL (right then left) — with the rotating nodes lit up, the case named in the rotation output and a running rotation count; the scripted demo shows all four cases in turn, clearing between them
- 🔑 **Hash table visualizer** — keys hash into 8 buckets with h(key) = key mod 8, shown live in the formula line; keys that collide chain up in the same bucket with arrows, the colliding bucket lights up gold, and the panel tracks size, load factor and a running collision count; insert, search and delete, plus a scripted demo that builds a 3-long collision chain in bucket 2, finds 18 mid-chain, collides 5 and 13 in bucket 5, then deletes 18
- 🌑 **Clean dark UI** — zero dependencies, zero build step; just open it in a browser

## Live now

| Area | Algorithms |
|---|---|
| Sorting | Bubble · Selection · Insertion · Merge · Quick · Heap |
| Searching | Linear · Binary |
| Data structures | Stack (push / pop / peek) · Queue (enqueue / dequeue / peek) · Linked List (insert head / tail / index, delete, search, reverse) · Doubly Linked List (traverse forward / backward, insert head / tail / index, delete, search, reverse) · Binary Search Tree (insert / search on a node canvas, inorder / preorder / postorder traversals) · AVL Tree (self-balancing insert, balance-factor badges, LL / RR / LR / RL rotation animations) · Hash Table (insert / search / delete, h(key) = key mod 8, chaining collisions, load factor + collision count) |

## Roadmap

Stack ✓ → Queue ✓ → Linked List ✓ → Doubly Linked List ✓ → BST ✓ → AVL ✓ → Hashing ✓ → BFS / DFS → Dijkstra & A* → Tower of Hanoi. Full day-by-day plan: [ROADMAP.md](ROADMAP.md).

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
│       ├── structures.js # interactive structures (stack, queue, linked list, doubly linked list, BST, AVL, hash table)
│       └── app.js        # UI wiring
├── ROADMAP.md            # day-by-day build plan
└── LICENSE               # MIT
```

## Built in public

This repository is built in small, focused steps — one complete, tested feature at a time. The commit history *is* the progress log.

## License

MIT — see [LICENSE](LICENSE).
