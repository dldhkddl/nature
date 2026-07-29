# Pureubon Hero And Logo Cleanup Design

Date: 2026-07-29

## Goal

Remove the visible vertical boundary in the seasonal fruit hero, enlarge the peach gift box without clipping it, and change the header brand from "오늘도자연섬김" to "자연섬김" wherever the preview references the brand image or accessible brand text.

## Scope

- Rebuild `public/nature-seomgim/hero-gift-box-pc.png` so the beige background reads as one continuous image.
- Keep the existing hero text, button style, green/beige palette, rounded banner frame, and desktop CSS position.
- Enlarge the peach gift box by roughly 10-15% while keeping the full box visible in the current desktop crop.
- Update the hero brand sentence from "오늘도자연섬김이 전합니다." to "자연섬김이 전합니다." so brand wording is consistent.
- Create a new transparent logo asset that shows the icon and "자연섬김" only.
- Update `SiteHeader` to use the new logo image and accessible labels.
- Update tests so they assert the new logo path, brand wording, and hero asset behavior.

## Approach

Use a new hero image asset rather than trying to hide the boundary with CSS. The asset will blend the background across the whole banner, preserve the left-side copy layout, and place a slightly larger gift box on the right. The header will switch to a new logo filename instead of overwriting the existing file, so the old asset remains available if the user wants to compare or revert visually.

## Components

- `HeroAccountPanel`: keeps the same structure and desktop hero source path.
- `SiteHeader`: changes logo source and brand labels to "자연섬김".
- `preview.module.css`: keep current desktop object positioning unless visual verification shows a tiny adjustment is needed to prevent clipping.
- `tests/pureubon-preview.test.mjs`: update brand/logo assertions and hero image checks.

## Verification

- Run the project tests.
- Render the local preview and inspect the hero area visually.
- Confirm no direct runtime references to "오늘도자연섬김" remain.
- Commit and push the completed implementation after verification passes.
