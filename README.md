# Watch Next

A content-based movie recommender over the TMDB 5000 dataset. Pick a film you
already like and it returns the most similar films, along with the shared
genres, keywords, cast and director that caused the match.

The whole site is static HTML, CSS and JavaScript, so it runs on GitHub Pages
with no server and no API keys.

**Live demo:** `https://<your-username>.github.io/<your-repo>/`

## The notebook and the CSVs

`notebook/` holds the original exploration and its two datasets. The CSVs are
byte-for-byte as supplied, and the notebook has exactly one line added to it,
described under *Two things worth knowing* below:

```
notebook/movie-recc-system.ipynb
notebook/tmdb_5000_movies.csv
notebook/tmdb_5000_credits.csv
```

They sit in one folder because the notebook reads the CSVs by bare filename
(`pd.read_csv('tmdb_5000_movies.csv')`), so opening the notebook from that folder
just works, with no path changes and no `FileNotFoundError`.

`build/export_site_data.py` holds a copy of the notebook's code and is split into
two clearly marked parts:

- **Part 1** is the notebook pipeline copied cell for cell with no
  modifications: same order, same variable names, same functions, same
  `read_csv` filenames. It switches the working directory to `notebook/` before
  running, rather than editing those two lines. Cells that only printed things
  (`movies.head()`, `movies.shape`) are not carried over.
- **Part 2** is new code written for the website. It takes the `new_df` and
  `similarity` that Part 1 produced and writes the two JSON files.

## How it works

Each film is reduced to a single bag of words:

```
overview + genres + keywords + top 3 cast + director
```

Multi-word names are squashed into one token (`Science Fiction` becomes
`sciencefiction`) so they survive tokenisation, then everything is lowercased.
`CountVectorizer(max_features=5000, stop_words='english')` turns each bag into a
5000-dimensional count vector, and cosine similarity between those vectors gives
the distance between any two films.

Cosine similarity across 4,806 films is a 4,806 x 4,806 matrix, roughly 185 MB,
well past GitHub's 100 MB file limit. So the export runs offline and keeps only
each film's closest neighbours. What ships to the browser is two small JSON
files:

| File | Size | Contents |
| --- | --- | --- |
| `data/catalogue.json` | ~1.2 MB | Title, year, genres, director, rating and a trimmed overview for every film |
| `data/recommendations.json` | ~0.9 MB | Eight neighbours per film, each with a similarity score and the tags they share |

The page loads the catalogue first so search and browsing work immediately, then
fetches the recommendations in the background. It displays the first five
distinct titles from each neighbour list.

## Running it locally

The page fetches JSON, which browsers block on `file://` URLs. Open it through a
local server instead of double-clicking `index.html`:

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
4. Choose branch `main` and folder `/ (root)`, then click **Save**.
5. Wait a minute and the URL appears at the top of that same page.

`index.html` sits at the repository root and every path in it is relative, so no
extra configuration is needed.

## Regenerating the data

Only necessary if the model or the dataset changes. The JSON files are already
committed, so a fresh clone works straight away.

```bash
pip install -r build/requirements.txt
python build/export_site_data.py
```

Flags: `--top-n 5` exports exactly the notebook's `[1:6]` slice, `--top-n 15`
exports more neighbours per film, `--data-dir` points at a different folder if
you move the CSVs.

## Project structure

```
.
├── index.html                     # the page
├── assets/
│   ├── style.css
│   └── app.js                     # search, results, catalogue browsing
├── data/
│   ├── catalogue.json             # generated, committed
│   └── recommendations.json       # generated, committed
├── build/
│   ├── export_site_data.py        # notebook code + export layer
│   └── requirements.txt
└── notebook/
    ├── movie-recc-system.ipynb    # original + the one-line index fix
    ├── tmdb_5000_movies.csv       # as supplied
    └── tmdb_5000_credits.csv      # as supplied
```

The two CSVs add about 46 MB to the repository. Both are well under GitHub's
100 MB per-file limit, so they push without any special handling. If you would
rather keep the repo light later, gitignoring them and linking to the
[Kaggle dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata) in
this README is the usual approach, and the site still works because the JSON is
committed.

## Two things worth knowing

**Row labels used to drift from row positions.** `movies.dropna()` removes three
rows, so from row 2658 onward a row's pandas label sat 1 to 3 higher than its
position in the `similarity` matrix. `recommend()` finds a title by label
(`new_df[new_df['title']==movie].index[0]`) and then uses that number as a
position (`similarity[movie_index]`), so for titles past that point it read a
neighbouring film's row, and the last two titles raised an `IndexError`. One line
after the `dropna` fixes it:

```python
movies.dropna(inplace=True)
movies.reset_index(drop=True, inplace=True)
```

That line is now in the notebook and mirrored in Part 1, and it is the only
change made to the notebook. `recommend('My Date with Drew')` and every other
late title work now. The exported JSON is unaffected, because the export always
walked rows by position.

The notebook's saved outputs were produced before the fix, so the cell that
displays `new_df` still shows row labels running to 4808. Re-running the notebook
(Kernel > Restart Kernel and Run All Cells) refreshes it to 4805.

**Three titles are duplicated.** Merging the two CSVs on `title` matches *The
Host*, *Batman* and *Out of the Blue* against more than one row each, producing
4,806 rows for 4,797 distinct titles. Every row stays in the model. The export
flags the repeats so the browse list shows each title once, and the page skips a
repeated title when building a results list, which is why eight neighbours are
exported and five are shown.

## Limits worth knowing

Content-based filtering only knows what the metadata says. Films with sparse
overviews or few keywords match on genre alone, which is why an obscure title
occasionally outranks an obvious sequel. Because `CountVectorizer` runs before
the Porter stemmer in the notebook, the vectors are built from unstemmed text, so
`space` and `spaces` count as separate features. TF-IDF weighting, stemming
before vectorising, or blending in popularity would each sharpen the results.

## Credits

Data from the [TMDB 5000 Movie Dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata)
on Kaggle. This product uses the TMDB API but is not endorsed or certified by
TMDB.
