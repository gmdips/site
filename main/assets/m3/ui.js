/* ============================================================================
   GDIPS · Material You 3 — Interaction layer
   ----------------------------------------------------------------------------
   Progressive enhancement for the M3 components: ripples, app-bar elevation,
   navigation drawers + scrims, menus, dialogs (with focus trap), tabs,
   segmented buttons, text-field state, sliders, snackbars, copy-to-clipboard
   and scroll reveals.  Every behaviour is declarative — pages only add data
   attributes, no per-page scripting required.

   Public API
     M3UI.snackbar(message, opts)       transient message with optional action
     M3UI.openDialog(elOrId) / close()  dialog helpers
     M3UI.openDrawer(elOrId, open)      drawer helpers
     M3UI.setLoading(el, bool)          button loading state
     M3UI.copy(text)                    clipboard helper
   ========================================================================== */

(function (global) {
  'use strict';

  var REDUCED = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function byId(id) { return typeof id === 'string' ? document.getElementById(id.replace(/^#/, '')) : id; }

  /* ── Scroll lock ────────────────────────────────────────────────────── */

  var lockCount = 0;
  function lockScroll() {
    if (lockCount++ === 0) {
      var gap = global.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (gap > 0) document.body.style.paddingInlineEnd = gap + 'px';
    }
  }
  function unlockScroll() {
    if (lockCount > 0 && --lockCount === 0) {
      document.body.style.overflow = '';
      document.body.style.paddingInlineEnd = '';
    }
  }

  /* ── Ripple ─────────────────────────────────────────────────────────── */

  var RIPPLE_SELECTOR = [
    '.m3-button', '.m3-icon-button', '.m3-fab', '.m3-chip', '.m3-tab',
    '.m3-list-item', '.m3-menu-item', '.m3-page-btn', '.m3-nav-bar__item',
    '.m3-drawer__item', '.m3-segmented__item', '.m3-card--interactive',
    '.sidebar-link', '.card-action-btn', '.view-btn', '.action-btn', '.filter-option'
  ].join(',');

  function attachRipple(el) {
    if (REDUCED || el.dataset.m3Ripple === 'off') return;
    el.addEventListener('pointerdown', function (event) {
      var rect = el.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 2;
      var ripple = document.createElement('span');
      ripple.className = 'm3-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 600);
    });
  }

  /* ── App bar elevation on scroll ────────────────────────────────────── */

  function setupAppBars(scope) {
    $$('.m3-app-bar', scope).forEach(function (bar) {
      if (bar.dataset.m3Bound) return;
      bar.dataset.m3Bound = '1';
      var sentinel = document.createElement('div');
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = 'position:absolute;top:0;left:0;height:1px;width:1px;';
      bar.parentNode.insertBefore(sentinel, bar);
      if ('IntersectionObserver' in global) {
        new IntersectionObserver(function (entries) {
          bar.classList.toggle('is-scrolled', !entries[0].isIntersecting);
        }, { threshold: 0 }).observe(sentinel);
      }
    });
  }

  /* ── Drawers ────────────────────────────────────────────────────────── */

  function setDrawer(drawer, open) {
    if (!drawer) return;
    var wasOpen = drawer.classList.contains('is-open') || drawer.classList.contains('active');
    drawer.classList.toggle('is-open', open);
    drawer.classList.toggle('active', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    var scrim = $('.m3-scrim[data-m3-scrim-for="#' + drawer.id + '"]') || $('.m3-scrim.is-paired');
    if (scrim) scrim.classList.toggle('is-open', open);
    if (open && !wasOpen) {
      lockScroll();
      var focusable = $(FOCUSABLE, drawer);
      if (focusable) setTimeout(function () { focusable.focus(); }, 220);
    } else if (!open && wasOpen) {
      unlockScroll();
    }
    if (!open) {
      var toggle = $('[data-m3-drawer-toggle="#' + drawer.id + '"]');
      if (toggle) toggle.focus();
    }
  }

  function setupDrawers(scope) {
    $$('[data-m3-drawer-toggle]', scope).forEach(function (toggle) {
      if (toggle.dataset.m3Bound) return;
      toggle.dataset.m3Bound = '1';
      toggle.addEventListener('click', function (event) {
        event.preventDefault();
        var drawer = byId(toggle.getAttribute('data-m3-drawer-toggle'));
        if (!drawer) return;
        setDrawer(drawer, !(drawer.classList.contains('is-open') || drawer.classList.contains('active')));
      });
    });

    $$('[data-m3-drawer-close]', scope).forEach(function (btn) {
      if (btn.dataset.m3Bound) return;
      btn.dataset.m3Bound = '1';
      btn.addEventListener('click', function () { setDrawer(btn.closest('.m3-drawer, .sidebar'), false); });
    });

    // Bridge for drawers whose open/close state is owned by legacy scripts
    // (the demon list toggles `.active` itself — we only mirror it).
    $$('[data-m3-scrim-for]', scope).forEach(function (scrim) {
      var drawer = byId(scrim.getAttribute('data-m3-scrim-for'));
      if (!drawer || scrim.dataset.m3Bound) return;
      scrim.dataset.m3Bound = '1';
      var sync = function () {
        var open = drawer.classList.contains('is-open') || drawer.classList.contains('active');
        scrim.classList.toggle('is-open', open);
        if (open) { lockScroll(); } else { unlockScroll(); }
      };
      new MutationObserver(sync).observe(drawer, { attributes: true, attributeFilter: ['class'] });
      scrim.addEventListener('click', function () {
        drawer.classList.remove('is-open', 'active');
        if (typeof global.DemonListApp !== 'undefined') { /* legacy app keeps its own state */ }
        setDrawer(drawer, false);
      });
      sync();
    });
  }

  /* ── Menus ──────────────────────────────────────────────────────────── */

  function closeMenus(except) {
    $$('.m3-menu.is-open').forEach(function (menu) {
      if (menu === except) return;
      menu.classList.remove('is-open');
      var trigger = $('[data-m3-menu-trigger="#' + menu.id + '"]');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function setupMenus(scope) {
    $$('[data-m3-menu-trigger]', scope).forEach(function (trigger) {
      if (trigger.dataset.m3Bound) return;
      trigger.dataset.m3Bound = '1';
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var menu = byId(trigger.getAttribute('data-m3-menu-trigger'));
        if (!menu) return;
        var willOpen = !menu.classList.contains('is-open');
        closeMenus(menu);
        menu.classList.toggle('is-open', willOpen);
        trigger.setAttribute('aria-expanded', String(willOpen));
      });
    });

    $$('.m3-menu', scope).forEach(function (menu) {
      if (menu.dataset.m3Bound) return;
      menu.dataset.m3Bound = '1';
      menu.addEventListener('click', function (event) {
        if (event.target.closest('[data-m3-menu-keep]')) return;
        if (event.target.closest('.m3-menu-item')) closeMenus();
      });
    });
  }

  /* ── Dialogs ────────────────────────────────────────────────────────── */

  var openDialogs = [];

  function openDialog(target) {
    var dialog = byId(target);
    if (!dialog) return;
    dialog.classList.add('is-open');
    dialog.setAttribute('aria-hidden', 'false');
    openDialogs.push(dialog);
    lockScroll();
    var focusable = $(FOCUSABLE, dialog);
    if (focusable) setTimeout(function () { focusable.focus(); }, 180);
    dialog.dispatchEvent(new CustomEvent('m3dialog:open', { bubbles: true }));
  }

  function closeDialog(target) {
    var dialog = target ? byId(target) : openDialogs[openDialogs.length - 1];
    if (!dialog) return;
    dialog.classList.remove('is-open');
    dialog.setAttribute('aria-hidden', 'true');
    openDialogs = openDialogs.filter(function (d) { return d !== dialog; });
    unlockScroll();
    var trigger = $('[data-m3-dialog-open="#' + dialog.id + '"]');
    if (trigger) trigger.focus();
    dialog.dispatchEvent(new CustomEvent('m3dialog:close', { bubbles: true }));
  }

  function trapFocus(dialog, event) {
    var items = $$(FOCUSABLE, dialog).filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function setupDialogs(scope) {
    $$('[data-m3-dialog-open]', scope).forEach(function (trigger) {
      if (trigger.dataset.m3Bound) return;
      trigger.dataset.m3Bound = '1';
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        openDialog(trigger.getAttribute('data-m3-dialog-open'));
      });
    });

    $$('.m3-dialog', scope).forEach(function (dialog) {
      if (dialog.dataset.m3Bound) return;
      dialog.dataset.m3Bound = '1';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-hidden', 'true');
      dialog.addEventListener('click', function (event) {
        if (event.target === dialog) closeDialog(dialog);
      });
    });

    document.addEventListener('click', function (event) {
      var closer = event.target.closest('[data-m3-dialog-close]');
      if (closer) {
        event.preventDefault();
        closeDialog(closer.closest('.m3-dialog'));
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (openDialogs.length) { closeDialog(); return; }
        if ($('.m3-menu.is-open')) { closeMenus(); return; }
        var drawer = $('.m3-scrim.is-open');
        if (drawer) {
          var target = byId(drawer.getAttribute('data-m3-scrim-for'));
          if (target) setDrawer(target, false);
        }
      }
      if (event.key === 'Tab' && openDialogs.length) trapFocus(openDialogs[openDialogs.length - 1], event);
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('.m3-menu') && !event.target.closest('[data-m3-menu-trigger]')) closeMenus();
    });
  }

  /* ── Snackbar ───────────────────────────────────────────────────────── */

  function region() {
    var el = $('.m3-snackbar-region');
    if (!el) {
      el = document.createElement('div');
      el.className = 'm3-snackbar-region';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    return el;
  }

  function snackbar(message, options) {
    var opts = options || {};
    var bar = document.createElement('div');
    bar.className = 'm3-snackbar' + (opts.variant === 'error' ? ' m3-snackbar--error' : '');
    var icon = opts.variant === 'error' ? 'fa-circle-exclamation' : (opts.icon || null);
    bar.innerHTML = (icon ? '<i class="fas ' + icon + '" aria-hidden="true"></i>' : '') +
      '<span>' + message + '</span>';
    if (opts.actionLabel) {
      var action = document.createElement('button');
      action.type = 'button';
      action.className = 'm3-snackbar__action';
      action.textContent = opts.actionLabel;
      action.addEventListener('click', function () {
        if (typeof opts.onAction === 'function') opts.onAction();
        dismiss();
      });
      bar.appendChild(action);
    }
    region().appendChild(bar);
    var timer = setTimeout(dismiss, opts.duration || 4000);
    function dismiss() {
      clearTimeout(timer);
      bar.classList.add('is-leaving');
      setTimeout(function () { bar.remove(); }, 200);
    }
    return dismiss;
  }

  /* ── Tabs ───────────────────────────────────────────────────────────── */

  function activateTab(tab) {
    var group = tab.closest('[data-m3-tabs]');
    if (!group) return;
    var tabs = $$('[role="tab"]', group);
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.classList.toggle('is-active', selected);
      t.tabIndex = selected ? 0 : -1;
      var panelId = t.getAttribute('aria-controls') || (t.getAttribute('href') || '').replace(/^.*#/, '');
      var panel = panelId ? byId(panelId) : null;
      if (panel) {
        panel.hidden = !selected;
        panel.classList.toggle('is-active', selected);
      }
    });
  }

  function setupTabs(scope) {
    $$('[data-m3-tabs]', scope).forEach(function (group) {
      if (group.dataset.m3Bound) return;
      group.dataset.m3Bound = '1';
      group.setAttribute('role', 'tablist');
      var tabs = $$('[role="tab"]', group);
      tabs.forEach(function (tab, index) {
        if (!tab.hasAttribute('aria-controls')) {
          var href = (tab.getAttribute('href') || '').replace(/^.*#/, '');
          if (href) tab.setAttribute('aria-controls', href);
        }
        tab.addEventListener('click', function (event) {
          event.preventDefault();
          activateTab(tab);
          if (global.history && tab.getAttribute('href') && tab.getAttribute('href').charAt(0) === '#') {
            global.history.replaceState(null, '', tab.getAttribute('href'));
          }
        });
        tab.addEventListener('keydown', function (event) {
          var step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
          if (!step) return;
          event.preventDefault();
          var next = tabs[(index + step + tabs.length) % tabs.length];
          next.focus();
          activateTab(next);
        });
      });
      var initial = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true' || t.classList.contains('is-active'); })[0] || tabs[0];
      if (initial) activateTab(initial);
    });
  }

  /* ── Segmented buttons & chips ──────────────────────────────────────── */

  function setupSegmented(scope) {
    $$('[data-m3-segmented]', scope).forEach(function (group) {
      if (group.dataset.m3Bound) return;
      group.dataset.m3Bound = '1';
      group.setAttribute('role', 'tablist');
      var items = $$('.m3-segmented__item', group);
      items.forEach(function (item) {
        item.setAttribute('role', 'tab');
        item.setAttribute('aria-selected', String(item.classList.contains('is-selected')));
        item.addEventListener('click', function () {
          items.forEach(function (other) {
            other.classList.toggle('is-selected', other === item);
            other.setAttribute('aria-selected', String(other === item));
          });
          group.dispatchEvent(new CustomEvent('m3segment:change', { detail: { value: item.dataset.value, item: item }, bubbles: true }));
        });
      });
    });

    $$('[data-m3-chip-toggle]', scope).forEach(function (chip) {
      if (chip.dataset.m3Bound) return;
      chip.dataset.m3Bound = '1';
      chip.addEventListener('click', function () {
        var pressed = chip.getAttribute('aria-pressed') === 'true';
        chip.setAttribute('aria-pressed', String(!pressed));
        chip.classList.toggle('m3-chip--selected', !pressed);
      });
    });
  }

  /* ── Fields, sliders, switches ──────────────────────────────────────── */

  function setupFields(scope) {
    $$('.m3-field__box', scope).forEach(function (box) {
      var field = box.closest('.m3-field');
      var input = $('.m3-field__input', box);
      if (!input || box.dataset.m3Bound) return;
      box.dataset.m3Bound = '1';
      var sync = function () {
        box.classList.toggle('has-value', !!input.value);
        if (field) field.classList.toggle('m3-field--filled', !!input.value);
      };
      input.addEventListener('input', sync);
      input.addEventListener('change', sync);
      input.addEventListener('blur', function () {
        if (field && field.dataset.m3Validate === 'required' && !input.value) {
          field.classList.add('m3-field--error');
        }
      });
      sync();
    });

    var syncRange = function (input) {
      var min = parseFloat(input.min || 0);
      var max = parseFloat(input.max || 100);
      var value = parseFloat(input.value);
      var pct = ((value - min) / (max - min)) * 100;
      input.style.setProperty('--m3-slider-fill', pct + '%');
    };

    $$('.m3-slider', scope).forEach(function (input) {
      if (input.dataset.m3Bound) return;
      input.dataset.m3Bound = '1';
      input.addEventListener('input', function () { syncRange(input); });
      syncRange(input);
    });

    $$('[data-m3-range-output]', scope).forEach(function (input) {
      var output = byId(input.getAttribute('data-m3-range-output'));
      if (!output) return;
      var update = function () { output.textContent = input.value; };
      input.addEventListener('input', update);
      update();
    });
  }

  /* ── Theme toggles & copy buttons ───────────────────────────────────── */

  function setupThemeToggles(scope) {
    $$('.m3-theme-toggle', scope).forEach(function (btn) {
      if (btn.dataset.m3Bound) return;
      btn.dataset.m3Bound = '1';
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        if (global.M3Color) {
          var theme = global.M3Color.toggleTheme();
          btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
        }
      });
    });
  }

  function copy(text) {
    if (navigator.clipboard && global.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      try {
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.cssText = 'position:absolute;left:-9999px;';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
        resolve();
      } catch (error) { reject(error); }
    });
  }

  function setupCopy(scope) {
    $$('[data-m3-copy]', scope).forEach(function (btn) {
      if (btn.dataset.m3Bound) return;
      btn.dataset.m3Bound = '1';
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        var source = btn.getAttribute('data-m3-copy');
        var field = source ? $(source) : null;
        var value = field ? (field.value || field.textContent) : source;
        copy(value.trim()).then(function () {
          snackbar(btn.getAttribute('data-m3-copy-message') || 'Copied to clipboard');
        }).catch(function () {
          snackbar('Could not copy — copy manually: ' + value, { variant: 'error' });
        });
      });
    });
  }

  /* ── Reveal on scroll ───────────────────────────────────────────────── */

  function setupReveals(scope) {
    var items = $$('.m3-reveal', scope);
    if (!items.length) return;
    if (REDUCED || !('IntersectionObserver' in global)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = parseInt(entry.target.getAttribute('data-m3-reveal-delay') || '0', 10);
        setTimeout(function () { entry.target.classList.add('is-visible'); }, delay);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ── Loading state ──────────────────────────────────────────────────── */

  function setLoading(el, loading, label) {
    if (!el) return;
    var target = el.classList.contains('m3-button') ? el : el.closest('.m3-button') || el;
    target.classList.toggle('is-loading', !!loading);
    target.setAttribute('aria-busy', String(!!loading));
    if (loading) {
      target.dataset.m3Label = target.dataset.m3Label || target.textContent.trim();
      if (!target.querySelector('.sr-only')) {
        var sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = label || 'Loading';
        target.appendChild(sr);
      }
    } else {
      var sr = target.querySelector('.sr-only.sr-only--auto');
      if (sr) sr.remove();
    }
    target.disabled = !!loading;
  }

  /* ── Boot ───────────────────────────────────────────────────────────── */

  function init(scope) {
    scope = scope || document;
    $$(RIPPLE_SELECTOR, scope).forEach(attachRipple);
    setupAppBars(scope);
    setupDrawers(scope);
    setupMenus(scope);
    setupDialogs(scope);
    setupTabs(scope);
    setupSegmented(scope);
    setupFields(scope);
    setupThemeToggles(scope);
    setupCopy(scope);
    setupReveals(scope);
  }

  global.M3UI = {
    init: init,
    snackbar: snackbar,
    openDialog: openDialog,
    closeDialog: closeDialog,
    openDrawer: function (target, open) { setDrawer(byId(target), open); },
    setLoading: setLoading,
    copy: copy,
    lockScroll: lockScroll,
    unlockScroll: unlockScroll
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }

  // Re-scan when pages inject markup dynamically (e.g. the demon list grids).
  global.addEventListener('m3ui:refresh', function () { init(); });

  // Legacy bridge: elements that toggle drawers via plain classes.
  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-m3-drawer-legacy]');
    if (!toggle) return;
    var drawer = byId(toggle.getAttribute('data-m3-drawer-legacy'));
    if (drawer) setTimeout(function () { setDrawer(drawer, drawer.classList.contains('active') || drawer.classList.contains('is-open')); }, 0);
  });
})(window);
