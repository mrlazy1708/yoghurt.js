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
  yoghurt.document = new yoghurt.Type.Document(document);
});

/* -------------------------------------------------------------------------- */
/*                                     API                                    */
/* -------------------------------------------------------------------------- */

yoghurt.take = function (element) {
  if (!yoghurt.yoghurts.has(element))
    switch (element.nodeName) {
      case `DIV`:
        return new yoghurt.Type.Yoghurt.Element.Adjustable(element);

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

  listen(type, element) {
    console.assert(!this.listener.has(type), arguments);

    const listener = this[`on${type}`].bind(this);
    element.addEventListener(type, listener);

    this.listener.set(type, listener);
  }

  unlisten(type, element) {
    console.assert(this.listener.has(type), arguments);

    const listener = this.listener.get(type);
    element.removeEventListener(type, listener);

    this.listener.delete(type);
  }

  constructor(element) {
    this.element = element;

    this.listener = new Map();

    this.status = new Object();
  }

  destructor() {
    delete this.status;

    console.assert(this.listener.size === 0);
    delete this.listener;

    delete this.element;
  }
};

yoghurt.Type.Document = class extends yoghurt.Type {
  constructor(element) {
    super(element);

    this.listen(`mousedown`, document);
  }

  destructor() {
    this.unlisten(`mousedown`, document);

    super.destructor();
  }

  onmousedown(event) {
    if (yoghurt.log) console.log(this, event);

    yoghurt.yoghurts.forEach((self) =>
      self.status.selected && self.status.mouse === null &&
      self.yoghurt.dispatchEvent(new yoghurt.Event.Select(false)));
  }
};

yoghurt.Type.Yoghurt = class extends yoghurt.Type {
  constructor(element) {
    super(element);

    this.yoghurt = document.createElement(`div`);
    this.yoghurt.classList.add(`yoghurt`);
    yoghurt.yoghurts.set(element, this);

    this.listen(`mousedown`, this.yoghurt);
    this.status.mouse = null;

    this.listen(`yoghurtpick`, this.yoghurt);
    this.listen(`yoghurtdrag`, this.yoghurt);
    this.listen(`yoghurtdrop`, this.yoghurt);
    this.status.dragged = false;
  }

  destructor() {
    this.unlisten(`yoghurtpick`, this.yoghurt);
    this.unlisten(`yoghurtdrag`, this.yoghurt);
    this.unlisten(`yoghurtdrop`, this.yoghurt);

    this.unlisten(`mousedown`, this.yoghurt);

    yoghurt.yoghurts.delete(this.element);
    this.element.removeChild(this.yoghurt);
    delete this.yoghurt;

    super.destructor();
  }

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

    this.status.shape = null;
    this.status.fixed = { x: false, y: false };
  }

  destructor() {
    delete this.parent;

    super.destructor();
  }

  onyoghurtpick(event) {
    super.onyoghurtpick(event);

    const locked = { x: this.dir[1] !== `l`, y: this.dir[0] !== `t` };
    this.status.shape = { w: parseFloat(this.parent.get(`width`)), h: parseFloat(this.parent.get(`height`)), locked };
    [this.status.shape.locked, this.parent.status.locked] = [this.parent.status.locked, this.status.shape.locked];
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

    this.parent.status.locked = this.status.shape.locked;
    this.status.shape = null;
  }
};

yoghurt.Type.Yoghurt.Element = class extends yoghurt.Type.Yoghurt {
  constructor(element) {
    super(element);

    this.element.prepend(this.yoghurt);

    this.yoghurt.classList.add(`yoghurt-element`);

    this.status.position = null;
    this.status.locked = { x: false, y: false };

    this.listen(`yoghurtselected`, this.yoghurt);
    this.listen(`yoghurtunselected`, this.yoghurt);
    this.status.selected = false;
  }

  destructor() {
    this.unlisten(`yoghurtunselected`, this.yoghurt);
    this.unlisten(`yoghurtselected`, this.yoghurt);

    super.destructor();
  }

  onmousedown(event) {
    super.onmousedown(event);

    yoghurt.document.onmousedown(event);

    this.yoghurt.dispatchEvent(new yoghurt.Event.Select(!this.status.selected));

    event.stopPropagation();
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

yoghurt.Type.Yoghurt.Element.Adjustable = class extends yoghurt.Type.Yoghurt.Element {
  constructor(element) {
    super(element);

    this.adjusters = [`tl`, `tm`, `tr`, `ml`, `mr`, `bl`, `bm`, `br`]
      .map((dir) => new yoghurt.Type.Yoghurt.Adjuster(this, dir));
  }

  destructor() {
    delete this.adjusters;

    super.destructor();
  }

  onyoghurtselected(event) {
    super.onyoghurtselected(event);

    this.adjusters.forEach((adjuster) => this.yoghurt.appendChild(adjuster.yoghurt));
  }

  onyoghurtunselected(event) {
    super.onyoghurtunselected(event);

    this.adjusters.forEach((adjuster) => this.yoghurt.removeChild(adjuster.yoghurt));
  }
};
