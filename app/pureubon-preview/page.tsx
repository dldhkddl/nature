import { ProductCard } from "./_components/ProductCard";
import { ProductSection } from "./_components/ProductSection";
import { SiteHeader } from "./_components/SiteHeader";
import {
  dealProducts,
  farmGroups,
  featuredProducts,
  quickLinks,
  trustItems,
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

        <section
          className={styles.brandStory}
          data-cafe24-slot="brand-story"
        >
          <div className={styles.brandStoryCopy}>
            <span className={styles.eyebrow}>자연을 닮은 정직한 먹거리</span>
            <h2>자연섬김 이야기</h2>
            <p>
              좋은 농산물은 좋은 산지에서 시작됩니다. 자연섬김은 생산자의
              정성과 제철의 신선함이 식탁까지 온전히 이어지도록 산지와
              고객을 정직하게 연결합니다.
            </p>
            <a className={styles.storyLink} href="#customer-center">
              자연섬김 더 알아보기
            </a>
          </div>
          <div className={styles.brandStoryVisual}>
            <img
              src="/nature-seomgim/hero-mobile.png"
              alt="자연섬김의 자연과 농산물"
            />
          </div>
        </section>

        <section
          id="shipping-guide"
          className={styles.trustGuide}
          data-cafe24-slot="trust-guide"
        >
          <img
            className={styles.trustTitleImage}
            src="/nature-seomgim/trust-title.png"
            alt=""
            aria-hidden="true"
          />
          <span className={styles.eyebrow}>신선함을 지키는 네 가지 원칙</span>
          <h2>자연섬김이 약속합니다</h2>
          <div className={styles.trustGrid}>
            {trustItems.map((item) => (
              <article className={styles.trustCard} key={item.title}>
                <img
                  src="/nature-seomgim/trust-icon.png"
                  alt=""
                  aria-hidden="true"
                />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer
        id="customer-center"
        className={styles.footer}
        data-cafe24-slot="footer"
      >
        <div className={styles.footerBrand}>
          <strong>자연섬김</strong>
          <p>산지의 신선함을 정직하게 전하는 농산물 전문몰</p>
        </div>
        <div>
          <h2>고객센터</h2>
          <strong className={styles.phone}>상담번호 준비 중</strong>
          <p>평일 09:00–18:00 · 주말 및 공휴일 휴무</p>
        </div>
        <div>
          <h2>배송 · 교환 · 반품 안내</h2>
          <p>
            신선식품 특성상 상품별 배송 일정이 다를 수 있습니다. 교환 및
            반품은 고객센터를 통해 먼저 접수해 주세요.
          </p>
        </div>
        <div className={styles.footerMeta}>
          <p>이용약관 · 개인정보처리방침 · 사업자정보확인</p>
          <p>© 자연섬김. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
