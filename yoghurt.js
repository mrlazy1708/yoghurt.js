`use strict`;

console.time(`Yoghurt load `); // Load Timer
setTimeout(() => console.timeEnd(`Yoghurt load `));

/* -------------------------------------------------------------------------- */
/*                                     VAR                                    */
/* -------------------------------------------------------------------------- */

var yoghurt = Object.create(window.yoghurt ?? null);

yoghurt.log ??= false;                // logging level
yoghurt.debug ??= false;              // debugging level
yoghurt.magnet ??= 7.0;               // magnet attach level

yoghurt.yoghurts = new Map();         // map from element to yoghurt instance
yoghurt.clipboard = new Array();      // copy & paste cache array

/* -------------------------------------------------------------------------- */
/*                                    INIT                                    */
/* -------------------------------------------------------------------------- */

window.addEventListener(`load`, (event) => {
  yoghurt.document = new yoghurt.Type.Document(document.body);
});

/* -------------------------------------------------------------------------- */
/*                                     API                                    */
/* -------------------------------------------------------------------------- */

/**
 * Take an element into control. Construct corresponding yoghurt instance and
 * register the mapping. Assert the mapping is one-to-one and element type is
 * well known.
 * @param {HTMLElement} element - target element
 * 
 * @return constructed yoghurt instance
 */
yoghurt.take = function (element) {
  if (yoghurt.log) console.log(`take`, element);

  if (!yoghurt.yoghurts.has(element))
    switch (element.nodeName) {
      case `DIV`:
        return new yoghurt.Type.Yoghurt.Element.Adjustable(element);

      default: return;
    }

  if (yoghurt.debug) debugger;
  return yoghurt.yoghurts.get(element);
};

/**
 * Drop an element. Destruct its controlling yoghurt instance and unregister
 * the mapping. Assert the element has been registered before.
 * @param {HTMLElement} element - target element
 */
yoghurt.drop = function (element) {
  if (yoghurt.log) console.log(`drop`, element);

  if (yoghurt.yoghurts.has(element))
    yoghurt.yoghurts.get(element).destructor();

  else if (yoghurt.debug) debugger;
};

/**
 * Take all elements under subtree of `element`.
 * @param {HTMLElement} element - target subtree root, default to `document.body`
 *
 * @return array of all constructed yoghurt instance
 */
yoghurt.enter = function (element = document.body) {
  if (yoghurt.log) console.log(`enter`, element);

  return [element, ...element.querySelectorAll(`*`)].map((node) =>
    yoghurt.take(node));
};

/**
 * Drop all elements under subtree of `element`.
 * @param {HTMLElement} element - target subtree root, default to `document.body`
 */
yoghurt.leave = function (element = document.body) {
  if (yoghurt.log) console.log(`leave`, element);

  [element, ...element.querySelectorAll(`*`)].forEach((node) =>
    yoghurt.yoghurts.has(node) && yoghurt.drop(node));
};

/* ---------------------------------- EDIT ---------------------------------- */

/**
 * Collect all registered yoghurts and filter by key-value status.
 * @param {string} name - filtered status name.
 * @param {*} status - expected status value.
 * @return {[*]} all filtered yoghurts on element.
 */
yoghurt.element = function (name, status = name && true) {
  return [...yoghurt.yoghurts.values()]
    .filter((self) => self instanceof yoghurt.Type.Yoghurt.Element)
    .filter((self) => self.status[name] === status);
}

/**
 * Destory all selected subtree and put element onto clipboard.
 * @param {[*]} yoghurts - array of subtree.
 */
yoghurt.clip = function (yoghurts = yoghurt.element(`selected`)) {
  if (yoghurt.log) console.log(`clip`, yoghurts);

  yoghurt.clipboard = yoghurts.map(({ element }) =>
    (yoghurt.leave(element), element.remove(), element));
};

/**
 * Append each element on clipboard to all selected yoghurts and control it.
 * If nothing is selected, paste on `document.body`.
 * @param {[*]} yoghurts - array of yoghurt.
 */
