---
name: Movie Recommender
description: Projection booth labels. Pale stock, a deep teal shell, orange for your pick, teal for what matched.
colors:
  stock: "#E3EAE4"
  stock-raised: "#F3F6F1"
  stock-line: "#BCC8BF"
  ink: "#13232B"
  ink-dim: "#485962"
  booth: "#0F3540"
  on-booth: "#EEF3EE"
  on-booth-dim: "#A5D3D6"
  pick: "#C2410C"
  pick-bright: "#F26A2E"
  match: "#0B6E66"
  white: "#fff"
  pick-hover: "#FF8348"
  on-booth-link-hover: "#FFB08A"
  on-booth-error: "#FFC2A6"
  stock-line-hover: "#8FA096"
  shadow-menu: "rgba(6, 28, 34, 0.45)"
  shadow-float: "rgba(6, 28, 34, 0.6)"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "5.25rem"
    fontWeight: 700
    lineHeight: 0.92
  heading:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.05
  body:
    fontFamily: "Barlow, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  display-min:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 0.92
  heading-min:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.05
  title:
    fontFamily: "Barlow, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.4375rem"
    fontWeight: 600
    lineHeight: 1.2
  title-compact:
    fontFamily: "Barlow, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
  control:
    fontFamily: "Barlow, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
  body-small:
    fontFamily: "Barlow, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  facts:
    fontFamily: "Barlow, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  caption:
    fontFamily: "Barlow, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
  fine:
    fontFamily: "Barlow, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.3
  code:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  sm: "4px"
  md: "6px"
  pill: "999px"
components:
  button-primary:
    backgroundColor: "{colors.pick-bright}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "15px 28px"
  input-search:
    backgroundColor: "{colors.stock-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
---

## Overview

A single working page: one film in, five films out. The look borrows from the labels on film cans in a projection booth: pale grey-green stock, sturdy condensed capitals, and two working colours. The world lends type, palette, density and one signature move; every control is a standard web control.

## Colors

- **Stock** is the page ground; **stock-raised** is for fields, hovered rows and menus.
- **Booth** is the header shell only. Text on it uses **on-booth** and **on-booth-dim**, never grey.
- **Pick (orange)** means the visitor's chosen film and the primary action. Nothing else is orange.
- **Match (teal)** means anything matched to that film: the splice line, numbered nodes, shared-trait chips, hover on a result.

## Typography

Barlow Condensed, bold, uppercase for the title, section headings, labels and buttons. Barlow for everything read as a sentence, 500 to 600 weight for film titles. Numerals are tabular wherever they line up.

## Layout

One 60rem column with a fluid gutter. The header band is full width; content below sits on stock. More space above a section heading than below it. Results indent 3.5rem to make room for the splice.

## Elevation & Depth

Flat. Only floating things cast a shadow: the suggestion menu and the back-to-top button, both with an offset, soft shadow.

## Shapes

6px radius on controls, 4px on small rows, full pills for shared-trait chips, circles for nodes.

## Components

- **The splice** (signature): an orange ring beside the chosen film, a 2px teal trunk running down from it, a numbered teal node per result, a short branch to the row, and the shared traits written at the branch. It draws top to bottom when results arrive.
- **Result row**: shared traits, title, facts line, overview. The whole row is one button that re-seeds the search.
- **Catalogue entry**: title over a facts line, ruled grid, whole cell clickable.

## Do's and Don'ts

- Do keep orange for the pick and the primary action only.
- Do keep the splice as the one authored motion; other motion is feedback under 250ms.
- Don't add a second accent, gradients, or decorative texture.
- Don't dress controls as labels, tickets or film stock.
- Don't imply posters or imagery the data does not have.
