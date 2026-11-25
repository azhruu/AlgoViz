/* Interactive data-structure visualizers — stateful and driven by the
   user, unlike the frame-based sorting/searching players. A stack is
   operated, not played back: push, pop and peek act on the live stack
   and animate the box that moves. */
"use strict";

const STACK_INFO = {
  complexity: "O(1)",
  cases: {
    best: "O(1) — push, pop and peek are all constant time",
    average: "O(1) — every operation touches only the top of the stack",
    worst: "O(1) — a push that grows the backing array is amortized O(1)",
    note: "Last in, first out — the most recently pushed value is always the first one popped. Think of a stack of plates, or the browser back button.",
  },
  pseudocode:
`push(value)        <- add to the top
  stack[top++] = value
pop()              <- remove from the top
  return stack[--top]
peek()             <- look at the top
  return stack[top - 1]
isEmpty()          <- top == 0 ?`,
};

const STACK_MAX_VALUE = 999;
const STACK_LOG_LIMIT = 8;
/* Long enough for the slide animation to read, short enough to stay snappy. */
const STACK_ANIM_MS = 260;
const STACK_DEMO_STEP_MS = 550;
const STACK_PEEK_MS = 700;

/* The scripted demo: a full push / peek / pop story that ends with the
   stack empty again, so it can be replayed straight away. */
const STACK_DEMO_SCRIPT = [
  { op: "push", value: 10 }, { op: "push", value: 20 }, { op: "push", value: 30 },
  { op: "peek" },
  { op: "pop" }, { op: "push", value: 40 }, { op: "pop" },
  { op: "pop" }, { op: "pop" },
];

/* els: { stage, valueInput, pushBtn, popBtn, peekBtn, demoBtn, clearBtn,
          size, top, ops, status, log } — plain DOM elements. The factory
   keeps no other state, so a node test can drive it with stub elements. */
function createStackViz(els) {
  let items = [];
  let ops = 0;
  let animating = false;
  let demoTimer = null;
  let demoRunning = false;

  function render(enteringValue) {
    els.stage.innerHTML = "";
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "stack-empty";
      empty.textContent = "— empty —";
      els.stage.appendChild(empty);
    }
    items.forEach((value, i) => {
      const box = document.createElement("div");
      box.className = "stack-box";
      box.textContent = String(value);
      if (i === items.length - 1) {
        box.classList.add("top");
        if (enteringValue !== undefined && value === enteringValue)
          box.classList.add("entering");
      }
      els.stage.appendChild(box);
    });
    els.size.textContent = String(items.length);
    els.top.textContent = items.length === 0 ? "—" : String(items[items.length - 1]);
    els.ops.textContent = String(ops);
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function log(message) {
    const entry = document.createElement("li");
    entry.textContent = message;
    els.log.insertBefore(entry, els.log.firstChild);
    while (els.log.children.length > STACK_LOG_LIMIT)
      els.log.removeChild(els.log.lastChild);
  }

  function setButtonsDisabled(disabled) {
    [els.pushBtn, els.popBtn, els.peekBtn, els.demoBtn, els.clearBtn]
      .forEach((b) => { b.disabled = disabled; });
  }

  function push(value) {
    if (animating) return false;
    if (!Number.isInteger(value) || value < 0 || value > STACK_MAX_VALUE) {
      setStatus(`Enter a whole number between 0 and ${STACK_MAX_VALUE}.`);
      return false;
    }
    items.push(value);
    ops++;
    render(value);
    setStatus(`Pushed ${value} — size ${items.length}, top is now ${value}.`);
    log(`push ${value} -> size ${items.length}, top ${value}`);
    return true;
  }

  function pop() {
    if (animating) return null;
    if (items.length === 0) {
      setStatus("Stack is empty — nothing to pop.");
      return null;
    }
    animating = true;
    setButtonsDisabled(true);
    const topBox = els.stage.lastChild;
    const value = items[items.length - 1];
    if (topBox && topBox.classList) topBox.classList.add("leaving");
    setTimeout(() => {
      items.pop();
      ops++;
      render();
      setStatus(`Popped ${value} — size ${items.length}`
        + (items.length === 0 ? ", stack is empty now." : `, top is now ${items[items.length - 1]}.`));
      log(`pop -> ${value} (size ${items.length})`);
      animating = false;
      setButtonsDisabled(false);
    }, STACK_ANIM_MS);
    return value;
  }

  function peek() {
    if (animating) return null;
    if (items.length === 0) {
      setStatus("Stack is empty — nothing to peek at.");
      return null;
    }
    ops++;
    const value = items[items.length - 1];
    render();
    els.ops.textContent = String(ops);
    const topBox = els.stage.lastChild;
    if (topBox && topBox.classList) {
      topBox.classList.add("peek");
      setTimeout(() => topBox.classList.remove("peek"), STACK_PEEK_MS);
    }
    setStatus(`Top is ${value} — peek only looks, the stack is unchanged.`);
    log(`peek -> ${value} (size ${items.length})`);
    return value;
  }

  function clear() {
    if (animating) return;
    stopDemo();
    items = [];
    render();
    setStatus("Stack cleared.");
    log("clear -> stack is empty");
  }

  function stopDemo() {
    if (demoTimer !== null) {
      clearTimeout(demoTimer);
      demoTimer = null;
    }
    demoRunning = false;
    els.demoBtn.disabled = false;
  }

  /* Runs the scripted story one step at a time. Pushes and pops animate
     through the normal paths; a peek in the middle shows the top value. */
  function demo() {
    if (demoRunning || animating) return false;
    clear();
    demoRunning = true;
    els.demoBtn.disabled = true;
    setStatus("Demo running — push 10, 20, 30, peek, then pop back down…");
    let step = 0;
    const runStep = () => {
      if (step >= STACK_DEMO_SCRIPT.length) {
        stopDemo();
        setStatus("Demo finished — the stack is empty again. Push your own values, or run it again.");
        return;
      }
      const action = STACK_DEMO_SCRIPT[step];
      step++;
      if (action.op === "push") push(action.value);
      else if (action.op === "pop") pop();
      else if (action.op === "peek") peek();
      /* A pop needs its slide-out to finish before the next step. */
      const wait = action.op === "pop" ? STACK_ANIM_MS + STACK_DEMO_STEP_MS : STACK_DEMO_STEP_MS;
      demoTimer = setTimeout(runStep, wait);
    };
    demoTimer = setTimeout(runStep, STACK_DEMO_STEP_MS);
    return true;
  }

  function reset() {
    stopDemo();
    items = [];
    ops = 0;
    animating = false;
    setButtonsDisabled(false);
    render();
    els.log.innerHTML = "";
    setStatus("Stack is empty — push a value to start.");
  }

  function readValueInput() {
    const n = parseInt(els.valueInput.value, 10);
    return Number.isInteger(n) ? n : NaN;
  }

  els.pushBtn.addEventListener("click", () => push(readValueInput()));
  els.popBtn.addEventListener("click", () => pop());
  els.peekBtn.addEventListener("click", () => peek());
  els.demoBtn.addEventListener("click", () => demo());
  els.clearBtn.addEventListener("click", () => clear());
  els.valueInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") push(readValueInput());
  });

  render();
  setStatus("Stack is empty — push a value to start.");
  return {
    push, pop, peek, clear, demo, reset, stopDemo,
    get size() { return items.length; },
    get top() { return items.length === 0 ? null : items[items.length - 1]; },
    get operations() { return ops; },
    get items() { return items.slice(); },
    get demoRunning() { return demoRunning; },
  };
}

/* Wires the stack panel in index.html; called once from app.js. */
function initStackViz() {
  const $ = (id) => document.getElementById(id);
  return createStackViz({
    stage: $("stackStage"),
    valueInput: $("stackValueInput"),
    pushBtn: $("pushBtn"),
    popBtn: $("popBtn"),
    peekBtn: $("peekBtn"),
    demoBtn: $("demoStackBtn"),
    clearBtn: $("clearStackBtn"),
    size: $("stackSize"),
    top: $("stackTop"),
    ops: $("stackOps"),
    status: $("stackStatus"),
    log: $("stackLog"),
  });
}

/* ------------------------------------------------------------------ */
/* Queue visualizer — the stack's mirror image, in a horizontal row.  */
/* Enqueue joins the rear (right), dequeue leaves from the front      */
/* (left): first in, first out. The front and rear boxes are marked,  */
/* so the FIFO order reads at a glance.                               */
/* ------------------------------------------------------------------ */

const QUEUE_INFO = {
  complexity: "O(1)",
  cases: {
    best: "O(1) — enqueue, dequeue and peek are all constant time",
    average: "O(1) — every operation touches only the front or the rear",
    worst: "O(1) — with a circular array; a plain array shift would cost O(n)",
    note: "First in, first out — the first value enqueued is always the first one dequeued. Think of a checkout line, or a printer spool.",
  },
  pseudocode:
`enqueue(value)      <- join the rear
  queue[rear++] = value
dequeue()           <- leave from the front
  return queue[front++]
peek()              <- look at the front
  return queue[front]
isEmpty()           <- front == rear ?`,
};

const QUEUE_MAX_VALUE = 999;
const QUEUE_LOG_LIMIT = 8;
/* Long enough for the slide animation to read, short enough to stay snappy. */
const QUEUE_ANIM_MS = 260;
const QUEUE_DEMO_STEP_MS = 550;
const QUEUE_PEEK_MS = 700;

/* The scripted demo: a full enqueue / peek / dequeue story that ends with
   the queue empty again, so it can be replayed straight away. */
const QUEUE_DEMO_SCRIPT = [
  { op: "enqueue", value: 10 }, { op: "enqueue", value: 20 }, { op: "enqueue", value: 30 },
  { op: "peek" },
  { op: "dequeue" }, { op: "enqueue", value: 40 }, { op: "dequeue" },
  { op: "dequeue" }, { op: "dequeue" },
];

/* els: { stage, valueInput, enqueueBtn, dequeueBtn, peekBtn, demoBtn,
          clearBtn, size, front, rear, ops, status, log } — plain DOM
   elements. The factory keeps no other state, so a node test can drive
   it with stub elements. */
function createQueueViz(els) {
  let items = [];
  let ops = 0;
  let animating = false;
  let demoTimer = null;
  let demoRunning = false;

  function render(enteringValue) {
    els.stage.innerHTML = "";
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "queue-empty";
      empty.textContent = "— empty —";
      els.stage.appendChild(empty);
    }
    items.forEach((value, i) => {
      const box = document.createElement("div");
      box.className = "queue-box";
      box.textContent = String(value);
      if (i === 0) box.classList.add("front");
      if (i === items.length - 1) {
        box.classList.add("rear");
        if (enteringValue !== undefined && value === enteringValue)
          box.classList.add("entering");
      }
      els.stage.appendChild(box);
    });
    els.size.textContent = String(items.length);
    els.front.textContent = items.length === 0 ? "—" : String(items[0]);
    els.rear.textContent = items.length === 0 ? "—" : String(items[items.length - 1]);
    els.ops.textContent = String(ops);
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function log(message) {
    const entry = document.createElement("li");
    entry.textContent = message;
    els.log.insertBefore(entry, els.log.firstChild);
    while (els.log.children.length > QUEUE_LOG_LIMIT)
      els.log.removeChild(els.log.lastChild);
  }

  function setButtonsDisabled(disabled) {
    [els.enqueueBtn, els.dequeueBtn, els.peekBtn, els.demoBtn, els.clearBtn]
      .forEach((b) => { b.disabled = disabled; });
  }

  function enqueue(value) {
    if (animating) return false;
    if (!Number.isInteger(value) || value < 0 || value > QUEUE_MAX_VALUE) {
      setStatus(`Enter a whole number between 0 and ${QUEUE_MAX_VALUE}.`);
      return false;
    }
    items.push(value);
    ops++;
    render(value);
    setStatus(`Enqueued ${value} — size ${items.length}, rear is now ${value}.`);
    log(`enqueue ${value} -> size ${items.length}, rear ${value}`);
    return true;
  }

  function dequeue() {
    if (animating) return null;
    if (items.length === 0) {
      setStatus("Queue is empty — nothing to dequeue.");
      return null;
    }
    animating = true;
    setButtonsDisabled(true);
    const frontBox = els.stage.firstChild;
    const value = items[0];
    if (frontBox && frontBox.classList) frontBox.classList.add("leaving");
    setTimeout(() => {
      items.shift();
      ops++;
      render();
      setStatus(`Dequeued ${value} — size ${items.length}`
        + (items.length === 0 ? ", queue is empty now." : `, front is now ${items[0]}.`));
      log(`dequeue -> ${value} (size ${items.length})`);
      animating = false;
      setButtonsDisabled(false);
    }, QUEUE_ANIM_MS);
    return value;
  }

  function peek() {
    if (animating) return null;
    if (items.length === 0) {
      setStatus("Queue is empty — nothing to peek at.");
      return null;
    }
    ops++;
    const value = items[0];
    render();
    els.ops.textContent = String(ops);
    const frontBox = els.stage.firstChild;
    if (frontBox && frontBox.classList) {
      frontBox.classList.add("peek");
      setTimeout(() => frontBox.classList.remove("peek"), QUEUE_PEEK_MS);
    }
    setStatus(`Front is ${value} — peek only looks, the queue is unchanged.`);
    log(`peek -> ${value} (size ${items.length})`);
    return value;
  }

  function clear() {
    if (animating) return;
    stopDemo();
    items = [];
    render();
    setStatus("Queue cleared.");
    log("clear -> queue is empty");
  }

  function stopDemo() {
    if (demoTimer !== null) {
      clearTimeout(demoTimer);
      demoTimer = null;
    }
    demoRunning = false;
    els.demoBtn.disabled = false;
  }

  /* Runs the scripted story one step at a time. Enqueues and dequeues
     animate through the normal paths; a peek in the middle shows the
     front value. */
  function demo() {
    if (demoRunning || animating) return false;
    clear();
    demoRunning = true;
    els.demoBtn.disabled = true;
    setStatus("Demo running — enqueue 10, 20, 30, peek, then dequeue back down…");
    let step = 0;
    const runStep = () => {
      if (step >= QUEUE_DEMO_SCRIPT.length) {
        stopDemo();
        setStatus("Demo finished — the queue is empty again. Enqueue your own values, or run it again.");
        return;
      }
      const action = QUEUE_DEMO_SCRIPT[step];
      step++;
      if (action.op === "enqueue") enqueue(action.value);
      else if (action.op === "dequeue") dequeue();
      else if (action.op === "peek") peek();
      /* A dequeue needs its slide-out to finish before the next step. */
      const wait = action.op === "dequeue" ? QUEUE_ANIM_MS + QUEUE_DEMO_STEP_MS : QUEUE_DEMO_STEP_MS;
      demoTimer = setTimeout(runStep, wait);
    };
    demoTimer = setTimeout(runStep, QUEUE_DEMO_STEP_MS);
    return true;
  }

  function reset() {
    stopDemo();
    items = [];
    ops = 0;
    animating = false;
    setButtonsDisabled(false);
    render();
    els.log.innerHTML = "";
    setStatus("Queue is empty — enqueue a value to start.");
  }

  function readValueInput() {
    const n = parseInt(els.valueInput.value, 10);
    return Number.isInteger(n) ? n : NaN;
  }

  els.enqueueBtn.addEventListener("click", () => enqueue(readValueInput()));
  els.dequeueBtn.addEventListener("click", () => dequeue());
  els.peekBtn.addEventListener("click", () => peek());
  els.demoBtn.addEventListener("click", () => demo());
  els.clearBtn.addEventListener("click", () => clear());
  els.valueInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") enqueue(readValueInput());
  });

  render();
  setStatus("Queue is empty — enqueue a value to start.");
  return {
    enqueue, dequeue, peek, clear, demo, reset, stopDemo,
    get size() { return items.length; },
    get front() { return items.length === 0 ? null : items[0]; },
    get rear() { return items.length === 0 ? null : items[items.length - 1]; },
    get operations() { return ops; },
    get items() { return items.slice(); },
    get demoRunning() { return demoRunning; },
  };
}

/* Wires the queue panel in index.html; called once from app.js. */
function initQueueViz() {
  const $ = (id) => document.getElementById(id);
  return createQueueViz({
    stage: $("queueStage"),
    valueInput: $("queueValueInput"),
    enqueueBtn: $("enqueueBtn"),
    dequeueBtn: $("dequeueBtn"),
    peekBtn: $("peekQueueBtn"),
    demoBtn: $("demoQueueBtn"),
    clearBtn: $("clearQueueBtn"),
    size: $("queueSize"),
    front: $("queueFront"),
    rear: $("queueRear"),
    ops: $("queueOps"),
    status: $("queueStatus"),
    log: $("queueLog"),
  });
}

/* ------------------------------------------------------------------ */
/* Linked list visualizer — nodes joined by pointer arrows.           */
/* Each node is a box; an arrow after it is its "next" pointer, and    */
/* the chain ends at a NULL box. Insert and delete show where the      */
/* pointers rewire: head, tail and index inserts, delete by value,     */
/* search and reverse.                                                */
/* ------------------------------------------------------------------ */

const LINKED_LIST_INFO = {
  complexity: "O(1) head · O(n) index",
  cases: {
    best: "O(1) — insert or delete at the head touches one pointer",
    average: "O(n) — insert, delete or search by index walks half the list on average",
    worst: "O(n) — an insert at the tail (no tail pointer) or a search for a missing value walks every node",
    note: "Nodes are scattered in memory and joined by pointers — inserting in the middle only rewires two pointers, never shifts the rest. The price is no random access: reaching node i means walking i links from the head.",
  },
  pseudocode:
`insertHead(value)     <- new node points at the head
  node.next = head
  head = node
insertTail(value)     <- walk to the last node
  last.next = node
  node.next = null
insertAt(i, value)    <- walk i - 1 links, rewire
  prev.next = node
  node.next = prev.next
delete(value)         <- walk, rewire around it
  prev.next = node.next
search(value)         <- walk from the head
  node = node.next until match
reverse()             <- flip every pointer
  prev, node = null, head`,
};

const LL_MAX_VALUE = 999;
const LL_LOG_LIMIT = 8;
/* Long enough for the slide animation to read, short enough to stay snappy. */
const LL_ANIM_MS = 260;
const LL_DEMO_STEP_MS = 550;
const LL_FOUND_MS = 900;

/* The scripted demo: build 10 -> 20 -> 30, find 20, add 5 at the head,
   delete 20, reverse, then clear — ending empty so it replays cleanly. */
const LL_DEMO_SCRIPT = [
  { op: "insertTail", value: 10 }, { op: "insertTail", value: 20 },
  { op: "insertTail", value: 30 },
  { op: "search", value: 20 },
  { op: "insertHead", value: 5 },
  { op: "delete", value: 20 },
  { op: "reverse" },
  { op: "clear" },
];

/* els: { stage, valueInput, indexInput, insertHeadBtn, insertTailBtn,
          insertAtBtn, deleteBtn, searchBtn, reverseBtn, demoBtn,
          clearBtn, size, head, tail, ops, status, log } — plain DOM
   elements. The factory keeps no other state, so a node test can drive
   it with stub elements. */
