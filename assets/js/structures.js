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
  not found`,
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
   tree, find 40, then look for 99 and miss — ending with the tree
   standing, so it can be replayed straight away. */
const BST_DEMO_SCRIPT = [
  { op: "insert", value: 50 }, { op: "insert", value: 30 },
  { op: "insert", value: 70 }, { op: "insert", value: 20 },
  { op: "insert", value: 40 }, { op: "insert", value: 60 },
  { op: "insert", value: 80 },
  { op: "search", value: 40 },
  { op: "search", value: 99 },
];

/* els: { stage, valueInput, insertBtn, searchBtn, demoBtn, clearBtn,
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
    [els.insertBtn, els.searchBtn, els.demoBtn, els.clearBtn]
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

  function clear() {
    if (animating) return;
    stopDemo();
    walkId++;
    root = null;
    size = 0;
    current = null;
    found = null;
    entering = null;
    visited = new Set();
    lastSearch = null;
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
     its own walk to finish (walk length + one beat to attach or
     report), so the demo never overtakes the animation. */
  function demo() {
    if (demoRunning || animating) return false;
    clear();
    demoRunning = true;
    els.demoBtn.disabled = true;
    setStatus("Demo running — building 50, 30, 70, 20, 40, 60, 80, then searching for 40 and 99…");
    let step = 0;
    const runStep = () => {
      if (step >= BST_DEMO_SCRIPT.length) {
        stopDemo();
        setStatus("Demo finished — the tree is standing. Insert your own values, search for one, or run it again.");
        return;
      }
      const action = BST_DEMO_SCRIPT[step];
      step++;
      /* The walk visits pathLength nodes, plus one beat to attach or report. */
      const wait = (pathLength(action.value) + 1) * BST_STEP_MS + BST_DEMO_STEP_MS;
      if (action.op === "insert") insert(action.value);
      else if (action.op === "search") search(action.value);
      demoTimer = setTimeout(runStep, wait);
    };
    demoTimer = setTimeout(runStep, BST_DEMO_STEP_MS);
    return true;
  }

  function reset() {
    stopDemo();
    walkId++;
    root = null;
    size = 0;
    ops = 0;
    animating = false;
    current = null;
    found = null;
    entering = null;
    visited = new Set();
    lastSearch = null;
    setButtonsDisabled(false);
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
  els.demoBtn.addEventListener("click", () => demo());
  els.clearBtn.addEventListener("click", () => clear());
  els.valueInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") insert(readValueInput());
  });

  render();
  setStatus("Tree is empty — insert a value to start.");
  return {
    insert, search, clear, demo, reset, stopDemo,
    get size() { return size; },
    get treeHeight() { return height(root); },
    get rootValue() { return root === null ? null : root.value; },
    get operations() { return ops; },
    get items() { return inOrder(root, []); },
    get demoRunning() { return demoRunning; },
    get lastSearch() { return lastSearch; },
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
