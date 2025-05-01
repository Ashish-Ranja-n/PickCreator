import { uploadUrl } from './uploadMedia';

/**
 * Interface for Instagram media item
 */
interface InstagramMediaItem {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  children?: {
    data: {
      id: string;
      media_type: 'IMAGE' | 'VIDEO';
      media_url: string;
      thumbnail_url?: string;
    }[];
  };
}

/**
 * Interface for Instagram media response
 */
interface InstagramMediaResponse {
  data: InstagramMediaItem[];
  paging: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

/**
 * Fetch media from Instagram Graph API
 * @param accessToken - Instagram Graph API access token
 * @param limit - Number of media items to fetch
 * @returns Promise with Instagram media data
 */
export const fetchInstagramMedia = async (
  accessToken: string,
  limit: number = 25
): Promise<InstagramMediaItem[]> => {
  try {
    const url = `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,children{id,media_type,media_url,thumbnail_url}&limit=${limit}&access_token=${accessToken}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch Instagram media');
    }
    
    const data: InstagramMediaResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching Instagram media:', error);
    throw error;
  }
};

/**
 * Import Instagram media to Cloudinary
 * @param mediaItems - Array of Instagram media items
 * @returns Promise with array of uploaded media results
 */
export const importInstagramMediaToCloudinary = async (
  mediaItems: InstagramMediaItem[]
) => {
  try {
    const uploadPromises = mediaItems.map(async (item) => {
      // For carousel albums, upload each child item
      if (item.media_type === 'CAROUSEL_ALBUM' && item.children?.data) {
        const childUploads = await Promise.all(
          item.children.data.map(async (child) => {
            const mediaUrl = child.media_url;
            const result = await uploadUrl(mediaUrl, 'instagram', child.id);
            return {
              instagramId: child.id,
              mediaType: child.media_type,
              cloudinaryUrl: result.url,
              cloudinaryPublicId: result.publicId,
              resourceType: result.resourceType,
              originalUrl: mediaUrl,
              caption: item.caption,
              timestamp: item.timestamp,
              permalink: item.permalink,
            };
          })
        );
        return {
          instagramId: item.id,
          mediaType: item.media_type,
          children: childUploads,
          caption: item.caption,
          timestamp: item.timestamp,
          permalink: item.permalink,
        };
      }
      
      // For single image or video, upload directly
      const mediaUrl = item.media_url;
      const result = await uploadUrl(mediaUrl, 'instagram', item.id);
      return {
        instagramId: item.id,
        mediaType: item.media_type,
        cloudinaryUrl: result.url,
        cloudinaryPublicId: result.publicId,
        resourceType: result.resourceType,
        originalUrl: mediaUrl,
        caption: item.caption,
        timestamp: item.timestamp,
        permalink: item.permalink,
      };
    });
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error importing Instagram media to Cloudinary:', error);
    throw error;
  }
}; 