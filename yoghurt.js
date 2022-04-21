`use strict`;

console.time(`Yoghurt load `); // Load Timer
setTimeout(() => console.timeEnd(`Yoghurt load `));

/* -------------------------------------------------------------------------- */
/*                                     VAR                                    */
/* -------------------------------------------------------------------------- */

var yoghurt = Object.create(window.yoghurt ?? null);

yoghurt.debug ??= false;
yoghurt.magnet ??= 7;

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

      /* ----------------------------- Content Section ---------------------------- */
      case `SECTION`: case `ARTICLE`: case `MAIN`:
      case `HEADER`: case `FOOTER`: case `ASIDE`: case `NAV`:
      case `H1`: case `H2`: case `H3`: case `H4`: case `H5`: case `H6`:
        return new yoghurt.Yoghurt.Element.Text(element);

      /* ------------------------------ Text Content ------------------------------ */
      case `DIV`:
      case `DD`: case `DL`: case `DT`:
      case `LI`: case `OL`: case `UL`: case `MENU`:
      case `P`: case `PRE`:
      case `HR`:
      case `BLOCKQUOTE`:
      case `FIGURE`: case `FIGCAPTION`:
        return new yoghurt.Yoghurt.Element.Text(element);

      /* ----------------------------- Inline Content ----------------------------- */
      case `SPAN`:
      case `A`: case `B`: case `BDI`: case `BDO`: case `EM`: case `I`: case `MARK`: case `Q`: case `S`: case `SMALL`: case `STRONG`: case `SUB`: case `SUP`: case `U`:
      case `ABBR`: case `ADDRESS`: case `CITE`: case `CODE`: case `DATA`: case `DFN`: case `KBD`: case `TIME`: case `SAMP`: case `VAR`:
      case `BR`: case `WBR`:
      case `DEL`: case `INS`:
      case `RUBY`: case `RP`: case `RT`:
        return new yoghurt.Yoghurt.Element.Text(element);

      /* ------------------------------ Table Content ----------------------------- */
      case `TABLE`:
      case `THEAD`: case `TH`:
      case `TBODY`: case `TD`: case `TR`: case `COL`: case `COLGROUP`:
      case `TFOOT`: case `CAPTION`:
        return new yoghurt.Yoghurt.Element.Text(element);

      default:
        console.warn(arguments);
        return null;
    }

  console.warn(arguments);
  return yoghurt.yoghurts.get(element);
};

yoghurt.drop = function (element) {
  if (yoghurt.yoghurts.has(element)) yoghurt.yoghurts.get(element).destructor();
  else console.warn(arguments);
};

yoghurt.enter = function (element = document.body, filter = null) {
  const it = document.createNodeIterator(element, NodeFilter.SHOW_ALL, filter);
  const nodes = new Set((function* () {
    for (let node = it.nextNode(); node !== null; node = it.nextNode())
      yield node;
  })());

  nodes.forEach((node) => yoghurt.take(node));
};

yoghurt.leave = function (element = document.body) {
  const it = document.createNodeIterator(element, NodeFilter.SHOW_ALL);
  for (let node = it.nextNode(); node !== null; node = it.nextNode())
    yoghurt.drop(node);
};

/* -------------------------------------------------------------------------- */
/*                                    EVENT                                   */
/* -------------------------------------------------------------------------- */

yoghurt.Event = class extends CustomEvent { };

yoghurt.Event.Move = class extends yoghurt.Event {
  constructor(x, y) {
    super(`yoghurtmove`, { detail: { x, y } });
  }
};

yoghurt.Event.Select = class extends yoghurt.Event {
  constructor(selected) {
    super(`yoghurt${selected ? `` : `un`}selected`);
  }
};

/* -------------------------------------------------------------------------- */
/*                                    TYPE                                    */
/* -------------------------------------------------------------------------- */

yoghurt.Yoghurt = class {
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
        console.error(arguments);
    }
  }

  listen(type, element = this.element) {
    console.assert(!this.listener.has(type), arguments);

    const listener = this[`on${type}`].bind(this);
    element.addEventListener(type, listener);

    this.listener.set(type, listener);
  }

  unlisten(type, element = this.element) {
    console.assert(this.listener.has(type), arguments);

    const listener = this.listener.get(type);
    element.removeEventListener(type, listener);

    this.listener.delete(type);
  }

  constructor(element) {
    this.element = element;
    yoghurt.yoghurts.set(element, this);

    this.yoghurt = document.createElement(`div`);
    this.yoghurt.classList.add(`yoghurt`);
    this.yoghurt.setAttribute(`draggable`, `true`);
    this.element.appendChild(this.yoghurt);

    this.listener = new Map();

    this.status = new Object();
  }

  destructor() {
    delete this.status;

    console.assert(this.listener.size === 0);
    delete this.listener;

    this.element.removeChild(this.yoghurt);
    delete this.yoghurt;

    yoghurt.yoghurts.delete(this.element);
    delete this.element;
  }
};