yoghurt.paste = function (yoghurts = yoghurt.element(`selected`)) {
  if (yoghurt.log) console.log(`paste`, yoghurts);

  if (yoghurts.length === 0) yoghurts = [yoghurt.document];
  console.log(yoghurts, yoghurt.clipboard)

  yoghurts.forEach(({ element }) => yoghurt.clipboard.forEach((child) =>
    yoghurt.enter(element.appendChild(child.cloneNode(true)))));
}

/**
 * Destory and remove each selected element yoghurt.
 * @param {[*]} yoghurts - array of yoghurt.
 */
yoghurt.delete = function (yoghurts = yoghurt.element(`selected`)) {
  if (yoghurt.log) console.log(`delete`, yoghurts);

  yoghurts.forEach(({ element }) => { yoghurt.leave(element), element.remove() });
}

/* -------------------------------------------------------------------------- */
/*                                    EVENT                                   */
/* -------------------------------------------------------------------------- */

yoghurt.Event = class extends CustomEvent { };

yoghurt.Event.Pick = class extends yoghurt.Event {
  /**
   * @event Element is pressed and dragged once.
   */
  constructor() {
    super(`yoghurtpick`);
  }
}

yoghurt.Event.Drag = class extends yoghurt.Event {
  /**
   * @event Element is dragged. Provide horizontal and vertical movement.
   */
  constructor(dx, dy) {
    super(`yoghurtdrag`, { detail: { dx, dy } });
  }
}

yoghurt.Event.Drop = class extends yoghurt.Event {
  /**
  * @event Element is dragged and released. Provide the element being dropped on.
  */
  constructor(target) {
    super(`yoghurtdrop`, { detail: { target } });
  }
}

yoghurt.Event.Select = class extends yoghurt.Event {
  /**
 * @event Element focus state changed. Provide if the element is being selected.
 */
  constructor(selected) {
    super(`yoghurt${selected ? `` : `un`}selected`);
  }
};

/* -------------------------------------------------------------------------- */
/*                                    CLASS                                   */
/* -------------------------------------------------------------------------- */

yoghurt.Type = class {
  /**
   * @class Base class. Provide common element manipulations.
   */
  constructor(element) {
    this.element = element;

    this.listener = new Map();

    this.status = new Object();
  }

  /**
   * Base destructor. Ensures no memory and event leak.
   */
  destructor() {
    delete this.status;

    console.assert(this.listener.size === 0);
    delete this.listener;

    delete this.element;
  }

  /**
   * Get computed style of `this.element`.
   * @param {string} name - name of the style
   * 
   * @return {string} computed `name` style
   */
  get(name) {
    return window.getComputedStyle(this.element).getPropertyValue(name);
  }

  /**
   * Set style of `this.element`. Convert the unit to currently used.
   * @param {string} name - name of the style
   * @param {number|string} value - value of the style
   */
  set(name, value) {
    switch (typeof value) {
      case `number`:
        const prev = this.element.style.getPropertyValue(name);
        const unit = prev.match(/(%|px)$/)?.[1];
        switch (unit) {
          case `%`:
            this.element.style.setProperty(name, `1${unit}`);
            const scale = parseFloat(this.get(name));

            value = `${Math.round((value / scale) * 100) / 100}${unit}`;
            break;

          default:
            value = `${Math.round(value * 100) / 100}px`;
            break;
        }

      case `string`:
        this.element.style.setProperty(name, value);
        break;

      default:
        if (yoghurt.debug) debugger;
    }
  }

  /**
   * Listen to event `type` on `element`, with corresponding class method as
   * listener. Assert no same listener exists and register it.
   * @param {string} type - name of event to be listened
   * @param {HTMLElement} element - target element to be listened on
   */
  listen(type, element) {
    console.assert(!this.listener.has(type), arguments);

    const listener = this[`on${type}`].bind(this);
    element.addEventListener(type, listener);

    this.listener.set(type, listener);
  }

  /**
   * Unlisten previously listened event `type` on `element`. Assert same
   * listener exists and unregister it.
   * @param {string} type - name of event being listened
   * @param {HTMLElement} element - target element to being listened on
   */
  unlisten(type, element) {
    console.assert(this.listener.has(type), arguments);

    const listener = this.listener.get(type);
    element.removeEventListener(type, listener);

    this.listener.delete(type);
  }
};

