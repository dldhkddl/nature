import styles from "../preview.module.css";

type ShortcutIconName =
  | "mypage"
  | "orders"
  | "cart"
  | "favorite"
  | "delivery"
  | "support";

const memberShortcuts: ReadonlyArray<{
  label: string;
  href: string;
  icon: ShortcutIconName;
}> = [
  { label: "마이페이지", href: "#mypage", icon: "mypage" },
  { label: "주문조회", href: "#orders", icon: "orders" },
  { label: "장바구니", href: "#cart", icon: "cart" },
  { label: "찜한상품", href: "#favorites", icon: "favorite" },
  { label: "배송조회", href: "#orders", icon: "delivery" },
  { label: "고객센터", href: "#customer-center", icon: "support" },
];

function ShortcutIcon({ name }: { name: ShortcutIconName }) {
  const paths: Record<ShortcutIconName, React.ReactNode> = {
    mypage: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21c.7-4.5 3.2-6.7 7.5-6.7s6.8 2.2 7.5 6.7" />
      </>
    ),
    orders: (
      <>
        <path d="M6 3h12v18H6z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
    cart: (
      <>
        <path d="M3 4h2l2.2 10.2h10.9L21 7H7" />
        <circle cx="9" cy="19" r="1.5" />
        <circle cx="18" cy="19" r="1.5" />
      </>
    ),
    favorite: (
      <path d="M12 21S4 16.3 4 9.8C4 6.6 6 5 8.4 5c1.5 0 2.8.8 3.6 2 .8-1.2 2.1-2 3.6-2C18 5 20 6.6 20 9.8 20 16.3 12 21 12 21Z" />
    ),
    delivery: (
      <>
        <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="19" r="2" />
        <circle cx="17" cy="19" r="2" />
      </>
    ),
    support: (
      <>
        <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
        <path d="M4 13v5h3v-6H5a1 1 0 0 0-1 1ZM20 13v5h-3v-6h2a1 1 0 0 1 1 1Z" />
        <path d="M17 18c0 2-1.7 3-5 3" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export function HeroAccountPanel() {
  return (
    <section
      className={styles.heroAccountPanel}
      data-cafe24-slot="hero-account-panel"
      aria-label="자연섬김 메인 및 회원 바로가기"
    >
      <div
        className={styles.heroArea}
        data-cafe24-slot="hero"
        aria-label="자연섬김 메인 배너"
      >
        <picture>
          <source
            media="(max-width: 640px)"
            srcSet="/nature-seomgim/hero-mobile.png"
          />
          <img
            src="/nature-seomgim/hero-premium-editorial-pc.png"
            alt="산지의 정직함을 가장 품격 있게 전하는 자연섬김 선물세트"
          />
        </picture>
      </div>

      <aside className={styles.memberRail} aria-label="회원 서비스">
        <div className={styles.loginCard} id="login">
          <span>오늘도 자연을 섬기는 장보기</span>
          <h2>자연섬김과 함께 신선한 장보기를 시작하세요</h2>
          <a href="#login">로그인</a>
        </div>

        <nav
          className={styles.memberShortcuts}
          data-cafe24-slot="quick-links"
          aria-label="회원 바로가기"
        >
          {memberShortcuts.map((item) => (
            <a
              key={item.label}
              href={item.href}
              data-member-shortcut={item.icon}
            >
              <ShortcutIcon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>
    </section>
  );
}
