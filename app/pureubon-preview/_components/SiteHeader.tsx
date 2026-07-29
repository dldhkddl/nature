import { navItems } from "../content";
import styles from "../preview.module.css";

export function SiteHeader() {
  return (
    <header className={styles.siteHeader} data-cafe24-slot="header">
      <div className={styles.utility}>
        <span>자연을 담은 산지직송 농산물</span>
        <nav aria-label="회원 메뉴">
          <a href="#signup">회원가입</a>
          <a href="#login">로그인</a>
          <a href="#orders">주문조회</a>
          <a href="#customer-center">고객센터</a>
        </nav>
      </div>

      <div className={styles.headerMain}>
        <a className={styles.logo} href="#top" aria-label="오늘도자연섬김 홈">
          <img src="/nature-seomgim/logo.png" alt="오늘도자연섬김" />
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
          <a href="#mypage">마이페이지</a>
          <a href="#cart">장바구니</a>
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