yoghurt.Yoghurt.Adjuster = class extends yoghurt.Yoghurt {
  constructor(parent, dir) {
    super(document.createElement(`div`));
    this.parent = parent;

    this.element.classList.add(`yoghurt`, `yoghurt-adjuster`, `yoghurt-adjuster-${dir}`);

    this.listen(`yoghurtselected`, this.parent.element);
    this.listen(`yoghurtunselected`, this.parent.element);

    this.status.shape = null;
  }

  destructor() {
    delete this.parent;

    this.unlisten(`yoghurtselected`, this.parent.element);
    this.unlisten(`yoghurtunselected`, this.parent.element);

    super.destructor();
  }

  onmousedown(event) {
    super.onmousedown(event);

    this.status.shape = { x: parseFloat(this.get(`width`)), y: parseFloat(this.get(`height`)) };
  }

  onmousemove(event) { }

  onmouseup(event) {
    super.onmouseup(event);

    this.status.shape = null;
  }

  onyoghurtselected(event) {
    if (yoghurt.debug?.verbose) console.debug(event);

    this.parent.yoghurt.appendChild(this.element);
  }

  onyoghurtunselected(event) {
    if (yoghurt.debug?.verbose) console.debug(event);

    this.parent.yoghurt.removeChild(this.element);
  }
};

yoghurt.Yoghurt.Element = class extends yoghurt.Yoghurt {

  constructor(element) {
    super(element);

    this.yoghurt.classList.add(`yoghurt-element`);

    // this.adjuster = [`tl`, `tm`, `tr`, `ml`, `mr`, `bl`, `bm`, `br`].map(
    //   (dir) => new yoghurt.Yoghurt.Adjuster(this, dir)
    // );

    this.listen(`dragstart`);
    this.listen(`drag`);
    this.listen(`dragend`);
    this.status.position = null;

    this.listen(`yoghurtselected`);
    this.listen(`yoghurtunselected`);
    this.status.selected = false;
  }

  destructor() {
    this.unlisten(`yoghurtundragged`);
    this.unlisten(`yoghurtdragged`);
    this.unlisten(`yoghurtunselected`);
    this.unlisten(`yoghurtselected`);

    super.destructor();
  }

  ondragstart(event) {
    if (yoghurt.debug) console.debug(this, event);

    this.status.position = {
      dx: parseFloat(this.get(`left`)) - event.pageX,
      dy: parseFloat(this.get(`top`)) - event.pageY
    };

    this.element.dispatchEvent(new yoghurt.Event.Select(!this.status.selected));

  }

  ondrag(event) {
    if (yoghurt.debug) console.debug(this, event);

    const x = + event.pageX + this.status.position.dx;
    this.set(`left`, x);

    const y = + event.pageY + this.status.position.dy;
    this.set(`top`, y);

    this.element.dispatchEvent(new yoghurt.Event.Move(x, y));

    if (this.status.selected)
      this.element.dispatchEvent(new yoghurt.Event.Select(false));

    event.preventDefault();
  }

  ondragend(event) {
    if (yoghurt.debug) console.debug(this, event);

    this.status.position = null;

    event.preventDefault();
  }

  onyoghurtselected(event) {
    if (yoghurt.debug) console.debug(this, event);

    console.assert(!this.status.selected);
    this.status.selected = true;

    this.yoghurt.style.setProperty(`border-color`, `var(--color-primary-blue)`);
  }

  onyoghurtunselected(event) {
    if (yoghurt.debug) console.debug(this, event);

    console.assert(this.status.selected);
    this.status.selected = false;

    this.yoghurt.style.setProperty(`border-color`, `var(--color-secondary)`);
  }

};

yoghurt.Yoghurt.Element.Text = class extends yoghurt.Yoghurt.Element { };

/* -------------------------------------------------------------------------- */
/*                                    TEST                                    */
/* -------------------------------------------------------------------------- */

yoghurt.debug = true;
setTimeout(() => yoghurt.enter(), 1000);
// setTimeout(() => yoghurt.leave(), 2000);
