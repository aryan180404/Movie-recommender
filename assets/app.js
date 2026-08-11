(function () {
  'use strict';

  var CHUNK = 80;

  var state = {
    movies: [],
    genres: [],
    haystack: [],
    recs: null,
    duplicate: [],
    filtered: [],
    shown: 0
  };

  var el = {
    count: document.getElementById('catalogue-count'),
    input: document.getElementById('seed-input'),
    go: document.getElementById('go-btn'),
    hint: document.getElementById('picker-hint'),
    results: document.getElementById('results'),
    seedTitle: document.getElementById('seed-title'),
    neighbours: document.getElementById('neighbours'),
    filter: document.getElementById('catalogue-filter'),
    status: document.getElementById('catalogue-status'),
    list: document.getElementById('catalogue-list'),
    more: document.getElementById('catalogue-more')
  };

  function nf(n) { return n.toLocaleString('en-US'); }

  function genreNames(movie) {
    return movie.g.map(function (i) { return state.genres[i]; });
  }

  function metaLine(movie) {
    var bits = [];
    if (movie.y) bits.push(movie.y);
    if (movie.d) bits.push(movie.d);
    var g = genreNames(movie).slice(0, 2).join(', ');
    if (g) bits.push(g);
    return bits.join(' · ');
  }

  /* --- data --- */

  function loadCatalogue() {
    return fetch('data/catalogue.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.movies = data.movies;
        state.genres = data.genres;
        state.duplicate = data.movies.map(function () { return false; });
        (data.duplicates || []).forEach(function (i) { state.duplicate[i] = true; });
        state.haystack = data.movies.map(function (m) {
          return (m.t + ' ' + (m.d || '') + ' ' + genreNames(m).join(' ')).toLowerCase();
        });
        el.count.textContent = nf(data.count);
        el.input.disabled = false;
        el.go.disabled = false;
        el.filter.disabled = false;
        el.hint.textContent = '';
        applyFilter('');
      });
  }

  function loadRecommendations() {
    return fetch('data/recommendations.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { state.recs = data.recommendations; });
  }

  function failed(err) {
    el.hint.textContent =
      'Could not load data. Serve this folder over http (see the README). ' + err.message;
  }

  /* --- recommend --- */

  function recommend() {
    var query = el.input.value.trim().toLowerCase();
    if (!query) return;

    var index = -1;
    for (var i = 0; i < state.movies.length; i++) {
      if (state.movies[i].t.toLowerCase() === query) { index = i; break; }
    }

    if (index === -1) {
      el.hint.textContent = 'Movie not found in the catalogue. Check the spelling.';
      el.results.hidden = true;
      return;
    }

    if (!state.recs) {
      el.hint.textContent = 'Still loading recommendations, try again in a moment.';
      return;
    }

    el.hint.textContent = '';
    el.results.hidden = false;
    el.seedTitle.textContent = state.movies[index].t;

    el.neighbours.innerHTML = '';
    var seen = {};
    var count = 0;
    for (var j = 0; j < state.recs[index].length && count < 5; j++) {
      var rec = state.recs[index][j];
      var title = state.movies[rec[0]].t;
      if (seen[title]) continue;
      seen[title] = true;
      count++;

      var li = document.createElement('li');
      li.className = 'neighbour';
      li.textContent = title;
      el.neighbours.appendChild(li);
    }
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
      var empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = 'No titles match that filter.';
      el.list.appendChild(empty);
    }
    for (var i = state.shown; i < end; i++) {
      var movie = state.movies[state.filtered[i]];
      var li = document.createElement('li');
      li.className = 'entry';
      li.textContent = movie.t;
      li.dataset.title = movie.t;

      var meta = document.createElement('span');
      meta.className = 'entry__meta';
      meta.textContent = metaLine(movie);
      li.appendChild(meta);

      li.addEventListener('click', function () {
        el.input.value = this.dataset.title;
        recommend();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      el.list.appendChild(li);
    }
    state.shown = end;
    el.more.hidden = state.shown >= state.filtered.length;
    var total = state.movies.length - state.duplicate.filter(Boolean).length;
    el.status.textContent =
      state.filtered.length === total
        ? 'Showing ' + nf(state.shown) + ' of ' + nf(total)
        : nf(state.filtered.length) + ' match' + (state.filtered.length === 1 ? '' : 'es');
  }

  /* --- events --- */

  el.go.addEventListener('click', recommend);
  el.input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') recommend();
  });

  var filterTimer;
  el.filter.addEventListener('input', function () {
    clearTimeout(filterTimer);
    var val = el.filter.value;
    filterTimer = setTimeout(function () { applyFilter(val); }, 150);
  });

  el.more.addEventListener('click', showMore);

  /* --- go --- */

  loadCatalogue()
    .then(loadRecommendations)
    .catch(failed);
})();
