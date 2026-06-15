export type CartLineItem = {
  productId: string;
  name: string;
  brand: string;
  price: number;
  mrp: number;
  size: string;
  img: string;
  qty: number;
  query: string;
  deliveryMin: number;
  tags: string[];
};