function createLinkedListViz(els) {
  let items = [];
  let ops = 0;
  let animating = false;
  let demoTimer = null;
  let demoRunning = false;
  /* Node boxes in list order, rebuilt by render(); used to animate the
     exact node an operation touches. */
  let nodeBoxes = [];

  function render(enteringValue, enteringIndex) {
    els.stage.innerHTML = "";
    nodeBoxes = [];
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "ll-empty";
      empty.textContent = "— empty —";
      els.stage.appendChild(empty);
    }
    items.forEach((value, i) => {
      const node = document.createElement("div");
      node.className = "ll-node";
      node.textContent = String(value);
      if (i === 0) node.classList.add("head");
      if (i === items.length - 1) node.classList.add("tail");
      if (enteringValue !== undefined && enteringIndex === i)
        node.classList.add("entering");
      els.stage.appendChild(node);
      nodeBoxes.push(node);
      if (i < items.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "ll-arrow";
        arrow.textContent = "→";
        els.stage.appendChild(arrow);
      }
    });
    if (items.length > 0) {
      const tailArrow = document.createElement("div");
      tailArrow.className = "ll-arrow";
      tailArrow.textContent = "→";
      els.stage.appendChild(tailArrow);
      const nullBox = document.createElement("div");
      nullBox.className = "ll-null";
      nullBox.textContent = "NULL";
      els.stage.appendChild(nullBox);
    }
    els.size.textContent = String(items.length);
    els.head.textContent = items.length === 0 ? "—" : String(items[0]);
    els.tail.textContent = items.length === 0 ? "—" : String(items[items.length - 1]);
    els.ops.textContent = String(ops);
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function log(message) {
    const entry = document.createElement("li");
    entry.textContent = message;
    els.log.insertBefore(entry, els.log.firstChild);
    while (els.log.children.length > LL_LOG_LIMIT)
      els.log.removeChild(els.log.lastChild);
  }

  function setButtonsDisabled(disabled) {
    [els.insertHeadBtn, els.insertTailBtn, els.insertAtBtn, els.deleteBtn,
     els.searchBtn, els.reverseBtn, els.demoBtn, els.clearBtn]
      .forEach((b) => { b.disabled = disabled; });
  }

  function validValue(value) {
    return Number.isInteger(value) && value >= 0 && value <= LL_MAX_VALUE;
  }

  function insertHead(value) {
    if (animating) return false;
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${LL_MAX_VALUE}.`);
      return false;
    }
    items.unshift(value);
    ops++;
    render(value, 0);
    setStatus(`Inserted ${value} at the head — head is now ${value}, size ${items.length}.`);
    log(`insertHead ${value} -> [${items.join(" -> ")}]`);
    return true;
  }

  function insertTail(value) {
    if (animating) return false;
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${LL_MAX_VALUE}.`);
      return false;
    }
    items.push(value);
    ops++;
    render(value, items.length - 1);
    setStatus(`Inserted ${value} at the tail — tail is now ${value}, size ${items.length}.`);
    log(`insertTail ${value} -> [${items.join(" -> ")}]`);
    return true;
  }

  function insertAt(index, value) {
    if (animating) return false;
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${LL_MAX_VALUE}.`);
      return false;
    }
    if (!Number.isInteger(index) || index < 0 || index > items.length) {
      setStatus(`Index must be between 0 and ${items.length} (size ${items.length}).`);
      return false;
    }
    items.splice(index, 0, value);
    ops++;
    render(value, index);
    setStatus(`Inserted ${value} at index ${index} — size ${items.length}.`);
    log(`insertAt(${index}, ${value}) -> [${items.join(" -> ")}]`);
    return true;
  }

  function deleteValue(value) {
    if (animating) return null;
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${LL_MAX_VALUE}.`);
      return null;
    }
    const index = items.indexOf(value);
    if (index === -1) {
      setStatus(`${value} is not in the list — nothing to delete.`);
      return null;
    }
    animating = true;
    setButtonsDisabled(true);
    const box = nodeBoxes[index];
    if (box && box.classList) box.classList.add("leaving");
    setTimeout(() => {
      items.splice(index, 1);
      ops++;
      render();
      setStatus(`Deleted ${value} at index ${index} — the neighbours are now linked directly`
        + (items.length === 0 ? ", list is empty now." : `, size ${items.length}.`));
      log(`delete ${value} -> [${items.join(" -> ")}]`);
      animating = false;
      setButtonsDisabled(false);
    }, LL_ANIM_MS);
    return value;
  }

  function search(value) {
    if (animating) return -1;
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${LL_MAX_VALUE}.`);
      return -1;
    }
    ops++;
    const index = items.indexOf(value);
    render();
    els.ops.textContent = String(ops);
    if (index === -1) {
      setStatus(`${value} is not in the list — walked all ${items.length} nodes.`);
      log(`search ${value} -> not found (${items.length} nodes walked)`);
      return -1;
    }
    const box = nodeBoxes[index];
    if (box && box.classList) {
      box.classList.add("found");
      setTimeout(() => box.classList.remove("found"), LL_FOUND_MS);
    }
    setStatus(`Found ${value} at index ${index} — walked ${index + 1} node${index === 0 ? "" : "s"} from the head.`);
    log(`search ${value} -> index ${index}`);
    return index;
  }

  function reverse() {
    if (animating) return false;
    if (items.length < 2) {
      setStatus(items.length === 0
        ? "List is empty — nothing to reverse."
        : "One node — reversing changes nothing.");
      return false;
    }
    items.reverse();
    ops++;
    render();
    setStatus(`Reversed — every pointer flipped, head is now ${items[0]}.`);
    log(`reverse -> [${items.join(" -> ")}]`);
    return true;
  }

  function clear() {
    if (animating) return;
    stopDemo();
    items = [];
    render();
    setStatus("List cleared.");
    log("clear -> list is empty");
  }

  function stopDemo() {
    if (demoTimer !== null) {
      clearTimeout(demoTimer);
      demoTimer = null;
    }
    demoRunning = false;
    els.demoBtn.disabled = false;
  }

  /* Runs the scripted story one step at a time. A delete needs its
     slide-out to finish before the next step. */
  function demo() {
    if (demoRunning || animating) return false;
    clear();
    demoRunning = true;
    els.demoBtn.disabled = true;
    setStatus("Demo running — build 10 → 20 → 30, find 20, add 5 at the head, delete 20, reverse…");
    let step = 0;
    const runStep = () => {
      if (step >= LL_DEMO_SCRIPT.length) {
        stopDemo();
        setStatus("Demo finished — the list is empty again. Insert your own values, or run it again.");
        return;
      }
      const action = LL_DEMO_SCRIPT[step];
      step++;
      if (action.op === "insertHead") insertHead(action.value);
      else if (action.op === "insertTail") insertTail(action.value);
      else if (action.op === "insertAt") insertAt(action.index, action.value);
      else if (action.op === "delete") deleteValue(action.value);
      else if (action.op === "search") search(action.value);
      else if (action.op === "reverse") reverse();
      else if (action.op === "clear") clear();
      /* A delete needs its slide-out to finish before the next step. */
      const wait = action.op === "delete" ? LL_ANIM_MS + LL_DEMO_STEP_MS : LL_DEMO_STEP_MS;
      demoTimer = setTimeout(runStep, wait);
    };
    demoTimer = setTimeout(runStep, LL_DEMO_STEP_MS);
    return true;
  }

  function reset() {
    stopDemo();
    items = [];
    ops = 0;
    animating = false;
    setButtonsDisabled(false);
    render();
    els.log.innerHTML = "";
    setStatus("List is empty — insert a value to start.");
  }

  function readValueInput() {
    const n = parseInt(els.valueInput.value, 10);
    return Number.isInteger(n) ? n : NaN;
  }

  function readIndexInput() {
    const n = parseInt(els.indexInput.value, 10);
    return Number.isInteger(n) ? n : NaN;
  }

  els.insertHeadBtn.addEventListener("click", () => insertHead(readValueInput()));
  els.insertTailBtn.addEventListener("click", () => insertTail(readValueInput()));
  els.insertAtBtn.addEventListener("click", () => insertAt(readIndexInput(), readValueInput()));
  els.deleteBtn.addEventListener("click", () => deleteValue(readValueInput()));
  els.searchBtn.addEventListener("click", () => search(readValueInput()));
  els.reverseBtn.addEventListener("click", () => reverse());
  els.demoBtn.addEventListener("click", () => demo());
  els.clearBtn.addEventListener("click", () => clear());
  els.valueInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") insertTail(readValueInput());
  });

  render();
  setStatus("List is empty — insert a value to start.");
  return {
    insertHead, insertTail, insertAt, deleteValue, search, reverse,
    clear, demo, reset, stopDemo,
    get size() { return items.length; },
    get head() { return items.length === 0 ? null : items[0]; },
    get tail() { return items.length === 0 ? null : items[items.length - 1]; },
    get operations() { return ops; },
    get items() { return items.slice(); },
    get demoRunning() { return demoRunning; },
  };
}

/* Wires the linked list panel in index.html; called once from app.js. */
function initLinkedListViz() {
  const $ = (id) => document.getElementById(id);
  return createLinkedListViz({
    stage: $("llStage"),
    valueInput: $("llValueInput"),
    indexInput: $("llIndexInput"),
    insertHeadBtn: $("insertHeadBtn"),
    insertTailBtn: $("insertTailBtn"),
    insertAtBtn: $("insertAtBtn"),
    deleteBtn: $("deleteLlBtn"),
    searchBtn: $("searchLlBtn"),
    reverseBtn: $("reverseLlBtn"),
    demoBtn: $("demoLlBtn"),
    clearBtn: $("clearLlBtn"),
    size: $("llSize"),
    head: $("llHead"),
    tail: $("llTail"),
    ops: $("llOps"),
    status: $("llStatus"),
    log: $("llLog"),
  });
}

/* ------------------------------------------------------------------ */
/* Doubly linked list visualizer — the linked list with a second      */
/* pointer per node. Each node has a prev (←) and a next (→) link,    */
/* so the chain runs both ways: NULL ← node ↔ node ↔ node → NULL.     */
/* The headline feature is traversal: walk the list forward from      */
/* the head or backward from the tail, one node at a time, with the    */
/* current node lit up and visited nodes marked. Insert, delete,      */
/* search and reverse work the same as the singly linked list, but    */
/* every operation rewires two pointers instead of one.               */
/* ------------------------------------------------------------------ */

const DOUBLY_LINKED_LIST_INFO = {
  complexity: "O(1) head/tail · O(n) index",
  cases: {
    best: "O(1) — insert or delete at the head or tail touches two pointers",
    average: "O(n) — insert, delete or search by index walks half the list on average",
    worst: "O(n) — a search for a missing value walks every node, forward or backward",
    note: "Every node carries a prev and a next pointer, so the list can be walked in both directions and a node can be deleted knowing only the node itself — no walk back to the head. The price is one extra pointer per node and two rewires per insert or delete. Traversal is O(n) either way: forward from the head, backward from the tail.",
  },
  pseudocode:
`insertHead(value)     <- new node points both ways
  node.next = head
  node.prev = null
  head.prev = node
  head = node
insertTail(value)     <- new node points both ways
  node.prev = tail
  node.next = null
  tail.next = node
  tail = node
delete(node)          <- rewire both neighbours
  node.prev.next = node.next
  node.next.prev = node.prev
traverseForward()     <- follow next from the head
  node = head
  while node != null: visit node; node = node.next
traverseBackward()    <- follow prev from the tail
  node = tail
  while node != null: visit node; node = node.prev`,
};

const DLL_MAX_VALUE = 999;
const DLL_LOG_LIMIT = 8;
/* Long enough for the slide animation to read, short enough to stay snappy. */
const DLL_ANIM_MS = 260;
const DLL_DEMO_STEP_MS = 550;
const DLL_FOUND_MS = 900;
/* Pause on each node during a traversal, so the walk reads step by step. */
const DLL_TRAVERSE_STEP_MS = 650;

/* The scripted demo: build 10 -> 20 -> 30, walk it forward and back,
   find 20, add 5 at the head, delete 20, reverse, then clear — ending
   empty so it replays cleanly. */
const DLL_DEMO_SCRIPT = [
  { op: "insertTail", value: 10 }, { op: "insertTail", value: 20 },
  { op: "insertTail", value: 30 },
  { op: "traverse", direction: "forward" },
  { op: "traverse", direction: "backward" },
  { op: "search", value: 20 },
  { op: "insertHead", value: 5 },
  { op: "delete", value: 20 },
  { op: "reverse" },
  { op: "clear" },
];

/* els: { stage, valueInput, indexInput, insertHeadBtn, insertTailBtn,
          insertAtBtn, deleteBtn, searchBtn, reverseBtn,
          traverseForwardBtn, traverseBackwardBtn, demoBtn, clearBtn,
          size, head, tail, ops, status, log } — plain DOM elements.
   The factory keeps no other state, so a node test can drive it with
   stub elements. */
function createDoublyLinkedListViz(els) {
  let items = [];
  let ops = 0;
  let animating = false;
  let demoTimer = null;
  let demoRunning = false;
  let traverseTimer = null;
  let traversing = false;
  /* Node boxes in list order, rebuilt by render(); used to animate the
     exact node an operation touches. */
  let nodeBoxes = [];

  function render(enteringValue, enteringIndex) {
    els.stage.innerHTML = "";
    nodeBoxes = [];
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "dll-empty";
      empty.textContent = "— empty —";
      els.stage.appendChild(empty);
    } else {
      /* The head's prev pointer comes from NULL, the tail's next
         pointer goes to NULL, and neighbours are joined by ↔ — the
         two-way link is what makes this list doubly linked. */
      const headNull = document.createElement("div");
      headNull.className = "dll-null";
      headNull.textContent = "NULL";
      els.stage.appendChild(headNull);
      const prevArrow = document.createElement("div");
      prevArrow.className = "dll-arrow";
      prevArrow.textContent = "←";
      els.stage.appendChild(prevArrow);
      items.forEach((value, i) => {
        const node = document.createElement("div");
        node.className = "dll-node";
        node.textContent = String(value);
        if (i === 0) node.classList.add("head");
        if (i === items.length - 1) node.classList.add("tail");
        if (enteringValue !== undefined && enteringIndex === i)
          node.classList.add("entering");
        els.stage.appendChild(node);
        nodeBoxes.push(node);
        const arrow = document.createElement("div");
        arrow.className = "dll-arrow";
        arrow.textContent = i < items.length - 1 ? "↔" : "→";
        els.stage.appendChild(arrow);
      });
      const tailNull = document.createElement("div");
      tailNull.className = "dll-null";
      tailNull.textContent = "NULL";
      els.stage.appendChild(tailNull);
    }
    els.size.textContent = String(items.length);
    els.head.textContent = items.length === 0 ? "—" : String(items[0]);
    els.tail.textContent = items.length === 0 ? "—" : String(items[items.length - 1]);
    els.ops.textContent = String(ops);
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function log(message) {
    const entry = document.createElement("li");
    entry.textContent = message;
    els.log.insertBefore(entry, els.log.firstChild);
    while (els.log.children.length > DLL_LOG_LIMIT)
      els.log.removeChild(els.log.lastChild);
  }

  function setButtonsDisabled(disabled) {
    [els.insertHeadBtn, els.insertTailBtn, els.insertAtBtn, els.deleteBtn,
     els.searchBtn, els.reverseBtn, els.traverseForwardBtn,
     els.traverseBackwardBtn, els.demoBtn, els.clearBtn]
      .forEach((b) => { b.disabled = disabled; });
  }

  function validValue(value) {
    return Number.isInteger(value) && value >= 0 && value <= DLL_MAX_VALUE;
  }

  function insertHead(value) {
    if (animating || traversing) return false;
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${DLL_MAX_VALUE}.`);
      return false;
    }
    items.unshift(value);
    ops++;
    render(value, 0);
    setStatus(`Inserted ${value} at the head — its next points at the old head, head is now ${value}, size ${items.length}.`);
    log(`insertHead ${value} -> [${items.join(" <-> ")}]`);
    return true;
  }

  function insertTail(value) {
    if (animating || traversing) return false;
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${DLL_MAX_VALUE}.`);
      return false;
    }
    items.push(value);
    ops++;
    render(value, items.length - 1);
    setStatus(`Inserted ${value} at the tail — its prev points at the old tail, tail is now ${value}, size ${items.length}.`);
    log(`insertTail ${value} -> [${items.join(" <-> ")}]`);
    return true;
  }

  function insertAt(index, value) {
    if (animating || traversing) return false;
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${DLL_MAX_VALUE}.`);
      return false;
    }
    if (!Number.isInteger(index) || index < 0 || index > items.length) {
      setStatus(`Index must be between 0 and ${items.length} (size ${items.length}).`);
      return false;
    }
    items.splice(index, 0, value);
    ops++;
    render(value, index);
    setStatus(`Inserted ${value} at index ${index} — both neighbours rewired, size ${items.length}.`);
    log(`insertAt(${index}, ${value}) -> [${items.join(" <-> ")}]`);
    return true;
  }

  function deleteValue(value) {
    if (animating || traversing) return null;
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${DLL_MAX_VALUE}.`);
      return null;
    }
    const index = items.indexOf(value);
    if (index === -1) {
      setStatus(`${value} is not in the list — nothing to delete.`);
      return null;
    }
    animating = true;
    setButtonsDisabled(true);
    const box = nodeBoxes[index];
    if (box && box.classList) box.classList.add("leaving");
    setTimeout(() => {
      items.splice(index, 1);
      ops++;
      render();
      setStatus(`Deleted ${value} at index ${index} — its prev and next now point at each other`
        + (items.length === 0 ? ", list is empty now." : `, size ${items.length}.`));
      log(`delete ${value} -> [${items.join(" <-> ")}]`);
      animating = false;
      setButtonsDisabled(false);
    }, DLL_ANIM_MS);
    return value;
  }

  function search(value) {
    if (animating || traversing) return -1;
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${DLL_MAX_VALUE}.`);
      return -1;
    }
    ops++;
    const index = items.indexOf(value);
    render();
    els.ops.textContent = String(ops);
    if (index === -1) {
      setStatus(`${value} is not in the list — walked all ${items.length} nodes.`);
      log(`search ${value} -> not found (${items.length} nodes walked)`);
      return -1;
    }
    const box = nodeBoxes[index];
    if (box && box.classList) {
      box.classList.add("found");
      setTimeout(() => box.classList.remove("found"), DLL_FOUND_MS);
    }
    setStatus(`Found ${value} at index ${index} — walked ${index + 1} node${index === 0 ? "" : "s"} from the head.`);
    log(`search ${value} -> index ${index}`);
    return index;
  }

  function reverse() {
    if (animating || traversing) return false;
    if (items.length < 2) {
      setStatus(items.length === 0
        ? "List is empty — nothing to reverse."
        : "One node — reversing changes nothing.");
      return false;
    }
    items.reverse();
    ops++;
    render();
    setStatus(`Reversed — every prev/next pair swapped, head is now ${items[0]}, tail ${items[items.length - 1]}.`);
    log(`reverse -> [${items.join(" <-> ")}]`);
    return true;
  }

  /* Walk the list one node at a time — forward from the head, or
     backward from the tail — lighting up each node as it is visited
     and naming its prev and next neighbours. A traversal is one
     operation; visited nodes stay marked until the next render. */
  function traverse(direction) {
    if (animating || traversing) return false;
    if (items.length === 0) {
      setStatus("List is empty — nothing to traverse.");
      return false;
    }
    if (direction !== "forward" && direction !== "backward") direction = "forward";
    traversing = true;
    setButtonsDisabled(true);
    const step = direction === "backward" ? -1 : 1;
    let index = direction === "backward" ? items.length - 1 : 0;
    const visited = [];
    const visit = () => {
      if (index < 0 || index >= items.length) {
        traversing = false;
        traverseTimer = null;
        ops++;
        els.ops.textContent = String(ops);
        setButtonsDisabled(false);
        setStatus(`Traversed ${direction} — visited ${visited.length} node${visited.length === 1 ? "" : "s"}: ${visited.join(" → ")}.`);
        log(`traverse ${direction} -> ${visited.join(" -> ")}`);
        return;
      }
      nodeBoxes.forEach((b) => { if (b.classList) b.classList.remove("current"); });
      const box = nodeBoxes[index];
      if (box && box.classList) {
        box.classList.add("current");
        box.classList.add("visited");
      }
      visited.push(items[index]);
      const prev = index === 0 ? "NULL" : String(items[index - 1]);
      const next = index === items.length - 1 ? "NULL" : String(items[index + 1]);
      setStatus(`Traversing ${direction} — node ${index + 1} of ${items.length}: ${items[index]} (prev ${prev}, next ${next}).`);
      index += step;
      traverseTimer = setTimeout(visit, DLL_TRAVERSE_STEP_MS);
    };
    traverseTimer = setTimeout(visit, DLL_TRAVERSE_STEP_MS);
    return true;
  }

  function stopTraversal() {
    if (traverseTimer !== null) {
      clearTimeout(traverseTimer);
      traverseTimer = null;
    }
    if (traversing) {
      traversing = false;
      nodeBoxes.forEach((b) => { if (b.classList) b.classList.remove("current"); });
      setButtonsDisabled(false);
    }
  }

  function clear() {
    if (animating) return;
    stopTraversal();
    stopDemo();
    items = [];
    render();
    setStatus("List cleared.");
    log("clear -> list is empty");
  }

  function stopDemo() {
    if (demoTimer !== null) {
      clearTimeout(demoTimer);
      demoTimer = null;
    }
    demoRunning = false;
    els.demoBtn.disabled = false;
  }

  /* Runs the scripted story one step at a time. A delete needs its
     slide-out to finish before the next step; a traversal needs its
     whole walk to finish. */
  function demo() {
    if (demoRunning || animating || traversing) return false;
    clear();
    demoRunning = true;
    els.demoBtn.disabled = true;
    setStatus("Demo running — build 10 → 20 → 30, walk it forward and back, find 20, add 5 at the head, delete 20, reverse…");
    let step = 0;
    const runStep = () => {
      if (step >= DLL_DEMO_SCRIPT.length) {
        stopDemo();
        setStatus("Demo finished — the list is empty again. Insert your own values, or run it again.");
        return;
      }
      const action = DLL_DEMO_SCRIPT[step];
      step++;
      let wait = DLL_DEMO_STEP_MS;
      if (action.op === "insertHead") insertHead(action.value);
      else if (action.op === "insertTail") insertTail(action.value);
      else if (action.op === "insertAt") insertAt(action.index, action.value);
      else if (action.op === "delete") { deleteValue(action.value); wait = DLL_ANIM_MS + DLL_DEMO_STEP_MS; }
      else if (action.op === "search") search(action.value);
      else if (action.op === "reverse") reverse();
      else if (action.op === "traverse") {
        traverse(action.direction);
        /* The walk visits every node once, plus one step to finish. */
        wait = (items.length + 1) * DLL_TRAVERSE_STEP_MS + DLL_DEMO_STEP_MS;
      }
      else if (action.op === "clear") clear();
      demoTimer = setTimeout(runStep, wait);
    };
    demoTimer = setTimeout(runStep, DLL_DEMO_STEP_MS);
    return true;
  }

  function reset() {
    stopTraversal();
    stopDemo();
    items = [];
    ops = 0;
    animating = false;
    traversing = false;
    setButtonsDisabled(false);
    render();
    els.log.innerHTML = "";
    setStatus("List is empty — insert a value to start.");
  }

  function readValueInput() {
    const n = parseInt(els.valueInput.value, 10);
    return Number.isInteger(n) ? n : NaN;
  }

  function readIndexInput() {
    const n = parseInt(els.indexInput.value, 10);
    return Number.isInteger(n) ? n : NaN;
  }

  els.insertHeadBtn.addEventListener("click", () => insertHead(readValueInput()));
  els.insertTailBtn.addEventListener("click", () => insertTail(readValueInput()));
  els.insertAtBtn.addEventListener("click", () => insertAt(readIndexInput(), readValueInput()));
  els.deleteBtn.addEventListener("click", () => deleteValue(readValueInput()));
  els.searchBtn.addEventListener("click", () => search(readValueInput()));
  els.reverseBtn.addEventListener("click", () => reverse());
  els.traverseForwardBtn.addEventListener("click", () => traverse("forward"));
  els.traverseBackwardBtn.addEventListener("click", () => traverse("backward"));
  els.demoBtn.addEventListener("click", () => demo());
  els.clearBtn.addEventListener("click", () => clear());
  els.valueInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") insertTail(readValueInput());
  });

  render();
  setStatus("List is empty — insert a value to start.");
  return {
    insertHead, insertTail, insertAt, deleteValue, search, reverse,
    traverse, clear, demo, reset, stopDemo, stopTraversal,
    get size() { return items.length; },
    get head() { return items.length === 0 ? null : items[0]; },
    get tail() { return items.length === 0 ? null : items[items.length - 1]; },
    get operations() { return ops; },
    get items() { return items.slice(); },
    get demoRunning() { return demoRunning; },
    get traversing() { return traversing; },
  };
}

