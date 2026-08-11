"""
export_site_data.py
===================

Runs the code from notebook/movie-recc-system.ipynb and writes the JSON files
the static site reads. The notebook itself is never opened, imported or
modified by this script.

The file has two clearly separated parts:

  PART 1  The notebook pipeline, copied cell for cell with no modifications
          whatsoever. Same order, same variable names, same functions, same
          read_csv filenames. Display-only cells (movies.head(),
          movies.shape, and so on) are the only things not carried over,
          since they only printed to the notebook.

          Because the notebook reads the CSVs by bare filename, this script
          switches the working directory to the folder holding them before
          running Part 1, rather than touching those two lines.

  PART 2  The export layer. New code, written for the website. It reads the
          `new_df` and `similarity` that Part 1 produced and turns them into
          data/catalogue.json and data/recommendations.json.

Usage:
    python build/export_site_data.py
    python build/export_site_data.py --top-n 5 --data-dir notebook
"""

from __future__ import annotations

import argparse
import ast
import contextlib
import json
import os
import sys
import warnings
from pathlib import Path

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")  # the notebook's chained assignments are noisy

ROOT = Path(__file__).resolve().parents[1]

OVERVIEW_CHARS = 170   # how much of the plot summary to ship to the browser
MAX_REASONS = 6        # how many shared tags to show per recommendation


@contextlib.contextmanager
def working_directory(path: Path):
    """Run a block with `path` as the working directory, then switch back."""
    previous = Path.cwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(previous)


# =============================================================================
# PART 1 — notebook/movie-recc-system.ipynb, copied with no modifications
# =============================================================================

def run_notebook_pipeline():
    """Every line below is from the notebook, in notebook order, unedited.

    Call this with the CSV folder as the working directory.
    """

    import numpy as np
    import pandas as pd

    movies = pd.read_csv('tmdb_5000_movies.csv')
    credits = pd.read_csv('tmdb_5000_credits.csv')

    movies= movies.merge(credits, on='title')

    #removing unecessary data
    #genres, id, keywords

    movies= movies[['movie_id', 'title','overview','genres','keywords','cast','crew']]

    movies.dropna(inplace=True)
    movies.reset_index(drop=True, inplace=True)

    #now we have gotten imp columns now just format them before combining them

    import ast
    def convert(obj):
        L=[]
        for i in ast.literal_eval(obj):
            L.append(i['name'])
        return L

    movies['genres']= movies['genres'].apply(convert)

    movies['keywords']=movies['keywords'].apply(convert)

    def convert2(obj):
        L=[]
        counter = 0
        for i in ast.literal_eval(obj):
            if counter !=3:
                L.append(i['name'])
                counter+=1
            else:
                break
        return L

    movies['cast']=movies['cast'].apply(convert2)

    def convert3(obj):
        L=[]
        for i in ast.literal_eval(obj):
            if i['job'] == 'Director':
                L.append(i['name'])
                break
        return L

    movies['crew']= movies['crew'].apply(convert3)

    movies['genres']=movies['genres'].apply(lambda x:[i.replace(" ","") for i in x])
    movies['keywords']=movies['keywords'].apply(lambda x:[i.replace(" ","") for i in x])
    movies['cast']=movies['cast'].apply(lambda x:[i.replace(" ","") for i in x])
    movies['crew']=movies['crew'].apply(lambda x:[i.replace(" ","") for i in x])

    movies['overview'] = movies['overview'].str.split()
    movies['tags']= movies['overview']+movies['genres']+ movies['keywords'] + movies['cast'] + movies['crew']

    new_df= movies[['movie_id','title','tags']]

    new_df['tags'] = new_df['tags'].apply(lambda x: ' '.join(x) if isinstance(x, list) else x)

    new_df['tags']= new_df['tags'].apply(lambda x:x.lower())

    from sklearn.feature_extraction.text import CountVectorizer
    cv = CountVectorizer(max_features=5000, stop_words='english')

    vectors =cv.fit_transform(new_df['tags']).toarray()

    import nltk
    from nltk.stem.porter import PorterStemmer
    ps = PorterStemmer()

    def stem(text):
        y= []
        for i in text.split():
            y.append(ps.stem(i))
        return ' '.join(y)

    new_df['tags']= new_df['tags'].apply(stem)

    from sklearn.metrics.pairwise import cosine_similarity
    similarity = cosine_similarity(vectors)

    def recommend(movie):
        movie_index = new_df[new_df['title']==movie].index[0]
        distances = similarity[movie_index]
        movies_list = sorted(list(enumerate(distances)), reverse= True, key=lambda x:x[1])[1:6]

        for i in movies_list:
            print(new_df.iloc[i[0]].title)
        return

    # --- end of notebook code ---
    return new_df, similarity, recommend


