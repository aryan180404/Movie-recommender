(function () {
  'use strict';

  var CHUNK = 80;
  var MAX_OPTIONS = 7;
  var STARTERS = ['Inception', 'The Godfather', 'Toy Story', 'Spirited Away'];
  var ARROW =
    '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">' +
    '<path d="M3 8h10M8.5 3.5 13 8l-4.5 4.5" fill="none" stroke="currentColor" ' +
    'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var state = {
    movies: [],
    genres: [],
    titles: [],
    haystack: [],
    recs: null,
    tags: [],
    duplicate: [],
    total: 0,
    filtered: [],
    shown: 0,
    options: [],
    active: -1,
    pending: null
  };

  var el = {
    input: document.getElementById('seed-input'),
    options: document.getElementById('seed-options'),
    go: document.getElementById('go-btn'),
    hint: document.getElementById('picker-hint'),
    starters: document.getElementById('starters'),
    results: document.getElementById('results'),
    seed: document.getElementById('seed'),
    neighbours: document.getElementById('neighbours'),
    filter: document.getElementById('catalogue-filter'),
    status: document.getElementById('catalogue-status'),
    list: document.getElementById('catalogue-list'),
    more: document.getElementById('catalogue-more'),
    toTop: document.getElementById('to-top')
  };

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function nf(n) { return n.toLocaleString('en-US'); }

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function genreNames(movie) {
    return movie.g.map(function (i) { return state.genres[i]; });
  }

  function metaLine(movie, withRating) {
    var bits = [];
    if (movie.y) bits.push(movie.y);
    if (movie.d) bits.push(movie.d);
    var g = genreNames(movie).slice(0, 2).join(', ');
    if (g) bits.push(g);
    if (withRating && movie.v) bits.push(movie.v.toFixed(1) + '\u00a0/\u00a010');
    return bits.join(' · ');
  }

  function scrollBehavior() {
    return reducedMotion.matches ? 'auto' : 'smooth';
  }

  /* --- data --- */

  function loadCatalogue() {
    return fetch('data/catalogue.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        state.movies = data.movies;
        state.genres = data.genres;
        state.duplicate = data.movies.map(function () { return false; });
        (data.duplicates || []).forEach(function (i) { state.duplicate[i] = true; });
        state.total = data.movies.length - (data.duplicates || []).length;
        state.titles = data.movies.map(function (m) { return m.t.toLowerCase(); });
        state.haystack = data.movies.map(function (m) {
          return (m.t + ' ' + (m.d || '') + ' ' + genreNames(m).join(' ')).toLowerCase();
        });
        el.input.placeholder = 'Search ' + nf(data.count) + ' films...';
        el.input.disabled = false;
        el.go.disabled = false;
        el.filter.disabled = false;
        el.hint.textContent = '';
        el.list.removeAttribute('aria-busy');
        buildStarters();
        applyFilter('');

        var wanted = new URLSearchParams(location.search).get('film');
        if (wanted) {
          el.input.value = wanted;
          recommend({ scroll: false });
        }
      });
  }

  function loadRecommendations() {
    return fetch('data/recommendations.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        state.recs = data.recommendations;
        state.tags = data.tags || [];
        if (state.pending) {
          var p = state.pending;
          state.pending = null;
          showResults(p.index, p.scroll);
        }
      });
  }

  function failed(err) {
    el.list.innerHTML = '';
    el.list.removeAttribute('aria-busy');
    el.hint.classList.add('picker__hint--error');
    el.hint.textContent =
      'Could not load data. Serve this folder over http (see the README). ' + err.message;
  }

  /* --- suggestions --- */

  function findTitle(query) {
    return state.titles.indexOf(query);
  }

  function suggest(query) {
    var q = query.trim().toLowerCase();
    var starts = [];
    var contains = [];
    if (q) {
      for (var i = 0; i < state.titles.length; i++) {
        if (state.duplicate[i]) continue;
        var at = state.titles[i].indexOf(q);
        if (at === 0) starts.push(i);
        else if (at > 0 && contains.length < MAX_OPTIONS) contains.push(i);
      }
      /* Shortest prefix match first, so an exact title leads its sequels. */
      starts.sort(function (a, b) {
        return state.titles[a].length - state.titles[b].length;
      });
    }
    state.options = starts.concat(contains).slice(0, MAX_OPTIONS);
    state.active = -1;
    renderOptions();
  }

  function renderOptions() {
    el.options.innerHTML = '';
    state.options.forEach(function (index, n) {
      var movie = state.movies[index];
      var li = make('li', 'option');
      li.id = 'seed-option-' + n;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.dataset.n = n;
      li.appendChild(make('span', 'option__title', movie.t));
      if (movie.y) li.appendChild(make('span', 'option__year', movie.y));
      el.options.appendChild(li);
    });
    var open = state.options.length > 0;
    el.options.hidden = !open;
    el.input.setAttribute('aria-expanded', String(open));
    el.input.removeAttribute('aria-activedescendant');
  }

  function closeOptions() {
    state.options = [];
    state.active = -1;
    renderOptions();
  }

  function setActive(n) {
    var items = el.options.children;
    if (!items.length) return;
    if (state.active > -1) items[state.active].setAttribute('aria-selected', 'false');
    state.active = (n + items.length) % items.length;
    var item = items[state.active];
    item.setAttribute('aria-selected', 'true');
    item.scrollIntoView({ block: 'nearest' });
    el.input.setAttribute('aria-activedescendant', item.id);
  }

  function choose(index, scroll) {
    el.input.value = state.movies[index].t;
    closeOptions();
    seedWith(index, scroll);
  }

  /* --- recommend --- */

  function recommend(opts) {
    var query = el.input.value.trim().toLowerCase();
    if (!query) { el.input.focus(); return; }

    var index = findTitle(query);
    if (index === -1 && state.options.length) index = state.options[0];

    if (index === -1) {
      closeOptions();
      el.hint.classList.add('picker__hint--error');
      el.hint.textContent =
        'No film called "' + el.input.value.trim() + '" in the catalogue. Check the spelling, or browse below.';
      return;
    }

    choose(index, !opts || opts.scroll !== false);
  }

  function seedWith(index, scroll) {
    el.hint.classList.remove('picker__hint--error');
    if (!state.recs) {
      state.pending = { index: index, scroll: scroll };
      el.hint.textContent = 'Finding matches...';
      return;
    }
    showResults(index, scroll);
  }

  function showResults(index, scroll) {
    var seed = state.movies[index];
    el.hint.textContent = '';

    el.seed.innerHTML = '';
    var head = make('h2', 'section-head', 'Because you liked ');
    head.appendChild(make('span', 'seed-name', seed.t));
    el.seed.appendChild(head);
    var seedMeta = metaLine(seed, true);
    if (seedMeta) el.seed.appendChild(make('p', 'seed__meta', seedMeta));

    el.neighbours.innerHTML = '';
    var seen = {};
    seen[seed.t] = true;
    var count = 0;
    var list = state.recs[index] || [];
    for (var j = 0; j < list.length && count < 5; j++) {
      var movie = state.movies[list[j][0]];
      if (seen[movie.t]) continue;
      seen[movie.t] = true;
      el.neighbours.appendChild(neighbour(movie, list[j][0], list[j][2] || [], count));
      count++;
    }

    if (!count) {
      el.neighbours.appendChild(
        make('li', 'empty', 'No close matches for this one. Try another film.'));
    }

    el.results.hidden = false;

    var url = new URL(location.href);
    url.searchParams.set('film', seed.t);
    history.replaceState(null, '', url);

    if (scroll) {
      el.results.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    }
  }

  function neighbour(movie, index, tagIds, position) {
    var li = make('li', 'neighbour');
    li.style.setProperty('--i', position);

    var node = make('span', 'neighbour__node', position + 1);
    node.setAttribute('aria-hidden', 'true');
    li.appendChild(node);

    var body = make('div', 'neighbour__body');

    /* What the two films share sits on the branch that joins them. */
    var shared = tagIds
      .map(function (t) { return state.tags[t]; })
      .filter(Boolean)
      .slice(0, 4);
    var why = null;
    if (shared.length) {
      why = make('p', 'neighbour__why');
      why.appendChild(make('span', 'neighbour__why-label', 'Shares'));
      shared.forEach(function (tag) {
        why.appendChild(make('span', 'neighbour__tag', tag));
      });
    }

    var title = make('h3', 'neighbour__title');
    var pick = make('button', 'neighbour__pick', movie.t);
    pick.type = 'button';
    pick.dataset.index = index;
    pick.setAttribute('aria-label', movie.t + '. Show films like this');
    title.appendChild(pick);

    if (why) body.appendChild(why);
    body.appendChild(title);

    var meta = metaLine(movie, true);
    if (meta) body.appendChild(make('p', 'neighbour__meta', meta));
    if (movie.o) body.appendChild(make('p', 'neighbour__overview', movie.o));

    li.appendChild(body);

    var arrow = make('span', 'neighbour__arrow');
    arrow.innerHTML = ARROW;
    li.appendChild(arrow);
    return li;
  }

  function buildStarters() {
    var any = false;
    STARTERS.forEach(function (name) {
      var index = findTitle(name.toLowerCase());
      if (index === -1) return;
      var b = make('button', 'starter', name);
      b.type = 'button';
      b.dataset.index = index;
      el.starters.appendChild(b);
      any = true;
    });
    el.starters.hidden = !any;
  }

  /* --- catalogue --- */

  function applyFilter(query) {
    var q = query.trim().toLowerCase();
    state.filtered = [];
    for (var i = 0; i < state.haystack.length; i++) {
      if (state.duplicate[i]) continue;
      if (!q || state.haystack[i].indexOf(q) !== -1) state.filtered.push(i);
    }
    state.filtered.sort(function (a, b) {
      return state.movies[a].t.localeCompare(state.movies[b].t);
    });
    state.shown = 0;
    el.list.innerHTML = '';
    showMore();
  }

  function showMore() {
    var end = Math.min(state.shown + CHUNK, state.filtered.length);
    if (!state.filtered.length) {
      el.list.appendChild(
        make('li', 'empty', 'No titles match that filter. Try a director or a genre.'));
    }
    var frag = document.createDocumentFragment();
    for (var i = state.shown; i < end; i++) {
      var index = state.filtered[i];
      var movie = state.movies[index];
      var li = make('li', 'grid__cell');
      var b = make('button', 'entry');
      b.type = 'button';
      b.dataset.index = index;
      b.style.setProperty('--i', Math.min(i - state.shown, 16));
      b.appendChild(make('span', 'entry__title', movie.t));
      b.appendChild(make('span', 'entry__meta', metaLine(movie)));
      li.appendChild(b);
      frag.appendChild(li);
    }
    el.list.appendChild(frag);
    state.shown = end;
    el.more.hidden = state.shown >= state.filtered.length;
    el.status.textContent =
      state.filtered.length === state.total
        ? 'Showing ' + nf(state.shown) + ' of ' + nf(state.total)
        : nf(state.filtered.length) + ' match' + (state.filtered.length === 1 ? '' : 'es');
  }

  /* --- events --- */

  el.go.addEventListener('click', function () { recommend(); });

  el.input.addEventListener('input', function () {
    el.hint.classList.remove('picker__hint--error');
    if (!state.pending) el.hint.textContent = '';
    suggest(el.input.value);
  });

  el.input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!state.options.length) suggest(el.input.value);
      else setActive(state.active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.options.length) setActive(state.active === -1 ? -1 : state.active - 1);
    } else if (e.key === 'Enter') {
      if (state.active > -1) choose(state.options[state.active], true);
      else recommend();
    } else if (e.key === 'Escape') {
      closeOptions();
    }
  });

  el.input.addEventListener('blur', closeOptions);

  /* mousedown fires before the input's blur, so the option is still there */
  el.options.addEventListener('mousedown', function (e) {
    var item = e.target.closest('.option');
    if (!item) return;
    e.preventDefault();
    choose(state.options[Number(item.dataset.n)], true);
  });

  function pickFrom(container, selector) {
    container.addEventListener('click', function (e) {
      var b = e.target.closest(selector);
      if (!b) return;
      choose(Number(b.dataset.index), true);
    });
  }

  pickFrom(el.list, '.entry');
  pickFrom(el.neighbours, '.neighbour__pick');
  pickFrom(el.starters, '.starter');

  var filterTimer;
  el.filter.addEventListener('input', function () {
    clearTimeout(filterTimer);
    var val = el.filter.value;
    filterTimer = setTimeout(function () { applyFilter(val); }, 150);
  });

  el.more.addEventListener('click', showMore);

  /* Load the next chunk shortly before the reader reaches the end. */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !el.more.hidden) showMore();
    }, { rootMargin: '0px 0px 600px 0px' }).observe(el.more);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      el.toTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 1.2);
      ticking = false;
    });
  }, { passive: true });

  el.toTop.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
    el.input.focus({ preventScroll: true });
  });

  /* --- go --- */

  loadCatalogue()
    .then(loadRecommendations)
    .catch(failed);
})();
