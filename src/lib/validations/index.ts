import { z } from 'zod';

export const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be greater than 0'),
  salePrice: z.number().nonnegative().optional(),
  category: z.string().min(2, 'Category must be selected'),
  tags: z.array(z.string()).default([]),
  stock: z.number().int().nonnegative('Stock must be 0 or greater'),
  status: z.enum(['draft', 'active', 'out-of-stock']).default('active'),
  images: z.array(
    z.object({
      publicId: z.string(),
      url: z.string().url('Invalid image URL'),
      thumbnailUrl: z.string().url('Invalid thumbnail URL'),
    })
  ).min(1, 'At least one product image is required'),
});

export const shippingAddressSchema = z.object({
  customerName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(7, 'Phone number is required'),
  line1: z.string().min(5, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(4, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
});

export const vendorRegistrationSchema = z.object({
  name: z.string().min(3, 'Business name must be at least 3 characters'),
  description: z.string().min(15, 'Business description must be at least 15 characters'),
  logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type ShippingAddressValues = z.infer<typeof shippingAddressSchema>;
export type VendorFormValues = z.infer<typeof vendorRegistrationSchema>;
