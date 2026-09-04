/**
 * One theme and one series palette for every chart in the simulators.
 *
 * Four of the five tools draw with Chart.js, and each of them configured it
 * from scratch. That produced four different charts of the same data: the
 * Freedom Calendar drew in #2e6f40, the Market Time Machine in #134e2a, the hub
 * in #2e6f40 with #c3922e points, and the Passive Income Engine in a six-colour
 * palette of #10b981, #2563eb and #9333ea - none of which is a colour that
 * appears anywhere else on the site. Every one of them also asked for
 * `family: 'Inter'` in three or four separate places, so the chart labels were
 * set in a different typeface from the page around them.
 *
 * The colours mattered more than they look like they should. A chart is the
 * largest single block of colour on a simulator, so four charts in four palettes
 * is most of the reason the five tools read as five different products.
 *
 * This file sets Chart.defaults once - typeface, ink, grid, tooltip - and
 * publishes the palette as `window.SimChartTheme`. The per-chart configuration
 * in each tool now names a series index instead of a hex value, so a chart's
 * first line is the brand green on all four tools without any of them saying
 * what the brand green is.
 *
 * Deferred, and linked after chart-4.4.1.umd.min.js and before the tool's own
 * bundle: deferred scripts run in document order, so Chart exists when this
 * runs and the defaults are set before anything constructs a chart. The palette
 * is published whether or not Chart.js loaded, because the Monte Carlo cockpit
 * draws to a raw canvas and reads the same colours without using Chart at all.
 */
