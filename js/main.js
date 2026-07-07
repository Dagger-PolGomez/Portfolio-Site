/* =====================================================================
   main.js — interactions for Pol Gomez's portfolio
   Vanilla JS, no dependencies. Progressive enhancement: everything
   degrades gracefully if JS is disabled.
   ===================================================================== */
(function () {
    'use strict';

    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* =============================================================== */
    /* Language (EN / ES) — persisted across pages via localStorage.   */
    /* English lives in the DOM as the default; Spanish is supplied     */
    /* through data-es / data-es-* attributes next to it.               */
    /* =============================================================== */
    var LANG_KEY = 'site-lang';
    var currentLang = 'en';

    // Strings that are generated in JS (not present in the DOM).
    var I18N = {
        en: {
            sending: 'Sending…',
            sent: '✓ Message sent — I\'ll get back to you soon.',
            error: '✗ Something went wrong. Email me directly instead.',
            neterror: '✗ Network error. Email me directly instead.'
        },
        es: {
            sending: 'Enviando…',
            sent: '✓ Mensaje enviado — te responderé pronto.',
            error: '✗ Algo ha fallado. Escríbeme directamente por correo.',
            neterror: '✗ Error de red. Escríbeme directamente por correo.'
        }
    };

    function t(key) {
        return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || '';
    }

    function fmtNum(el, val) {
        if (el.getAttribute('data-format') !== 'comma') return String(val);
        // Group thousands explicitly so it's consistent regardless of the
        // browser's locale data: '.' for Spanish (Spain), ',' for English.
        var sep = currentLang === 'es' ? '.' : ',';
        return String(val).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    }

    function applyAttr(dataAttr, targetAttr, es) {
        var enKey = 'data-en-' + targetAttr.replace(/[^a-z]/gi, '');
        document.querySelectorAll('[' + dataAttr + ']').forEach(function (el) {
            if (el.getAttribute(enKey) === null) {
                el.setAttribute(enKey, el.getAttribute(targetAttr) || '');
            }
            el.setAttribute(targetAttr, es ? el.getAttribute(dataAttr) : el.getAttribute(enKey));
        });
    }

    function applyLang(lang) {
        currentLang = (lang === 'es') ? 'es' : 'en';
        var es = currentLang === 'es';
        document.documentElement.lang = currentLang;

        // Rich / plain text nodes.
        document.querySelectorAll('[data-es]').forEach(function (el) {
            if (el.getAttribute('data-en') === null) {
                el.setAttribute('data-en', el.innerHTML);
            }
            el.innerHTML = es ? el.getAttribute('data-es') : el.getAttribute('data-en');
        });

        // Translatable attributes.
        applyAttr('data-es-placeholder', 'placeholder', es);
        applyAttr('data-es-aria-label', 'aria-label', es);
        applyAttr('data-es-content', 'content', es);

        // Re-format any counters that have already finished animating.
        document.querySelectorAll('[data-count][data-done="1"]').forEach(function (el) {
            el.textContent = fmtNum(el, parseFloat(el.getAttribute('data-count')) || 0);
        });

        // Reflect state on the toggle buttons.
        document.querySelectorAll('.lang-opt').forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === currentLang));
        });

        try { localStorage.setItem(LANG_KEY, currentLang); } catch (e) { /* ignore */ }
    }

    // Read the saved language BEFORE anything else runs, so the terminal
    // typewriter and counters below pick up the right language.
    (function initLang() {
        var saved = 'en';
        try { saved = localStorage.getItem(LANG_KEY) || 'en'; } catch (e) { /* ignore */ }
        applyLang(saved);
        document.querySelectorAll('.lang-opt').forEach(function (b) {
            b.addEventListener('click', function () {
                applyLang(b.getAttribute('data-lang'));
            });
        });
    })();

    /* --------------------------------------------------------------- */
    /* Sticky nav: shadow/border on scroll                             */
    /* --------------------------------------------------------------- */
    var nav = document.getElementById('siteNav');
    if (nav) {
        var onScroll = function () {
            nav.classList.toggle('scrolled', window.scrollY > 8);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* --------------------------------------------------------------- */
    /* Mobile nav toggle                                               */
    /* --------------------------------------------------------------- */
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if (toggle && links) {
        toggle.addEventListener('click', function () {
            var open = links.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(open));
        });
        links.addEventListener('click', function (e) {
            if (e.target.closest('a')) {
                links.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* --------------------------------------------------------------- */
    /* Reveal on scroll                                                */
    /* --------------------------------------------------------------- */
    var revealEls = document.querySelectorAll('.reveal');
    if (prefersReduced || !('IntersectionObserver' in window)) {
        revealEls.forEach(function (el) { el.classList.add('visible'); });
    } else {
        var revealObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        revealEls.forEach(function (el) { revealObserver.observe(el); });
    }

    /* --------------------------------------------------------------- */
    /* Active nav link highlighting                                    */
    /* --------------------------------------------------------------- */
    var sections = ['tools', 'games', 'about', 'contact']
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);
    var navAnchors = {};
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
        navAnchors[a.getAttribute('href').slice(1)] = a;
    });
    if (sections.length && 'IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var a = navAnchors[entry.target.id];
                if (!a) return;
                if (entry.isIntersecting) {
                    Object.keys(navAnchors).forEach(function (k) {
                        navAnchors[k].classList.remove('active');
                    });
                    a.classList.add('active');
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(function (s) { spy.observe(s); });
    }

    /* --------------------------------------------------------------- */
    /* Animated counters                                               */
    /* --------------------------------------------------------------- */
    var counters = document.querySelectorAll('[data-count]');
    var runCounter = function (el) {
        var target = parseFloat(el.getAttribute('data-count')) || 0;
        if (prefersReduced) {
            el.textContent = fmtNum(el, target);
            el.setAttribute('data-done', '1');
            return;
        }
        var start = null;
        var dur = 1400;
        var step = function (ts) {
            if (start === null) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            var val = Math.round(target * eased);
            el.textContent = fmtNum(el, val);
            if (p < 1) {
                requestAnimationFrame(step);
            } else {
                el.setAttribute('data-done', '1');
            }
        };
        requestAnimationFrame(step);
    };
    if (counters.length && 'IntersectionObserver' in window) {
        var countObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    runCounter(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });
        counters.forEach(function (c) { countObserver.observe(c); });
    } else {
        counters.forEach(runCounter);
    }

    /* --------------------------------------------------------------- */
    /* Terminal typewriter                                             */
    /* --------------------------------------------------------------- */
    var terminal = document.getElementById('terminal');
    if (terminal && !prefersReduced) {
        // Snapshot the finished lines (already in the active language),
        // then replay them as a typing sequence.
        var lineNodes = Array.prototype.slice.call(terminal.children);
        var lines = lineNodes.map(function (node) {
            return { html: node.innerHTML, cls: node.className, isCmd: node.classList.contains('cmd') };
        });
        var cursor = '<span class="term-cursor"></span>';
        terminal.innerHTML = '';

        var li = 0;
        var typeLine = function () {
            if (li >= lines.length) return;
            var data = lines[li];
            var el = document.createElement('div');
            el.className = data.cls;
            terminal.appendChild(el);

            if (!data.isCmd) {
                // Output lines appear instantly (feels like program output).
                el.innerHTML = data.html;
                li++;
                setTimeout(typeLine, 130);
                return;
            }

            // Command lines type character-by-character. We type the text
            // content only, preserving the "$ " prefix from CSS.
            var tmp = document.createElement('div');
            tmp.innerHTML = data.html;
            var text = tmp.textContent || '';
            var ci = 0;
            var typeChar = function () {
                el.innerHTML = text.slice(0, ci) + cursor;
                ci++;
                if (ci <= text.length) {
                    setTimeout(typeChar, 42);
                } else {
                    el.innerHTML = data.html;
                    li++;
                    setTimeout(typeLine, 260);
                }
            };
            typeChar();
        };
        setTimeout(typeLine, 450);
    }

    /* --------------------------------------------------------------- */
    /* Contact form (Formspree, async) — same endpoint as before       */
    /* --------------------------------------------------------------- */
    var form = document.getElementById('contact-form');
    var status = document.getElementById('form-status');
    if (form && status) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = form.querySelector('button[type="submit"]');
            var original = btn ? btn.innerHTML : '';
            if (btn) { btn.disabled = true; btn.innerHTML = t('sending'); }

            fetch(form.action, {
                method: form.method,
                body: new FormData(form),
                headers: { Accept: 'application/json' }
            }).then(function (res) {
                if (res.ok) {
                    form.reset();
                    status.textContent = t('sent');
                    status.className = 'form-status show ok';
                } else {
                    status.textContent = t('error');
                    status.className = 'form-status show err';
                }
            }).catch(function () {
                status.textContent = t('neterror');
                status.className = 'form-status show err';
            }).finally(function () {
                if (btn) { btn.disabled = false; btn.innerHTML = original; }
            });
        });
    }

    /* --------------------------------------------------------------- */
    /* Current year in footer (if a [data-year] element exists)        */
    /* --------------------------------------------------------------- */
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = String(new Date().getFullYear());
    });
})();
