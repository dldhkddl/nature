import { SiteHeader } from "./_components/SiteHeader";
import { quickLinks } from "./content";
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
      </main>
    </div>
  );
}