yoghurt.Type.Document = class extends yoghurt.Type {
  /**
   * @class Current document. Provide global event handling.
   */
  constructor(element) {
    super(element);

    this.listen(`mousedown`, document);
    this.listen(`keydown`, document);
  }

  /**
   * Sub destructor.
   */
  destructor() {
    this.unlisten(`mousedown`, document);
    this.unlisten(`keydown`, document);

    super.destructor();
  }

  /**
   * Base listener of `mousedown` event. Unselect all selected yoghurts.
   * @param {Event} event
   */
  onmousedown(event) {
    if (yoghurt.log) console.log(this, event);

    yoghurt.element(`selected`).forEach((self) => self.status.mouse === null
      && self.yoghurt.dispatchEvent(new yoghurt.Event.Select(false)));
  }

  /**
   * Base listener of `keydown` event.
   * - clip on `Ctrl-C`
   * - paste on `Ctrl-V`
   * - delete on `Backspace`
   * @param {Event} event
   */
  onkeydown(event) {
    if (yoghurt.log) console.log(this, event);

    const auxKey = event.metaKey /* MacOS */ || event.ctrlKey /* Windows */;

    if (event.key === `c` && auxKey) yoghurt.clip();
    if (event.key === `v` && auxKey) yoghurt.paste();
    if (event.key === `Backspace`) yoghurt.delete();
  }
};

yoghurt.Type.Yoghurt = class extends yoghurt.Type {
  /**
   * @class Element entity. Abstract basic mouse interactions.
   */
  constructor(element) {
    super(element);

    this.yoghurt = document.createElement(`div`);
    this.yoghurt.classList.add(`yoghurt`);

    this.listen(`mousedown`, this.yoghurt);
    this.status.mouse = null;

    this.listen(`yoghurtpick`, this.yoghurt);
    this.listen(`yoghurtdrag`, this.yoghurt);
    this.listen(`yoghurtdrop`, this.yoghurt);
    this.status.dragged = false;
  }

  /**
   * Sub destructor.
   */
  destructor() {
    this.unlisten(`yoghurtpick`, this.yoghurt);
    this.unlisten(`yoghurtdrag`, this.yoghurt);
    this.unlisten(`yoghurtdrop`, this.yoghurt);

    this.unlisten(`mousedown`, this.yoghurt);

    delete this.yoghurt;

    super.destructor();
  }

  /**
   * Listener of `mousedown` event. Record current mouse position and
   * listen on `mousemove` and `mouseup` events.
   * @param {Event} event
   */
  onmousedown(event) {
    if (this.status.mouse == null) {

      if (yoghurt.log) console.log(this, event);

      this.listen(`mousemove`, document);
      this.listen(`mouseup`, document);
      this.status.mouse = { x: event.pageX, y: event.pageY };

      event.preventDefault();

    } else

      this.onmouseup(event);
  }

  /**
   * Listener of `mousemove` event. Record mouse position movement and
   * dispatch `yoghurtdrag` event. If it is first time dragging, dispatch
   * `yoghurtpick` event.
   * @param {Event} event
   */
  onmousemove(event) {
    if (yoghurt.log?.verbose) console.log(this, event);

    if (!this.status.dragged)
      this.yoghurt.dispatchEvent(new yoghurt.Event.Pick());

    const dx = event.pageX - this.status.mouse.x;
    const dy = event.pageY - this.status.mouse.y;
    this.yoghurt.dispatchEvent(new yoghurt.Event.Drag(dx, dy));
  }

  /**
   * Listener of `mouseup` event. Clear mouse position information.
   * If the element has been dragged since `mousedown`, acquire the
   * element it is dropped on and dispatch `yoghurtdrop` event.
   * @param {Event} event
   */
  onmouseup(event) {
    if (yoghurt.log) console.log(this, event);

    this.unlisten(`mousemove`, document);
    this.unlisten(`mouseup`, document);
    this.status.mouse = null;

    if (this.status.dragged) {
      const target = document.elementFromPoint(event.pageX, event.pageY);
      this.yoghurt.dispatchEvent(new yoghurt.Event.Drop(target));
    }
  }

  /**
   * Listener for `yoghurtpick` event.
   * @param {Event} event
   */
  onyoghurtpick(event) {
    if (yoghurt.log) console.log(this, event);

    this.status.dragged = true;
  }

  /**
   * Listener for `yoghurtdrag` event.
   * @param {Event} event
   */
  onyoghurtdrag(event) {
    if (yoghurt.log?.verbose) console.log(this, event);
  }

  /**
   * Listener for `yoghurtdrop` event.
   * @param {Event} event
   */
  onyoghurtdrop(event) {
    if (yoghurt.log) console.log(this, event);

    this.status.dragged = false;
  }
}

