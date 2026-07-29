# Pureubon Seasonal Peach Hero Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Replace the green grapes in the desktop seasonal-fruit hero with the approved white peaches and move the desktop hero content 64px left without changing the mobile layout.

**Architecture:** Keep the existing Cafe24-ready hero structure and member rail intact. Create a new non-destructive desktop banner asset, switch the component to that asset, and apply the horizontal adjustment only in desktop CSS with an explicit mobile reset.

**Tech Stack:** Next.js, React, CSS Modules, Node test runner, Pillow image compositing, built-in ImageGen.

---

### Task 1: Create and wire the peach hero asset

**Files:**
- Modify: `tests/pureubon-preview.test.mjs`
- Create: `public/nature-seomgim/hero-peach-pc.png`
- Modify: `app/pureubon-preview/_components/HeroAccountPanel.tsx`

**Step 1: Write the failing test**

Add an assertion that the rendered preview HTML references:

```js
assert.match(html, /\/nature-seomgim\/hero-peach-pc\.png/);
```

and no longer references the former desktop hero path.

**Step 2: Run the test to verify it fails**

Run:

```powershell
node --test tests/pureubon-preview.test.mjs
```

Expected: FAIL because the component still renders `/nature-seomgim/hero-pc.png`.

**Step 3: Generate and preserve the edited asset**

Inspect `public/nature-seomgim/hero-pc.png`, then use built-in ImageGen in `precise-object-edit` mode with this invariant:

```text
Replace only the green grape cluster and its grape leaves on the center-right pedestal with three soft white peaches matching the peaches already visible in the right fruit box. Preserve every Korean character, button, background texture, pedestal, right fruit box, plant, lighting, crop, and all other pixels as closely as possible. Add no new text, logo, watermark, or object.
```

Resize the generated result to the original `1900x400` canvas if necessary, composite only the peach edit region over the original with a feathered mask, and save the result as `public/nature-seomgim/hero-peach-pc.png`. Keep the original asset unchanged.

**Step 4: Update the component**

Change the desktop image source in `HeroAccountPanel.tsx`:

```tsx
src="/nature-seomgim/hero-peach-pc.png"
```

**Step 5: Run the test to verify it passes**

Run:

```powershell
node --test tests/pureubon-preview.test.mjs
```

Expected: PASS.

### Task 2: Shift desktop hero left and preserve mobile layout

**Files:**
- Modify: `tests/pureubon-preview-styles.test.mjs`
- Modify: `app/pureubon-preview/preview.module.css`

**Step 1: Write the failing style assertions**

Assert that the desktop rule contains:

```css
object-position: -64px center;
```

and the `@media (max-width: 640px)` hero rule contains:

```css
object-position: center;
```

**Step 2: Run the style test to verify it fails**

Run:

```powershell
node --test tests/pureubon-preview-styles.test.mjs
```

Expected: FAIL because the desktop rule is still `left center` and the mobile rule has no explicit reset.

**Step 3: Implement the CSS change**

Update the desktop hero image rule to `object-position: -64px center`, then add `object-position: center` to the mobile hero image rule.

**Step 4: Run focused tests**

Run:

```powershell
node --test tests/pureubon-preview.test.mjs tests/pureubon-preview-styles.test.mjs
```

Expected: PASS.

### Task 3: Verify the final page and publish the branch

**Files:**
- Verify: `public/nature-seomgim/hero-peach-pc.png`
- Verify: `app/pureubon-preview/_components/HeroAccountPanel.tsx`
- Verify: `app/pureubon-preview/preview.module.css`

**Step 1: Validate the asset**

Confirm the final asset is `1900x400`, the untouched text region matches the original, and the peach edit has no visible seam.

**Step 2: Run all checks**

Run:

```powershell
$env:CI='true'; npm.cmd test
node --test tests/pureubon-preview.test.mjs tests/pureubon-preview-styles.test.mjs
.\node_modules\.bin\eslint.cmd app\pureubon-preview tests\pureubon-preview.test.mjs tests\pureubon-preview-styles.test.mjs
```

Expected: build and tests pass, ESLint reports zero errors.

**Step 3: Check the running preview**

Reload `http://localhost:4310/pureubon-preview`, verify the peach hero, the left shift, the unchanged member rail, and the mobile reset.

**Step 4: Commit and push**

Commit the implementation with:

```powershell
git add app/pureubon-preview/_components/HeroAccountPanel.tsx app/pureubon-preview/preview.module.css public/nature-seomgim/hero-peach-pc.png tests/pureubon-preview.test.mjs tests/pureubon-preview-styles.test.mjs
git commit -m "feat: update seasonal fruit hero"
git push origin codex/pureubon-homepage
```
