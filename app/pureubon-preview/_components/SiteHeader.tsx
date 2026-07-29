import { navItems } from "../content";
import styles from "../preview.module.css";

type HeaderIconName = "products" | "mypage" | "cart" | "support";

function HeaderIcon({ name }: { name: HeaderIconName }) {
  const paths: Record<HeaderIconName, React.ReactNode> = {
    products: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    mypage: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21c.7-4.5 3.2-6.7 7.5-6.7s6.8 2.2 7.5 6.7" />
      </>
    ),
    cart: (
      <>
        <path d="M3 4h2l2.2 10.2h10.9L21 7H7" />
        <circle cx="9" cy="19" r="1.5" />
        <circle cx="18" cy="19" r="1.5" />
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

export function SiteHeader() {
  return (
    <header className={styles.siteHeader} data-cafe24-slot="header">
      <div className={styles.utility}>
        <span>자연을 담은 산지직송 농산물</span>
        <nav aria-label="회원 메뉴">
          <a href="#signup">회원가입</a>
          <a href="#login">로그인</a>
        </nav>
      </div>

      <div className={styles.headerMain}>
        <a className={styles.logo} href="#top" aria-label="오늘도자연섬김 홈">
          <img
            src="/nature-seomgim/logo-transparent.png"
            alt="오늘도자연섬김"
          />
        </a>

        <form className={styles.search} role="search" action="#all-products">
          <label className={styles.srOnly} htmlFor="pureubon-search">
            상품 검색
          </label>
          <input
            id="pureubon-search"
            type="search"
            placeholder="상품을 검색해 보세요"
          />
          <button type="submit">검색</button>
        </form>

        <div className={styles.accountLinks}>
          <a href="#all-products">
            <HeaderIcon name="products" />
            <span>전체상품</span>
          </a>
          <a href="#mypage">
            <HeaderIcon name="mypage" />
            <span>마이페이지</span>
          </a>
          <a href="#cart">
            <HeaderIcon name="cart" />
            <span>장바구니</span>
          </a>
          <a href="#customer-center">
            <HeaderIcon name="support" />
            <span>고객센터</span>
          </a>
        </div>
      </div>

      <nav
        className={styles.categoryNav}
        data-cafe24-slot="category"
        aria-label="상품 분류"
      >
        {navItems.map((item) => (
          <a key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
