import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Check if credentials exist, otherwise load mock configuration
const hasCredentials = 
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

export async function GET() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'glimore_presets';

  if (!hasCredentials) {
    // Generate an elegant simulated signature to bypass Cloudinary calls in local dev
    return NextResponse.json({
      signature: 'mock-cloudinary-signature',
      timestamp,
      apiKey: 'mock-cloudinary-api-key',
      uploadPreset,
      cloudName: 'glimore-style-mock',
      isMock: true
    });
  }

  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const paramsToSign = {
    timestamp,
    folder: 'glimore-style-products',
    upload_preset: uploadPreset,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    uploadPreset,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    isMock: false
  });
}
