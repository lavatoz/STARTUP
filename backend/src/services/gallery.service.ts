import { prisma } from '../config/database';
import { AppError } from '../middleware/error';
import { uploadAndVerifyPublicFile, getOrCreateFolder } from './google-drive.service';
import { env } from '../config/env';
import { logAudit } from './audit.service';
import crypto from 'crypto';
import path from 'path';

/**
 * Utility function to convert a title to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export interface CreateCollectionDTO {
  organizationId: string;
  title: string;
  slug?: string;
  description?: string;
  category: string;
  heroImage?: string;
  coverImage?: string;
  displayOrder?: number;
  isPublished?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateCollectionDTO {
  title?: string;
  slug?: string;
  description?: string;
  category?: string;
  heroImage?: string;
  coverImage?: string;
  displayOrder?: number;
  isPublished?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateImageDTO {
  caption?: string;
  altText?: string;
  displayOrder?: number;
  isFeatured?: boolean;
}

export class GalleryService {
  /**
   * Create a new Gallery Collection
   */
  static async createCollection(data: CreateCollectionDTO, userId?: string, reqMeta?: any) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.title);

    // Check slug uniqueness within organization
    const existing = await prisma.galleryCollection.findFirst({
      where: { slug, organizationId: data.organizationId },
    });
    if (existing) {
      throw new AppError(`A collection with slug "${slug}" already exists.`, 400);
    }

    const collection = await prisma.galleryCollection.create({
      data: {
        organizationId: data.organizationId,
        title: data.title,
        slug,
        description: data.description || null,
        category: data.category,
        heroImage: data.heroImage || null,
        coverImage: data.coverImage || null,
        displayOrder: data.displayOrder ?? 0,
        isPublished: !!data.isPublished,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
      },
    });

    await logAudit({
      userId,
      organizationId: data.organizationId,
      action: 'COLLECTION_CREATED',
      details: { collectionId: collection.id, title: collection.title, slug: collection.slug },
      ...reqMeta,
    });

    return collection;
  }

  /**
   * Update an existing Gallery Collection
   */
  static async updateCollection(organizationId: string, id: string, data: UpdateCollectionDTO, userId?: string, reqMeta?: any) {
    const existing = await prisma.galleryCollection.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new AppError('Gallery collection not found.', 404);
    }

    let slug = existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      slug = slugify(data.slug);
      const slugConflict = await prisma.galleryCollection.findFirst({
        where: { slug, organizationId, NOT: { id } },
      });
      if (slugConflict) {
        throw new AppError(`A collection with slug "${slug}" already exists.`, 400);
      }
    }

    const updated = await prisma.galleryCollection.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        slug,
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.heroImage !== undefined ? { heroImage: data.heroImage || null } : {}),
        ...(data.coverImage !== undefined ? { coverImage: data.coverImage || null } : {}),
        ...(data.displayOrder !== undefined ? { displayOrder: data.displayOrder } : {}),
        ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
        ...(data.seoTitle !== undefined ? { seoTitle: data.seoTitle || null } : {}),
        ...(data.seoDescription !== undefined ? { seoDescription: data.seoDescription || null } : {}),
      },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    await logAudit({
      userId,
      organizationId,
      action: 'COLLECTION_UPDATED',
      details: { collectionId: updated.id, title: updated.title, changes: data },
      ...reqMeta,
    });

    return updated;
  }

  /**
   * Delete a Gallery Collection
   */
  static async deleteCollection(organizationId: string, id: string, userId?: string, reqMeta?: any) {
    const collection = await prisma.galleryCollection.findFirst({
      where: { id, organizationId },
      include: { images: true },
    });
    if (!collection) {
      throw new AppError('Gallery collection not found.', 404);
    }

    // Cascade delete from database
    await prisma.galleryCollection.delete({
      where: { id },
    });

    await logAudit({
      userId,
      organizationId,
      action: 'COLLECTION_DELETED',
      details: { collectionId: id, title: collection.title },
      ...reqMeta,
    });

    return { success: true, message: 'Collection deleted successfully.' };
  }

  /**
   * Set Publish Status (Publish / Unpublish)
   */
  static async setPublishStatus(organizationId: string, id: string, isPublished: boolean, userId?: string, reqMeta?: any) {
    const existing = await prisma.galleryCollection.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new AppError('Gallery collection not found.', 404);
    }

    const updated = await prisma.galleryCollection.update({
      where: { id },
      data: { isPublished },
    });

    await logAudit({
      userId,
      organizationId,
      action: 'PUBLISH_STATUS_CHANGED',
      details: { collectionId: id, title: existing.title, isPublished },
      ...reqMeta,
    });

    return updated;
  }

  /**
   * Get all collections for Admin Dashboard
   */
  static async getAdminCollections(organizationId: string) {
    return await prisma.galleryCollection.findMany({
      where: { organizationId },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { images: true },
        },
      },
    });
  }

  /**
   * Get Collection details by ID for Admin Dashboard
   */
  static async getAdminCollectionById(organizationId: string, id: string) {
    const collection = await prisma.galleryCollection.findFirst({
      where: { id, organizationId },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
    if (!collection) {
      throw new AppError('Gallery collection not found.', 404);
    }
    return collection;
  }

  /**
   * Upload Images to Collection using Google Drive
   */
  static async uploadImages(
    organizationId: string,
    collectionId: string,
    files: Express.Multer.File[],
    userId?: string,
    reqMeta?: any
  ) {
    const collection = await prisma.galleryCollection.findFirst({
      where: { id: collectionId, organizationId },
    });
    if (!collection) {
      throw new AppError('Gallery collection not found.', 404);
    }

    if (!files || files.length === 0) {
      throw new AppError('No image files provided.', 400);
    }

    // Get root Google Drive folder for Website Gallery -> Collections -> {collection.slug}
    const rootFolderId = env.GOOGLE_DRIVE_FOLDER_ID;
    const galleryFolderId = await getOrCreateFolder('Website Gallery', rootFolderId);
    const collectionsFolderId = await getOrCreateFolder('Collections', galleryFolderId);
    const targetFolderId = await getOrCreateFolder(collection.slug, collectionsFolderId);

    // Get current max display order
    const maxOrderAgg = await prisma.galleryImage.aggregate({
      where: { collectionId },
      _max: { displayOrder: true },
    });
    let currentOrder = (maxOrderAgg._max.displayOrder ?? 0) + 1;

    const createdImages = [];

    for (const file of files) {
      const originalExt = path.extname(file.originalname) || '';
      let ext = originalExt.toLowerCase();
      if (!ext || ext === '.') {
        if (file.mimetype === 'image/png') ext = '.png';
        else if (file.mimetype === 'image/webp') ext = '.webp';
        else ext = '.jpg';
      }
      const filename = `${crypto.randomUUID()}-${Date.now()}${ext}`;

      const uploadRes = await uploadAndVerifyPublicFile(
        file.buffer,
        filename,
        file.mimetype,
        targetFolderId,
        `[Gallery Image Upload ${filename}]`
      );

      const image = await prisma.galleryImage.create({
        data: {
          collectionId,
          imageUrl: uploadRes.url,
          thumbnailUrl: uploadRes.url,
          displayOrder: currentOrder++,
          altText: collection.title,
        },
      });

      createdImages.push(image);
    }

    // Auto-populate heroImage and coverImage if currently null
    if (!collection.heroImage || !collection.coverImage) {
      const firstUrl = createdImages[0]?.imageUrl;
      if (firstUrl) {
        await prisma.galleryCollection.update({
          where: { id: collectionId },
          data: {
            heroImage: collection.heroImage || firstUrl,
            coverImage: collection.coverImage || firstUrl,
          },
        });
      }
    }

    await logAudit({
      userId,
      organizationId,
      action: 'IMAGES_UPLOADED',
      details: { collectionId, count: createdImages.length },
      ...reqMeta,
    });

    return createdImages;
  }

  /**
   * Delete an Image from Collection
   */
  static async deleteImage(organizationId: string, imageId: string, userId?: string, reqMeta?: any) {
    const image = await prisma.galleryImage.findUnique({
      where: { id: imageId },
      include: { collection: true },
    });
    if (!image || image.collection.organizationId !== organizationId) {
      throw new AppError('Gallery image not found.', 404);
    }

    await prisma.galleryImage.delete({
      where: { id: imageId },
    });

    await logAudit({
      userId,
      organizationId,
      action: 'IMAGE_DELETED',
      details: { imageId, collectionId: image.collectionId },
      ...reqMeta,
    });

    return { success: true, message: 'Image deleted successfully.' };
  }

  /**
   * Update Image Metadata
   */
  static async updateImage(organizationId: string, imageId: string, data: UpdateImageDTO, _userId?: string, _reqMeta?: any) {
    const existing = await prisma.galleryImage.findUnique({
      where: { id: imageId },
      include: { collection: true },
    });
    if (!existing || existing.collection.organizationId !== organizationId) {
      throw new AppError('Gallery image not found.', 404);
    }

    const updated = await prisma.galleryImage.update({
      where: { id: imageId },
      data: {
        ...(data.caption !== undefined ? { caption: data.caption || null } : {}),
        ...(data.altText !== undefined ? { altText: data.altText || null } : {}),
        ...(data.displayOrder !== undefined ? { displayOrder: data.displayOrder } : {}),
        ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
      },
    });

    return updated;
  }

  /**
   * Reorder Images (Bulk displayOrder update)
   */
  static async reorderImages(organizationId: string, items: Array<{ id: string; displayOrder: number }>, _userId?: string, _reqMeta?: any) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Items array is required for reordering.', 400);
    }

    const imageIds = items.map((i) => i.id);
    const count = await prisma.galleryImage.count({
      where: {
        id: { in: imageIds },
        collection: { organizationId },
      },
    });

    if (count !== items.length) {
      throw new AppError('Unauthorized access to some gallery images.', 403);
    }

    const updatePromises = items.map((item) =>
      prisma.galleryImage.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder },
      })
    );

    await prisma.$transaction(updatePromises);

    return { success: true, message: 'Image display order updated successfully.' };
  }

  /**
   * Public: Get Published Collections
   */
  static async getPublicCollections(organizationId: string) {
    return await prisma.galleryCollection.findMany({
      where: { organizationId, isPublished: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 10,
        },
      },
    });
  }

  /**
   * Public: Get Collection Details By Slug
   */
  static async getPublicCollectionBySlug(organizationId: string, slug: string) {
    const collection = await prisma.galleryCollection.findFirst({
      where: { organizationId, slug, isPublished: true },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!collection) {
      throw new AppError('Gallery collection not found or not published.', 404);
    }

    // Get related published collections (up to 4 in same category or general)
    const relatedCollections = await prisma.galleryCollection.findMany({
      where: {
        organizationId,
        isPublished: true,
        id: { not: collection.id },
        category: collection.category,
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      take: 4,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        heroImage: true,
        coverImage: true,
        description: true,
      },
    });

    return {
      collection,
      relatedCollections,
      seo: {
        title: collection.seoTitle || collection.title,
        description: collection.seoDescription || collection.description || `View gallery for ${collection.title}`,
      },
    };
  }
}
