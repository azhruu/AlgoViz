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
