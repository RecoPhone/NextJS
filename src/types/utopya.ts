export type UtopyaItem = {
  sku?: string | null;
  name: string | null;
  price: string | null;   // ex "€ 199,00"
  capacity?: string | null; // ex "128 GB"
  grade?: string | null;    // ex "A", "B", ...
  state?: string | null;    // ex "Reconditionné"
  stock?: string | null;    // ex "En stock", "Rupture"
  url?: string | null;      // lien fournisseur
  image?: string | null;
  scraped_at?: number;
};

export type UtopyaPayload = {
  count: number;
  items: UtopyaItem[];
};