yoghurt.Type.Yoghurt.Adjuster = class extends yoghurt.Type.Yoghurt {
  /**
   * @class Element adjuster. Resize parent element with mouse dragging.
   */
  constructor(parent, dir) {
    super(parent.yoghurt);

    this.parent = parent;
    this.dir = dir;

    this.yoghurt.classList.add(`yoghurt-adjuster`, `yoghurt-adjuster-${dir}`);

    this.listen(`yoghurtselected`, this.parent.yoghurt);
    this.listen(`yoghurtunselected`, this.parent.yoghurt);
    this.status.shape = null;
    this.status.fixed = { x: false, y: false };
  }

  /**
   * Sub destructor.
   */
  destructor() {
    delete this.parent;

    super.destructor();
  }

  /**
   * Sub listener of `yoghurtpick` event. Record the current parent shape.
   * @param {Event} event
   */
  onyoghurtpick(event) {
    super.onyoghurtpick(event);

    const locked = { x: this.dir[1] !== `l`, y: this.dir[0] !== `t` };
    this.status.shape = { w: parseFloat(this.parent.get(`width`)), h: parseFloat(this.parent.get(`height`)), locked };
    [this.status.shape.locked, this.parent.status.locked] = [this.parent.status.locked, this.status.shape.locked];
  }

  /**
   * Sub listener of `yoghurtdrag` event. Resize parent according to mouse
   * movement and direction of this adjuster.
   * @param {Event} event
   */
  onyoghurtdrag(event) {
    super.onyoghurtdrag(event);

    const rx = { l: -1, m: 0, r: 1 }[this.dir[1]];
    const ry = { t: -1, m: 0, b: 1 }[this.dir[0]];

    const w = this.status.shape.w + event.detail.dx * rx;
    const h = this.status.shape.h + event.detail.dy * ry;
    if (!this.status.fixed.x) this.parent.set(`width`, w);
    if (!this.status.fixed.y) this.parent.set(`height`, h);
  }

  /**
   * Sub listener of `yoghurtdrop` event. Clear parent shape information.
   * @param {Event} event
   */
  onyoghurtdrop(event) {
    super.onyoghurtdrop(event);

    this.parent.status.locked = this.status.shape.locked;
    this.status.shape = null;
  }

  /**
   * Sub listener of `yoghurtselected` event. Show all adjusters.
   * @param {Event} event
   */
  onyoghurtselected(event) {
    if (yoghurt.log?.verbose) console.log(this, event);

    if (this.status.mouse === null)
      this.parent.yoghurt.appendChild(this.yoghurt);
  }

  /**
   * Sub listener of `yoghurtselected` event. Hide all adjusters.
   * @param {Event} event
   */
  onyoghurtunselected(event) {
    if (yoghurt.log?.verbose) console.log(this, event);

    if (this.status.mouse === null)
      this.parent.yoghurt.removeChild(this.yoghurt);
  }
};

