import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'glimore-style',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock-api-secret',
  secure: true,
});

export default cloudinary;
