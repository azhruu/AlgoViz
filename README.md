# AlgoViz

**Data Structures & Algorithms, visualized.** Sorting, searching, trees, graphs and pathfinding — animated step by step, with live comparison counts, complexity notes and clean pseudocode.

![Status](https://img.shields.io/badge/status-actively%20building-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Why this project

Algorithms click when you can *see* them. AlgoViz turns the classic DSA syllabus into interactive animations: press play and watch bubble sort bubble, binary search halve, and Dijkstra flood a grid. Every visualizer shows real comparison/swap counts next to the Big-O, so the theory and the behaviour stay connected.

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
- ⛰️ **Heap visualizer** — min-heap and max-heap on the same panel, shown twice at once: a tree view of circles joined by edges and an array view of indexed cells, so parent (i − 1) / 2 and children 2i + 1 / 2i + 2 read off both; insert bubbles up and extract sifts down one swap at a time with the moving node lit up, peek flashes the root, switching min/max re-heapifies the same values in place, plus a scripted demo that builds a max-heap from 50 / 30 / 70 / 20 / 40 / 60 / 80, peeks at 80 and extracts twice
- 🕸️ **Graph BFS visualizer** — an 8-node graph (A–H, 11 edges) on a node canvas; BFS walks it level by level from any start node you pick (click a node or use the dropdown), with the node being processed glowing gold, queued nodes outlined purple, visited nodes outlined teal, every edge BFS crosses lit up teal, and the queue and visit order shown live in the side panel; run it animated, step by step, or with a scripted demo from A (visit order A → B → C → D → E → F → H → G)
- 🕸️ **Graph DFS visualizer** — the same 8-node graph with a traversal switch: DFS dives deep down one branch on a stack instead of walking level by level, neighbours pushed in reverse order so the smallest is visited first, with the stack (top first) and visit order shown live in the side panel; run it animated, step by step, or with a scripted demo from A (visit order A → B → D → H → F → G → E → C)
- 🗺️ **Dijkstra shortest-path visualizer** — a 12×7 weighted grid where every cell shows the cost of stepping onto it (1–5) and two wall blocks force a detour; Dijkstra settles the cheapest cell in the frontier first, with settled cells showing their final distance, the frontier (cheapest first) and settle order shown live in the side panel, and the cheapest route from S to T traced in teal — on the default grid the cheapest route costs 48 over 18 cells, settling 76 cells to prove it; drag across cells to paint walls (drag over a wall to erase it), or generate a fresh random grid (always reachable), and run it animated, step by step, or with a scripted demo
- 🧭 **A\* pathfinding visualizer** — the same 12×7 weighted grid, searched with a sense of direction: A\* orders the frontier by f = g + h, where g is the cost so far and h is the Manhattan distance left to the target, so the frontier line shows each cell's f = g + h live; the heuristic never overestimates (every step costs at least 1), so it finds the same cheapest route as Dijkstra — cost 48 over 18 cells on the default grid — after settling 75 cells instead of 76, and usually fewer on a fresh random grid; drag across cells to paint walls and watch the guided search route around them, and run it animated, step by step, or with a scripted demo
- 🗼 **Tower of Hanoi visualizer** — three pegs and 3–6 discs, solved by the recursion itself: the optimal 2ⁿ − 1-move solution plays animated, one move at a time on Step, or as a 3-disc demo, with the disc that just moved glowing gold, a running move count against the optimal total, and the move sequence building live in the side panel
- 🌲 **Fibonacci recursion tree visualizer** — pick n from 2 to 8 and watch the call tree grow one frame at a time: the active call glows gold, returned calls turn teal with their value, and the live call stack (top first) shows how deep the recursion goes; fib(6) takes 25 calls for a one-digit answer, and the log makes the repeated subproblems — fib(2) solved five times — impossible to miss
- 🌑 **Clean dark UI** — zero dependencies, zero build step; just open it in a browser

## Live now

| Area | Algorithms |
|---|---|
| Sorting | Bubble · Selection · Insertion · Merge · Quick · Heap |
| Searching | Linear · Binary |
| Data structures | Stack (push / pop / peek) · Queue (enqueue / dequeue / peek) · Linked List (insert head / tail / index, delete, search, reverse) · Doubly Linked List (traverse forward / backward, insert head / tail / index, delete, search, reverse) · Binary Search Tree (insert / search on a node canvas, inorder / preorder / postorder traversals) · AVL Tree (self-balancing insert, balance-factor badges, LL / RR / LR / RL rotation animations) · Hash Table (insert / search / delete, h(key) = key mod 8, chaining collisions, load factor + collision count) · Heap (min/max insert & extract, tree + array views, mode switch re-heapifies) |
| Graphs | BFS (level-by-level walk on an 8-node graph, live queue + visit order, any start node) · DFS (deep-first walk on the same graph, live stack + visit order, any start node) · Dijkstra (cheapest path on a 12×7 weighted grid, live frontier + settle order, drag-to-paint walls, new-grid button) · A* (guided search on the same grid, frontier ordered by f = g + h, drag-to-paint walls, new-grid button) |
| Recursion | Tower of Hanoi (optimal 2ⁿ − 1-move solution, animated Solve, single-step, or 3-disc demo, 3–6 discs, live move count vs optimal) · Fibonacci recursion tree (n 2–8, step-through call/return events, live call stack, returned values on the tree, repeated-subproblem log) |

## Roadmap

Stack ✓ → Queue ✓ → Linked List ✓ → Doubly Linked List ✓ → BST ✓ → AVL ✓ → Hashing ✓ → Heap ✓ → BFS ✓ → DFS ✓ → Dijkstra ✓ → A* ✓ → Tower of Hanoi ✓ → Fibonacci recursion tree ✓. Full day-by-day plan: [ROADMAP.md](ROADMAP.md).

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
│       ├── structures.js # interactive structures (stack, queue, linked list, doubly linked list, BST, AVL, hash table, heap, graph BFS / DFS / Dijkstra / A*, Tower of Hanoi, Fibonacci recursion tree)
│       └── app.js        # UI wiring
├── ROADMAP.md            # day-by-day build plan
└── LICENSE               # MIT
```

## Built in public

This repository is built in small, focused steps — one complete, tested feature at a time. The commit history *is* the progress log.

## License

MIT — see [LICENSE](LICENSE).