yoghurt.Type.Yoghurt.Element = class extends yoghurt.Type.Yoghurt {
  /**
   * @class Controlled element. Select and move element with mouse.
   */
  constructor(element) {
    super(element);

    this.yoghurt.classList.add(`yoghurt-element`);
    this.element.prepend(this.yoghurt);
    yoghurt.yoghurts.set(this.element, this);

    this.status.position = null;
    this.status.locked = { x: false, y: false };

    this.listen(`yoghurtselected`, this.yoghurt);
    this.listen(`yoghurtunselected`, this.yoghurt);
    this.status.selected = false;
  }

  /**
   * Sub destructor.
   */
  destructor() {
    this.unlisten(`yoghurtunselected`, this.yoghurt);
    this.unlisten(`yoghurtselected`, this.yoghurt);

    this.element.removeChild(this.yoghurt);
    yoghurt.yoghurts.delete(this.element);

    super.destructor();
  }

  /**
   * Sub listener of `mousedown` event. Dispatch `yoghurt[un]select` event to
   * inversed select the element and pervent this event from being propagated
   * to sup element.
   * @param {Event} event
   */
  onmousedown(event) {
    super.onmousedown(event);

    yoghurt.document.onmousedown(event);

    this.yoghurt.dispatchEvent(new yoghurt.Event.Select(!this.status.selected));

    event.stopPropagation();
  }

  /**
   * Sub listener of `yoghurtpick` event. Record current element position.
   * @param {Event} event
   */
  onyoghurtpick(event) {
    super.onyoghurtpick(event);

    this.status.position = { x: parseFloat(this.get(`left`)), y: parseFloat(this.get(`top`)) };
  }

  /**
   * Sub listener of `yoghurtdrag` event. Move the element according to mouse
   * movement and dispatch `yoghurtunselect` event.
   * @param {Event} event
   */
  onyoghurtdrag(event) {
    super.onyoghurtdrag(event);

    const x = this.status.position.x + event.detail.dx;
    const y = this.status.position.y + event.detail.dy;
    if (!this.status.locked.x) this.set(`left`, x);
    if (!this.status.locked.y) this.set(`top`, y);

    if (this.status.selected)
      this.yoghurt.dispatchEvent(new yoghurt.Event.Select(false));
  }

  /**
   * Sub listener of `yoghurtdrop` event. Dispatch `yoghurtselected` event.
   * @param {Event} event
   */
  onyoghurtdrop(event) {
    super.onyoghurtdrop(event);

    this.yoghurt.dispatchEvent(new yoghurt.Event.Select(true));
  }

  /**
   * Listener of `yoghurtselected` event. Change border color to primary blue.
   * @param {Event} event
   */
  onyoghurtselected(event) {
    if (yoghurt.log) console.log(this, event);

    console.assert(!this.status.selected);
    this.status.selected = true;

    this.yoghurt.style.setProperty(`border-color`, `var(--color-primary-blue)`);
  }

  /**
   * Listener of `yoghurtunselected` event. Change border color to secondary.
   * @param {Event} event
   */
  onyoghurtunselected(event) {
    if (yoghurt.log) console.log(this, event);

    console.assert(this.status.selected);
    this.status.selected = false;

    this.yoghurt.style.setProperty(`border-color`, `var(--color-secondary)`);
  }
};

yoghurt.Type.Yoghurt.Element.Adjustable = class extends yoghurt.Type.Yoghurt.Element {
  /**
   * @class Resizable controlled element. Resize element by adjusters.
   */
  constructor(element) {
    super(element);

    this.adjusters = [`tl`, `tm`, `tr`, `ml`, `mr`, `bl`, `bm`, `br`]
      .map((dir) => new yoghurt.Type.Yoghurt.Adjuster(this, dir));
  }

  /**
   * Sub destructor.
   */
  destructor() {
    delete this.adjusters;

    super.destructor();
  }
};