# =============================================================================
# PART 2 — export layer (new code, written for the website)
# =============================================================================
#
# A note on how this part reads `similarity`.
#
# `movies.dropna()` removes three rows. Without the `reset_index(drop=True)`
# that follows it, a row's pandas label would sit 1 to 3 higher than its
# position in the `similarity` matrix from row 2658 onward, and recommend()
# would read the wrong row for every title past that point, since it finds a
# title by label (`.index[0]`) but then uses that number as a position
# (`similarity[movie_index]`).
#
# With the reset in place, labels and positions agree. This export walks every
# row by position, which is what recommend()'s own output line does
# (`new_df.iloc[i[0]]`), so the two now describe the same rows.
# =============================================================================


def display_metadata(expected_rows: int) -> pd.DataFrame:
    """Rebuild the same row set as Part 1, but keeping the fields the page
    needs to display: readable names (with spaces), year, rating, overview.

    Call this with the CSV folder as the working directory.
    """

    movies = pd.read_csv('tmdb_5000_movies.csv')
    credits = pd.read_csv('tmdb_5000_credits.csv')
    merged = movies.merge(credits, on='title')

    # Same column selection and same dropna as the notebook, so the row order
    # and row count match `new_df` exactly.
    core = merged[['movie_id', 'title', 'overview', 'genres', 'keywords', 'cast', 'crew']]
    keep = core.dropna().index
    df = merged.loc[keep].reset_index(drop=True)

    if len(df) != expected_rows:
        sys.exit(
            f"Row mismatch: metadata has {len(df)} rows, the pipeline produced "
            f"{expected_rows}. The export would misalign, so nothing was written."
        )

    def names(raw):
        return [item['name'] for item in ast.literal_eval(raw)]

    df['genre_names'] = df['genres'].apply(names)
    df['keyword_names'] = df['keywords'].apply(names)
    df['cast_names'] = df['cast'].apply(lambda raw: names(raw)[:3])
    df['director'] = df['crew'].apply(
        lambda raw: next(
            (item['name'] for item in ast.literal_eval(raw) if item.get('job') == 'Director'),
            '',
        )
    )
    df['year'] = pd.to_datetime(df['release_date'], errors='coerce').dt.year
    return df


def trim(overview: str) -> str:
    overview = str(overview).strip().replace('\n', ' ')
    if len(overview) <= OVERVIEW_CHARS:
        return overview
    return overview[:OVERVIEW_CHARS].rsplit(' ', 1)[0] + '...'


