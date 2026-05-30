export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'customer' | 'vendor' | 'admin';
  superAdmin?: boolean;
  createdAt: any;
  updatedAt: any;
  vendorId?: string;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface Vendor {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  ownerUid: string;
  stripeAccountId: string;
  status: 'pending' | 'approved' | 'suspended';
  rating: number;
  reviewsCount: number;
  createdAt: any;
}

export interface ProductImage {
  publicId: string;
  url: string;
  thumbnailUrl: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number; // In cents
  salePrice?: number; // In cents
  images: ProductImage[];
  category: string;
  tags: string[];
  stock: number;
  vendorId: string;
  vendorName: string;
  status: 'draft' | 'active' | 'out-of-stock';
  averageRating: number;
  reviewsCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  price: number; // In cents at purchase
  vendorId: string;
  image: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number; // In cents
  stripePaymentIntentId: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: UserProfile['shippingAddress'];
  createdAt: any;
  updatedAt: any;
}