(function () {
  'use strict';

  var FONT = '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';

  /* Tokens duplicated from sim-system.css. A canvas cannot read a custom
     property - it is painted, not styled - so a chart colour has to reach
     JavaScript as a literal somewhere. Here is the one place it does. */
  var INK = '#574838';
  var INK_STRONG = '#2a241e';
  var GRID = '#efeae0';
  var SURFACE = '#fffdf8';

  /**
   * The series palette, in the order charts consume it.
   *
   * `line` is what the dataset is stroked in, `text` is the cut of the same
   * colour that is legible as text on cream (every one of these clears 4.5:1 on
   * all four cream surfaces and on its own tint), and `tint` is the fill.
   *
   * The first two are the brand pair, so a chart with one or two series - which
   * is four of the six charts in the tools - reads as forest green and gold
   * rather than as a palette. The rest are chosen to stay apart from each other
   * and to stay recognisably part of the same set.
   *
   * Series 5 and 6 are close in luminance, so they are distinguishable by hue
   * but not in greyscale. The one chart that plots all six also dashes those
   * two, which is what separates them for a reader who cannot separate the
   * hues - and the reason to keep the dashes if that chart is ever rewritten.
   */
  var SERIES = [
    { line: '#1e4620', text: '#1e4620', tint: 'rgba(30, 70, 32, 0.10)' },
    { line: '#c59b27', text: '#7a5f12', tint: 'rgba(197, 155, 39, 0.12)' },
    { line: '#2a5b8c', text: '#2a5b8c', tint: 'rgba(42, 91, 140, 0.10)' },
    { line: '#a6402a', text: '#a6402a', tint: 'rgba(166, 64, 42, 0.10)' },
    { line: '#2f7a72', text: '#1f6259', tint: 'rgba(47, 122, 114, 0.10)' },
    { line: '#7a6a52', text: '#5a4d3a', tint: 'rgba(122, 106, 82, 0.10)' }
  ];

  /** Status colours, for the datasets that mean "good" or "bad" rather than "the third one". */
  var ROLES = {
    positive: '#146b44',
    caution: '#8a5a0b',
    negative: '#a6402a',
    info: '#2a5b8c',
    forest: '#1e4620',
    gold: '#c59b27',
    ink: INK,
    inkStrong: INK_STRONG,
    grid: GRID,
    surface: SURFACE
  };

  function at(index) {
    return SERIES[((index % SERIES.length) + SERIES.length) % SERIES.length];
  }

  window.SimChartTheme = {
    series: SERIES,
    role: ROLES,
    font: FONT,
    /** The stroke for series `index`, wrapping round rather than returning undefined. */
    line: function (index) { return at(index).line; },
    /** The same colour as text - for a legend chip or a label in the markup. */
    text: function (index) { return at(index).text; },
    /** The area fill under series `index`, or at an explicit alpha. */
    fill: function (index, alpha) {
      if (alpha === undefined) return at(index).tint;
      var hex = at(index).line.slice(1);
      return 'rgba(' + parseInt(hex.slice(0, 2), 16) + ', ' + parseInt(hex.slice(2, 4), 16) +
        ', ' + parseInt(hex.slice(4, 6), 16) + ', ' + alpha + ')';
    }
  };

  if (typeof window.Chart === 'undefined') return;

  var defaults = window.Chart.defaults;

  /* Typeface and ink. Setting these on the root defaults is what removes the
     `family: 'Inter'` that the tools were repeating per axis and per legend. */
  defaults.font.family = FONT;
  defaults.font.size = 11;
  defaults.color = INK;

  /* One border and one point size across every chart, so a line in one tool is
     the same weight as the same line in another. */
  defaults.elements.line.borderWidth = 2.5;
  defaults.elements.line.tension = 0.25;
  defaults.elements.point.radius = 0;
  defaults.elements.point.hoverRadius = 4;
  defaults.elements.point.borderWidth = 2;
  defaults.elements.point.borderColor = SURFACE;
  defaults.elements.arc.borderWidth = 2;
  defaults.elements.arc.borderColor = SURFACE;

  /* Legends were bottom on two charts, top on one and off on another, at three
     font sizes. Bottom, because the charts are wide and short and a legend
     above one pushes the plot off a phone screen. */
  defaults.plugins.legend.position = 'bottom';
  defaults.plugins.legend.labels.boxWidth = 10;
  defaults.plugins.legend.labels.boxHeight = 10;
  defaults.plugins.legend.labels.padding = 12;
  defaults.plugins.legend.labels.usePointStyle = true;
  defaults.plugins.legend.labels.pointStyle = 'circle';
  defaults.plugins.legend.labels.color = INK;
  defaults.plugins.legend.labels.font = { family: FONT, size: 11, weight: '600' };

  /* The tooltip is the one part of a chart that is drawn over the page, so it
     is the dark ink surface the rest of the site uses for the same job rather
     than Chart.js's default near-black. */
  defaults.plugins.tooltip.backgroundColor = 'rgba(31, 25, 19, 0.95)';
  defaults.plugins.tooltip.titleColor = '#fffdf8';
  defaults.plugins.tooltip.bodyColor = 'rgba(255, 253, 248, 0.88)';
  defaults.plugins.tooltip.borderColor = 'rgba(197, 155, 39, 0.45)';
  defaults.plugins.tooltip.borderWidth = 1;
  defaults.plugins.tooltip.cornerRadius = 8;
  defaults.plugins.tooltip.padding = 10;
  defaults.plugins.tooltip.displayColors = true;
  defaults.plugins.tooltip.boxWidth = 8;
  defaults.plugins.tooltip.boxHeight = 8;
  defaults.plugins.tooltip.usePointStyle = true;
  defaults.plugins.tooltip.titleFont = { family: FONT, size: 12, weight: '700' };
  defaults.plugins.tooltip.bodyFont = { family: FONT, size: 12, weight: '500' };

  /* Axes. The horizontal grid stays and the vertical grid goes: these are all
     time series, so the vertical lines were repeating the tick labels. */
  if (defaults.scales && defaults.scales.linear) {
    defaults.scales.linear.grid.color = GRID;
    defaults.scales.linear.grid.drawTicks = false;
    defaults.scales.linear.border = { display: false };
    defaults.scales.linear.ticks.color = INK;
    defaults.scales.linear.ticks.padding = 8;
  }
  if (defaults.scales && defaults.scales.category) {
    defaults.scales.category.grid.display = false;
    defaults.scales.category.border = { display: false };
    defaults.scales.category.ticks.color = INK;
    defaults.scales.category.ticks.padding = 6;
    defaults.scales.category.ticks.maxRotation = 0;
  }

  defaults.maintainAspectRatio = false;
  defaults.responsive = true;

  /* A chart redrawing on every slider drag should not animate: the tools update
     on `input`, so the animation was competing with the next update rather than
     showing a transition. One of the four had already turned it off by hand.
     And anybody who has asked for less motion gets none. */
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    defaults.animation = false;
  } else {
    defaults.animation = { duration: 220 };
  }
})();
