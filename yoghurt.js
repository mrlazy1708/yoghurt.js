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
  mutations.forEach(({ target, attributeName, addedNodes, removedNodes }) => {
    console.log(target, `attr ${attributeName}`);
    console.log(`add`, addedNodes);
    console.log(`rem`, removedNodes);
  })
);

/* -------------------------------------------------------------------------- */
/*                                     API                                    */
/* -------------------------------------------------------------------------- */

yoghurt.take = function (element) {
  if (yoghurt.debug?.verbose) console.log(element);

  // prettier-ignore
  if (!yoghurt.yoghurts.has(element))
    switch (element.tagName) {

/* ----------------------------- Content Section ---------------------------- */
      case `SECTION`: case `ARTICLE`: case `MAIN`   : 
      case `HEADER` : case `FOOTER` : case `ASIDE`  : case `NAV`    : 
      case `H1`     : case `H2`     : case `H3`     : case `H4`     : case `H5`     : case `H6`     : 
        return new yoghurt(element);

/* ------------------------------ Text Content ------------------------------ */
      case `DIV`    : 
      case `DD`     : case `DL`     : case `DT`     : 
      case `LI`     : case `OL`     : case `UL`     : case `MENU`   : 
      case `P`      : case `PRE`    : 
      case `HR`     : 
      case `BLOCKQUOTE`             : 
      case `FIGURE` : case `FIGCAPTION`             : 
        return new yoghurt(element);

/* ----------------------------- Inline Content ----------------------------- */
      case `SPAN`   : 
      case `A`      : case `B`      : case `BDI`    : case `BDO`    : case `EM`     : case `I`      : case `MARK`   : case `Q`      : case `S`      : case `SMALL`  : case `STRONG` : case `SUB`    : case `SUP`    : case `U`      : 
      case `ABBR`   : case `ADDRESS`: case `CITE`   : case `CODE`   : case `DATA`   : case `DFN`    : case `KBD`    : case `TIME`   : case `SAMP`   : case `VAR`    : 
      case `BR`     : case `WBR`    : 
      case `DEL`    : case `INS`    :
      case `RUBY`   : case `RP`     : case `RT`     : 
        return new yoghurt(element);

/* ------------------------------ Table Content ----------------------------- */
      case `TABLE`  : 
      case `THEAD`  : case `TH`     : 
      case `TBODY`  : case `TD`     : case `TR`     : case `COL`    : case `COLGROUP`               : 
      case `TFOOT`  : case `CAPTION`: 
        return new yoghurt(element);

      default: 
        if (yoghurt.debug) console.warn(element);
        return null;
    }

  if (yoghurt.debug) console.warn(element);
  return yoghurt.yoghurts.get(element);
};

yoghurt.drop = function (element) {
  if (yoghurt.debug?.verbose) console.log(element);

  if (yoghurt.yoghurts.has(element)) yoghurt.yoghurts.get(element).destructor();
  else if (yoghurt.debug) console.warn(element);
};

yoghurt.enter = function (element = document.body) {
  if (yoghurt.debug) console.log(element);

  const it = document.createNodeIterator(element, NodeFilter.SHOW_ALL);
  for (let node = it.nextNode(); node !== null; node = it.nextNode())
    yoghurt.take(node);
};

yoghurt.leave = function (element = document.body) {
  if (yoghurt.debug) console.log(element);

  const it = document.createNodeIterator(element, NodeFilter.SHOW_ALL);
  for (let node = it.nextNode(); node !== null; node = it.nextNode())
    yoghurt.drop(node);
};

/* -------------------------------------------------------------------------- */
/*                                    Event                                   */
/* -------------------------------------------------------------------------- */

yoghurt.Event = class extends CustomEvent {};

/* -------------------------------------------------------------------------- */
/*                                    Type                                    */
/* -------------------------------------------------------------------------- */

yoghurt.Type = class {};

yoghurt.Type.Adjuter = class extends yoghurt.Type {};

yoghurt.Type.Element = class extends yoghurt.Type {};

yoghurt.Type.Element.Text = class extends yoghurt.Type.Element {};