/* Wires the doubly linked list panel in index.html; called once from app.js. */
function initDoublyLinkedListViz() {
  const $ = (id) => document.getElementById(id);
  return createDoublyLinkedListViz({
    stage: $("dllStage"),
    valueInput: $("dllValueInput"),
    indexInput: $("dllIndexInput"),
    insertHeadBtn: $("insertDllHeadBtn"),
    insertTailBtn: $("insertDllTailBtn"),
    insertAtBtn: $("insertDllAtBtn"),
    deleteBtn: $("deleteDllBtn"),
    searchBtn: $("searchDllBtn"),
    reverseBtn: $("reverseDllBtn"),
    traverseForwardBtn: $("traverseForwardBtn"),
    traverseBackwardBtn: $("traverseBackwardBtn"),
    demoBtn: $("demoDllBtn"),
    clearBtn: $("clearDllBtn"),
    size: $("dllSize"),
    head: $("dllHead"),
    tail: $("dllTail"),
    ops: $("dllOps"),
    status: $("dllStatus"),
    log: $("dllLog"),
  });
}

/* ------------------------------------------------------------------ */
/* Binary search tree visualizer — nodes drawn on a canvas, so the    */
/* shape of the tree is the lesson: left means smaller, right means   */
/* bigger, and the depth of a value is the number of comparisons it   */
/* took to reach it. Insert and search walk down from the root one    */
/* comparison at a time, lighting up each node they visit; the new    */
/* node pops in where the walk runs out of tree.                      */
/* ------------------------------------------------------------------ */

const BST_INFO = {
  complexity: "O(log n) avg · O(n) worst",
  cases: {
    best: "O(log n) — a balanced tree halves the search space at every step",
    average: "O(log n) — random insert order keeps the tree roughly balanced",
    worst: "O(n) — sorted input grows a chain, and every operation walks the whole chain",
    note: "Left subtree < node < right subtree, always. Insert walks down comparing at each node until it finds an empty spot; search walks the same path. The tree's height is the worst-case number of comparisons — which is why balancing (AVL) matters.",
  },
  pseudocode:
`insert(value)         <- walk down, comparing
  node = root
  while node != null:
    if value < node.value: node = node.left
    elif value > node.value: node = node.right
    else: already here, stop
  attach as a leaf
search(value)         <- walk the same path
  node = root
  while node != null:
    if value == node.value: found
    elif value < node.value: node = node.left
    else: node = node.right
  not found
traverse(order)       <- visit every node once
  inorder:   left, node, right  -> values in sorted order
  preorder:  node, left, right  -> the root first
  postorder: left, right, node  -> the leaves first`,
};

const BST_MAX_VALUE = 999;
/* The canvas fits about 15 nodes before the tree gets cramped. */
const BST_MAX_NODES = 15;
const BST_LOG_LIMIT = 8;
/* Pause on each node during a walk, so the comparisons read step by step. */
const BST_STEP_MS = 500;
const BST_DEMO_STEP_MS = 550;
const BST_FOUND_MS = 1200;
/* Node circles are 52px; one slot per inorder position keeps siblings apart. */
const BST_NODE_SIZE = 52;
const BST_SLOT_WIDTH = 64;
const BST_ROW_HEIGHT = 76;
const BST_TOP_PAD = 22;

/* The scripted demo: build a balanced 50 / 30 / 70 / 20 / 40 / 60 / 80
   tree, find 40, then look for 99 and miss, then walk it inorder —
   ending with the tree standing, so it can be replayed straight away. */
const BST_DEMO_SCRIPT = [
  { op: "insert", value: 50 }, { op: "insert", value: 30 },
  { op: "insert", value: 70 }, { op: "insert", value: 20 },
  { op: "insert", value: 40 }, { op: "insert", value: 60 },
  { op: "insert", value: 80 },
  { op: "search", value: 40 },
  { op: "search", value: 99 },
  { op: "traverse", order: "inorder" },
];
/* Shown in the traversal output line until the first walk runs. */
const BST_TRAVERSAL_PLACEHOLDER =
  "No traversal yet — build a tree, then walk it inorder, preorder or postorder.";

/* els: { stage, valueInput, insertBtn, searchBtn, inorderBtn,
          preorderBtn, postorderBtn, traversalOutput, demoBtn, clearBtn,
          size, height, root, ops, status, log } — plain DOM elements.
   The factory keeps no other state, so a node test can drive it with
   stub elements. */
function createBstViz(els) {
  let root = null;
  let size = 0;
  let ops = 0;
  let animating = false;
  let demoTimer = null;
  let demoRunning = false;
  let traversalTimer = null;
  let traversing = false;
  /* Bumped when a traversal is stopped, so a leftover step does nothing. */
  let traversalId = 0;
  /* Bumped on clear / reset so a walk left over from the old tree
     stops instead of inserting into the new one. */
  let walkId = 0;
  /* Nodes highlighted by the walk in progress: the node being compared
     right now, the ones already visited, the one just found, and the
     one just inserted. Keyed by node object, so re-renders keep them. */
  let current = null;
  let found = null;
  let entering = null;
  let visited = new Set();
  /* The result of the most recent finished search, for tests and the log. */
  let lastSearch = null;
  /* The result of the most recent finished traversal, for tests and the log. */
  let lastTraversal = null;

  function height(node) {
    if (node === null) return 0;
    return 1 + Math.max(height(node.left), height(node.right));
  }

  function inOrder(node, out) {
    if (node === null) return out;
    inOrder(node.left, out);
    out.push(node.value);
    inOrder(node.right, out);
    return out;
  }

  /* Inorder walk assigns each node its slot (left subtree, node, right
     subtree), which is exactly the left-to-right order on the canvas;
     depth sets the row. Positions are centres, so edges join cleanly. */
  function layout() {
    const positions = new Map();
    let slot = 0;
    const walk = (node, depth) => {
      if (node === null) return;
      walk(node.left, depth + 1);
      positions.set(node, {
        x: BST_TOP_PAD + slot * BST_SLOT_WIDTH + BST_SLOT_WIDTH / 2,
        y: BST_TOP_PAD + depth * BST_ROW_HEIGHT,
        depth,
      });
      slot++;
      walk(node.right, depth + 1);
    };
    walk(root, 0);
    return positions;
  }

  function render() {
    els.stage.innerHTML = "";
    const canvas = document.createElement("div");
    canvas.className = "bst-canvas";
    if (root === null) {
      const empty = document.createElement("div");
      empty.className = "bst-empty";
      empty.textContent = "— empty —";
      canvas.appendChild(empty);
    } else {
      const positions = layout();
      const treeHeight = height(root);
      const width = BST_TOP_PAD * 2 + size * BST_SLOT_WIDTH;
      const canvasHeight = BST_TOP_PAD * 2 + (treeHeight - 1) * BST_ROW_HEIGHT + BST_NODE_SIZE;
      canvas.style.width = width + "px";
      canvas.style.height = canvasHeight + "px";
      /* Edges first, so nodes draw on top of them. */
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "bst-edges");
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(canvasHeight));
      const edges = [];
      const collect = (node, parent) => {
        if (node === null) return;
        if (parent !== null) edges.push([parent, node]);
        collect(node.left, node);
        collect(node.right, node);
      };
      collect(root, null);
      edges.forEach(([parent, child]) => {
        const p = positions.get(parent);
        const c = positions.get(child);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(p.x));
        line.setAttribute("y1", String(p.y + BST_NODE_SIZE));
        line.setAttribute("x2", String(c.x));
        line.setAttribute("y2", String(c.y));
        svg.appendChild(line);
      });
      canvas.appendChild(svg);
      positions.forEach((pos, node) => {
        const box = document.createElement("div");
        box.className = "bst-node";
        box.textContent = String(node.value);
        if (node === root) box.classList.add("root");
        if (node === current) box.classList.add("current");
        if (visited.has(node)) box.classList.add("visited");
        if (node === found) box.classList.add("found");
        if (node === entering) box.classList.add("entering");
        box.style.left = (pos.x - BST_NODE_SIZE / 2) + "px";
        box.style.top = pos.y + "px";
        canvas.appendChild(box);
      });
    }
    els.stage.appendChild(canvas);
    els.size.textContent = String(size);
    els.height.textContent = root === null ? "—" : String(height(root));
    els.root.textContent = root === null ? "—" : String(root.value);
    els.ops.textContent = String(ops);
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function log(message) {
    const entry = document.createElement("li");
    entry.textContent = message;
    els.log.insertBefore(entry, els.log.firstChild);
    while (els.log.children.length > BST_LOG_LIMIT)
      els.log.removeChild(els.log.lastChild);
  }

  function setButtonsDisabled(disabled) {
    [els.insertBtn, els.searchBtn, els.inorderBtn, els.preorderBtn,
     els.postorderBtn, els.demoBtn, els.clearBtn]
      .forEach((b) => { b.disabled = disabled; });
  }

  function validValue(value) {
    return Number.isInteger(value) && value >= 0 && value <= BST_MAX_VALUE;
  }

  /* How many nodes an insert or a search of this value would compare —
     the walk length, used to pace the demo. */
  function pathLength(value) {
    let node = root;
    let n = 0;
    while (node !== null) {
      n++;
      if (value === node.value) break;
      node = value < node.value ? node.left : node.right;
    }
    return n;
  }

  function directionText(value, nodeValue) {
    return value < nodeValue
      ? `${value} < ${nodeValue}, go left`
      : `${value} > ${nodeValue}, go right`;
  }

  function insert(value) {
    if (animating) return false;
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${BST_MAX_VALUE}.`);
      return false;
    }
    if (size >= BST_MAX_NODES) {
      setStatus(`The tree is full — ${BST_MAX_NODES} nodes is all the canvas fits. Clear it to start over.`);
      return false;
    }
    /* Duplicates are rejected up front, so the walk never has to explain one. */
    let probe = root;
    while (probe !== null) {
      if (value === probe.value) {
        setStatus(`${value} is already in the tree — a BST holds each value once.`);
        return false;
      }
      probe = value < probe.value ? probe.left : probe.right;
    }
    animating = true;
    setButtonsDisabled(true);
    visited = new Set();
    current = null;
    found = null;
    entering = null;
    const id = ++walkId;
    let node = root;
    let parent = null;
    let comparisons = 0;
    const step = () => {
      if (id !== walkId) return;
      if (node === null) {
        /* Ran out of tree: attach the new node here. */
        const leaf = { value, left: null, right: null };
        if (parent === null) root = leaf;
        else if (value < parent.value) parent.left = leaf;
        else parent.right = leaf;
        size++;
        ops++;
        entering = leaf;
        current = null;
        animating = false;
        setButtonsDisabled(false);
        render();
        setStatus(parent === null
          ? `Inserted ${value} as the root — the tree starts here.`
          : `Inserted ${value} under ${parent.value} after ${comparisons} comparison${comparisons === 1 ? "" : "s"} — ${directionText(value, parent.value)}.`);
        log(`insert ${value} -> size ${size}, height ${height(root)}`);
        setTimeout(() => { entering = null; render(); }, BST_FOUND_MS);
        return;
      }
      comparisons++;
      current = node;
      visited.add(node);
      render();
      setStatus(`Compare ${value} with ${node.value} — ${directionText(value, node.value)} (comparison ${comparisons}).`);
      parent = node;
      node = value < node.value ? node.left : node.right;
      setTimeout(step, BST_STEP_MS);
    };
    step();
    return true;
  }

  function search(value) {
    if (animating) return false;
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${BST_MAX_VALUE}.`);
      return false;
    }
    if (root === null) {
      setStatus("The tree is empty — insert a value first.");
      return false;
    }
    animating = true;
    setButtonsDisabled(true);
    visited = new Set();
    current = null;
    found = null;
    entering = null;
    const id = ++walkId;
    let node = root;
    let depth = 0;
    let comparisons = 0;
    const step = () => {
      if (id !== walkId) return;
      if (node === null) {
        ops++;
        lastSearch = { value, found: false, comparisons };
        current = null;
        animating = false;
        setButtonsDisabled(false);
        render();
        setStatus(`${value} is not in the tree — walked ${comparisons} node${comparisons === 1 ? "" : "s"} and ran out of tree.`);
        log(`search ${value} -> not found (${comparisons} comparisons)`);
        return;
      }
      comparisons++;
      current = node;
      visited.add(node);
      render();
      if (value === node.value) {
        ops++;
        lastSearch = { value, found: true, comparisons, depth };
        found = node;
        current = null;
        animating = false;
        setButtonsDisabled(false);
        render();
        setStatus(`Found ${value} at depth ${depth} after ${comparisons} comparison${comparisons === 1 ? "" : "s"}${depth === 0 ? " — it was the root." : "."}`);
        log(`search ${value} -> found at depth ${depth} (${comparisons} comparisons)`);
        setTimeout(() => { found = null; render(); }, BST_FOUND_MS);
        return;
      }
      setStatus(`Compare ${value} with ${node.value} — ${directionText(value, node.value)} (comparison ${comparisons}).`);
      node = value < node.value ? node.left : node.right;
      depth++;
      setTimeout(step, BST_STEP_MS);
    };
    step();
    return true;
  }

  /* The nodes in traversal order — the walk itself, without animation.
     Inorder visits left, node, right (so the values come out sorted);
     preorder visits the node first; postorder visits the node last. */
  function traversalOrder(node, order, out) {
    if (node === null) return out;
    if (order === "preorder") out.push(node);
    traversalOrder(node.left, order, out);
    if (order === "inorder") out.push(node);
    traversalOrder(node.right, order, out);
    if (order === "postorder") out.push(node);
    return out;
  }

  /* Walk the tree one node at a time in the chosen order, lighting up
     each node as it is visited and building the visit order in the
     output line — so the difference between the three orders reads
     off the tree itself. A traversal is one operation. */
  function traverse(order) {
    if (animating || traversing) return false;
    if (order !== "inorder" && order !== "preorder" && order !== "postorder")
      order = "inorder";
    if (root === null) {
      setStatus("The tree is empty — insert a value first.");
      return false;
    }
    const label = order.charAt(0).toUpperCase() + order.slice(1);
    const rule = order === "inorder"
      ? "left subtree, then the node, then the right subtree — the values come out sorted"
      : order === "preorder"
        ? "the node first, then its left subtree, then its right subtree"
        : "the left subtree, then the right subtree, then the node — the leaves come first";
    traversing = true;
    setButtonsDisabled(true);
    visited = new Set();
    current = null;
    found = null;
    entering = null;
    const id = ++traversalId;
    const nodes = traversalOrder(root, order, []);
    const values = [];
    let index = 0;
    els.traversalOutput.textContent = `${label}: `;
    setStatus(`${label} traversal — ${rule}. Visiting ${nodes.length} nodes…`);
    const step = () => {
      if (id !== traversalId) return;
      if (index >= nodes.length) {
        traversing = false;
        traversalTimer = null;
        ops++;
        lastTraversal = { order, values: values.slice() };
        current = null;
        setButtonsDisabled(false);
        render();
        setStatus(`${label} complete — visited ${values.length} node${values.length === 1 ? "" : "s"}: ${values.join(" → ")}.`);
        log(`${order} -> ${values.join(", ")}`);
        return;
      }
      const node = nodes[index];
      index++;
      values.push(node.value);
      current = node;
      visited.add(node);
      render();
      els.traversalOutput.textContent = `${label}: ${values.join(" → ")}`;
      setStatus(`${label} — visiting ${node.value} (${index} of ${nodes.length}).`);
      traversalTimer = setTimeout(step, BST_STEP_MS);
    };
    traversalTimer = setTimeout(step, BST_STEP_MS);
    return true;
  }

  function stopTraversal() {
    if (traversalTimer !== null) {
      clearTimeout(traversalTimer);
      traversalTimer = null;
    }
    if (traversing) {
      traversing = false;
      traversalId++;
      current = null;
      setButtonsDisabled(false);
      render();
    }
  }

  function clear() {
    if (animating) return;
    stopTraversal();
    stopDemo();
    walkId++;
    root = null;
    size = 0;
    current = null;
    found = null;
    entering = null;
    visited = new Set();
    lastSearch = null;
    lastTraversal = null;
    els.traversalOutput.textContent = BST_TRAVERSAL_PLACEHOLDER;
    render();
    setStatus("Tree cleared.");
    log("clear -> tree is empty");
  }

  function stopDemo() {
    if (demoTimer !== null) {
      clearTimeout(demoTimer);
      demoTimer = null;
    }
    demoRunning = false;
    els.demoBtn.disabled = false;
  }

  /* Runs the scripted story one step at a time. Each step waits for
     its own walk to finish (walk length + one beat to attach, report
     or visit the last node), so the demo never overtakes the animation. */
  function demo() {
    if (demoRunning || animating) return false;
    clear();
    demoRunning = true;
    els.demoBtn.disabled = true;
    setStatus("Demo running — building 50, 30, 70, 20, 40, 60, 80, then searching for 40 and 99, then an inorder walk…");
    let step = 0;
    const runStep = () => {
      if (step >= BST_DEMO_SCRIPT.length) {
        stopDemo();
        setStatus("Demo finished — the tree is standing and the inorder walk came out sorted. Insert your own values, search for one, or run it again.");
        return;
      }
      const action = BST_DEMO_SCRIPT[step];
      step++;
      let wait;
      if (action.op === "traverse") {
        /* The walk visits every node once, plus one step to finish. */
        wait = (size + 1) * BST_STEP_MS + BST_DEMO_STEP_MS;
        traverse(action.order);
      } else {
        /* The walk visits pathLength nodes, plus one beat to attach or report. */
        wait = (pathLength(action.value) + 1) * BST_STEP_MS + BST_DEMO_STEP_MS;
        if (action.op === "insert") insert(action.value);
        else if (action.op === "search") search(action.value);
      }
      demoTimer = setTimeout(runStep, wait);
    };
    demoTimer = setTimeout(runStep, BST_DEMO_STEP_MS);
    return true;
  }

  function reset() {
    stopTraversal();
    stopDemo();
    walkId++;
    root = null;
    size = 0;
    ops = 0;
    animating = false;
    traversing = false;
    current = null;
    found = null;
    entering = null;
    visited = new Set();
    lastSearch = null;
    lastTraversal = null;
    setButtonsDisabled(false);
    els.traversalOutput.textContent = BST_TRAVERSAL_PLACEHOLDER;
    render();
    els.log.innerHTML = "";
    setStatus("Tree is empty — insert a value to start.");
  }

  function readValueInput() {
    const n = parseInt(els.valueInput.value, 10);
    return Number.isInteger(n) ? n : NaN;
  }

  els.insertBtn.addEventListener("click", () => insert(readValueInput()));
  els.searchBtn.addEventListener("click", () => search(readValueInput()));
  els.inorderBtn.addEventListener("click", () => traverse("inorder"));
  els.preorderBtn.addEventListener("click", () => traverse("preorder"));
  els.postorderBtn.addEventListener("click", () => traverse("postorder"));
  els.demoBtn.addEventListener("click", () => demo());
  els.clearBtn.addEventListener("click", () => clear());
  els.valueInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") insert(readValueInput());
  });

  render();
  setStatus("Tree is empty — insert a value to start.");
  return {
    insert, search, traverse, clear, demo, reset, stopDemo, stopTraversal,
    get size() { return size; },
    get treeHeight() { return height(root); },
    get rootValue() { return root === null ? null : root.value; },
    get operations() { return ops; },
    get items() { return inOrder(root, []); },
    get demoRunning() { return demoRunning; },
    get traversing() { return traversing; },
    get lastSearch() { return lastSearch; },
    get lastTraversal() { return lastTraversal; },
  };
}

/* Wires the BST panel in index.html; called once from app.js. */
function initBstViz() {
  const $ = (id) => document.getElementById(id);
  return createBstViz({
    stage: $("bstStage"),
    valueInput: $("bstValueInput"),
    insertBtn: $("insertBstBtn"),
    searchBtn: $("searchBstBtn"),
    inorderBtn: $("inorderBstBtn"),
    preorderBtn: $("preorderBstBtn"),
    postorderBtn: $("postorderBstBtn"),
    traversalOutput: $("bstTraversalOutput"),
    demoBtn: $("demoBstBtn"),
    clearBtn: $("clearBstBtn"),
    size: $("bstSize"),
    height: $("bstHeight"),
    root: $("bstRoot"),
    ops: $("bstOps"),
    status: $("bstStatus"),
    log: $("bstLog"),
  });
}

