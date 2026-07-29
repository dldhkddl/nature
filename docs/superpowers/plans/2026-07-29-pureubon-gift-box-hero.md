# Pureubon Gift Box Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the desktop hero's peach plate with a fully visible peach gift box while preserving the user's `object-position: -100px -20px`.

**Architecture:** Keep the existing Cafe24-ready component and mobile asset unchanged. Create a new non-destructive desktop banner asset, wire it into the existing hero component, and protect the source dimensions, left copy region, user positioning, and mobile reset with tests.

**Tech Stack:** Next.js, React, CSS Modules, Node test runner, built-in ImageGen, Pillow image compositing.

## Global Constraints

- The final desktop banner must remain exactly `1920×400`.
- The plate and three loose peaches must not remain in the final banner.
- The peach gift box must show its top, bottom, and right edges with about `25px` bottom safety space.
- The left Korean copy and button must remain pixel-identical to the current source.
- Desktop must retain `object-position: -100px -20px`.
- Mobile must retain `object-position: center` and `object-fit: contain`.
- `hero-mobile.png`, the login card, and member shortcuts must not change.

---

### Task 1: Protect the new asset contract with tests

**Files:**
- Modify: `tests/pureubon-preview.test.mjs`
- Modify: `tests/pureubon-preview-styles.test.mjs`

**Interfaces:**
- Consumes: Existing `decodePng(url)` and `cropPixels(image, region)` helpers.
- Produces: Assertions for `/nature-seomgim/hero-gift-box-pc.png`, `1920×400`, unchanged left copy pixels, and the approved CSS positions.

- [ ] **Step 1: Write the failing route and asset assertions**

Replace the desktop asset assertion with:

```js
assert.match(html, /\/nature-seomgim\/hero-gift-box-pc\.png/);
assert.doesNotMatch(html, /\/nature-seomgim\/hero-peach-pc\.png/);
```

Point the invariant test at:

```js
const giftBoxHeroUrl = new URL(
  "../public/nature-seomgim/hero-gift-box-pc.png",
  import.meta.url,
);
```

Keep the dimension and `0..699` copy-region pixel comparisons.

- [ ] **Step 2: Write the failing desktop position assertion**

Require the approved desktop rule:

```js
assert.match(
  css,
  /\.heroArea img\s*\{[^}]*object-position:\s*-100px -20px/i,
);
```

Retain the mobile `object-position: center` assertion.

- [ ] **Step 3: Run tests to verify they fail**

Run:

```powershell
node --test tests/pureubon-preview.test.mjs tests/pureubon-preview-styles.test.mjs
```

Expected: FAIL because the component still references the peach-plate asset and the gift-box asset does not exist.

### Task 2: Create and wire the gift-box hero

**Files:**
- Create: `public/nature-seomgim/hero-gift-box-pc.png`
- Modify: `app/pureubon-preview/_components/HeroAccountPanel.tsx`
- Preserve: `app/pureubon-preview/preview.module.css`

**Interfaces:**
- Consumes: `public/nature-seomgim/hero-peach-pc.png` as edit target and visual reference.
- Produces: `/nature-seomgim/hero-gift-box-pc.png`, consumed by `HeroAccountPanel`.

- [ ] **Step 1: Generate the edited composition**

Use built-in ImageGen in `precise-object-edit` mode:

```text
Remove the stone pedestal and the three loose white peaches. Recompose the existing premium peach gift box as the only fruit subject on the right. Show the complete top, bottom, and right edges of the box, with about 25px clear beige space below it. Preserve every Korean character, button, beige texture, lighting, plant, vase, and the 1920×400 composition. Add no text, logo, watermark, plate, or loose fruit.
```

- [ ] **Step 2: Composite the result non-destructively**

Normalize the generated result to `1920×400`, then composite only the right image region over the original. Preserve source pixels `x=0..699` exactly and save to:

```text
public/nature-seomgim/hero-gift-box-pc.png
```

- [ ] **Step 3: Update the component path**

Change the desktop image to:

```tsx
src="/nature-seomgim/hero-gift-box-pc.png"
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm.cmd run build
node --test tests/pureubon-preview.test.mjs tests/pureubon-preview-styles.test.mjs
```

Expected: PASS.

### Task 3: Verify, commit, and publish

**Files:**
- Verify: `public/nature-seomgim/hero-gift-box-pc.png`
- Verify: `app/pureubon-preview/_components/HeroAccountPanel.tsx`
- Verify: `app/pureubon-preview/preview.module.css`

**Interfaces:**
- Consumes: The completed gift-box asset and CSS contract.
- Produces: A verified commit on `codex/pureubon-homepage`.

- [ ] **Step 1: Inspect the final desktop preview**

Reload:

```text
http://localhost:4310/pureubon-preview
```

Confirm the full gift box and bottom safety space are visible at `object-position: -100px -20px`.

- [ ] **Step 2: Run all verification commands**

```powershell
$env:CI='true'; npm.cmd test
node --test tests/pureubon-preview.test.mjs tests/pureubon-preview-styles.test.mjs
.\node_modules\.bin\eslint.cmd app\pureubon-preview tests\pureubon-preview.test.mjs tests\pureubon-preview-styles.test.mjs
git diff --check
```

Expected: build and tests pass, and ESLint reports zero errors.

- [ ] **Step 3: Commit**

```powershell
git add app/pureubon-preview/_components/HeroAccountPanel.tsx app/pureubon-preview/preview.module.css public/nature-seomgim/hero-gift-box-pc.png tests/pureubon-preview.test.mjs tests/pureubon-preview-styles.test.mjs
git commit -m "feat: feature peach gift box in hero"
```

- [ ] **Step 4: Push**

```powershell
git push origin codex/pureubon-homepage
```
