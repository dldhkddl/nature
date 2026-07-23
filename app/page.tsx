"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";

type Product = {
  name: string; variety: string; origin: string; weight: string; price: string;
  stock: string; shipping: string; producer: string; storage: string; feature: string;
};

const initial: Product = {
  name: "포항 산지직송 햇사과", variety: "부사", origin: "경상북도 포항시",
  weight: "3kg + 3kg", price: "39,900", stock: "100", shipping: "무료배송",
  producer: "명성농산", storage: "수령 후 냉장 보관", feature: "아삭한 식감, 풍부한 과즙, 산지에서 바로 발송",
};

const fields: { key: keyof Product; label: string; placeholder?: string }[] = [
  { key: "name", label: "상품 기본명" }, { key: "variety", label: "품종" },
  { key: "origin", label: "원산지" }, { key: "producer", label: "생산자·판매자" },
  { key: "weight", label: "중량·구성" }, { key: "price", label: "판매가(원)" },
  { key: "stock", label: "재고" }, { key: "shipping", label: "배송 조건" },
  { key: "storage", label: "보관 방법" }, { key: "feature", label: "상품 특징" },
];

export default function Home() {
  const [product, setProduct] = useState(initial);
  const [generated, setGenerated] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [images, setImages] = useState<string[]>(["/samples/apple-main.png", "/samples/apple-cut.png"]);
  const [notice, setNotice] = useState("");
  const detailPageRef = useRef<HTMLDivElement>(null);

  const copy = useMemo(() => ({
    title: `[산지직송] ${product.origin} ${product.variety} ${product.weight} ${product.shipping}`,
    headline: `오늘의 아삭함을 산지에서 바로`,
    summary: `${product.origin}에서 정성껏 기른 ${product.variety}입니다. ${product.feature}을 한 상자에 담아 보내드립니다.`,
    points: ["산지에서 선별 후 바로 발송", product.feature.split(",")[0] || "신선한 품질", `${product.weight} 알찬 구성`],
  }), [product]);

  function update(key: keyof Product, value: string) {
    setProduct(p => ({ ...p, [key]: value })); setGenerated(false);
  }

  function generate() {
    setBusy(true); setNotice("");
    setTimeout(() => { setGenerated(true); setBusy(false); setTab("preview"); }, 650);
  }

  function upload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 10 - images.length);
    setImages(prev => [...prev, ...files.map(file => URL.createObjectURL(file))].slice(0, 10));
  }

  function download() {
    const data = JSON.stringify({ product, aiDraft: copy, images: images.length }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "스마트스토어_상품등록_초안.json"; a.click();
    URL.revokeObjectURL(url); setNotice("등록용 초안을 저장했습니다.");
  }

  async function downloadPng() {
    if (!detailPageRef.current) return;
    setNotice("상세페이지 이미지를 만드는 중입니다…");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(detailPageRef.current, {
        pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true,
        width: 390, style: { width: "390px", maxWidth: "390px" },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${product.name.replace(/[\\/:*?\"<>|]/g, "_")}_상세페이지.png`;
      a.click();
      setNotice("상세페이지 PNG를 저장했습니다.");
    } catch {
      setNotice("이미지 저장에 실패했습니다. 사진을 다시 선택한 후 시도해 주세요.");
    }
  }

  async function downloadExcel() {
    const XLSX = await import("xlsx");
    const priceNumber = Number(product.price.replace(/[^0-9.-]/g, "")) || 0;
    const stockNumber = Number(product.stock.replace(/[^0-9.-]/g, "")) || 0;
    const rows = [
      ["스마트스토어 상품등록 초안", ""], ["항목", "등록 내용"],
      ["추천 상품명", copy.title], ["상품 기본명", product.name], ["품종", product.variety],
      ["원산지", product.origin], ["생산자·판매자", product.producer], ["중량·구성", product.weight],
      ["판매가", priceNumber], ["재고", stockNumber], ["배송 조건", product.shipping],
      ["보관 방법", product.storage], ["상품 특징", product.feature], ["상세 소개", copy.summary],
      ["핵심 포인트 1", copy.points[0]], ["핵심 포인트 2", copy.points[1]], ["핵심 포인트 3", copy.points[2]],
      ["사진 수", images.length], ["작성 상태", "등록 전 사실정보 확인 필요"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 20 }, { wch: 65 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    if (ws.B9) ws.B9.z = "#,##0";
    if (ws.B10) ws.B10.z = "#,##0";
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "상품등록정보");
    XLSX.writeFile(wb, `${product.name.replace(/[\\/:*?\"<>|]/g, "_")}_상품등록.xlsx`);
    setNotice("스마트스토어 등록정보 엑셀을 저장했습니다.");
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span className="brandMark">果</span><div><b>담다 AI</b><small>스마트스토어 상품 제작 도우미</small></div></div>
        <div className="steps"><span className="active">1 상품 입력</span><i /> <span className={generated ? "active" : ""}>2 AI 제작</span><i /> <span>3 등록</span></div>
        <button className="ghost" onClick={() => setNotice("네이버 커머스 API 키 연결 기능은 다음 단계에서 활성화됩니다.")}>네이버 연결</button>
      </header>

      <section className="hero">
        <div><span className="eyebrow">PRODUCT PAGE STUDIO</span><h1>사진과 상품정보만 넣으세요.<br/><em>상세페이지는 AI가 준비할게요.</em></h1><p>농산물 판매에 꼭 필요한 정보는 빠짐없이, 표현은 더 먹음직스럽게.</p></div>
        <div className="heroStat"><b>약 3분</b><span>상품 등록 초안 완성</span></div>
      </section>

      <div className="mobileTabs"><button className={tab === "edit" ? "on" : ""} onClick={() => setTab("edit")}>상품 입력</button><button className={tab === "preview" ? "on" : ""} onClick={() => setTab("preview")}>상세 미리보기</button></div>

      <section className="workspace">
        <div className={`editor ${tab === "edit" ? "show" : ""}`}>
          <div className="sectionHead"><div><span>01</span><h2>상품 사진</h2></div><small>대표 이미지를 첫 번째로 배치하세요 · 최대 10장</small></div>
          <div className="imageGrid">
            {images.map((src, i) => <div className="thumb" key={src}><img src={src} alt={`상품 사진 ${i+1}`} />{i === 0 && <b>대표</b>}<button aria-label="사진 삭제" onClick={() => setImages(v => v.filter((_, n) => n !== i))}>×</button></div>)}
            {images.length < 10 && <label className="upload"><span>＋</span><b>사진 추가</b><small>JPG, PNG</small><input type="file" accept="image/*" multiple onChange={upload}/></label>}
          </div>

          <div className="sectionHead second"><div><span>02</span><h2>상품 정보</h2></div><small><strong>*</strong> 실제 정보만 입력해 주세요</small></div>
          <div className="formGrid">
            {fields.map(f => <label key={f.key} className={f.key === "feature" ? "wide" : ""}><span>{f.label}</span>{f.key === "feature" ? <textarea value={product[f.key]} onChange={e => update(f.key, e.target.value)} /> : <input value={product[f.key]} onChange={e => update(f.key, e.target.value)} />}</label>)}
          </div>
          <div className="safety"><span>✓</span><p><b>안심 생성 원칙</b> 원산지·중량·가격 같은 사실 정보는 AI가 임의로 만들지 않습니다.</p></div>
          <button className="primary full" onClick={generate} disabled={busy}>{busy ? "상세페이지 구성 중…" : "✦ AI 상세페이지 만들기"}</button>
        </div>

        <aside className={`previewPane ${tab === "preview" ? "show" : ""}`}>
          <div className="previewHead"><div><span className="dot" /> 상세페이지 미리보기</div><div><button onClick={() => window.print()}>인쇄</button><button onClick={download}>초안 저장</button></div></div>
          <div className="phone">
            <div className="mockPage" ref={detailPageRef}>
              <div className="cover" style={{backgroundImage: `linear-gradient(0deg,rgba(23,33,23,.72),rgba(23,33,23,.04)),url("${images[0] || "/samples/apple-main.png"}")`}}>
                <span>{product.origin} 산지직송</span><h2>{copy.headline}</h2><p>{product.variety} · {product.weight}</p>
              </div>
              <div className="story"><span>FRESH FROM FARM</span><h3>{product.name}</h3><p>{copy.summary}</p></div>
              <div className="pointRow">{copy.points.map((p, i) => <div key={p}><b>0{i+1}</b><span>{p}</span></div>)}</div>
              {images[1] && <img className="detailImg" src={images[1]} alt="상품 상세" />}
              <div className="info"><span>상품 정보</span><h3>구매 전 꼭 확인해 주세요</h3><dl><div><dt>원산지</dt><dd>{product.origin}</dd></div><div><dt>구성</dt><dd>{product.weight}</dd></div><div><dt>보관</dt><dd>{product.storage}</dd></div><div><dt>배송</dt><dd>{product.shipping}</dd></div></dl></div>
            </div>
          </div>
          <div className="resultCard"><span>AI 추천 상품명</span><p>{generated ? copy.title : "정보가 변경되었습니다. AI 제작 버튼을 눌러 갱신하세요."}</p><button onClick={() => navigator.clipboard?.writeText(copy.title)}>복사</button></div>
          <div className="downloadActions"><button className="secondary" onClick={downloadPng}><b>PNG</b><span>상세페이지 저장</span></button><button className="secondary" onClick={downloadExcel}><b>XLSX</b><span>등록정보 엑셀</span></button></div>
          <div className="actions"><button className="secondary" onClick={download}>JSON 백업</button><button className="primary" onClick={() => setNotice("API 연결 전입니다. PNG와 엑셀을 내려받아 스마트스토어에서 확인해 주세요.")}>스마트스토어 등록 준비 →</button></div>
        </aside>
      </section>
      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
    </main>
  );
}
