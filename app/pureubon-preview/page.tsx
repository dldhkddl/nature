import { ProductCard } from "./_components/ProductCard";
import { ProductSection } from "./_components/ProductSection";
import { SiteHeader } from "./_components/SiteHeader";
import {
  dealProducts,
  farmGroups,
  featuredProducts,
  quickLinks,
} from "./content";
import styles from "./preview.module.css";

export default function PureubonPreviewPage() {
  return (
    <div className={styles.preview} id="top">
      <SiteHeader />

      <main>
        <h1 className={styles.srOnly}>자연섬김 산지직송 농산물</h1>

        <section
          className={styles.hero}
          data-cafe24-slot="hero"
          aria-label="자연섬김 메인 배너"
        >
          <picture>
            <source
              media="(max-width: 640px)"
              srcSet="/nature-seomgim/hero-mobile.png"
            />
            <img
              src="/nature-seomgim/hero-pc.png"
              alt="오늘의 제철 과일, 산지에서 가장 맛있는 순간"
            />
          </picture>
        </section>

        <section
          className={styles.quickLinks}
          data-cafe24-slot="quick-links"
          aria-label="빠른 이용 메뉴"
        >
          {quickLinks.map((item) => (
            <a key={item.label} href={item.href}>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </a>
          ))}
        </section>

        <div data-cafe24-slot="featured-products">
          <ProductSection
            id="all-products"
            eyebrow="BEST PRODUCTS"
            title="지금 많이 찾는 상품"
            description="자연섬김 고객이 먼저 찾은 산지 농산물입니다."
            products={featuredProducts}
          />
        </div>

        <div data-cafe24-slot="season-deals">
          <ProductSection
            id="season-deals"
            eyebrow="WEEKLY SPECIAL"
            title="산지에서 바로, 이번 주 특별가"
            description="제철 물량을 좋은 조건으로 준비했습니다."
            products={dealProducts}
            tone="beige"
          />
        </div>

        <section
          id="farm-products"
          className={styles.farmGroups}
          data-cafe24-slot="farm-groups"
        >
          <div className={styles.sectionHeading}>
            <span>FARM COLLECTION</span>
            <h2>농산물 상품군별 인기상품</h2>
            <p>제철 과일부터 정성스러운 선물세트까지 만나보세요.</p>
          </div>

          {farmGroups.map((group) => (
            <div className={styles.farmGroup} id={group.id} key={group.id}>
              <div>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
              </div>
              <div className={styles.compactGrid}>
                {group.products.map((item) => (
                  <ProductCard key={`${group.id}-${item.id}`} product={item} />
                ))}
              </div>
            </div>
          ))}
        </section>

        <section
          id="exhibitions"
          className={styles.exhibition}
          data-cafe24-slot="exhibitions"
        >
          <div>
            <span>CURATED FOR YOU</span>
            <h2>자연섬김 기획전</h2>
            <p>
              제철상품, 선물세트, 대량구매 상품을 한곳에서 확인하세요.
            </p>
          </div>
          <a href="#season-deals">기획상품 보러가기</a>
        </section>
      </main>
    </div>
  );
}
