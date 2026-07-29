import type { ProductPreview } from "../content";
import styles from "../preview.module.css";
import { ProductCard } from "./ProductCard";

type ProductSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  products: readonly ProductPreview[];
  tone?: "default" | "beige";
};

export function ProductSection({
  id,
  eyebrow,
  title,
  description,
  products,
  tone = "default",
}: ProductSectionProps) {
  return (
    <section
      id={id}
      className={`${styles.productSection} ${
        tone === "beige" ? styles.beigeSection : ""
      }`}
    >
      <div className={styles.sectionHeading}>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className={styles.productGrid}>
        {products.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}