/* ------------------------------------------------------------------ */
/* AVL tree visualizer — a BST that rebalances itself. Every node     */
/* carries a height and shows its balance factor (left height minus   */
/* right height) as a small badge; the factor must stay in -1..+1.    */
/* Insert walks down comparing, like the BST, then walks back up:     */
/* the first ancestor whose balance factor breaks is fixed on the     */
/* spot with one of the four rotations — LL (right rotation), RR      */
/* (left rotation), LR (left then right) or RL (right then left) —    */
/* each shown step by step, with the nodes being rotated lit up and   */
/* the rotation named in the status line and the rotation output.     */
/* ------------------------------------------------------------------ */

const AVL_INFO = {
  complexity: "O(log n) all cases",
  cases: {
    best: "O(log n) — the tree stays balanced, so every walk is short",
    average: "O(log n) — insert, search and delete all follow a path of logarithmic length",
    worst: "O(log n) — the balance factor of every node is kept in -1..+1, so the height can never degrade to O(n) the way an unbalanced BST can",
    note: "An AVL tree keeps every subtree's heights within one of each other, so the height stays O(log n). The price is a rotation (or two) after some inserts: the tree rebalances itself on the spot, and one rotation is always enough after a single insert.",
  },
  pseudocode:
`insert(value)         <- walk down, comparing
  node = root
  while node != null:
    if value < node.value: node = node.left
    elif value > node.value: node = node.right
    else: already here, stop
  attach as a leaf, height 1
rebalance(node)       <- walk back up to the root
  update height(node)
  balance = height(left) - height(right)
  if balance > 1:  left is heavy
    if balance(left) < 0: rotateLeft(left)   <- LR case
    rotateRight(node)                       <- LL case
  if balance < -1: right is heavy
    if balance(right) > 0: rotateRight(right) <- RL case
    rotateLeft(node)                        <- RR case
rotateRight(y)        <- y's left child becomes the root
  x = y.left; t = x.right
  x.right = y; y.left = t
  update heights
rotateLeft(x)         <- mirror image of rotateRight`,
};

const AVL_MAX_VALUE = 999;
/* The canvas fits about 15 nodes before the tree gets cramped. */
const AVL_MAX_NODES = 15;
const AVL_LOG_LIMIT = 8;
/* Pause on each node during a walk, so the comparisons read step by step. */
const AVL_STEP_MS = 500;
const AVL_DEMO_STEP_MS = 550;
const AVL_FOUND_MS = 1200;

/* The scripted demo: one case per rotation type, clearing between
   cases so each rotation reads on its own — LL (30, 20, 10), RR
   (10, 20, 30), LR (30, 10, 20), RL (10, 30, 20) — ending with the
   RL tree standing, so it can be replayed straight away. */
const AVL_DEMO_SCRIPT = [
  { name: "LL", values: [30, 20, 10] },
  { name: "RR", values: [10, 20, 30] },
  { name: "LR", values: [30, 10, 20] },
  { name: "RL", values: [10, 30, 20] },
];
/* Shown in the rotation output line until the first rotation runs. */
const AVL_ROTATION_PLACEHOLDER =
  "No rotations yet — insert values that unbalance the tree, or run the demo to see all four rotation cases.";

/* --- Pure AVL helpers: no DOM, so a node test can drive them. --- */

/* Height of a subtree: 0 for an empty one, the stored height otherwise. */
function avlHeightOf(node) {
  return node === null ? 0 : node.height;
}

function avlUpdateHeight(node) {
  node.height = 1 + Math.max(avlHeightOf(node.left), avlHeightOf(node.right));
}

/* Left height minus right height: -1, 0 or +1 in a balanced tree. */
function avlBalanceFactor(node) {
  return avlHeightOf(node.left) - avlHeightOf(node.right);
}

function avlNode(value) {
  return { value, left: null, right: null, height: 1 };
}

/* Right rotation at y: y's left child x becomes the subtree root, y
   drops to x's right, and x's old right subtree becomes y's left. */
function avlRotateRight(y) {
  const x = y.left;
  const t = x.right;
  x.right = y;
  y.left = t;
  avlUpdateHeight(y);
  avlUpdateHeight(x);
  return x;
}

/* Left rotation at x: the mirror image of a right rotation. */
function avlRotateLeft(x) {
  const y = x.right;
  const t = y.left;
  y.left = x;
  x.right = t;
  avlUpdateHeight(x);
  avlUpdateHeight(y);
  return y;
}

/* Every node's balance factor within -1..+1, checked recursively. */
function avlIsBalanced(node) {
  if (node === null) return true;
  const bf = avlBalanceFactor(node);
  if (bf < -1 || bf > 1) return false;
  return avlIsBalanced(node.left) && avlIsBalanced(node.right);
}

function avlInOrder(node, out) {
  if (node === null) return out;
  avlInOrder(node.left, out);
  out.push(node.value);
  avlInOrder(node.right, out);
  return out;
}

/* els: { stage, valueInput, insertBtn, demoBtn, clearBtn, size, height,
          root, rotations, ops, status, rotationOutput, log } — plain
   DOM elements. The factory keeps no other state, so a node test can
   drive it with stub elements. */
function createAvlViz(els) {
  let root = null;
  let size = 0;
  let ops = 0;
  let rotations = 0;
  let animating = false;
  let demoTimer = null;
  let demoRunning = false;
  /* Bumped on clear / reset so a walk left over from the old tree
     stops instead of inserting into the new one. */
  let walkId = 0;
  /* Nodes highlighted by the walk in progress: the node being compared
     right now, the ones already visited, the one just inserted, the
     nodes a rotation is moving, and the node whose balance broke. */
  let current = null;
  let entering = null;
  let visited = new Set();
  let rotating = new Set();
  let imbalanced = null;
  /* The most recent finished rotation, for tests and the log. */
  let lastRotation = null;

  function height(node) {
    return avlHeightOf(node);
  }

  /* Inorder walk assigns each node its slot (left subtree, node, right
     subtree), which is exactly the left-to-right order on the canvas;
     depth sets the row. Positions are centres, so edges join cleanly. */
  function layout() {
    const positions = new Map();
    let slot = 0;
    const walk = (node, depth) => {
      if (node === null) return;
      walk(node.left, depth + 1);
      positions.set(node, {
        x: BST_TOP_PAD + slot * BST_SLOT_WIDTH + BST_SLOT_WIDTH / 2,
        y: BST_TOP_PAD + depth * BST_ROW_HEIGHT,
        depth,
      });
      slot++;
      walk(node.right, depth + 1);
    };
    walk(root, 0);
    return positions;
  }

  function render() {
    els.stage.innerHTML = "";
    const canvas = document.createElement("div");
    canvas.className = "avl-canvas";
    if (root === null) {
      const empty = document.createElement("div");
      empty.className = "avl-empty";
      empty.textContent = "— empty —";
      canvas.appendChild(empty);
    } else {
      const positions = layout();
      const treeHeight = height(root);
      const width = BST_TOP_PAD * 2 + size * BST_SLOT_WIDTH;
      const canvasHeight = BST_TOP_PAD * 2 + (treeHeight - 1) * BST_ROW_HEIGHT + BST_NODE_SIZE;
      canvas.style.width = width + "px";
      canvas.style.height = canvasHeight + "px";
      /* Edges first, so nodes draw on top of them. */
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "avl-edges");
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(canvasHeight));
      const edges = [];
      const collect = (node, parent) => {
        if (node === null) return;
        if (parent !== null) edges.push([parent, node]);
        collect(node.left, node);
        collect(node.right, node);
      };
      collect(root, null);
      edges.forEach(([parent, child]) => {
        const p = positions.get(parent);
        const c = positions.get(child);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(p.x));
        line.setAttribute("y1", String(p.y + BST_NODE_SIZE));
        line.setAttribute("x2", String(c.x));
        line.setAttribute("y2", String(c.y));
        svg.appendChild(line);
      });
      canvas.appendChild(svg);
      positions.forEach((pos, node) => {
        const box = document.createElement("div");
        box.className = "avl-node";
        box.textContent = String(node.value);
        if (node === root) box.classList.add("root");
        if (node === current) box.classList.add("current");
        if (visited.has(node)) box.classList.add("visited");
        if (node === entering) box.classList.add("entering");
        if (rotating.has(node)) box.classList.add("rotating");
        if (node === imbalanced) box.classList.add("imbalanced");
        /* The balance factor rides on the node, so the imbalance that
           triggers a rotation is visible before the rotation runs. */
        const bf = avlBalanceFactor(node);
        const badge = document.createElement("span");
        badge.className = "avl-bf";
        badge.textContent = (bf >= 0 ? "+" : "") + String(bf);
        if (bf < -1 || bf > 1) badge.classList.add("bad");
        box.appendChild(badge);
        box.style.left = (pos.x - BST_NODE_SIZE / 2) + "px";
        box.style.top = pos.y + "px";
        canvas.appendChild(box);
      });
    }
    els.stage.appendChild(canvas);
    els.size.textContent = String(size);
    els.height.textContent = root === null ? "—" : String(height(root));
    els.root.textContent = root === null ? "—" : String(root.value);
    els.rotations.textContent = String(rotations);
    els.ops.textContent = String(ops);
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function log(message) {
    const entry = document.createElement("li");
    entry.textContent = message;
    els.log.insertBefore(entry, els.log.firstChild);
    while (els.log.children.length > AVL_LOG_LIMIT)
      els.log.removeChild(els.log.lastChild);
  }

  function setButtonsDisabled(disabled) {
    [els.insertBtn, els.demoBtn, els.clearBtn]
      .forEach((b) => { b.disabled = disabled; });
  }

  function validValue(value) {
    return Number.isInteger(value) && value >= 0 && value <= AVL_MAX_VALUE;
  }

  /* How many nodes an insert of this value would compare — the walk
     length, used to pace the demo. */
  function pathLength(value) {
    let node = root;
    let n = 0;
    while (node !== null) {
      n++;
      if (value === node.value) break;
      node = value < node.value ? node.left : node.right;
    }
    return n;
  }

  function directionText(value, nodeValue) {
    return value < nodeValue
      ? `${value} < ${nodeValue}, go left`
      : `${value} > ${nodeValue}, go right`;
  }

  /* Rewire a parent's child pointer (or the root) after a rotation. */
  function replaceChild(parent, oldChild, newChild) {
    if (parent === null) root = newChild;
    else if (parent.left === oldChild) parent.left = newChild;
    else parent.right = newChild;
  }

  /* One rotation step inside the rebalance walk: name it, light up
     the nodes it moves, wait a beat, then apply it and re-render.
     `done` runs after the rotation has landed. */
  function rotationStep(kind, pivot, child, parent, done, id) {
    const verb = kind === "right" ? "Right rotation" : "Left rotation";
    const at = pivot.value;
    rotating = new Set([pivot, child]);
    imbalanced = pivot;
    current = null;
    render();
    setStatus(`${verb} at ${at} — ${child.value} becomes the new subtree root`
      + ` and ${at} drops to its ${kind === "right" ? "right" : "left"}.`);
    setTimeout(() => {
      if (id !== walkId) return;
      const newRoot = kind === "right" ? avlRotateRight(pivot) : avlRotateLeft(pivot);
      replaceChild(parent, pivot, newRoot);
      rotations++;
      lastRotation = { kind, at, child: child.value };
      rotating = new Set([newRoot, pivot]);
      render();
      setStatus(`${verb} at ${at} done — ${child.value} is the subtree root now,`
        + ` ${at} sits below it, and the balance factors are back in range.`);
      log(`${kind} rotation at ${at} -> ${child.value} is the subtree root`);
      setTimeout(() => {
        if (id !== walkId) return;
        rotating = new Set();
        imbalanced = null;
        render();
        done();
      }, AVL_STEP_MS);
    }, AVL_STEP_MS);
  }

  /* Walk the insert path back up from the deepest ancestor, checking
     each balance factor; the first ancestor that breaks is fixed with
     its rotation case, then the walk continues upward. `done` runs
     when the whole tree is balanced again. */
  function rebalance(path, done, id) {
    /* Ancestors deepest first; path[i - 1] is the parent of path[i]. */
    let index = path.length - 1;
    const nextAncestor = () => {
      if (id !== walkId) return;
      if (index < 0) {
        done();
        return;
      }
      const node = path[index];
      const parent = index === 0 ? null : path[index - 1];
      index--;
      avlUpdateHeight(node);
      const bf = avlBalanceFactor(node);
      current = node;
      visited.add(node);
      render();
      setStatus(`Checking balance at ${node.value} — left height ${height(node.left)},`
        + ` right height ${height(node.right)}, balance factor ${bf >= 0 ? "+" : ""}${bf}.`);
      setTimeout(() => {
        if (id !== walkId) return;
        if (bf > 1 || bf < -1) {
          /* The heavy side and the heavy child's lean name the case:
             same direction is a single rotation, opposite directions
             need two — the child rotates first, then the node. */
          const heavyLeft = bf > 1;
          const heavyChild = heavyLeft ? node.left : node.right;
          const childBf = avlBalanceFactor(heavyChild);
          const single = heavyLeft ? childBf >= 0 : childBf <= 0;
          const caseName = heavyLeft
            ? (single ? "LL" : "LR")
            : (single ? "RR" : "RL");
          const side = heavyLeft ? "left" : "right";
          setStatus(`Imbalance at ${node.value} — balance factor ${bf >= 0 ? "+" : ""}${bf},`
            + ` too heavy on the ${side}. ${caseName} case: `
            + (single
              ? `one ${heavyLeft ? "right" : "left"} rotation at ${node.value}.`
              : `a ${heavyLeft ? "left" : "right"} rotation at ${heavyChild.value} first,`
                + ` then a ${heavyLeft ? "right" : "left"} rotation at ${node.value}.`));
          els.rotationOutput.textContent = `${caseName} case at ${node.value}`
            + ` (balance factor ${bf >= 0 ? "+" : ""}${bf}) — `
            + (single
              ? `single ${heavyLeft ? "right" : "left"} rotation.`
              : `double rotation: ${heavyLeft ? "left" : "right"} at ${heavyChild.value},`
                + ` then ${heavyLeft ? "right" : "left"} at ${node.value}.`);
          log(`${caseName} case at ${node.value} (balance factor ${bf >= 0 ? "+" : ""}${bf})`);
          setTimeout(() => {
            if (id !== walkId) return;
            const secondRotation = () => {
              /* The second rotation runs at the same node, whose
                 parent is unchanged — but its heavy child is now the
                 new subtree root the first rotation put there. */
              const newChild = heavyLeft ? node.left : node.right;
              rotationStep(heavyLeft ? "right" : "left", node, newChild, parent,
                () => { lastRotation.type = caseName; nextAncestor(); }, id);
            };
            if (single) {
              rotationStep(heavyLeft ? "right" : "left", node, heavyChild, parent,
                () => { lastRotation.type = caseName; nextAncestor(); }, id);
            } else {
              /* First rotate the heavy child, then the node itself;
                 the child's new root is the node for the second step. */
              rotationStep(heavyLeft ? "left" : "right", heavyChild,
                heavyLeft ? heavyChild.right : heavyChild.left,
                node, secondRotation, id);
            }
          }, AVL_STEP_MS);
        } else {
          nextAncestor();
        }
      }, AVL_STEP_MS);
    };
    nextAncestor();
  }

  /* Insert with an optional completion callback (the demo chains on
     it). `done` is called with true once the tree is balanced again,
     or with false immediately if the insert was rejected. */
  function insert(value, done) {
    const finish = (ok) => { if (typeof done === "function") done(ok); };
    if (animating) { finish(false); return false; }
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${AVL_MAX_VALUE}.`);
      finish(false);
      return false;
    }
    if (size >= AVL_MAX_NODES) {
      setStatus(`The tree is full — ${AVL_MAX_NODES} nodes is all the canvas fits. Clear it to start over.`);
      finish(false);
      return false;
    }
    /* Duplicates are rejected up front, so the walk never has to explain one. */
    let probe = root;
    while (probe !== null) {
      if (value === probe.value) {
        setStatus(`${value} is already in the tree — an AVL tree holds each value once.`);
        finish(false);
        return false;
      }
      probe = value < probe.value ? probe.left : probe.right;
    }
    animating = true;
    setButtonsDisabled(true);
    visited = new Set();
    current = null;
    entering = null;
    rotating = new Set();
    imbalanced = null;
    const id = ++walkId;
    let node = root;
    let parent = null;
    let comparisons = 0;
    const path = [];
    const step = () => {
      if (id !== walkId) return;
      if (node === null) {
        /* Ran out of tree: attach the new node here. */
        const leaf = avlNode(value);
        if (parent === null) root = leaf;
        else if (value < parent.value) parent.left = leaf;
        else parent.right = leaf;
        size++;
        ops++;
        entering = leaf;
        current = null;
        render();
        setStatus(parent === null
          ? `Inserted ${value} as the root — the tree starts here. Now checking the balance back up…`
          : `Inserted ${value} under ${parent.value} after ${comparisons} comparison${comparisons === 1 ? "" : "s"} — ${directionText(value, parent.value)}. Now checking the balance back up…`);
        log(`insert ${value} -> size ${size}, height ${height(root)}`);
        setTimeout(() => { entering = null; render(); }, AVL_FOUND_MS);
        /* The rebalance walk runs on the ancestors, deepest first. */
        rebalance(path, () => {
          if (id !== walkId) return;
          animating = false;
          setButtonsDisabled(false);
          render();
          setStatus(`Tree is balanced — height ${height(root)}, root ${root.value},`
            + ` ${rotations} rotation${rotations === 1 ? "" : "s"} so far. Insert another value, or run the demo.`);
          finish(true);
        }, id);
        return;
      }
      comparisons++;
      current = node;
      visited.add(node);
      render();
      setStatus(`Compare ${value} with ${node.value} — ${directionText(value, node.value)} (comparison ${comparisons}).`);
      parent = node;
      path.push(node);
      node = value < node.value ? node.left : node.right;
      setTimeout(step, AVL_STEP_MS);
    };
    step();
    return true;
  }

  /* Reset the tree itself, without touching the demo flags — the demo
     clears between rotation cases while it is still running. */
  function clearTree() {
    walkId++;
    root = null;
    size = 0;
    current = null;
    entering = null;
    visited = new Set();
    rotating = new Set();
    imbalanced = null;
    lastRotation = null;
    els.rotationOutput.textContent = AVL_ROTATION_PLACEHOLDER;
    render();
  }

  function clear() {
    if (animating) return;
    stopDemo();
    clearTree();
    setStatus("Tree cleared.");
    log("clear -> tree is empty");
  }

  function stopDemo() {
    if (demoTimer !== null) {
      clearTimeout(demoTimer);
      demoTimer = null;
    }
    demoRunning = false;
    els.demoBtn.disabled = false;
  }

  /* Runs the scripted story case by case, chaining on each insert's
     completion so the demo never overtakes the animation: LL, then RR,
     then LR, then RL, clearing between cases. */
  function demo() {
    if (demoRunning || animating) return false;
    clearTree();
    demoRunning = true;
    els.demoBtn.disabled = true;
    setStatus("Demo running — one case per rotation: LL, then RR, LR and RL…");
    let caseIndex = 0;
    const runCase = () => {
      if (caseIndex >= AVL_DEMO_SCRIPT.length) {
        stopDemo();
        setStatus("Demo finished — all four rotations: LL, RR, LR and RL. The RL tree is standing — insert your own values, or run it again.");
        return;
      }
      const rotationCase = AVL_DEMO_SCRIPT[caseIndex];
      caseIndex++;
      clearTree();
      setStatus(`${rotationCase.name} case — inserting ${rotationCase.values.join(", ")}…`);
      let i = 0;
      const runInsert = () => {
        if (i >= rotationCase.values.length) {
          demoTimer = setTimeout(runCase, AVL_DEMO_STEP_MS * 2);
          return;
        }
        const value = rotationCase.values[i];
        i++;
        insert(value, runInsert);
      };
      demoTimer = setTimeout(runInsert, AVL_DEMO_STEP_MS);
    };
    runCase();
    return true;
  }

  function reset() {
    stopDemo();
    walkId++;
    root = null;
    size = 0;
    ops = 0;
    rotations = 0;
    animating = false;
    current = null;
    entering = null;
    visited = new Set();
    rotating = new Set();
    imbalanced = null;
    lastRotation = null;
    setButtonsDisabled(false);
    els.rotationOutput.textContent = AVL_ROTATION_PLACEHOLDER;
    render();
    els.log.innerHTML = "";
    setStatus("Tree is empty — insert a value to start.");
  }

  function readValueInput() {
    const n = parseInt(els.valueInput.value, 10);
    return Number.isInteger(n) ? n : NaN;
  }

  els.insertBtn.addEventListener("click", () => insert(readValueInput()));
  els.demoBtn.addEventListener("click", () => demo());
  els.clearBtn.addEventListener("click", () => clear());
  els.valueInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") insert(readValueInput());
  });

  render();
  setStatus("Tree is empty — insert a value to start.");
  return {
    insert, clear, demo, reset, stopDemo, pathLength,
    get size() { return size; },
    get treeHeight() { return height(root); },
    get rootValue() { return root === null ? null : root.value; },
    get rotations() { return rotations; },
    get operations() { return ops; },
    get items() { return avlInOrder(root, []); },
    get balanced() { return avlIsBalanced(root); },
    get demoRunning() { return demoRunning; },
    get animating() { return animating; },
    get lastRotation() { return lastRotation; },
  };
}

/* Wires the AVL panel in index.html; called once from app.js. */
function initAvlViz() {
  const $ = (id) => document.getElementById(id);
  return createAvlViz({
    stage: $("avlStage"),
    valueInput: $("avlValueInput"),
    insertBtn: $("insertAvlBtn"),
    demoBtn: $("demoAvlBtn"),
    clearBtn: $("clearAvlBtn"),
    size: $("avlSize"),
    height: $("avlHeight"),
    root: $("avlRoot"),
    rotations: $("avlRotations"),
    ops: $("avlOps"),
    status: $("avlStatus"),
    rotationOutput: $("avlRotationOutput"),
    log: $("avlLog"),
  });
}

/* ------------------------------------------------------------------ */
/* Hash table visualizer — h(key) = key mod 8, collisions resolved   */
/* by chaining. Each bucket is a row; keys that land in the same      */
/* bucket chain up left to right, so a collision reads at a glance.   */
/* ------------------------------------------------------------------ */

const HASH_INFO = {
  complexity: "O(1) average, O(n) worst",
  cases: {
    best: "O(1) — the key hashes straight to an empty bucket",
    average: "O(1) — with a good hash function and a low load factor, chains stay short",
    worst: "O(n) — every key collides into the same bucket and the chain becomes a list",
    note: "A hash table trades space for speed: the hash function turns a key into a bucket index in O(1), and collisions are resolved by chaining — each bucket holds a small list of the keys that landed there. Keep the load factor low and the chains stay short.",
  },
  pseudocode:
`hash(key)            <- turn the key into a bucket
  return key mod m       (m = number of buckets)
insert(key)          <- chain on collision
  i = hash(key)
  if key in buckets[i]: already here, stop
  buckets[i].append(key) <- behind any keys already there
search(key)          <- look only in one bucket
  i = hash(key)
  return key in buckets[i]
delete(key)          <- unlink from its chain
  i = hash(key)
  buckets[i].remove(key)`,
};

const HASH_BUCKET_COUNT = 8;
const HASH_MAX_VALUE = 999;
const HASH_LOG_LIMIT = 8;
/* Pause on each demo step, so the hash computation reads before the
   next key lands. */
const HASH_DEMO_STEP_MS = 650;

/* The scripted demo: 10, 18 and 26 all hash to bucket 2 (a chain of
   three), then a search finds 18 mid-chain; 5 and 13 collide in
   bucket 5; deleting 18 leaves both chains intact. */
const HASH_DEMO_SCRIPT = [
  { op: "insert", value: 10 },
  { op: "insert", value: 18 },
  { op: "insert", value: 26 },
  { op: "search", value: 18 },
  { op: "insert", value: 5 },
  { op: "insert", value: 13 },
  { op: "delete", value: 18 },
  { op: "search", value: 26 },
];
/* Shown in the formula line until the first key is hashed. */
const HASH_FORMULA_PLACEHOLDER =
  "No hash computed yet — insert or search a key to see h(key) = key mod 8.";

/* --- Pure hash helpers: no DOM, so a node test can drive them. --- */

/* h(key) = key mod m, always in 0..m-1 even for negative keys. */
function hashIndexOf(key, bucketCount) {
  return ((key % bucketCount) + bucketCount) % bucketCount;
}

/* Pure chaining model: buckets of key lists, a collision counter and
   a load factor — no DOM, so a node test can drive it directly. */
function createHashModel(bucketCount) {
  const buckets = Array.from({ length: bucketCount }, () => []);
  let collisions = 0;
  let size = 0;

  function insert(key) {
    const index = hashIndexOf(key, bucketCount);
    const chain = buckets[index];
    const position = chain.indexOf(key);
    if (position !== -1)
      return { index, position, inserted: false, collided: chain.length > 1 };
    const collided = chain.length > 0;
    chain.push(key);
    size++;
    if (collided) collisions++;
    return { index, position: chain.length - 1, inserted: true, collided };
  }

  function search(key) {
    const index = hashIndexOf(key, bucketCount);
    const position = buckets[index].indexOf(key);
    return { index, position, found: position !== -1 };
  }

  function remove(key) {
    const index = hashIndexOf(key, bucketCount);
    const position = buckets[index].indexOf(key);
    if (position === -1) return { index, position, removed: false };
    buckets[index].splice(position, 1);
    size--;
    return { index, position, removed: true };
  }

  function clear() {
    buckets.forEach((chain) => { chain.length = 0; });
    collisions = 0;
    size = 0;
  }

  return {
    insert, search, remove, clear,
    get buckets() { return buckets.map((chain) => chain.slice()); },
    get size() { return size; },
    get collisions() { return collisions; },
    get bucketCount() { return bucketCount; },
    loadFactor() { return size / bucketCount; },
  };
}

/* els: { stage, valueInput, insertBtn, searchBtn, deleteBtn, demoBtn,
          clearBtn, size, buckets, loadFactor, collisions, status,
          formulaOutput, log } — plain DOM elements. The factory keeps
   no other state, so a node test can drive it with stub elements. */
function createHashViz(els) {
  const model = createHashModel(HASH_BUCKET_COUNT);
  let ops = 0;
  let demoTimer = null;
  let demoRunning = false;
  /* The bucket and chain position the last operation touched, and
     how it should light up: a fresh key, a found key, or a key that
     collided into an occupied bucket. Cleared by the next operation. */
  let highlight = null;
  let formula = HASH_FORMULA_PLACEHOLDER;

  function render() {
    els.stage.innerHTML = "";
    model.buckets.forEach((chain, index) => {
      const row = document.createElement("div");
      row.className = "hash-bucket";
      if (highlight !== null && highlight.index === index) row.classList.add("active");
      if (chain.length > 1) row.classList.add("has-collision");

      const label = document.createElement("span");
      label.className = "hash-bucket-label";
      label.textContent = "Bucket " + index;
      if (chain.length > 1) {
        const tag = document.createElement("span");
        tag.className = "hash-collision-tag";
        tag.textContent = " · collision ×" + (chain.length - 1);
        label.appendChild(tag);
      }
      row.appendChild(label);

      const chainEl = document.createElement("div");
      chainEl.className = "hash-chain";
      if (chain.length === 0) {
        const empty = document.createElement("span");
        empty.className = "hash-chain-empty";
        empty.textContent = "— empty —";
        chainEl.appendChild(empty);
      }
      chain.forEach((value, position) => {
        if (position > 0) {
          const arrow = document.createElement("span");
          arrow.className = "hash-arrow";
          arrow.textContent = "→";
          chainEl.appendChild(arrow);
        }
        const node = document.createElement("div");
        node.className = "hash-node";
        node.textContent = String(value);
        if (highlight !== null && highlight.index === index
            && highlight.position === position) {
          if (highlight.kind === "found") node.classList.add("found");
          else if (highlight.kind === "collision") node.classList.add("collision");
          else node.classList.add("entering");
        }
        chainEl.appendChild(node);
      });
      row.appendChild(chainEl);
      els.stage.appendChild(row);
    });
    els.size.textContent = String(model.size);
    els.buckets.textContent = String(model.bucketCount);
    els.loadFactor.textContent = model.loadFactor().toFixed(2);
    els.collisions.textContent = String(model.collisions);
    els.ops.textContent = String(ops);
    els.formulaOutput.textContent = formula;
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function setFormula(message) {
    formula = message;
    els.formulaOutput.textContent = message;
  }

  function log(message) {
    const entry = document.createElement("li");
    entry.textContent = message;
    els.log.insertBefore(entry, els.log.firstChild);
    while (els.log.children.length > HASH_LOG_LIMIT)
      els.log.removeChild(els.log.lastChild);
  }

  function setButtonsDisabled(disabled) {
    [els.insertBtn, els.searchBtn, els.deleteBtn, els.demoBtn, els.clearBtn]
      .forEach((b) => { b.disabled = disabled; });
  }

  function hashLine(value, index) {
    return `h(${value}) = ${value} mod ${HASH_BUCKET_COUNT} = ${index}`;
  }

  function readValueInput() {
    const n = parseInt(els.valueInput.value, 10);
    return Number.isInteger(n) ? n : NaN;
  }

  function validValue(value) {
    if (!Number.isInteger(value) || value < 0 || value > HASH_MAX_VALUE) {
      setStatus(`Enter a whole number between 0 and ${HASH_MAX_VALUE}.`);
      return false;
    }
    return true;
  }

  function insert(value) {
    if (!validValue(value)) return false;
    const result = model.insert(value);
    ops++;
    if (!result.inserted) {
      highlight = { index: result.index, position: result.position, kind: "found" };
      setFormula(`${hashLine(value, result.index)} — already in the table.`);
      render();
      setStatus(`${value} is already in bucket ${result.index} — duplicates are not stored.`);
      log(`insert ${value} -> already present (bucket ${result.index})`);
      return false;
    }
    highlight = {
      index: result.index,
      position: result.position,
      kind: result.collided ? "collision" : "entering",
    };
    const chain = model.buckets[result.index];
    setFormula(result.collided
      ? `${hashLine(value, result.index)} — collision! Bucket ${result.index} already held `
        + `${chain.slice(0, -1).join(", ")}, so ${value} chains behind it `
        + `(collision #${model.collisions}).`
      : `${hashLine(value, result.index)} — bucket ${result.index} was empty.`);
    render();
    setStatus(result.collided
      ? `Inserted ${value} into bucket ${result.index} — collision, chained behind `
        + `${chain.slice(0, -1).join(", ")}.`
      : `Inserted ${value} into bucket ${result.index} — no collision.`);
    log(`insert ${value} -> bucket ${result.index}`
      + (result.collided ? " (collision)" : ""));
    return true;
  }

  function search(value) {
    if (!validValue(value)) return false;
    const result = model.search(value);
    ops++;
    setFormula(`${hashLine(value, result.index)} — `
      + (result.found
        ? `found at chain position ${result.position}.`
        : `bucket ${result.index} holds ${model.buckets[result.index].join(", ") || "nothing"} — not here.`));
    if (result.found) {
      highlight = { index: result.index, position: result.position, kind: "found" };
      render();
      setStatus(`Found ${value} in bucket ${result.index}, chain position ${result.position} — `
        + `only that one bucket had to be checked.`);
      log(`search ${value} -> found (bucket ${result.index}, position ${result.position})`);
    } else {
      highlight = { index: result.index, position: -1, kind: "entering" };
      render();
      setStatus(`${value} is not in the table — ${hashLine(value, result.index)}, `
        + `and bucket ${result.index} does not hold it.`);
      log(`search ${value} -> not found (bucket ${result.index})`);
    }
    return result.found;
  }

  function remove(value) {
    if (!validValue(value)) return false;
    const result = model.remove(value);
    ops++;
    if (!result.removed) {
      highlight = { index: result.index, position: -1, kind: "entering" };
      setFormula(`${hashLine(value, result.index)} — not in bucket ${result.index}, nothing to delete.`);
      render();
      setStatus(`${value} is not in the table — nothing to delete.`);
      log(`delete ${value} -> not present (bucket ${result.index})`);
      return false;
    }
    highlight = null;
    setFormula(`${hashLine(value, result.index)} — removed from chain position ${result.position}.`);
    render();
    setStatus(`Deleted ${value} from bucket ${result.index}`
      + (model.buckets[result.index].length === 0 ? " — the bucket is empty now." : "."));
    log(`delete ${value} -> removed from bucket ${result.index}`);
    return true;
  }

  function clear() {
    if (demoRunning) return;
    stopDemo();
    model.clear();
    highlight = null;
    setFormula(HASH_FORMULA_PLACEHOLDER);
    render();
    setStatus("Table cleared.");
    log("clear -> table is empty");
  }

  function stopDemo() {
    if (demoTimer !== null) {
      clearTimeout(demoTimer);
      demoTimer = null;
    }
    demoRunning = false;
    els.demoBtn.disabled = false;
  }

  /* Runs the scripted story one step at a time: a 3-long collision
     chain in bucket 2, a mid-chain search, a second collision in
     bucket 5, then a delete that leaves both chains standing. */
  function demo() {
    if (demoRunning) return false;
    clear();
    demoRunning = true;
    els.demoBtn.disabled = true;
    setStatus("Demo running — watch 10, 18 and 26 collide into bucket 2…");
    let step = 0;
    const runStep = () => {
      if (step >= HASH_DEMO_SCRIPT.length) {
        stopDemo();
        setStatus("Demo finished — bucket 2 holds 10 → 26 and bucket 5 holds 5 → 13. Insert your own keys, or run it again.");
        return;
      }
      const action = HASH_DEMO_SCRIPT[step];
      step++;
      if (action.op === "insert") insert(action.value);
      else if (action.op === "search") search(action.value);
      else if (action.op === "delete") remove(action.value);
      demoTimer = setTimeout(runStep, HASH_DEMO_STEP_MS);
    };
    demoTimer = setTimeout(runStep, HASH_DEMO_STEP_MS);
    return true;
  }

  function reset() {
    stopDemo();
    model.clear();
    ops = 0;
    highlight = null;
    setButtonsDisabled(false);
    setFormula(HASH_FORMULA_PLACEHOLDER);
    render();
    els.log.innerHTML = "";
    setStatus("Table is empty — insert a key to start.");
  }

  els.insertBtn.addEventListener("click", () => insert(readValueInput()));
  els.searchBtn.addEventListener("click", () => search(readValueInput()));
  els.deleteBtn.addEventListener("click", () => remove(readValueInput()));
  els.demoBtn.addEventListener("click", () => demo());
  els.clearBtn.addEventListener("click", () => clear());
  els.valueInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") insert(readValueInput());
  });

  render();
  setStatus("Table is empty — insert a key to start.");
  return {
    insert, search, remove, clear, demo, reset, stopDemo,
    get size() { return model.size; },
    get collisions() { return model.collisions; },
    get loadFactor() { return model.loadFactor(); },
    get buckets() { return model.buckets; },
    get operations() { return ops; },
    get formula() { return formula; },
    get demoRunning() { return demoRunning; },
  };
}

