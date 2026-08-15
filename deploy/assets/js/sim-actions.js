/**
 * Runs the simulators' declarative click, input and change handlers.
 *
 * The five simulator pages carried a hundred-odd `onclick="doThing('x')"`
 * attributes. Every one of them is inline script, so the pages could only be
 * served with `script-src 'unsafe-inline'` - and a policy that allows inline
 * script allows any inline script, which is the injection it was there to
 * stop. The attributes are now `data-onclick`, which is data, and this file is
 * what gives them meaning.
 *
 * What it does NOT do is evaluate them. `new Function(attribute)` would restore
 * the hole exactly, with an extra step. Instead the attribute is parsed as one
 * small fixed grammar - a function name, and arguments that are string, number,
 * boolean or null literals, or the token `this.value` - and anything that does
 * not fit that shape is refused. An injected `data-onclick` cannot express an
 * expression, a property lookup, or a call to anything but a function the page
 * itself defined at the top level.
 *
 * Delegated from the document rather than bound per element, because most of
 * these attributes arrive on markup the simulators build at runtime. Binding on
 * load would miss every one of those; delegation means an element works the
 * moment it exists.
 */
(function () {
  'use strict';

  var ATTRIBUTES = {
    click: 'data-onclick',
    input: 'data-oninput',
    change: 'data-onchange'
  };

  // name(arg, arg, ...) or name() - nothing else parses.
  var CALL = /^([A-Za-z_$][\w$]*)\((.*)\)$/;
  var STRING = /^'((?:[^'\\]|\\.)*)'$|^"((?:[^"\\]|\\.)*)"$/;
  var NUMBER = /^-?\d+(?:\.\d+)?$/;

  function parseArgument(raw, element) {
    var token = raw.trim();
    if (token === 'this.value') return element.value;
    if (token === 'true') return true;
    if (token === 'false') return false;
    if (token === 'null') return null;
    if (NUMBER.test(token)) return Number(token);

    var quoted = token.match(STRING);
    if (quoted) {
      var body = quoted[1] !== undefined ? quoted[1] : quoted[2];
      return body.replace(/\\(.)/g, '$1');
    }
    return undefined;
  }

  /**
   * Arguments are split on commas at depth zero and outside quotes, so a comma
   * inside a translated label - "Fat FIRE, ampliado" - stays part of its string
   * instead of becoming a second argument.
   */
  function splitArguments(source) {
    var parts = [];
    var current = '';
    var quote = null;

    for (var index = 0; index < source.length; index += 1) {
      var character = source[index];
      if (quote) {
        current += character;
        if (character === '\\') { current += source[++index] || ''; continue; }
        if (character === quote) quote = null;
        continue;
      }
      if (character === "'" || character === '"') { quote = character; current += character; continue; }
      if (character === ',') { parts.push(current); current = ''; continue; }
      current += character;
    }
    if (current.trim() !== '') parts.push(current);
    return parts;
  }

  function run(element, source) {
    var call = String(source).trim().match(CALL);
    if (!call) {
      console.warn('sim-actions: "' + source + '" is not a plain function call. Ignored.');
      return;
    }

    var handler = window[call[1]];
    if (typeof handler !== 'function') {
      // Ordinary during load: the page is interactive before its behaviour
      // bundle has finished parsing, so an early click can land here. Warning
      // rather than throwing keeps one missing function from stopping the
      // delegation for every other control on the page.
      console.warn('sim-actions: no function named "' + call[1] + '".');
      return;
    }

    var raw = call[2].trim();
    var args = raw === '' ? [] : splitArguments(raw).map(function (part) {
      return parseArgument(part, element);
    });

    if (args.some(function (value) { return value === undefined; })) {
      console.warn('sim-actions: "' + source + '" has an argument that is not a literal. Ignored.');
      return;
    }

    handler.apply(element, args);
  }

  Object.keys(ATTRIBUTES).forEach(function (type) {
    var attribute = ATTRIBUTES[type];
    document.addEventListener(type, function (event) {
      var element = event.target.closest ? event.target.closest('[' + attribute + ']') : null;
      if (element) run(element, element.getAttribute(attribute));
    // Capture for input and change, which do not bubble in every browser for
    // every control type. Click bubbles everywhere, so it stays on the target
    // phase where event.target.closest gives the element that was clicked.
    }, type !== 'click');
  });
})();