def export(similarity, meta: pd.DataFrame, out_dir: Path, top_n: int) -> None:
    scores = similarity.astype(np.float32).copy()
    np.fill_diagonal(scores, -1.0)  # a film is never its own recommendation

    part = np.argpartition(-scores, top_n, axis=1)[:, :top_n]
    ranked = np.take_along_axis(
        part, np.argsort(-np.take_along_axis(scores, part, axis=1), axis=1), axis=1
    )

    # Human readable tag sets, used to explain why two films matched.
    tag_sets = [
        set(row.genre_names + row.keyword_names + row.cast_names
            + ([row.director] if row.director else []))
        for row in meta.itertuples()
    ]
    frequency: dict[str, int] = {}
    for names in tag_sets:
        for name in names:
            frequency[name] = frequency.get(name, 0) + 1

    tag_vocab: dict[str, int] = {}
    genre_vocab: dict[str, int] = {}

    def tag_id(name: str) -> int:
        return tag_vocab.setdefault(name, len(tag_vocab))

    def genre_id(name: str) -> int:
        return genre_vocab.setdefault(name, len(genre_vocab))

    catalogue, recommendations = [], []
    seen_titles: set[str] = set()
    duplicates: list[int] = []

    for i, row in enumerate(meta.itertuples()):
        # Merging on title leaves a few titles duplicated. Every row stays in
        # the model; the repeats are only flagged so the browse list shows each
        # title once instead of four times.
        if row.title in seen_titles:
            duplicates.append(i)
        seen_titles.add(row.title)

        catalogue.append({
            't': row.title,
            'y': None if pd.isna(row.year) else int(row.year),
            'g': [genre_id(g) for g in row.genre_names],
            'v': round(float(row.vote_average), 1),
            'o': trim(row.overview),
            'd': row.director,
        })

        neighbours = []
        for j in ranked[i]:
            # Rank shared tags by rarity, so "Christopher Nolan" beats "Drama".
            # The name is part of the key so equal-frequency ties break the same
            # way on every run, regardless of the process hash seed.
            shared = sorted(tag_sets[i] & tag_sets[j], key=lambda n: (frequency[n], n))
            neighbours.append([
                int(j),
                int(round(float(similarity[i][j]) * 1000)),
                [tag_id(n) for n in shared[:MAX_REASONS]],
            ])
        recommendations.append(neighbours)

    out_dir.mkdir(parents=True, exist_ok=True)
    payloads = {
        'catalogue.json': {
            'count': len(catalogue) - len(duplicates),
            'genres': list(genre_vocab),
            'duplicates': duplicates,
            'movies': catalogue,
        },
        'recommendations.json': {
            'topN': top_n,
            'tags': list(tag_vocab),
            'recommendations': recommendations,
        },
    }

    for name, payload in payloads.items():
        path = out_dir / name
        path.write_text(json.dumps(payload, separators=(',', ':')), encoding='utf-8')
        print(f'  wrote {path.relative_to(ROOT)}  ({path.stat().st_size / 1e6:.2f} MB)')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-dir', default=ROOT / 'notebook', type=Path,
                        help='folder holding the notebook and the two CSVs')
    parser.add_argument('--out-dir', default=ROOT / 'data', type=Path)
    parser.add_argument('--top-n', default=8, type=int,
                        help='neighbours exported per film. The page displays the first 5 '
                             'distinct titles from this list; the extra rows are spares, '
                             'used when the merge duplicated a title. Pass 5 for exactly '
                             "the notebook's [1:6] slice.")
    args = parser.parse_args()

    for name in ('tmdb_5000_movies.csv', 'tmdb_5000_credits.csv'):
        if not (args.data_dir / name).exists():
            sys.exit(
                f'Missing {name} in {args.data_dir}.\n'
                'Both CSVs need to sit beside the notebook, since the notebook reads\n'
                'them by bare filename. See the README.'
            )

    with working_directory(args.data_dir):
        print('Running the notebook pipeline...')
        new_df, similarity, recommend = run_notebook_pipeline()
        print(f'  {len(new_df)} rows, similarity matrix {similarity.shape}')

        print('Collecting display metadata...')
        meta = display_metadata(len(new_df))

    print(f'Exporting top {args.top_n} neighbours per film...')
    export(similarity, meta, args.out_dir, args.top_n)

    print('Done. Commit the JSON files and push.')


if __name__ == '__main__':
    main()