/* Wires the hash table panel in index.html; called once from app.js. */
function initHashViz() {
  const $ = (id) => document.getElementById(id);
  return createHashViz({
    stage: $("hashStage"),
    valueInput: $("hashValueInput"),
    insertBtn: $("insertHashBtn"),
    searchBtn: $("searchHashBtn"),
    deleteBtn: $("deleteHashBtn"),
    demoBtn: $("demoHashBtn"),
    clearBtn: $("clearHashBtn"),
    size: $("hashSize"),
    buckets: $("hashBuckets"),
    loadFactor: $("hashLoadFactor"),
    collisions: $("hashCollisions"),
    ops: $("hashOps"),
    status: $("hashStatus"),
    formulaOutput: $("hashFormulaOutput"),
    log: $("hashLog"),
  });
}

/* ------------------------------------------------------------------ */
/* Heap visualizer — a complete binary tree kept in an array: the     */
/* root is the extreme value (largest in a max-heap, smallest in a    */
/* min-heap), and every parent beats its children. Insert appends at  */
/* the end and bubbles up, swapping with its parent while it wins;    */
/* extract takes the root, moves the last element up top, and sifts   */
/* it down, swapping with the better child while it loses. The tree   */
/* view and the array view show the same heap side by side, so the    */
/* index arithmetic — parent (i - 1) / 2, children 2i + 1 and 2i + 2  */
/* — reads off both at once.                                          */
/* ------------------------------------------------------------------ */

const HEAP_INFO = {
  complexity: "O(log n)",
  cases: {
    best: "O(1) — peek reads the root; an insert that stays put swaps nothing",
    average: "O(log n) — insert and extract walk one root-to-leaf path",
    worst: "O(log n) — a value that bubbles all the way up (or down) swaps once per level",
    note: "A heap is a complete binary tree stored in an array: index 0 is the root, index i has parent (i - 1) / 2 and children 2i + 1 and 2i + 2. The root is always the extreme value, so peek is O(1) — which is why heaps back priority queues and heap sort. Switching min/max re-heapifies the same values in place.",
  },
  pseudocode:
`insert(value)         <- append, then bubble up
  heap[size++] = value
  i = size - 1
  while i > 0 and heap[i] beats heap[parent(i)]:
    swap heap[i], heap[parent(i)]
    i = parent(i)
extract()             <- take the root, sift the last one down
  root = heap[0]
  heap[0] = heap[--size]
  i = 0
  while heap[i] loses to its better child:
    swap heap[i], heap[betterChild(i)]
    i = betterChild(i)
peek()                <- look at the root
  return heap[0]
min or max            <- the mode flips which value wins`,
};

const HEAP_MAX_VALUE = 999;
/* The canvas fits about 15 nodes before the tree gets cramped. */
const HEAP_MAX_NODES = 15;
const HEAP_LOG_LIMIT = 8;
/* Pause on each comparison during a bubble-up or sift-down, so the
   swaps read step by step. */
const HEAP_STEP_MS = 500;
const HEAP_DEMO_STEP_MS = 550;
const HEAP_FLASH_MS = 900;
/* Node circles are 52px; one slot per position in the widest level
   keeps siblings apart. */
const HEAP_NODE_SIZE = 52;
const HEAP_SLOT_WIDTH = 64;
const HEAP_ROW_HEIGHT = 76;
const HEAP_TOP_PAD = 22;

/* The scripted demo: build a max-heap from 50 / 30 / 70 / 20 / 40 /
   60 / 80 (70 bubbles to the root, then 80 takes it), peek at the
   root, then extract twice — ending with a 5-element heap standing,
   so it can be replayed straight away. */
const HEAP_DEMO_SCRIPT = [
  { op: "insert", value: 50 }, { op: "insert", value: 30 },
  { op: "insert", value: 70 }, { op: "insert", value: 20 },
  { op: "insert", value: 40 }, { op: "insert", value: 60 },
  { op: "insert", value: 80 },
  { op: "peek" },
  { op: "extract" },
  { op: "extract" },
];

/* els: { treeStage, arrayStage, valueInput, modeSelect, insertBtn,
          extractBtn, peekBtn, demoBtn, clearBtn, mode, size, height,
          root, ops, status, log } — plain DOM elements. The factory
   keeps no other state, so a node test can drive it with stub
   elements. */
