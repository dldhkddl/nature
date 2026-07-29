# Pureubon Hero Account Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카테고리와 인기상품 사이에 식품백억형 배너·로그인·회원 바로가기 영역을 추가하고 자연섬김 로고 배경을 투명하게 만든다.

**Architecture:** 기존 `SiteHeader`는 상단 회원·검색·바로가기 구조를 담당하고, 새 `HeroAccountPanel`은 메인 배너와 로그인/회원 바로가기를 독립적으로 렌더링한다. 기존 상품 섹션은 수정하지 않고 CSS 모듈에서 데스크톱 2열과 모바일 1열만 추가한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules, Node test runner, PNG 브랜드 자산

## Global Constraints

- 자연섬김 색상 `#f2e7dd`, `#ebe0d4`, `#234837`, `#ab8f70`을 유지한다.
- `지금 많이 찾는 상품` 이하의 상품진열 구조와 문구는 변경하지 않는다.
- 카테고리 내비게이션은 농산물 중심 구성을 유지한다.
- 회원 관련 링크는 이후 Cafe24 URL로 교체 가능한 개별 앵커로 만든다.
- 데스크톱은 배너와 회원 패널의 2열, 모바일은 1열로 렌더링한다.

---

### Task 1: 투명 로고와 식품백억형 상단 회원 메뉴

**Files:**
- Create: `public/nature-seomgim/logo-transparent.png`
- Modify: `app/pureubon-preview/_components/SiteHeader.tsx`
- Test: `tests/pureubon-preview.test.mjs`

**Interfaces:**
- Consumes: 기존 `SiteHeader()`와 자연섬김 로고 이미지
- Produces: 투명 로고 경로 `/nature-seomgim/logo-transparent.png`와 네 개의 상단 바로가기 앵커

- [ ] **Step 1: Write the failing test**

`tests/pureubon-preview.test.mjs`에 아래 검사를 추가한다.

```js
assert.match(html, /\/nature-seomgim\/logo-transparent\.png/);
assert.match(html, /전체상품/);
assert.match(html, /마이페이지/);
assert.match(html, /장바구니/);
assert.match(html, /고객센터/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd run build && node --test tests/pureubon-preview.test.mjs`

Expected: `logo-transparent.png` 경로가 HTML에 없어 FAIL

- [ ] **Step 3: Create the transparent logo and update the header**

기존 `logo.png`에서 크림색 배경만 제거한 투명 PNG를 만들고 `SiteHeader`의 로고 경로를 교체한다. 상단 유틸리티에는 `회원가입`, `로그인`만 두고 검색창 우측에는 `전체상품`, `마이페이지`, `장바구니`, `고객센터` 아이콘 링크를 렌더링한다.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd run build && node --test tests/pureubon-preview.test.mjs`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add public/nature-seomgim/logo-transparent.png app/pureubon-preview/_components/SiteHeader.tsx tests/pureubon-preview.test.mjs
git commit -m "feat: refine Pureubon member header"
```

### Task 2: 배너·로그인·회원 바로가기 패널

**Files:**
- Create: `app/pureubon-preview/_components/HeroAccountPanel.tsx`
- Modify: `app/pureubon-preview/page.tsx`
- Test: `tests/pureubon-preview.test.mjs`

**Interfaces:**
- Consumes: `/nature-seomgim/hero-pc.png`, `/nature-seomgim/hero-mobile.png`
- Produces: `HeroAccountPanel()`과 `data-cafe24-slot="hero-account-panel"`

- [ ] **Step 1: Write the failing test**

`tests/pureubon-preview.test.mjs`에 아래 검사를 추가한다.

```js
assert.match(html, /data-cafe24-slot="hero-account-panel"/);
assert.match(html, /자연섬김과 함께 신선한 장보기를 시작하세요/);
for (const label of ["마이페이지", "주문조회", "장바구니", "찜한상품", "배송조회", "고객센터"]) {
  assert.match(html, new RegExp(label));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd run build && node --test tests/pureubon-preview.test.mjs`

Expected: `hero-account-panel` 슬롯과 로그인 안내가 없어 FAIL

- [ ] **Step 3: Implement the panel**

`HeroAccountPanel`에서 왼쪽 배너와 오른쪽 로그인 카드를 렌더링하고, 오른쪽 아래에 여섯 개 바로가기 링크를 2×3으로 배치한다. `page.tsx`의 기존 단독 hero 섹션을 이 컴포넌트로 교체한다.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd run build && node --test tests/pureubon-preview.test.mjs`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/pureubon-preview/_components/HeroAccountPanel.tsx app/pureubon-preview/page.tsx tests/pureubon-preview.test.mjs
git commit -m "feat: add Pureubon hero account panel"
```

### Task 3: 반응형 레이아웃과 최종 검증

**Files:**
- Modify: `app/pureubon-preview/preview.module.css`
- Modify: `tests/pureubon-preview-styles.test.mjs`
- Modify: `docs/cafe24/pureubon-homepage-mapping.md`

**Interfaces:**
- Consumes: `HeroAccountPanel`의 `heroAccountPanel`, `heroArea`, `memberRail`, `loginCard`, `memberShortcuts` 클래스
- Produces: 데스크톱 2열·모바일 1열 레이아웃과 Cafe24 슬롯 이식 설명

- [ ] **Step 1: Write the failing style test**

`tests/pureubon-preview-styles.test.mjs`에 아래 검사를 추가한다.

```js
assert.match(css, /\.heroAccountPanel\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*300px/);
assert.match(css, /\.memberShortcuts\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
assert.match(css, /@media\s*\(max-width:\s*960px\)[\s\S]*\.heroAccountPanel\s*\{[\s\S]*grid-template-columns:\s*1fr/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/pureubon-preview-styles.test.mjs`

Expected: `heroAccountPanel` 규칙이 없어 FAIL

- [ ] **Step 3: Add responsive CSS and mapping**

헤더 아이콘 메뉴, 메인 2열 패널, 그린 로그인 카드, 2×3 회원 바로가기 스타일을 추가한다. 960px 이하에서 메인 패널을 1열로 변경하고 기존 상품 카드 규칙은 유지한다. Cafe24 이식 문서에 `hero-account-panel` 슬롯을 추가한다.

- [ ] **Step 4: Run full verification**

Run: `npm.cmd test`

Run: `node --test tests/pureubon-preview.test.mjs tests/pureubon-preview-styles.test.mjs`

Run: `node_modules\.bin\eslint.cmd app\pureubon-preview tests\pureubon-preview.test.mjs tests\pureubon-preview-styles.test.mjs`

Expected: build 성공, 모든 테스트 PASS, ESLint 오류 0개

- [ ] **Step 5: Commit and push**

```bash
git add app/pureubon-preview/preview.module.css tests/pureubon-preview-styles.test.mjs docs/cafe24/pureubon-homepage-mapping.md
git commit -m "feat: finish Pureubon member landing layout"
git push -u origin codex/pureubon-homepage
```
