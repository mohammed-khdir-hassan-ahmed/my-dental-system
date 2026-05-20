export type ProductCategory = 'فڵچەی ددان' | 'مەعجون' | string;

export interface Product {
  id: number;
  name: string;
  category: ProductCategory;
  price: number;
  cost: number;
  quantity: number;
  date: string;
  notes?: string;
  createdAt?: string;
}

export interface Sale {
  id: number;
  productId: number;
  productName: string;
  category: ProductCategory;
  price: number;
  quantity: number;
  totalPrice: number;
  profit: number;
  date: string;
  notes?: string;
  createdAt?: string;
}

export const defaultCategories: ProductCategory[] = ['فڵچەی ددان', 'مەعجونی ددان'];