function createHeapViz(els) {
  let items = [];
  let isMax = true;
  let ops = 0;
  let animating = false;
  let demoTimer = null;
  let demoRunning = false;
  /* Bumped on clear / reset, so a bubble-up or sift-down left over
     from the old heap stops instead of swapping into the new one. */
  let opId = 0;
  /* The pair a step is comparing: a is the node moving, b the node
     it is measured against. */
  let comparing = null;
  let entering = null;
  let flash = null;
  /* The result of the most recent finished extract / peek, for tests. */
  let lastExtract = null;
  let lastPeek = null;

  function parent(i) { return Math.floor((i - 1) / 2); }
  function left(i) { return 2 * i + 1; }
  function right(i) { return 2 * i + 2; }

  function height() {
    if (items.length === 0) return 0;
    return Math.floor(Math.log2(items.length)) + 1;
  }

  /* True when a should sit above b: larger in a max-heap, smaller in
     a min-heap. */
  function better(a, b) {
    return isMax ? a > b : a < b;
  }

  function modeName() {
    return isMax ? "Max-heap" : "Min-heap";
  }

  function extremeWord() {
    return isMax ? "largest" : "smallest";
  }

  function swap(i, j) {
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }

  /* Synchronous sift-down, used by the mode switch: re-heapify the
     current values bottom-up, leaves already satisfying the heap
     property, so the whole rebuild is O(n). */
  function siftDownSync(i) {
    for (;;) {
      const l = left(i);
      const r = right(i);
      let best = i;
      if (l < items.length && better(items[l], items[best])) best = l;
      if (r < items.length && better(items[r], items[best])) best = r;
      if (best === i) return;
      swap(i, best);
      i = best;
    }
  }

  /* A complete tree: level d holds 2^d nodes, and node i sits in the
     slot (i - (2^d - 1)) of its level, centred across the canvas. */
  function layout(width) {
    const positions = new Map();
    const levels = height();
    items.forEach((value, i) => {
      const depth = Math.floor(Math.log2(i + 1));
      const levelStart = Math.pow(2, depth) - 1;
      const slots = Math.pow(2, depth);
      const slot = i - levelStart;
      positions.set(i, {
        x: HEAP_TOP_PAD + ((slot + 0.5) * (width - 2 * HEAP_TOP_PAD)) / slots,
        y: HEAP_TOP_PAD + depth * HEAP_ROW_HEIGHT,
        depth,
      });
    });
    return { positions, levels };
  }

  function render() {
    /* Tree view. */
    els.treeStage.innerHTML = "";
    const canvas = document.createElement("div");
    canvas.className = "heap-canvas";
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "heap-empty";
      empty.textContent = "— empty —";
      canvas.appendChild(empty);
    } else {
      const levels = height();
      const width = HEAP_TOP_PAD * 2 + Math.pow(2, levels - 1) * HEAP_SLOT_WIDTH;
      const canvasHeight = HEAP_TOP_PAD * 2 + (levels - 1) * HEAP_ROW_HEIGHT + HEAP_NODE_SIZE;
      const { positions } = layout(width);
      canvas.style.width = width + "px";
      canvas.style.height = canvasHeight + "px";
      /* Edges first, so nodes draw on top of them. */
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "heap-edges");
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(canvasHeight));
      for (let i = 1; i < items.length; i++) {
        const p = positions.get(parent(i));
        const c = positions.get(i);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(p.x));
        line.setAttribute("y1", String(p.y + HEAP_NODE_SIZE));
        line.setAttribute("x2", String(c.x));
        line.setAttribute("y2", String(c.y));
        svg.appendChild(line);
      }
      canvas.appendChild(svg);
      positions.forEach((pos, i) => {
        const box = document.createElement("div");
        box.className = "heap-node";
        box.textContent = String(items[i]);
        if (i === 0) box.classList.add("root");
        if (comparing !== null && i === comparing.a) box.classList.add("current");
        if (comparing !== null && i === comparing.b) box.classList.add("visited");
        if (i === entering) box.classList.add("entering");
        if (i === flash) box.classList.add("peek");
        box.style.left = (pos.x - HEAP_NODE_SIZE / 2) + "px";
        box.style.top = pos.y + "px";
        canvas.appendChild(box);
      });
    }
    els.treeStage.appendChild(canvas);

    /* Array view: the same heap as a row of indexed cells, so the
       parent / child arithmetic reads off the positions. */
    els.arrayStage.innerHTML = "";
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "heap-empty";
      empty.textContent = "— empty —";
      els.arrayStage.appendChild(empty);
    } else {
      items.forEach((value, i) => {
        const cell = document.createElement("div");
        cell.className = "heap-cell";
        if (i === 0) cell.classList.add("root");
        if (comparing !== null && i === comparing.a) cell.classList.add("current");
        if (comparing !== null && i === comparing.b) cell.classList.add("visited");
        if (i === entering) cell.classList.add("entering");
        if (i === flash) cell.classList.add("peek");
        const index = document.createElement("span");
        index.className = "heap-index";
        index.textContent = String(i);
        const val = document.createElement("span");
        val.className = "heap-value";
        val.textContent = String(value);
        cell.appendChild(index);
        cell.appendChild(val);
        els.arrayStage.appendChild(cell);
      });
    }

    els.mode.textContent = modeName();
    els.size.textContent = String(items.length);
    els.height.textContent = items.length === 0 ? "—" : String(height());
    els.root.textContent = items.length === 0 ? "—" : String(items[0]);
    els.ops.textContent = String(ops);
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function log(message) {
    const entry = document.createElement("li");
    entry.textContent = message;
    els.log.insertBefore(entry, els.log.firstChild);
    while (els.log.children.length > HEAP_LOG_LIMIT)
      els.log.removeChild(els.log.lastChild);
  }

  function setButtonsDisabled(disabled) {
    [els.insertBtn, els.extractBtn, els.peekBtn, els.modeSelect,
     els.demoBtn, els.clearBtn]
      .forEach((b) => { b.disabled = disabled; });
  }

  function validValue(value) {
    return Number.isInteger(value) && value >= 0 && value <= HEAP_MAX_VALUE;
  }

  /* done fires when the animation settles, so the demo can chain the
     next step after this one instead of guessing how long it takes. */
  function insert(value, done) {
    if (animating) return false;
    if (!validValue(value)) {
      setStatus(`Enter a whole number between 0 and ${HEAP_MAX_VALUE}.`);
      return false;
    }
    if (items.length >= HEAP_MAX_NODES) {
      setStatus(`The heap is full — ${HEAP_MAX_NODES} nodes is all the canvas fits. Clear it to start over.`);
      return false;
    }
    animating = true;
    setButtonsDisabled(true);
    items.push(value);
    ops++;
    const id = ++opId;
    let i = items.length - 1;
    let swaps = 0;
    entering = i;
    comparing = null;
    render();
    setStatus(`Inserted ${value} at index ${i} — now bubbling it up…`);
    log(`insert ${value} -> index ${i}`);
    const finish = () => {
      comparing = null;
      entering = null;
      animating = false;
      setButtonsDisabled(false);
      render();
      setStatus(i === 0 && swaps === 0
        ? `${value} is the first element — it is the root.`
        : swaps === 0
          ? `${value} stays at index ${i} — it does not beat its parent, so the heap is already valid.`
          : `${value} bubbled up to index ${i} in ${swaps} swap${swaps === 1 ? "" : "s"} — root is now ${items[0]}.`);
      if (done) done();
    };
    const step = () => {
      if (id !== opId) return;
      if (i === 0) {
        finish();
        return;
      }
      const p = parent(i);
      comparing = { a: i, b: p };
      render();
      if (better(items[i], items[p])) {
        setStatus(`${items[i]} beats its parent ${items[p]} at index ${p} — swapping them.`);
        swap(i, p);
        swaps++;
        comparing = { a: p, b: i };
        i = p;
        render();
        setTimeout(step, HEAP_STEP_MS);
      } else {
        setStatus(`${items[i]} does not beat its parent ${items[p]} — it stays at index ${i}.`);
        finish();
      }
    };
    setTimeout(step, HEAP_STEP_MS);
    return true;
  }

  function extract(done) {
    if (animating) return null;
    if (items.length === 0) {
      setStatus("Heap is empty — nothing to extract.");
      return null;
    }
    animating = true;
    setButtonsDisabled(true);
    const value = items[0];
    lastExtract = value;
    ops++;
    const id = ++opId;
    let swaps = 0;
    if (items.length === 1) {
      items = [];
      comparing = null;
      entering = null;
      animating = false;
      setButtonsDisabled(false);
      render();
      setStatus(`Extracted ${value} — that was the only element, the heap is empty now.`);
      log(`extract -> ${value} (heap empty)`);
      if (done) done();
      return value;
    }
    items[0] = items.pop();
    let i = 0;
    entering = 0;
    comparing = null;
    render();
    setStatus(`Extracted ${value} — moved the last element ${items[0]} to the root, now sifting it down…`);
    log(`extract -> ${value} (size ${items.length})`);
    const finish = () => {
      comparing = null;
      entering = null;
      animating = false;
      setButtonsDisabled(false);
      render();
      setStatus(swaps === 0
        ? `${value} extracted — ${items[0]} already beats both children, so it stays at the root.`
        : `${value} extracted — the replacement settled at index ${i} after ${swaps} swap${swaps === 1 ? "" : "s"}, root is now ${items[0]}.`);
      if (done) done();
    };
    const step = () => {
      if (id !== opId) return;
      const l = left(i);
      const r = right(i);
      let best = i;
      if (l < items.length && better(items[l], items[best])) best = l;
      if (r < items.length && better(items[r], items[best])) best = r;
      if (best === i) {
        finish();
        return;
      }
      comparing = { a: i, b: best };
      render();
      setStatus(`${items[i]} loses to its ${extremeWord()} child ${items[best]} at index ${best} — swapping them.`);
      swap(i, best);
      swaps++;
      comparing = { a: best, b: i };
      i = best;
      render();
      setTimeout(step, HEAP_STEP_MS);
    };
    setTimeout(step, HEAP_STEP_MS);
    return value;
  }

  function peek() {
    if (animating) return null;
    if (items.length === 0) {
      setStatus("Heap is empty — nothing to peek at.");
      return null;
    }
    ops++;
    const value = items[0];
    lastPeek = value;
    flash = 0;
    render();
    setStatus(`Root is ${value} — the ${extremeWord()} value in this ${modeName().toLowerCase()}; peek only looks, the heap is unchanged.`);
    log(`peek -> ${value} (size ${items.length})`);
    setTimeout(() => { flash = null; render(); }, HEAP_FLASH_MS);
    return value;
  }

  /* Flips which value wins and re-heapifies the values already in
     the heap, so the same numbers come out in the opposite order. */
  function setMode(max) {
    if (animating) return false;
    if (max === isMax) return false;
    isMax = max;
    for (let i = parent(items.length - 1); i >= 0; i--) siftDownSync(i);
    ops++;
    comparing = null;
    entering = null;
    flash = null;
    els.modeSelect.value = isMax ? "max" : "min";
    render();
    setStatus(`Switched to ${modeName()} — the same ${items.length} value${items.length === 1 ? "" : "s"} re-heapified`
      + (items.length === 0 ? "." : `, root is now ${items[0]}.`));
    log(`mode -> ${modeName().toLowerCase()}`
      + (items.length === 0 ? "" : ` (root ${items[0]})`));
    return true;
  }

  function clear() {
    if (animating) return;
    stopDemo();
    opId++;
    items = [];
    comparing = null;
    entering = null;
    flash = null;
    render();
    setStatus("Heap cleared.");
    log("clear -> heap is empty");
  }

  function stopDemo() {
    if (demoTimer !== null) {
      clearTimeout(demoTimer);
      demoTimer = null;
    }
    demoRunning = false;
    els.demoBtn.disabled = false;
  }

  /* Runs the scripted story one step at a time. Each insert and
     extract reports back when its animation settles, so the next
     step starts on time instead of on a guess. */
  function demo() {
    if (demoRunning || animating) return false;
    clear();
    demoRunning = true;
    els.demoBtn.disabled = true;
    setStatus("Demo running — building a max-heap from 50, 30, 70, 20, 40, 60, 80…");
    let step = 0;
    const next = () => { demoTimer = setTimeout(runStep, HEAP_DEMO_STEP_MS); };
    const runStep = () => {
      if (step >= HEAP_DEMO_SCRIPT.length) {
        stopDemo();
        setStatus(`Demo finished — root is ${items.length === 0 ? "—" : items[0]} after two extracts. Insert your own values, or run it again.`);
        return;
      }
      const action = HEAP_DEMO_SCRIPT[step];
      step++;
      if (action.op === "insert") insert(action.value, next);
      else if (action.op === "extract") extract(next);
      else if (action.op === "peek") { peek(); next(); }
    };
    demoTimer = setTimeout(runStep, HEAP_DEMO_STEP_MS);
    return true;
  }

  function reset() {
    stopDemo();
    opId++;
    items = [];
    isMax = true;
    ops = 0;
    animating = false;
    comparing = null;
    entering = null;
    flash = null;
    lastExtract = null;
    lastPeek = null;
    setButtonsDisabled(false);
    els.modeSelect.value = "max";
    render();
    els.log.innerHTML = "";
    setStatus("Heap is empty — insert a value to start.");
  }

  function readValueInput() {
    const n = parseInt(els.valueInput.value, 10);
    return Number.isInteger(n) ? n : NaN;
  }

  els.insertBtn.addEventListener("click", () => insert(readValueInput()));
  els.extractBtn.addEventListener("click", () => extract());
  els.peekBtn.addEventListener("click", () => peek());
  els.modeSelect.addEventListener("change", () => setMode(els.modeSelect.value === "max"));
  els.demoBtn.addEventListener("click", () => demo());
  els.clearBtn.addEventListener("click", () => clear());
  els.valueInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") insert(readValueInput());
  });

  render();
  setStatus("Heap is empty — insert a value to start.");
  return {
    insert, extract, peek, setMode, clear, demo, reset, stopDemo,
    get size() { return items.length; },
    get root() { return items.length === 0 ? null : items[0]; },
    get operations() { return ops; },
    get items() { return items.slice(); },
    get isMax() { return isMax; },
    get demoRunning() { return demoRunning; },
    get lastExtract() { return lastExtract; },
    get lastPeek() { return lastPeek; },
  };
}

/* Wires the heap panel in index.html; called once from app.js. */
function initHeapViz() {
  const $ = (id) => document.getElementById(id);
  return createHeapViz({
    treeStage: $("heapTreeStage"),
    arrayStage: $("heapArrayStage"),
    valueInput: $("heapValueInput"),
    modeSelect: $("heapModeSelect"),
    insertBtn: $("insertHeapBtn"),
    extractBtn: $("extractHeapBtn"),
    peekBtn: $("peekHeapBtn"),
    demoBtn: $("demoHeapBtn"),
    clearBtn: $("clearHeapBtn"),
    mode: $("heapMode"),
    size: $("heapSize"),
    height: $("heapHeight"),
    root: $("heapRoot"),
    ops: $("heapOps"),
    status: $("heapStatus"),
    log: $("heapLog"),
  });
}

/* ------------------------------------------------------------------ */
/* Graph canvas — BFS traversal animation. A fixed 8-node sample      */
/* graph (A–H) is drawn as circles joined by edges; BFS walks it     */
/* level by level from the chosen start node, using a queue, and DFS   */
/* dives down one branch at a time, using a stack. The node being     */
/* processed glows gold, nodes waiting in the queue / stack are       */
/* outlined purple, visited nodes keep a teal outline, and every     */
/* edge the walk actually crosses lights up teal. The queue / stack   */
/* and the visit order are shown live in the side panel, so the FIFO  */
/* order — the whole point of BFS — and the LIFO order — the whole    */
/* point of DFS — read off the screen. Clicking a node picks it as    */
/* the start node.                                                    */
/* ------------------------------------------------------------------ */

const GRAPH_INFO = {
  complexity: "O(V + E)",
  cases: {
    best: "O(V + E) — every node is dequeued once and every edge is checked once, whatever the shape",
    average: "O(V + E) — same as best: BFS always visits the whole connected component",
    worst: "O(V + E) — a dense graph checks every edge, but never twice",
    note: "BFS visits nodes level by level: everything one hop from the start first, then two hops, and so on. That is why it finds the shortest path (fewest edges) in an unweighted graph — the first time a node is reached, it is reached by the shortest route.",
  },
  pseudocode:
`bfs(start)            <- a queue, first in first out
  queue = [start]
  visited = {start}
  while queue is not empty:
    node = queue.dequeue()      <- front of the queue
    visit(node)                 <- in visit order
    for each neighbour of node:
      if neighbour not visited:
        visited.add(neighbour)
        queue.enqueue(neighbour) <- back of the queue`,
};

/* DFS on the same graph and the same panel: the stack replaces the
   queue, so the walk dives down one branch before backtracking. */
const GRAPH_DFS_INFO = {
  complexity: "O(V + E)",
  cases: {
    best: "O(V + E) — every node is popped once and every edge is checked once, whatever the shape",
    average: "O(V + E) — same as best: DFS always visits the whole connected component",
    worst: "O(V + E) — a dense graph checks every edge, but never twice",
    note: "DFS dives deep first: from the start it follows one branch as far as it goes, backtracks, then tries the next branch. That makes it the tool for cycle detection and topological sort — but unlike BFS it does not find shortest paths. This version is iterative: neighbours are pushed in reverse order, so the smallest neighbour ends up on top of the stack and is visited first.",
  },
  pseudocode:
`dfs(start)            <- a stack, last in first out
  stack = [start]
  visited = {start}
  while stack is not empty:
    node = stack.pop()          <- top of the stack
    visit(node)                 <- in visit order
    for each neighbour of node, in reverse order:
      if neighbour not visited:
        visited.add(neighbour)
        stack.push(neighbour)   <- top of the stack`,
};

/* Fixed sample graph: 8 nodes, 11 edges. Positions are the top-left
   corner of each 52px node circle on a 760 x 310 canvas. */
const GRAPH_NODE_SIZE = 52;
const GRAPH_CANVAS_WIDTH = 760;
const GRAPH_CANVAS_HEIGHT = 310;
const GRAPH_NODES = {
  A: { x: 70, y: 30 }, B: { x: 290, y: 20 }, C: { x: 70, y: 230 },
  D: { x: 290, y: 220 }, E: { x: 500, y: 25 }, F: { x: 500, y: 225 },
  G: { x: 680, y: 30 }, H: { x: 680, y: 230 },
};
const GRAPH_EDGES = [
  ["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "D"],
  ["C", "F"], ["D", "H"], ["E", "F"], ["E", "G"], ["F", "H"], ["G", "H"],
];
const GRAPH_LOG_LIMIT = 8;
/* Pause between steps, so each dequeue and enqueue reads step by step. */
const GRAPH_STEP_MS = 650;
const GRAPH_DEMO_START = "A";
/* Shown in the side panel until the first BFS run. */
const GRAPH_ORDER_PLACEHOLDER =
  "No visit order yet — run BFS to walk the graph level by level.";
const GRAPH_DFS_ORDER_PLACEHOLDER =
  "No visit order yet — run DFS to dive deep from the start node.";
const GRAPH_QUEUE_PLACEHOLDER = "Queue is empty.";
const GRAPH_STACK_PLACEHOLDER = "Stack is empty.";
const GRAPH_STATUS_PLACEHOLDER =
  "Pick a start node, then run BFS — or press Demo to watch it from A.";
const GRAPH_DFS_STATUS_PLACEHOLDER =
  "Pick a start node, then run DFS — or press Demo to watch it from A.";

/* Neighbours of every node, sorted, so the visit order is deterministic. */
function graphAdjacency() {
  const adj = {};
  Object.keys(GRAPH_NODES).forEach((n) => { adj[n] = []; });
  GRAPH_EDGES.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
  Object.keys(adj).forEach((n) => adj[n].sort());
  return adj;
}

/* Pure BFS: the visit order from `start`, with no DOM. The animated
   visualizer steps through the same walk one dequeue at a time. */
function bfsOrder(adjacency, start) {
  const visited = new Set([start]);
  const queue = [start];
  const order = [];
  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);
    (adjacency[node] || []).forEach((next) => {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    });
  }
  return order;
}

/* Pure DFS: the visit order from `start`, with no DOM. Iterative, on
   a stack: neighbours are pushed in reverse sorted order, so the
   smallest neighbour ends up on top and is visited first. The
   animated visualizer steps through the same walk one pop at a time. */
function dfsOrder(adjacency, start) {
  const visited = new Set([start]);
  const stack = [start];
  const order = [];
  while (stack.length > 0) {
    const node = stack.pop();
    order.push(node);
    [...(adjacency[node] || [])].reverse().forEach((next) => {
      if (!visited.has(next)) {
        visited.add(next);
        stack.push(next);
      }
    });
  }
  return order;
}

/* ------------------------------------------------------------------ */
/* Dijkstra on a weighted grid. Every cell carries the cost of        */
/* stepping onto it (1-5, shown in the cell); walls are impassable.   */
/* The pure function below precomputes the whole run as frames, so    */
/* the animation steps through settled cells one at a time and a      */
/* node test can drive it with no DOM at all. Entering a cell costs   */
/* that cell's weight, so the cost of a path is the sum of the         */
/* weights of the cells it steps onto, not counting the start.        */
/* ------------------------------------------------------------------ */

const DIJKSTRA_INFO = {
  complexity: "O(V²) here · O((V + E) log V) with a heap",
  cases: {
    best: "O(V + E) — the target sits next to the start and is settled almost immediately",
    average: "O(V²) with this simple scan-for-the-minimum frontier — fine on a small grid",
    worst: "O(V²) — a target cut off by walls settles every reachable cell before giving up",
    note: "BFS finds the fewest hops; Dijkstra finds the cheapest route. On a weighted grid those differ: a short-looking path through 5s can cost more than a longer path through 1s. The cell settled next is always the cheapest unvisited one, so the first time the target is settled, its distance is final — that is the whole proof, and why the walk can stop there.",
  },
  pseudocode:
`dijkstra(start, target)   <- a priority queue, cheapest first
  dist[start] = 0, dist[others] = infinity
  frontier = [(start, 0)]      <- cheapest distance first
  while frontier is not empty:
    cell = extract cheapest from frontier
    if cell is target: stop    <- its distance is final
    for each neighbour of cell (up / right / down / left):
      if neighbour is a wall or already settled: skip
      newDist = dist[cell] + weight(neighbour)
      if newDist < dist[neighbour]:
        dist[neighbour] = newDist
        prev[neighbour] = cell
        frontier.add(neighbour, newDist)
  follow prev[] back from target to trace the path`,
};

const ASTAR_INFO = {
  complexity: "O(E) with a good heuristic · O(V²) here",
  cases: {
    best: "O(d) — the heuristic points straight at the target and the search barely strays from the optimal path",
    average: "O(E) — the heuristic pulls the search towards the target, so it usually settles fewer cells than Dijkstra on the same grid",
    worst: "O(V²) — a misleading grid (or a target cut off by walls) degrades to Dijkstra and settles every reachable cell",
    note: "A* is Dijkstra with a sense of direction: each cell is ordered by f = g + h, where g is the cost so far and h is the Manhattan distance left to the target. The heuristic never overestimates — every step costs at least 1 — so the first time the target is settled its cost is still optimal, exactly as with Dijkstra, but the search is pulled towards the target and usually settles fewer cells. Drag across the grid to paint walls and watch the guided search route around them.",
  },
  pseudocode:
`astar(start, target)     <- a priority queue, lowest f first
  g[start] = 0, f[start] = h(start)   <- h = Manhattan distance
  frontier = [(start, f = 0)]         <- lowest f first
  while frontier is not empty:
    cell = extract lowest f from frontier
    if cell is target: stop    <- its cost is optimal
    for each neighbour of cell (up / right / down / left):
      if neighbour is a wall or already settled: skip
      newG = g[cell] + weight(neighbour)
      if newG < g[neighbour]:
        g[neighbour] = newG
        f[neighbour] = newG + h(neighbour)
        prev[neighbour] = cell
        frontier.add(neighbour, f[neighbour])
  follow prev[] back from target to trace the path`,
};

const DIJKSTRA_ROWS = 7;
const DIJKSTRA_COLS = 12;
const DIJKSTRA_START = { r: 0, c: 0 };
const DIJKSTRA_TARGET = { r: DIJKSTRA_ROWS - 1, c: DIJKSTRA_COLS - 1 };
/* Two wall blocks force a detour: a column at c=3 (rows 1-4) and one
   at c=8 (rows 2-5), each passable around the top or the bottom. */
const DIJKSTRA_DEFAULT_WALLS = [
  [1, 3], [2, 3], [3, 3], [4, 3],
  [2, 8], [3, 8], [4, 8], [5, 8],
];
const DIJKSTRA_STATUS_PLACEHOLDER =
  "Drag across cells to paint walls (drag over a wall to erase it), then run Dijkstra — or press Demo to watch it find the cheapest route from S to T.";
const DIJKSTRA_ORDER_PLACEHOLDER =
  "No path yet — run Dijkstra to find the cheapest route from S to T.";
