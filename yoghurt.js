`use strict`;

console.time(`Yoghurt load `); // Load Timer
setTimeout(() => console.timeEnd(`Yoghurt load `));

/* -------------------------------------------------------------------------- */
/*                                     VAR                                    */
/* -------------------------------------------------------------------------- */

var yoghurt = Object.create(window.yoghurt ?? null);

yoghurt.log ??= false;
yoghurt.debug ??= false;
yoghurt.magnet ??= 7.0;

yoghurt.yoghurts = new Map();
yoghurt.observer = new MutationObserver((mutations) =>
  mutations.forEach(({ target, addedNodes, removedNodes }) => { })
);

/* -------------------------------------------------------------------------- */
/*                                    INIT                                    */
/* -------------------------------------------------------------------------- */

window.addEventListener(`load`, (event) => {
  yoghurt.observer.observe(document.body, { childList: true, subtree: true });
});

/* -------------------------------------------------------------------------- */
/*                                     API                                    */
/* -------------------------------------------------------------------------- */

yoghurt.take = function (element) {
  if (!yoghurt.yoghurts.has(element))
    switch (element.tagName) {
      case `DIV`:
        return new yoghurt.Type.Yoghurt.Element(element);

      default: return;
    }

  if (yoghurt.debug) debugger;
  return yoghurt.yoghurts.get(element);
};

yoghurt.drop = function (element) {
  if (yoghurt.yoghurts.has(element))
    return yoghurt.yoghurts.get(element).destructor();

  if (yoghurt.debug) debugger;
};

yoghurt.enter = function (element = document.body) {
  element.querySelectorAll(`*`).forEach((node) => yoghurt.take(node));
};

yoghurt.leave = function (element = document.body) {
  element.querySelectorAll(`*`).forEach((node) => yoghurt.drop(node));
};

/* -------------------------------------------------------------------------- */
/*                                    EVENT                                   */
/* -------------------------------------------------------------------------- */

yoghurt.Event = class extends CustomEvent { };

yoghurt.Event.Pick = class extends yoghurt.Event {
  constructor() {
    super(`yoghurtpick`);
  }
}

yoghurt.Event.Drag = class extends yoghurt.Event {
  constructor(dx, dy) {
    super(`yoghurtdrag`, { detail: { dx, dy } });
  }
}

yoghurt.Event.Drop = class extends yoghurt.Event {
  constructor(target) {
    super(`yoghurtdrop`, { detail: { target } });
  }
}

yoghurt.Event.Select = class extends yoghurt.Event {
  constructor(selected) {
    super(`yoghurt${selected ? `` : `un`}selected`);
  }
};

/* -------------------------------------------------------------------------- */
/*                                    CLASS                                   */
/* -------------------------------------------------------------------------- */

yoghurt.Type = class {
  get(name) {
    return window.getComputedStyle(this.element).getPropertyValue(name);
  }

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

  listen(type, element = this.yoghurt) {
    console.assert(!this.listener.has(type), arguments);

    const listener = this[`on${type}`].bind(this);
    element.addEventListener(type, listener);

    this.listener.set(type, listener);
  }

  unlisten(type, element = this.yoghurt) {
    console.assert(this.listener.has(type), arguments);

    const listener = this.listener.get(type);
    element.removeEventListener(type, listener);

    this.listener.delete(type);
  }

  constructor(element) {
    this.element = element;
    yoghurt.yoghurts.set(element, this);

    this.listener = new Map();

    this.status = new Object();
  }

  destructor() {
    delete this.status;

    console.assert(this.listener.size === 0);
    delete this.listener;

    yoghurt.yoghurts.delete(this.element);
    delete this.element;
  }
};

yoghurt.Type.Yoghurt = class extends yoghurt.Type {
  constructor(element) {
    super(element);

    this.yoghurt = document.createElement(`div`);
    this.yoghurt.classList.add(`yoghurt`);

    this.listen(`mousedown`);
    this.status.mouse = null;

    this.listen(`yoghurtpick`);
    this.listen(`yoghurtdrag`);
    this.listen(`yoghurtdrop`);
    this.status.dragged = false;
  }

  destructor() {
    this.unlisten(`mousedown`);

    this.element.removeChild(this.yoghurt);
    delete this.yoghurt;

    super.destructor();
  }

  onmousedown(event) {
    if (yoghurt.log) console.log(this, event);

    this.listen(`mousemove`, document);
    this.listen(`mouseup`, document);
    this.status.mouse = { x: event.pageX, y: event.pageY };
  }

  onmousemove(event) {
    if (yoghurt.log?.verbose) console.log(this, event);

    if (!this.status.dragged)
      this.yoghurt.dispatchEvent(new yoghurt.Event.Pick());

    const dx = event.pageX - this.status.mouse.x;
    const dy = event.pageY - this.status.mouse.y;
    this.yoghurt.dispatchEvent(new yoghurt.Event.Drag(dx, dy));
  }

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

  onyoghurtpick(event) {
    if (yoghurt.log) console.log(this, event);

    this.status.dragged = true;
  }

  onyoghurtdrag(event) {
    if (yoghurt.log?.verbose) console.log(this, event);
  }

  onyoghurtdrop(event) {
    if (yoghurt.log) console.log(this, event);

    this.status.dragged = false;
  }
}

