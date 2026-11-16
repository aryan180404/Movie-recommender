# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
People deciding what to watch next. They arrive with one film they already like and want a short list of similar ones, on a phone or a laptop, usually in the evening. A second audience is people evaluating the project itself (a portfolio piece on GitHub).

## Product Purpose
Pick a film you like and get five similar films, with enough about each (year, director, genres, rating, overview, what it shares with your pick) to decide whether to watch it. Success is a visitor finding a film they had not thought of within a minute, and following one recommendation into another.

## Positioning
The match is explainable. Every recommendation comes from shared metadata (overview words, genres, keywords, top cast, director), and the page can say what two films have in common.

## Operating Context
A single static page on GitHub Pages. No server, no accounts, no API keys. Similarities are computed offline from the TMDB 5000 dataset by `build/export_site_data.py` and shipped as two JSON files.

## Capabilities and Constraints
- 4,797 distinct films, searchable by title; the catalogue filters by title, director or genre.
- Five recommendations per film, drawn from eight exported neighbours.
- Data per film: title, year, genres, director, rating, trimmed overview. No posters or other images are available.
- Static HTML, CSS and JavaScript only; no build step, no dependencies.
- Undecided: a product name. The README says "Watch Next", the page says "Movie Recommender".

## Evidence on Hand
- `data/catalogue.json`, `data/recommendations.json` (real data).
- No imagery, logo, testimonials or usage numbers exist; none may be invented.
- TMDB attribution is required: "This product uses the TMDB API but is not endorsed or certified by TMDB."

## Product Principles
- One film in, five films out. Nothing stands between the visitor and that exchange.
- Show why a film was matched, never only that it was.
- Every result is a doorway to the next search.
- The page works from text alone; it never pretends to have pictures it lacks.