const ASTAR_STATUS_PLACEHOLDER =
  "Drag across cells to paint walls (drag over a wall to erase it), then run A* — or press Demo to watch the guided search find the cheapest route from S to T.";
const ASTAR_ORDER_PLACEHOLDER =
  "No path yet — run A* to find the cheapest route from S to T.";
const DIJKSTRA_FRONTIER_PLACEHOLDER = "Frontier is empty.";

function dijkstraCellKey(r, c) { return r + "," + c; }

function dijkstraParseKey(key) {
  const parts = key.split(",");
  return { r: parseInt(parts[0], 10), c: parseInt(parts[1], 10) };
}

/* The default grid: weights 1-5 from a fixed pattern, so the demo is
   the same every load and the node test can pin the exact cost. */
function defaultGrid() {
  const weights = [];
  for (let r = 0; r < DIJKSTRA_ROWS; r++) {
    const row = [];
    for (let c = 0; c < DIJKSTRA_COLS; c++) row.push(1 + ((r * 3 + c * 7 + r * c) % 5));
    weights.push(row);
  }
  return {
    rows: DIJKSTRA_ROWS, cols: DIJKSTRA_COLS, weights,
    walls: new Set(DIJKSTRA_DEFAULT_WALLS.map(([r, c]) => dijkstraCellKey(r, c))),
  };
}

/* A fresh random grid: weights 1-5, about one cell in ten a wall,
   never on the start or the target. Retries until the target is
   reachable, so "New grid" never deals an impossible board. */
function randomGrid() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const grid = { rows: DIJKSTRA_ROWS, cols: DIJKSTRA_COLS, weights: [], walls: new Set() };
    for (let r = 0; r < DIJKSTRA_ROWS; r++) {
      const row = [];
      for (let c = 0; c < DIJKSTRA_COLS; c++) {
        row.push(1 + Math.floor(Math.random() * 5));
        const isEndpoint = (r === DIJKSTRA_START.r && c === DIJKSTRA_START.c)
          || (r === DIJKSTRA_TARGET.r && c === DIJKSTRA_TARGET.c);
        if (!isEndpoint && Math.random() < 0.1) grid.walls.add(dijkstraCellKey(r, c));
      }
      grid.weights.push(row);
    }
    if (dijkstraGridFrames(grid, DIJKSTRA_START, DIJKSTRA_TARGET).reachable) return grid;
  }
  return defaultGrid();
}

const DIJKSTRA_DIRECTIONS = [[-1, 0], [0, 1], [1, 0], [0, -1]];

/* Pure Dijkstra on a weighted grid: returns every animation frame,
   plus the reconstructed path and its cost. A frame is
   { current, settled, frontier, dist, prev, path, finished,
     totalCost }: `settled` in settle order, `frontier` cheapest
   first, `dist`/`prev` as plain objects keyed by "r,c". The first
   frame is the state before anything is settled; the last frame is
   finished, with `path` (start -> target) or null when the target
   cannot be reached. Entering a cell costs that cell's weight. */
function dijkstraGridFrames(grid, start, target) {
  const startKey = dijkstraCellKey(start.r, start.c);
  const targetKey = dijkstraCellKey(target.r, target.c);
  const inBounds = (r, c) => r >= 0 && r < grid.rows && c >= 0 && c < grid.cols;
  const passable = (r, c) => inBounds(r, c) && !grid.walls.has(dijkstraCellKey(r, c));
  const dist = { [startKey]: 0 };
  const prev = { [startKey]: null };
  const settled = new Set();
  const settledOrder = [];
  let frontier = [{ key: startKey, dist: 0 }];
  const frames = [];
  const snapshot = (current, finished, path, totalCost) => ({
    current,
    settled: settledOrder.slice(),
    /* Copy each frontier entry: later relaxations mutate entries in
       place, and a frame must keep the values it was recorded with. */
    frontier: frontier.map((e) => ({ key: e.key, dist: e.dist }))
      .sort((a, b) => a.dist - b.dist),
    dist: Object.assign({}, dist),
    prev: Object.assign({}, prev),
    path: path ? path.slice() : null,
    finished,
    totalCost,
  });
  frames.push(snapshot(null, false, null, null));
  let path = null;
  let totalCost = null;
  let reachable = false;
  while (frontier.length > 0) {
    // Cheapest first; ties keep insertion order (the earliest queued wins).
    let cheapest = 0;
    for (let i = 1; i < frontier.length; i++) {
      if (frontier[i].dist < frontier[cheapest].dist) cheapest = i;
    }
    const current = frontier.splice(cheapest, 1)[0].key;
    if (settled.has(current)) continue;
    settled.add(current);
    settledOrder.push(current);
    if (current === targetKey) {
      reachable = true;
      totalCost = dist[current];
      path = [];
      let node = current;
      while (node !== null) {
        path.unshift(node);
        node = prev[node];
      }
      frames.push(snapshot(current, true, path, totalCost));
      break;
    }
    const { r, c } = dijkstraParseKey(current);
    DIJKSTRA_DIRECTIONS.forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (!passable(nr, nc)) return;
      const nextKey = dijkstraCellKey(nr, nc);
      if (settled.has(nextKey)) return;
      const via = dist[current] + grid.weights[nr][nc];
      if (dist[nextKey] === undefined || via < dist[nextKey]) {
        dist[nextKey] = via;
        prev[nextKey] = current;
        const existing = frontier.find((e) => e.key === nextKey);
        if (existing) existing.dist = via;
        else frontier.push({ key: nextKey, dist: via });
      }
    });
    frames.push(snapshot(current, false, null, null));
  }
  if (!reachable) frames.push(snapshot(null, true, null, null));
  return { frames, path, totalCost, reachable };
}

/* The Manhattan distance from a cell to the target: the fewest steps
   left, ignoring walls and weights. Every step costs at least 1, so
   this never overestimates the true remaining cost — the heuristic
   is admissible, which is what keeps A* optimal. */
function manhattanDistance(r, c, target) {
  return Math.abs(r - target.r) + Math.abs(c - target.c);
}

/* Pure A* on a weighted grid: the same shape as dijkstraGridFrames,
   but the frontier is ordered by f = g + h instead of by g alone, so
   the search is pulled towards the target. A frame is
   { current, settled, frontier, dist, prev, path, finished,
     totalCost }: `dist` holds g (the cost so far), each frontier
   entry carries { key, dist (g), h, f }, and the first frame is the
   state before anything is settled. The last frame is finished, with
   `path` (start -> target) or null when the target cannot be reached.
   Entering a cell costs that cell's weight. */
function astarGridFrames(grid, start, target) {
  const startKey = dijkstraCellKey(start.r, start.c);
  const targetKey = dijkstraCellKey(target.r, target.c);
  const inBounds = (r, c) => r >= 0 && r < grid.rows && c >= 0 && c < grid.cols;
  const passable = (r, c) => inBounds(r, c) && !grid.walls.has(dijkstraCellKey(r, c));
  const dist = { [startKey]: 0 };
  const prev = { [startKey]: null };
  const settled = new Set();
  const settledOrder = [];
  let frontier = [{
    key: startKey, dist: 0,
    h: manhattanDistance(start.r, start.c, target),
    f: manhattanDistance(start.r, start.c, target),
  }];
  const frames = [];
  const snapshot = (current, finished, path, totalCost) => ({
    current,
    settled: settledOrder.slice(),
    /* Copy each frontier entry: later relaxations mutate entries in
       place, and a frame must keep the values it was recorded with. */
    frontier: frontier.map((e) => ({ key: e.key, dist: e.dist, h: e.h, f: e.f }))
      .sort((a, b) => (a.f - b.f) || (a.h - b.h)),
    dist: Object.assign({}, dist),
    prev: Object.assign({}, prev),
    path: path ? path.slice() : null,
    finished,
    totalCost,
  });
  frames.push(snapshot(null, false, null, null));
  let path = null;
  let totalCost = null;
  let reachable = false;
  while (frontier.length > 0) {
    // Lowest f first; ties prefer the smaller h (closer to the
    // target), then keep insertion order (the earliest queued wins).
    let cheapest = 0;
    for (let i = 1; i < frontier.length; i++) {
      if (frontier[i].f < frontier[cheapest].f
        || (frontier[i].f === frontier[cheapest].f && frontier[i].h < frontier[cheapest].h)) {
        cheapest = i;
      }
    }
    const current = frontier.splice(cheapest, 1)[0].key;
    if (settled.has(current)) continue;
    settled.add(current);
    settledOrder.push(current);
    if (current === targetKey) {
      reachable = true;
      totalCost = dist[current];
      path = [];
      let node = current;
      while (node !== null) {
        path.unshift(node);
        node = prev[node];
      }
      frames.push(snapshot(current, true, path, totalCost));
      break;
    }
    const { r, c } = dijkstraParseKey(current);
    DIJKSTRA_DIRECTIONS.forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (!passable(nr, nc)) return;
      const nextKey = dijkstraCellKey(nr, nc);
      if (settled.has(nextKey)) return;
      const via = dist[current] + grid.weights[nr][nc];
      if (dist[nextKey] === undefined || via < dist[nextKey]) {
        dist[nextKey] = via;
        prev[nextKey] = current;
        const h = manhattanDistance(nr, nc, target);
        const existing = frontier.find((e) => e.key === nextKey);
        if (existing) {
          existing.dist = via;
          existing.h = h;
          existing.f = via + h;
        } else {
          frontier.push({ key: nextKey, dist: via, h, f: via + h });
        }
      }
    });
    frames.push(snapshot(current, false, null, null));
  }
  if (!reachable) frames.push(snapshot(null, true, null, null));
  return { frames, path, totalCost, reachable };
}

/* els: { stage, startLabel, startSelect, traversalSelect, runBtn, stepBtn, demoBtn,
          resetBtn, newGridBtn, nodesLabel, edgesLabel, nodes, edges, visited,
          waitingLabel, queueSize, steps, status, queueOutput, orderOutput, log }
   — plain DOM elements. The factory keeps no other state, so a node
   test can drive it with stub elements. */
function createGraphViz(els) {
  const adjacency = graphAdjacency();
  let queue = [];
  let stack = [];
  let visited = new Set();
  let order = [];
  let treeEdges = new Set();
  let current = null;
  let steps = 0;
  let start = GRAPH_DEMO_START;
  let traversal = "bfs";
  let started = false;
  let finished = false;
  let running = false;
  let timer = null;
  let modeChangeHandler = null;

  /* Grid-search state (shared by Dijkstra and A*): the grid, the
     precomputed frames, and the index of the frame currently on
     screen (-1 until the walk starts). */
  let searchGrid = defaultGrid();
  let gridFrames = [];
  let gridPos = -1;
  /* While a wall-painting drag is in progress: "paint" adds walls,
     "erase" removes them. Null when no drag is happening. */
  let paintMode = null;

  function isDijkstra() { return traversal === "dijkstra"; }
  function isAstar() { return traversal === "astar"; }
  function isGridSearch() { return isDijkstra() || isAstar(); }

  function gridFrame() {
    return gridPos >= 0 && gridPos < gridFrames.length
      ? gridFrames[gridPos] : null;
  }

  /* The grid search for the selected mode: Dijkstra settles the
     cheapest cell first, A* the lowest f = g + h. */
  function computeGridFrames() {
    return isAstar()
      ? astarGridFrames(searchGrid, DIJKSTRA_START, DIJKSTRA_TARGET)
      : dijkstraGridFrames(searchGrid, DIJKSTRA_START, DIJKSTRA_TARGET);
  }

  /* The nodes waiting to be visited: the queue for BFS, the stack
     for DFS. The stack is shown top first, so the node popped next
     reads first. */
  function waiting() {
    return traversal === "dfs" ? stack : queue;
  }

  function waitingLabel() {
    return traversal === "dfs" ? "Stack" : "Queue";
  }

  function traversalName() {
    return traversal === "dfs" ? "DFS" : "BFS";
  }

  function orderPlaceholder() {
    return traversal === "dfs" ? GRAPH_DFS_ORDER_PLACEHOLDER
      : traversal === "astar" ? ASTAR_ORDER_PLACEHOLDER
      : traversal === "dijkstra" ? DIJKSTRA_ORDER_PLACEHOLDER
      : GRAPH_ORDER_PLACEHOLDER;
  }

  function statusPlaceholder() {
    return traversal === "dfs" ? GRAPH_DFS_STATUS_PLACEHOLDER
      : traversal === "astar" ? ASTAR_STATUS_PLACEHOLDER
      : traversal === "dijkstra" ? DIJKSTRA_STATUS_PLACEHOLDER
      : GRAPH_STATUS_PLACEHOLDER;
  }

  function edgeKey(u, v) {
    return [u, v].sort().join("-");
  }

  function centre(node) {
    const p = GRAPH_NODES[node];
    return { x: p.x + GRAPH_NODE_SIZE / 2, y: p.y + GRAPH_NODE_SIZE / 2 };
  }

  function render() {
    if (isGridSearch()) { renderGridSearch(); return; }
    els.stage.innerHTML = "";
    const canvas = document.createElement("div");
    canvas.className = "graph-canvas";
    canvas.style.width = GRAPH_CANVAS_WIDTH + "px";
    canvas.style.height = GRAPH_CANVAS_HEIGHT + "px";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "graph-edges");
    svg.setAttribute("width", GRAPH_CANVAS_WIDTH);
    svg.setAttribute("height", GRAPH_CANVAS_HEIGHT);
    GRAPH_EDGES.forEach(([u, v]) => {
      const a = centre(u);
      const b = centre(v);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", a.x);
      line.setAttribute("y1", a.y);
      line.setAttribute("x2", b.x);
      line.setAttribute("y2", b.y);
      if (treeEdges.has(edgeKey(u, v))) line.setAttribute("class", "traversed");
      svg.appendChild(line);
    });
    canvas.appendChild(svg);
    Object.keys(GRAPH_NODES).forEach((label) => {
      const p = GRAPH_NODES[label];
      const node = document.createElement("div");
      node.className = "graph-node";
      node.style.left = p.x + "px";
      node.style.top = p.y + "px";
      node.textContent = label;
      if (label === start) node.classList.add("start");
      if (label === current) node.classList.add("current");
      else if (visited.has(label)) node.classList.add("visited");
      else if (waiting().includes(label))
        node.classList.add(traversal === "dfs" ? "stacked" : "queued");
      node.addEventListener("click", () => setStart(label));
      canvas.appendChild(node);
    });
    els.stage.appendChild(canvas);

    els.nodesLabel.textContent = "Nodes";
    els.edgesLabel.textContent = "Edges";
    els.newGridBtn.hidden = true;
    els.startLabel.hidden = false;
    els.nodes.textContent = Object.keys(GRAPH_NODES).length;
    els.edges.textContent = GRAPH_EDGES.length;
    els.visited.textContent = order.length;
    els.waitingLabel.textContent = waitingLabel();
    els.queueSize.textContent = waiting().length;
    els.steps.textContent = steps;
    els.queueOutput.textContent = waiting().length === 0
      ? (traversal === "dfs" ? GRAPH_STACK_PLACEHOLDER : GRAPH_QUEUE_PLACEHOLDER)
      : (traversal === "dfs"
        ? "Stack (top → bottom): " + waiting().slice().reverse().join(" → ")
        : "Queue (front → back): " + waiting().join(" → "));
    els.orderOutput.textContent = order.length === 0
      ? orderPlaceholder()
      : "Visit order: " + order.join(" → ");
  }

  /* Grid-search mode (Dijkstra or A*): a weighted grid instead of
     the node canvas. Each cell shows the cost of stepping onto it;
     settled cells show their final distance in the corner, frontier
     cells are outlined purple, the cell being settled glows gold,
     and the finished path lights up teal. Dragging across cells
     paints walls (dragging over a wall erases it) — a click paints
     or erases just the one cell. */
  function renderGridSearch() {
    els.stage.innerHTML = "";
    const frame = gridFrame();
    const settledSet = new Set(frame ? frame.settled : []);
    const frontierSet = new Set(frame ? frame.frontier.map((e) => e.key) : []);
    const pathSet = new Set(frame && frame.path ? frame.path : []);
    const gridEl = document.createElement("div");
    gridEl.className = "dijkstra-grid";
    for (let r = 0; r < searchGrid.rows; r++) {
      for (let c = 0; c < searchGrid.cols; c++) {
        const key = dijkstraCellKey(r, c);
        const isStart = r === DIJKSTRA_START.r && c === DIJKSTRA_START.c;
        const isTarget = r === DIJKSTRA_TARGET.r && c === DIJKSTRA_TARGET.c;
        const isWall = searchGrid.walls.has(key);
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        if (isStart) cell.classList.add("start");
        else if (isTarget) cell.classList.add("target");
        else if (isWall) cell.classList.add("wall");
        if (!isWall && frame) {
          if (frame.current === key) cell.classList.add("current");
          else if (pathSet.has(key) && !isStart && !isTarget) cell.classList.add("path");
          else if (settledSet.has(key)) cell.classList.add("settled");
          else if (frontierSet.has(key)) cell.classList.add("frontier");
        }
        if (isStart) cell.textContent = "S";
        else if (isTarget) cell.textContent = "T";
        else if (!isWall) {
          const weight = document.createElement("span");
          weight.className = "cell-weight";
          weight.textContent = searchGrid.weights[r][c];
          cell.appendChild(weight);
          if (frame && frame.dist[key] !== undefined) {
            const d = document.createElement("span");
            d.className = "cell-dist";
            d.textContent = frame.dist[key];
            cell.appendChild(d);
          }
        }
        cell.addEventListener("mousedown", (e) => {
          e.preventDefault();
          startPaint(r, c);
        });
        cell.addEventListener("mouseover", () => applyPaint(r, c));
        gridEl.appendChild(cell);
      }
    }
    els.stage.appendChild(gridEl);

    els.nodesLabel.textContent = "Cells";
    els.edgesLabel.textContent = "Walls";
    els.newGridBtn.hidden = false;
    els.startLabel.hidden = true;
    els.nodes.textContent = searchGrid.rows * searchGrid.cols;
    els.edges.textContent = searchGrid.walls.size;
    els.visited.textContent = frame ? frame.settled.length : 0;
    els.waitingLabel.textContent = "Frontier";
    els.queueSize.textContent = frame ? frame.frontier.length : 0;
    els.steps.textContent = frame ? frame.settled.length : 0;
    els.queueOutput.textContent = !frame || frame.frontier.length === 0
      ? DIJKSTRA_FRONTIER_PLACEHOLDER
      : isAstar()
        ? "Frontier (lowest f first): " + frame.frontier
          .map((e) => "(" + e.key.replace(",", ", ") + ") f=" + e.f
            + " (g=" + e.dist + " + h=" + e.h + ")").join(" → ")
        : "Frontier (cheapest first): " + frame.frontier
          .map((e) => "(" + e.key.replace(",", ", ") + ") = " + e.dist).join(" → ");
    if (!frame) {
      els.orderOutput.textContent = orderPlaceholder();
    } else if (frame.finished && frame.path) {
      els.orderOutput.textContent = isAstar()
        ? "Shortest path (cost " + frame.totalCost + ", " + frame.path.length
          + " cells, " + frame.settled.length + " settled): "
          + frame.path.map((k) => "(" + k.replace(",", ", ") + ")").join(" → ")
        : "Shortest path (cost " + frame.totalCost + "): "
          + frame.path.map((k) => "(" + k.replace(",", ", ") + ")").join(" → ");
    } else if (frame.finished) {
      els.orderOutput.textContent = "No path — the target is cut off by walls.";
    } else if (frame.settled.length === 0) {
      els.orderOutput.textContent = orderPlaceholder();
    } else {
      const latest = frame.settled.slice(-8);
      els.orderOutput.textContent = "Settled " + frame.settled.length + " cell(s) so far — latest: "
        + latest.map((k) => "(" + k.replace(",", ", ") + ")").join(" → ");
    }
  }

  function setStatus(text) {
    els.status.textContent = text;
  }

  function logLine(text) {
    const entry = document.createElement("li");
    entry.textContent = text;
    els.log.appendChild(entry);
    while (els.log.children.length > GRAPH_LOG_LIMIT)
      els.log.removeChild(els.log.firstChild);
  }

  function setButtonsDisabled(disabled) {
    els.runBtn.disabled = disabled;
    els.stepBtn.disabled = disabled;
    els.demoBtn.disabled = disabled;
    els.newGridBtn.disabled = disabled;
  }

  function stopRun() {
    running = false;
    if (timer) clearTimeout(timer);
    timer = null;
    setButtonsDisabled(false);
  }

  function finish() {
    finished = true;
    stopRun();
    current = null;
    render();
    setStatus(`${traversalName()} complete — visited all ${order.length} nodes in ${steps} steps. `
      + `Visit order: ${order.join(" → ")}.`);
    logLine(`${traversalName()} complete — every node reached.`);
  }

  /* One BFS step: enqueue the start on the first call, then dequeue
     the front node, visit it, and enqueue its unvisited neighbours.
     Returns false when the walk is finished. */
  function stepBfs() {
    if (finished) return false;
    if (!started) {
      started = true;
      queue = [start];
      visited = new Set([start]);
      setStatus(`Start at ${start} — enqueue ${start}.`);
      logLine(`Start at ${start} — enqueue ${start}.`);
      render();
      return true;
    }
    if (queue.length === 0) {
      finish();
      return false;
    }
    const node = queue.shift();
    current = node;
    order.push(node);
    steps++;
    const enqueued = [];
    adjacency[node].forEach((next) => {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
        treeEdges.add(edgeKey(node, next));
        enqueued.push(next);
      }
    });
    setStatus(enqueued.length > 0
      ? `Visit ${node} — dequeue it, enqueue ${enqueued.join(", ")}.`
      : `Visit ${node} — dequeue it, no new neighbours.`);
    logLine(`Visit ${node} — dequeue, ${queue.length} left in queue.`);
    enqueued.forEach((next) => logLine(`Enqueue ${next} (neighbour of ${node}).`));
    render();
    if (queue.length === 0) {
      finish();
      return false;
    }
    return true;
  }

  /* One DFS step: push the start on the first call, then pop the
     top node, visit it, and push its unvisited neighbours in reverse
     sorted order — so the smallest neighbour ends up on top and is
     visited first. Returns false when the walk is finished. */
  function stepDfs() {
    if (finished) return false;
    if (!started) {
      started = true;
      stack = [start];
      visited = new Set([start]);
      setStatus(`Start at ${start} — push ${start} onto the stack.`);
      logLine(`Start at ${start} — push ${start} onto the stack.`);
      render();
      return true;
    }
    if (stack.length === 0) {
      finish();
      return false;
    }
    const node = stack.pop();
    current = node;
    order.push(node);
    steps++;
    const pushed = [];
    [...adjacency[node]].reverse().forEach((next) => {
      if (!visited.has(next)) {
        visited.add(next);
        stack.push(next);
        treeEdges.add(edgeKey(node, next));
        pushed.push(next);
      }
    });
    setStatus(pushed.length > 0
      ? `Visit ${node} — pop it, push ${pushed.join(", ")} (reversed, so ${pushed[pushed.length - 1]} is on top).`
      : `Visit ${node} — pop it, no new neighbours.`);
    logLine(`Visit ${node} — pop, ${stack.length} left on the stack.`);
    pushed.forEach((next) => logLine(`Push ${next} (neighbour of ${node}).`));
    render();
    if (stack.length === 0) {
      finish();
      return false;
    }
    return true;
  }

  /* One grid-search step: show the starting frame on the first call,
     then settle one cell per step — the cheapest cell in the
     frontier for Dijkstra, the lowest f = g + h for A* — until the
     target is settled or the frontier runs dry. Returns false when
     the walk is finished. */
  function stepGridSearch() {
    if (finished) return false;
    if (!started) {
      started = true;
      gridFrames = computeGridFrames().frames;
      gridPos = 0;
      steps = 0;
      render();
      setStatus(isAstar()
        ? "Start at S (0, 0) — g = 0, f = h = 17 (Manhattan distance to T). The frontier holds the lowest f."
        : "Start at S (0, 0) — distance 0. The frontier holds the cheapest unvisited cell.");
      logLine(isAstar()
        ? "Start at S — g = 0, f = 17, frontier: (0, 0) f=17."
        : "Start at S — distance 0, frontier: (0, 0) = 0.");
      return true;
    }
    gridPos++;
    const frame = gridFrames[gridPos];
    steps = frame.settled.length;
    render();
    if (frame.finished) {
      finishGridSearch(frame);
      return false;
    }
    const cell = dijkstraParseKey(frame.current);
    if (isAstar()) {
      logLine(`Settle (${cell.r}, ${cell.c}) — lowest f in the frontier at g = ${frame.dist[frame.current]}.`);
      setStatus(`Settle (${cell.r}, ${cell.c}) at g = ${frame.dist[frame.current]} — `
        + `${frame.frontier.length} cell(s) waiting in the frontier.`);
    } else {
      logLine(`Settle (${cell.r}, ${cell.c}) — cheapest in the frontier at ${frame.dist[frame.current]}.`);
      setStatus(`Settle (${cell.r}, ${cell.c}) at distance ${frame.dist[frame.current]} — `
        + `${frame.frontier.length} cell(s) waiting in the frontier.`);
    }
    return true;
  }

  function finishGridSearch(frame) {
    finished = true;
    stopRun();
    render();
    const name = isAstar() ? "A*" : "Dijkstra";
    if (frame.path) {
      setStatus(isAstar()
        ? `A* complete — cheapest route from S to T costs ${frame.totalCost} `
          + `(${frame.path.length} cells), settled ${frame.settled.length} cells to find it.`
        : `Dijkstra complete — cheapest route from S to T costs ${frame.totalCost} `
          + `(${frame.path.length} cells), settled ${frame.settled.length} cells to prove it.`);
      logLine(`Shortest path found — cost ${frame.totalCost}.`);
    } else {
      setStatus(`${name} complete — no path: the target is cut off by walls. `
        + "Remove a wall or generate a new grid and try again.");
      logLine("No path — the target is unreachable.");
    }
  }

  /* One step of whichever traversal is selected. */
  function step() {
    return traversal === "dfs" ? stepDfs()
      : isGridSearch() ? stepGridSearch() : stepBfs();
  }

  function run() {
    if (running) return;
    if (finished) reset();
    running = true;
    setButtonsDisabled(true);
    const tick = () => {
      if (!running) return;
      if (step()) timer = setTimeout(tick, GRAPH_STEP_MS);
    };
    tick();
  }

  function demo() {
    reset();
    els.startSelect.value = GRAPH_DEMO_START;
    start = GRAPH_DEMO_START;
    render();
    run();
  }

  function setStart(label) {
    if (isGridSearch()) return; // a grid has no named start node
    if (running || !Object.prototype.hasOwnProperty.call(GRAPH_NODES, label)) return;
    start = label;
    els.startSelect.value = label;
    reset();
    setStatus(`Start node is ${label} — run ${traversalName()} to walk from here.`);
  }

  /* Switching traversal clears the walk and swaps the pseudocode and
     case notes through the callback app.js registers. */
  function setTraversal(mode) {
    if (running || (mode !== "bfs" && mode !== "dfs" && mode !== "dijkstra" && mode !== "astar")) return;
    traversal = mode;
    els.traversalSelect.value = mode;
    reset();
    if (modeChangeHandler) modeChangeHandler();
  }

  /* A fresh random grid (always reachable), with the walk cleared. */
  function newGrid() {
    if (running || !isGridSearch()) return;
    searchGrid = randomGrid();
    reset();
    logLine("New grid — fresh weights and walls. Run Dijkstra to find the cheapest route.");
  }

  /* Clicking a grid cell toggles it as a wall (never the start or the
     target) and clears the walk, so the next run uses the new board. */
  function toggleWall(r, c) {
    if (running || !isGridSearch()) return;
    const isEndpoint = (r === DIJKSTRA_START.r && c === DIJKSTRA_START.c)
      || (r === DIJKSTRA_TARGET.r && c === DIJKSTRA_TARGET.c);
    if (isEndpoint) return;
    const key = dijkstraCellKey(r, c);
    if (searchGrid.walls.has(key)) searchGrid.walls.delete(key);
    else searchGrid.walls.add(key);
    reset();
    setStatus((searchGrid.walls.has(key) ? `Wall added at (${r}, ${c})` : `Wall removed at (${r}, ${c})`)
      + ` — run ${isAstar() ? "A*" : "Dijkstra"} to find the new cheapest route.`);
  }

  /* Wall painting: pressing on a cell starts a stroke — painting
     walls when the cell is open, erasing when it already is one —
     and dragging across cells extends the stroke. The walk is
     cleared on the first cell, so the next run uses the new board. */
  function startPaint(r, c) {
    if (running || !isGridSearch()) return;
    const isEndpoint = (r === DIJKSTRA_START.r && c === DIJKSTRA_START.c)
      || (r === DIJKSTRA_TARGET.r && c === DIJKSTRA_TARGET.c);
    if (isEndpoint) return;
    paintMode = searchGrid.walls.has(dijkstraCellKey(r, c)) ? "erase" : "paint";
    reset();
    applyPaint(r, c);
  }

  function applyPaint(r, c) {
    if (!paintMode) return;
    const isEndpoint = (r === DIJKSTRA_START.r && c === DIJKSTRA_START.c)
      || (r === DIJKSTRA_TARGET.r && c === DIJKSTRA_TARGET.c);
    if (isEndpoint) return;
    const key = dijkstraCellKey(r, c);
    if (paintMode === "paint") searchGrid.walls.add(key);
    else searchGrid.walls.delete(key);
    render();
  }

  /* Releasing the mouse anywhere ends the stroke and reports it. */
  function finishPaint() {
    if (!paintMode) return;
    paintMode = null;
    const name = isAstar() ? "A*" : "Dijkstra";
    setStatus(`Walls updated (${searchGrid.walls.size} on the grid) — run ${name} to find the new cheapest route.`);
    logLine("Walls updated — run " + name + " to find the new cheapest route.");
  }

  function reset() {
    stopRun();
    queue = [];
    stack = [];
    visited = new Set();
    order = [];
    treeEdges = new Set();
    current = null;
    steps = 0;
    started = false;
    finished = false;
    gridFrames = [];
    gridPos = -1;
    paintMode = null;
    start = els.startSelect.value;
    render();
    els.log.innerHTML = "";
    setStatus(statusPlaceholder());
  }

  els.runBtn.addEventListener("click", run);
  els.stepBtn.addEventListener("click", () => {
    if (running) return;
    if (finished) reset();
    step();
  });
  els.demoBtn.addEventListener("click", demo);
  els.resetBtn.addEventListener("click", reset);
  els.newGridBtn.addEventListener("click", newGrid);
  els.startSelect.addEventListener("change", (e) => setStart(e.target.value));
  els.traversalSelect.addEventListener("change", (e) => setTraversal(e.target.value));
  /* A paint stroke can end outside the grid, so the release is
     watched on the whole document. */
  document.addEventListener("mouseup", finishPaint);

  render();
  setStatus(statusPlaceholder());
  return {
    run, step, demo, reset, setStart, setTraversal, stopRun, newGrid, toggleWall,
    set onModeChange(fn) { modeChangeHandler = fn; },
    get mode() { return traversal; },
    get info() {
      return traversal === "dfs" ? GRAPH_DFS_INFO
        : traversal === "astar" ? ASTAR_INFO
        : traversal === "dijkstra" ? DIJKSTRA_INFO : GRAPH_INFO;
    },
    get order() { return order.slice(); },
    get visitedCount() { return order.length; },
    get queueLength() { return waiting().length; },
    get steps() { return steps; },
    get running() { return running; },
    get finished() { return finished; },
    get start() { return start; },
    get dijkstraPath() {
      const frame = gridFrame();
      return frame && frame.path ? frame.path.slice() : null;
    },
    get dijkstraCost() {
      const frame = gridFrame();
      return frame ? frame.totalCost : null;
    },
    get astarPath() {
      const frame = gridFrame();
      return frame && frame.path ? frame.path.slice() : null;
    },
    get astarCost() {
      const frame = gridFrame();
      return frame ? frame.totalCost : null;
    },
  };
}