yoghurt.Type.Yoghurt.Adjuster = class extends yoghurt.Type.Yoghurt {
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

  destructor() {
    this.unlisten(`yoghurtselected`, this.parent.yoghurt);
    this.unlisten(`yoghurtunselected`, this.parent.yoghurt);

    delete this.parent;

    super.destructor();
  }

  onyoghurtpick(event) {
    super.onyoghurtpick(event);

    this.status.shape = { w: parseFloat(this.parent.get(`width`)), h: parseFloat(this.parent.get(`height`)) };

    if (this.dir[1] !== `l`) this.parent.status.locked.x = true;
    if (this.dir[0] !== `t`) this.parent.status.locked.y = true;
  }

  onyoghurtdrag(event) {
    super.onyoghurtdrag(event);

    const rx = { l: -1, m: 0, r: 1 }[this.dir[1]];
    const ry = { t: -1, m: 0, b: 1 }[this.dir[0]];

    const w = this.status.shape.w + event.detail.dx * rx;
    const h = this.status.shape.h + event.detail.dy * ry;
    if (!this.status.fixed.x) this.parent.set(`width`, w);
    if (!this.status.fixed.y) this.parent.set(`height`, h);
  }

  onyoghurtdrop(event) {
    super.onyoghurtdrop(event);

    this.status.shape = null;

    if (this.dir[1] !== `l`) this.parent.status.locked.x = false;
    if (this.dir[0] !== `t`) this.parent.status.locked.y = false;
  }

  onyoghurtselected(event) {
    if (yoghurt.log?.verbose) console.log(event);

    this.parent.yoghurt.appendChild(this.yoghurt);
  }

  onyoghurtunselected(event) {
    if (yoghurt.log?.verbose) console.log(event);

    this.parent.yoghurt.removeChild(this.yoghurt);
  }
};

yoghurt.Type.Yoghurt.Element = class extends yoghurt.Type.Yoghurt {
  constructor(element) {
    super(element);

    this.element.prepend(this.yoghurt);

    this.yoghurt.classList.add(`yoghurt-element`);

    this.adjusters = [`tl`, `tm`, `tr`, `ml`, `mr`, `bl`, `bm`, `br`]
      .map((dir) => new yoghurt.Type.Yoghurt.Adjuster(this, dir));

    this.status.position = null;
    this.status.locked = { x: false, y: false };

    this.listen(`yoghurtselected`);
    this.listen(`yoghurtunselected`);
    this.status.selected = false;
  }

  destructor() {
    this.unlisten(`yoghurtunselected`);
    this.unlisten(`yoghurtselected`);

    super.destructor();
  }

  onmousedown(event) {
    super.onmousedown(event);

    event.stopPropagation();
    event.preventDefault();

    this.yoghurt.dispatchEvent(new yoghurt.Event.Select(!this.status.selected));
  }

  onyoghurtpick(event) {
    super.onyoghurtpick(event);

    this.status.position = { x: parseFloat(this.get(`left`)), y: parseFloat(this.get(`top`)) };
  }

  onyoghurtdrag(event) {
    super.onyoghurtdrag(event);

    const x = this.status.position.x + event.detail.dx;
    const y = this.status.position.y + event.detail.dy;
    if (!this.status.locked.x) this.set(`left`, x);
    if (!this.status.locked.y) this.set(`top`, y);

    if (this.status.selected)
      this.yoghurt.dispatchEvent(new yoghurt.Event.Select(false));
  }

  onyoghurtdrop(event) {
    super.onyoghurtdrop(event);

    this.yoghurt.dispatchEvent(new yoghurt.Event.Select(true));
  }

  onyoghurtselected(event) {
    if (yoghurt.log) console.log(this, event);

    console.assert(!this.status.selected);
    this.status.selected = true;

    this.yoghurt.style.setProperty(`border-color`, `var(--color-primary-blue)`);
  }

  onyoghurtunselected(event) {
    if (yoghurt.log) console.log(this, event);

    console.assert(this.status.selected);
    this.status.selected = false;

    this.yoghurt.style.setProperty(`border-color`, `var(--color-secondary)`);
  }

};
