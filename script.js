/* ==========================================================================
   SUTRAKALPA — script.js
   Vanilla JS. No dependencies. Builds the animated "thread" through the
   page from measured anchor points, plus small UI interactions.
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var COLORS = {
    vermillion: '#C7492E',
    ultramarine: '#2454FF',
    brass: '#B38A3D'
  };
  var CYCLE = ['vermillion', 'ultramarine', 'brass'];

  /* ----------------------------------------------------------------
     Menu toggle
     ---------------------------------------------------------------- */
  var menuToggle = document.getElementById('menuToggle');
  var siteNav = document.getElementById('siteNav');

  var menuLabel = menuToggle ? menuToggle.querySelector('span') : null;

  function setNavOpen(open) {
    siteNav.setAttribute('data-open', String(open));
    menuToggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (menuLabel) menuLabel.textContent = open ? 'CLOSE' : 'MENU';
  }

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', function () {
      setNavOpen(siteNav.getAttribute('data-open') !== 'true');
    });

    siteNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNavOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && siteNav.getAttribute('data-open') === 'true') {
        setNavOpen(false);
      }
    });
  }

  /* ----------------------------------------------------------------
     Scroll-to-top cue
     ---------------------------------------------------------------- */
  var scrollCue = document.getElementById('scrollCue');
  if (scrollCue) {
    scrollCue.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ----------------------------------------------------------------
     THE THREAD
     Anchor points (".pt") are authored in the HTML/CSS at percentage
     positions within their section. We measure their real page
     position, build a smooth Catmull-Rom spline through each group,
     split it into per-segment coloured paths, animate a gentle
     organic drift, and slow-cycle the palette.
     ---------------------------------------------------------------- */

  var svg = document.getElementById('thread-svg');
  if (!svg) return;

  var ns = 'http://www.w3.org/2000/svg';
  var groups = {}; // groupName -> { points: [{el, base:{x,y}, color}], segEls: [], nodeEls: [] }

  function collectPoints() {
    var els = document.querySelectorAll('.pt');
    groups = {};
    els.forEach(function (el) {
      var group = el.getAttribute('data-group') || 'default';
      if (!groups[group]) groups[group] = { points: [] };
      groups[group].points.push({
        el: el,
        color: el.getAttribute('data-color') || 'ink',
        node: el.getAttribute('data-node') || null
      });
    });
  }

  function measure() {
    var docWidth = document.documentElement.scrollWidth;
    var docHeight = document.documentElement.scrollHeight;
    svg.setAttribute('viewBox', '0 0 ' + docWidth + ' ' + docHeight);
    svg.setAttribute('width', docWidth);
    svg.setAttribute('height', docHeight);
    svg.style.height = docHeight + 'px';

    Object.keys(groups).forEach(function (g) {
      groups[g].points.forEach(function (p) {
        var r = p.el.getBoundingClientRect();
        p.base = {
          x: r.left + r.width / 2 + window.scrollX,
          y: r.top + r.height / 2 + window.scrollY
        };
      });
    });
  }

  /* Catmull-Rom to cubic bezier control points for segment p1->p2 */
  function crControlPoints(p0, p1, p2, p3) {
    var t = 1 / 6;
    var c1 = { x: p1.x + (p2.x - p0.x) * t, y: p1.y + (p2.y - p0.y) * t };
    var c2 = { x: p2.x - (p3.x - p1.x) * t, y: p2.y - (p3.y - p1.y) * t };
    return [c1, c2];
  }

  function buildGroupDom(groupName) {
    var g = groups[groupName];
    var container = document.createElementNS(ns, 'g');
    container.setAttribute('data-thread-group', groupName);
    g.segEls = [];
    g.nodeEls = [];

    var pts = g.points;
    for (var i = 0; i < pts.length - 1; i++) {
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('stroke-width', groupName === 'hero' ? '1.6' : '1.1');
      path.setAttribute('opacity', groupName === 'hero' ? '0.85' : '0.55');
      container.appendChild(path);
      g.segEls.push(path);
    }

    pts.forEach(function (p, i) {
      if (!p.node || i === 0 || i === pts.length - 1) return;
      var shape;
      if (p.node === 'square') {
        shape = document.createElementNS(ns, 'rect');
        shape.setAttribute('width', 6);
        shape.setAttribute('height', 6);
      } else {
        shape = document.createElementNS(ns, 'circle');
        shape.setAttribute('r', p.node === 'circle' ? 4 : 2.6);
      }
      shape.setAttribute('class', 'thread-node');
      container.appendChild(shape);
      g.nodeEls.push({ shape: shape, index: i, kind: p.node });
    });

    svg.appendChild(container);
  }

  function colorFor(name) {
    return COLORS[name] || COLORS.vermillion;
  }

  function render(time) {
    Object.keys(groups).forEach(function (groupName) {
      var g = groups[groupName];
      var pts = g.points;
      if (!pts.length) return;

      var live = pts.map(function (p, i) {
        if (reduceMotion) return p.base;
        var phase = time * 0.00035 + i * 1.7;
        return {
          x: p.base.x + Math.sin(phase) * 3.5,
          y: p.base.y + Math.cos(phase * 0.8) * 5
        };
      });

      for (var i = 0; i < live.length - 1; i++) {
        var p0 = live[i - 1] || live[i];
        var p1 = live[i];
        var p2 = live[i + 1];
        var p3 = live[i + 2] || p2;
        var cps = crControlPoints(p0, p1, p2, p3);
        var d = 'M' + p1.x.toFixed(1) + ',' + p1.y.toFixed(1) +
          ' C' + cps[0].x.toFixed(1) + ',' + cps[0].y.toFixed(1) +
          ' ' + cps[1].x.toFixed(1) + ',' + cps[1].y.toFixed(1) +
          ' ' + p2.x.toFixed(1) + ',' + p2.y.toFixed(1);
        g.segEls[i].setAttribute('d', d);
        g.segEls[i].setAttribute('stroke', colorFor(pts[i].color));
      }

      g.nodeEls.forEach(function (n) {
        var pt = live[n.index];
        if (n.kind === 'square') {
          n.shape.setAttribute('x', pt.x - 3);
          n.shape.setAttribute('y', pt.y - 3);
        } else {
          n.shape.setAttribute('cx', pt.x);
          n.shape.setAttribute('cy', pt.y);
        }
        n.shape.setAttribute('fill', colorFor(pts[n.index].color));
      });
    });
  }

  function cycleColors() {
    Object.keys(groups).forEach(function (groupName) {
      groups[groupName].points.forEach(function (p) {
        var idx = CYCLE.indexOf(p.color);
        p.color = CYCLE[(idx + 1) % CYCLE.length];
      });
    });
  }

  var rafId = null;
  function loop(t) {
    render(t);
    if (!reduceMotion) rafId = requestAnimationFrame(loop);
  }

  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      measure();
      if (reduceMotion) render(0);
    }, 120);
  }

  function init() {
    collectPoints();
    if (!Object.keys(groups).length) return;
    measure();
    Object.keys(groups).forEach(buildGroupDom);
    render(performance.now());

    if (!reduceMotion) {
      rafId = requestAnimationFrame(loop);
      setInterval(function () {
        cycleColors();
      }, 7000);
    }

    window.addEventListener('resize', onResize);
    window.addEventListener('load', function () {
      measure();
      render(performance.now());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
