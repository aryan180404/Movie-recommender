# Graph Report - movie-recommender  (2026-11-16)

## Corpus Check
- 6 files · ~287,100 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .toml 5, (none) 3, .csv 2)

## Summary
- 57 nodes · 88 edges · 8 communities (3 shown, 5 thin omitted)
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Browser App Logic
- Recommender Concepts & Data
- Export Script Entry
- Notebook Pipeline
- Display Metadata
- JSON Export Layer
- Working Directory Helper
- Notebook & Dataset

## God Nodes (most connected - your core abstractions)
1. `export()` - 10 edges
2. `run_notebook_pipeline()` - 8 edges
3. `display_metadata()` - 8 edges
4. `main()` - 7 edges
5. `showMore()` - 6 edges
6. `loadCatalogue()` - 5 edges
7. `recommend()` - 5 edges
8. `working_directory()` - 5 edges
9. `index.html page` - 5 edges
10. `applyFilter()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `loadCatalogue()` --shares_data_with--> `data/catalogue.json`  [INFERRED]
  assets/app.js → README.md
- `recommend()` --references--> `Picker section (seed input + Recommend)`  [INFERRED]
  assets/app.js → index.html
- `recommend()` --references--> `Results section`  [INFERRED]
  assets/app.js → index.html
- `recommend()` --implements--> `Duplicate titles handling`  [INFERRED]
  assets/app.js → README.md
- `loadRecommendations()` --shares_data_with--> `data/recommendations.json`  [INFERRED]
  assets/app.js → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Offline recommendation pipeline** — readme_tmdb_5000_dataset, readme_bag_of_words, readme_countvectorizer, readme_cosine_similarity, readme_recommendations_json [EXTRACTED 1.00]

## Communities (8 total, 5 thin omitted)

### Community 0 - "Browser App Logic"
Cohesion: 0.31
Nodes (11): applyFilter(), genreNames(), loadCatalogue(), metaLine(), nf(), recommend(), showMore(), Catalogue section (filter + grid) (+3 more)

### Community 1 - "Recommender Concepts & Data"
Cohesion: 0.20
Nodes (10): loadRecommendations(), Bag of words (overview+genres+keywords+cast+director), data/catalogue.json, Content-based filtering, Cosine similarity matrix, CountVectorizer (5000 features), Duplicate titles handling, GitHub Pages static deployment (+2 more)

### Community 7 - "Notebook & Dataset"
Cohesion: 0.67
Nodes (3): One-line index fix in notebook, movie-recc-system.ipynb notebook, TMDB 5000 dataset (CSVs)

## Knowledge Gaps
- **2 isolated node(s):** `TMDB 5000 dataset (CSVs)`, `One-line index fix in notebook`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 18 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `data/recommendations.json` connect `Recommender Concepts & Data` to `Export Script Entry`?**
  _High betweenness centrality (0.257) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `run_notebook_pipeline()` (e.g. with `convert()` and `convert2()`) actually correct?**
  _`run_notebook_pipeline()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `TMDB 5000 dataset (CSVs)`, `One-line index fix in notebook` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Why does `data/catalogue.json` connect `Recommender Concepts & Data` to `Browser App Logic`, `Export Script Entry`?**
  _High betweenness centrality (0.239) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `showMore()` (e.g. with `app.js` and `Catalogue section (filter + grid)`) actually correct?**
  _`showMore()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Why does `run_notebook_pipeline()` connect `Notebook Pipeline` to `Export Script Entry`?**
  _High betweenness centrality (0.205) - this node is a cross-community bridge._