/* Wires the graph panel in index.html; called once from app.js. */
function initGraphViz() {
  const $ = (id) => document.getElementById(id);
  return createGraphViz({
    stage: $("graphStage"),
    startLabel: $("graphStartLabel"),
    startSelect: $("graphStartSelect"),
    traversalSelect: $("graphTraversalSelect"),
    runBtn: $("graphRunBtn"),
    stepBtn: $("graphStepBtn"),
    demoBtn: $("demoGraphBtn"),
    resetBtn: $("resetGraphBtn"),
    newGridBtn: $("newGridBtn"),
    nodesLabel: $("graphNodesLabel"),
    edgesLabel: $("graphEdgesLabel"),
    nodes: $("graphNodes"),
    edges: $("graphEdges"),
    visited: $("graphVisited"),
    waitingLabel: $("graphWaitingLabel"),
    queueSize: $("graphQueueSize"),
    steps: $("graphSteps"),
    status: $("graphStatus"),
    queueOutput: $("graphQueueOutput"),
    orderOutput: $("graphOrderOutput"),
    log: $("graphLog"),
  });
}

/* ------------------------------------------------------------------ */
/* Tower of Hanoi — the recursion visualizer. Three pegs, n discs,    */
/* one rule: a larger disc may never sit on a smaller one. The        */
/* optimal solution is generated by the same recursion the            */
/* pseudocode shows, so Solve, Step and Demo all play the exact       */
/* 2^n - 1 moves — no more, no fewer.                                */
/* ------------------------------------------------------------------ */

const HANOI_INFO = {
  complexity: "O(2ⁿ)",
  cases: {
    best: "O(2ⁿ) — there is exactly one optimal solution: 2ⁿ − 1 moves",
    average: "O(2ⁿ) — every correct solution makes the same 2ⁿ − 1 moves",
    worst: "O(2ⁿ) — no shortcut exists; the smallest disc moves 2ⁿ⁻¹ times",
    note: "The recursion moves n − 1 discs out of the way, moves the largest disc once, then rebuilds the tower on top of it. 3 discs take 7 moves, 6 take 63 — and 64 discs would take 584 billion years at one move a second.",
  },
  pseudocode:
`solve(n, from, to, aux)   <- move n discs from -> to
  if n == 1               <- one disc: move it directly
    move disc from -> to
    return
  solve(n - 1, from, aux, to)   <- clear the largest disc
  move disc n from -> to        <- the largest disc moves once
  solve(n - 1, aux, to, from)   <- rebuild the tower on top`,
};

const HANOI_MIN_DISCS = 3;
const HANOI_MAX_DISCS = 6;
const HANOI_DEFAULT_DISCS = 4;
const HANOI_LOG_LIMIT = 8;
const HANOI_STEP_MS = 600;
const HANOI_PEG_NAMES = ["A", "B", "C"];

/* The optimal move list for n discs, built by the same recursion the
   pseudocode shows. A move is { disc, from, to } with pegs as 0, 1, 2.
   Pure — no DOM — so it can be tested on its own. */
function hanoiMoves(n, from, to, aux, out) {
  out = out || [];
  if (n === 1) {
    out.push({ disc: 1, from, to });
    return out;
  }
  hanoiMoves(n - 1, from, aux, to, out);
  out.push({ disc: n, from, to });
  hanoiMoves(n - 1, aux, to, from, out);
  return out;
}

/* els: { stage, discsSelect, solveBtn, stepBtn, demoBtn, resetBtn,
          discs, moves, optimal, remaining, status, movesOutput, log }
   — plain DOM elements. The factory keeps no other state, so a node
   test can drive it with stub elements. */
function createHanoiViz(els) {
  let discCount = HANOI_DEFAULT_DISCS;
  let pegs = [[], [], []];
  let moves = [];
  let applied = [];            // moves already played, in order
  let moveIndex = 0;
  let running = false;
  let timer = null;
  let lastMovedDisc = null;

  function optimalMoves() { return Math.pow(2, discCount) - 1; }

  function finished() { return moveIndex >= moves.length; }

  function render() {
    els.stage.innerHTML = "";
    pegs.forEach((peg, p) => {
      const pegEl = document.createElement("div");
      pegEl.className = "hanoi-peg";
      const discsEl = document.createElement("div");
      discsEl.className = "hanoi-discs";
      peg.forEach((disc) => {
        const d = document.createElement("div");
        d.className = "hanoi-disc";
        d.style.width = (25 + disc * 12) + "%";
        d.textContent = String(disc);
        if (disc === lastMovedDisc) d.classList.add("moving");
        discsEl.appendChild(d);
      });
      const base = document.createElement("div");
      base.className = "hanoi-base";
      const label = document.createElement("div");
      label.className = "hanoi-peg-label";
      label.textContent = "Peg " + HANOI_PEG_NAMES[p];
      pegEl.appendChild(discsEl);
      pegEl.appendChild(base);
      pegEl.appendChild(label);
      els.stage.appendChild(pegEl);
    });
    els.discs.textContent = String(discCount);
    els.moves.textContent = String(applied.length);
    els.optimal.textContent = String(optimalMoves());
    els.remaining.textContent = String(optimalMoves() - applied.length);
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function log(message) {
    const entry = document.createElement("li");
    entry.textContent = message;
    els.log.insertBefore(entry, els.log.firstChild);
    while (els.log.children.length > HANOI_LOG_LIMIT)
      els.log.removeChild(els.log.lastChild);
  }

  /* The move sequence so far, most recent last — the last ten moves,
     so a 63-move solution stays readable. */
  function updateMovesOutput() {
    if (applied.length === 0) {
      els.movesOutput.textContent = "No moves yet — the tower is still on peg A.";
      return;
    }
    const tail = applied.slice(-10).map((m, i) =>
      `${applied.length - applied.slice(-10).length + i + 1}: disc ${m.disc} `
      + `${HANOI_PEG_NAMES[m.from]} → ${HANOI_PEG_NAMES[m.to]}`);
    els.movesOutput.textContent = `Moves so far (${applied.length}): ${tail.join(" · ")}`;
  }

  function setButtonsDisabled(disabled) {
    [els.solveBtn, els.stepBtn, els.demoBtn, els.resetBtn, els.discsSelect]
      .forEach((b) => { b.disabled = disabled; });
  }

  function applyMove(move) {
    const disc = pegs[move.from].pop();
    pegs[move.to].push(disc);
    lastMovedDisc = disc;
    applied.push(move);
    moveIndex++;
    render();
    updateMovesOutput();
    log(`move ${applied.length}: disc ${disc}, `
      + `${HANOI_PEG_NAMES[move.from]} → ${HANOI_PEG_NAMES[move.to]}`);
    if (finished()) {
      stopSolve();
      setStatus(`Solved ✓ — ${discCount} discs in ${applied.length} moves, `
        + `the optimal ${optimalMoves()}.`);
    } else {
      setStatus(`Move ${applied.length} of ${optimalMoves()}: disc ${disc}, `
        + `peg ${HANOI_PEG_NAMES[move.from]} → peg ${HANOI_PEG_NAMES[move.to]}.`);
    }
  }

  /* One move at a time, on demand. Disabled while Solve is running. */
  function step() {
    if (running) return false;
    if (finished()) {
      setStatus(`Already solved — ${discCount} discs in ${applied.length} moves. `
        + `Reset to play it again, or pick a different disc count.`);
      return false;
    }
    applyMove(moves[moveIndex]);
    return true;
  }

  function stopSolve() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    running = false;
    setButtonsDisabled(false);
  }

  /* Plays the precomputed optimal solution, one move per beat. */
  function solve() {
    if (running) return false;
    if (finished()) {
      setStatus(`Already solved — ${discCount} discs in ${applied.length} moves. `
        + `Reset to play it again, or pick a different disc count.`);
      return false;
    }
    running = true;
    setButtonsDisabled(true);
    els.solveBtn.disabled = false;   // Solve doubles as stop while running
    setStatus(`Solving — ${discCount} discs, ${optimalMoves()} moves to go…`);
    const tick = () => {
      if (!running) return;
      applyMove(moves[moveIndex]);
      if (!finished()) timer = setTimeout(tick, HANOI_STEP_MS);
    };
    timer = setTimeout(tick, HANOI_STEP_MS);
    return true;
  }

  /* Rebuilds the tower on peg A and clears the log. */
  function reset() {
    stopSolve();
    pegs = [Array.from({ length: discCount }, (_, i) => discCount - i), [], []];
    moves = hanoiMoves(discCount, 0, 2, 1);
    applied = [];
    moveIndex = 0;
    lastMovedDisc = null;
    render();
    updateMovesOutput();
    els.log.innerHTML = "";
    setStatus(`${discCount} discs on peg A — press Solve to watch the optimal `
      + `${optimalMoves()}-move solution, or step through it one move at a time.`);
  }

  function setDiscs(n) {
    if (!Number.isInteger(n) || n < HANOI_MIN_DISCS || n > HANOI_MAX_DISCS) {
      setStatus(`Pick ${HANOI_MIN_DISCS} to ${HANOI_MAX_DISCS} discs.`);
      return false;
    }
    discCount = n;
    reset();
    return true;
  }

  /* The scripted demo: 3 discs, the shortest full solution (7 moves),
     so it finishes quickly and can be replayed straight away. */
  function demo() {
    if (running) return false;
    els.discsSelect.value = "3";
    discCount = 3;
    reset();
    return solve();
  }

  els.solveBtn.addEventListener("click", () => {
    if (running) stopSolve();
    else solve();
  });
  els.stepBtn.addEventListener("click", () => step());
  els.demoBtn.addEventListener("click", () => demo());
  els.resetBtn.addEventListener("click", () => reset());
  els.discsSelect.addEventListener("change", (e) =>
    setDiscs(parseInt(e.target.value, 10)));

  reset();
  return {
    solve, step, demo, reset, setDiscs, stopSolve,
    get discCount() { return discCount; },
    get pegs() { return pegs.map((peg) => peg.slice()); },
    get movesMade() { return applied.length; },
    get optimalMoves() { return optimalMoves(); },
    get finished() { return finished(); },
    get running() { return running; },
    get moves() { return moves.slice(); },
    info: HANOI_INFO,
  };
}

/* Wires the Tower of Hanoi panel in index.html; called once from app.js. */
function initHanoiViz() {
  const $ = (id) => document.getElementById(id);
  return createHanoiViz({
    stage: $("hanoiStage"),
    discsSelect: $("hanoiDiscsSelect"),
    solveBtn: $("hanoiSolveBtn"),
    stepBtn: $("hanoiStepBtn"),
    demoBtn: $("demoHanoiBtn"),
    resetBtn: $("resetHanoiBtn"),
    discs: $("hanoiDiscs"),
    moves: $("hanoiMoves"),
    optimal: $("hanoiOptimal"),
    remaining: $("hanoiRemaining"),
    status: $("hanoiStatus"),
    movesOutput: $("hanoiMovesOutput"),
    log: $("hanoiLog"),
  });
}
