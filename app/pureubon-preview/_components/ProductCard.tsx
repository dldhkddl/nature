import type { ProductPreview } from "../content";
import styles from "../preview.module.css";

export function ProductCard({ product }: { product: ProductPreview }) {
  return (
    <article
      className={styles.productCard}
      data-preview-product={product.id}
    >
      <a
        href={`#product-${product.id}`}
        aria-label={`${product.name} 상세 보기`}
      >
        <div className={styles.productImage}>
          <img src={product.image} alt="" />
          {product.badge ? <span>{product.badge}</span> : null}
        </div>
        <div className={styles.productBody}>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <strong>{product.priceLabel}</strong>
        </div>
      </a>
    </article>
  );
}
