import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger';

// Configure Cloudinary from Environment Variables
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info('Cloudinary configured successfully for media storage.');
} else {
  logger.warn('Cloudinary credentials missing. Operating in fallback mock storage mode.');
}

export class MediaStorageService {
  /**
   * Upload image/document file (supports base64, buffer, or local path)
   */
  public static async uploadFile(
    fileContent: string,
    folder = 'cleanai_uploads',
    options: { publicId?: string; isPrivate?: boolean } = {}
  ): Promise<{ url: string; publicId: string; format: string }> {
    if (!isCloudinaryConfigured) {
      logger.info(`[Cloudinary Fallback] Simulating upload for file to folder: ${folder}`);
      // Generates a mock URL for sandbox/testing purposes
      const mockId = options.publicId || `mock_${Date.now()}`;
      return {
        url: `https://res.cloudinary.com/demo/image/upload/v1570979139/sample.jpg`,
        publicId: `${folder}/${mockId}`,
        format: 'jpg',
      };
    }

    try {
      const response = await cloudinary.uploader.upload(fileContent, {
        folder,
        public_id: options.publicId,
        resource_type: 'auto',
        type: options.isPrivate ? 'authenticated' : 'upload',
        // Auto-optimize transformations
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
          { width: 1200, crop: 'limit' }, // scale limit
        ],
      });

      return {
        url: response.secure_url,
        publicId: response.public_id,
        format: response.format,
      };
    } catch (err: any) {
      logger.error('Cloudinary upload execution failed:', err);
      throw new Error(err.message || 'Media file upload failed.');
    }
  }

  /**
   * Delete file from Cloudinary bucket
   */
  public static async deleteFile(publicId: string): Promise<boolean> {
    if (!isCloudinaryConfigured) {
      logger.info(`[Cloudinary Fallback] Simulating deletion of: ${publicId}`);
      return true;
    }

    try {
      const response = await cloudinary.uploader.destroy(publicId);
      return response.result === 'ok';
    } catch (err: any) {
      logger.error(`Cloudinary deletion failed for public ID ${publicId}:`, err);
      return false;
    }
  }

  /**
   * Generate authenticated signed URL for secure document access
   */
  public static getSignedUrl(publicId: string, ttlSeconds = 3600): string {
    if (!isCloudinaryConfigured) {
      return `https://res.cloudinary.com/demo/image/upload/v1570979139/sample.jpg`;
    }

    return cloudinary.url(publicId, {
      sign_url: true,
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
    });
  }
}
