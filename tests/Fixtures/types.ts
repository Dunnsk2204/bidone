// fixtures/types.ts

export interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  imageUrl: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  subtotal: number;
  gst: number;
  total: number;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  gst: number;
  total: number;
  customer: OrderCustomer;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderCustomer {
  name: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
}

export interface OrdersResponse {
  count: number;
  items: Order[];
}

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export interface AuthedUser extends TestUser {
  token: string;
  id: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: never;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ErrorResponse {
  error: string;
}