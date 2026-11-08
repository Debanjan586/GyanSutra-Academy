import { v2 as cloudinary } from 'cloudinary';
import ImageKit from 'imagekit';

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

let imagekit = null;
if (process.env.IMAGEKIT_PUBLIC_KEY) {
  imagekit = new ImageKit({
    publicKey:   process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey:  process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
}

export async function uploadToCloud(fileBuffer, originalName) {
  const provider = process.env.IMAGE_PROVIDER || 'cloudinary';

  if (provider === 'imagekit') {
    if (!imagekit) throw new Error('ImageKit is not configured in .env');
    const result = await imagekit.upload({
      file:     fileBuffer.toString('base64'),
      fileName: originalName,
      folder:   '/gyansutra/courses',
    });
    return result.url;
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('Cloudinary is not configured in .env');
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'gyansutra/courses', resource_type: 'image' },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.end(fileBuffer);
  });
  return result.secure_url;
}