import { Request, Response, NextFunction } from 'express';
import '../../middleware/tenant';
import { GalleryService } from '../../services/gallery.service';
import { extractReqMeta } from '../../services/audit.service';
import { AppError } from '../../middleware/error';
import { prisma } from '../../config/database';

/**
 * Admin: List all Collections
 * GET /api/admin/gallery/collections
 */
export async function getAdminCollectionsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const collections = await GalleryService.getAdminCollections(req.userContext!.organizationId);
    res.status(200).json(collections);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Get Collection Details By ID
 * GET /api/admin/gallery/collections/:id
 */
export async function getAdminCollectionByIdController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const collection = await GalleryService.getAdminCollectionById(req.userContext!.organizationId, id);
    res.status(200).json(collection);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Create Collection
 * POST /api/admin/gallery/collections
 */
export async function createCollectionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const reqMeta = extractReqMeta(req);
    const collection = await GalleryService.createCollection({ ...req.body, organizationId: req.userContext!.organizationId }, user.id, reqMeta);
    res.status(201).json(collection);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Update Collection
 * PUT /api/admin/gallery/collections/:id
 */
export async function updateCollectionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const reqMeta = extractReqMeta(req);
    const collection = await GalleryService.updateCollection(req.userContext!.organizationId, id, req.body, user.id, reqMeta);
    res.status(200).json(collection);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Delete Collection
 * DELETE /api/admin/gallery/collections/:id
 */
export async function deleteCollectionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const reqMeta = extractReqMeta(req);
    const result = await GalleryService.deleteCollection(req.userContext!.organizationId, id, user.id, reqMeta);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Publish Collection
 * POST /api/admin/gallery/collections/:id/publish
 */
export async function publishCollectionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const reqMeta = extractReqMeta(req);
    const collection = await GalleryService.setPublishStatus(req.userContext!.organizationId, id, true, user.id, reqMeta);
    res.status(200).json(collection);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Unpublish Collection
 * POST /api/admin/gallery/collections/:id/unpublish
 */
export async function unpublishCollectionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const reqMeta = extractReqMeta(req);
    const collection = await GalleryService.setPublishStatus(req.userContext!.organizationId, id, false, user.id, reqMeta);
    res.status(200).json(collection);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Upload Images to Collection
 * POST /api/admin/gallery/collections/:id/images
 */
export async function uploadCollectionImagesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const reqMeta = extractReqMeta(req);

    const files = req.files as Express.Multer.File[] | undefined;
    const file = req.file;

    const fileList: Express.Multer.File[] = files && files.length > 0 ? files : file ? [file] : [];

    if (fileList.length === 0) {
      throw new AppError('No image files provided for upload.', 400);
    }

    const uploadedImages = await GalleryService.uploadImages(req.userContext!.organizationId, id, fileList, user.id, reqMeta);
    res.status(201).json(uploadedImages);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Delete Image
 * DELETE /api/admin/gallery/images/:id
 */
export async function deleteImageController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const reqMeta = extractReqMeta(req);
    const result = await GalleryService.deleteImage(req.userContext!.organizationId, id, user.id, reqMeta);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Update Image Metadata
 * PUT /api/admin/gallery/images/:id
 */
export async function updateImageController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const reqMeta = extractReqMeta(req);
    const updated = await GalleryService.updateImage(req.userContext!.organizationId, id, req.body, user.id, reqMeta);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Reorder Images
 * POST /api/admin/gallery/images/reorder
 */
export async function reorderImagesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const reqMeta = extractReqMeta(req);
    const { items } = req.body;
    const result = await GalleryService.reorderImages(req.userContext!.organizationId, items, user.id, reqMeta);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Public: Get Published Collections
 * GET /api/gallery/collections
 */
export async function getPublicCollectionsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const proposedSlug = req.headers['x-organization-slug'] as string;
    const proposedId = req.headers['x-organization-id'] as string;

    let orgId: string | undefined = proposedId;
    if (!orgId && proposedSlug) {
      const org = await prisma.organization.findUnique({
        where: { slug: proposedSlug }
      });
      orgId = org?.id;
    }

    if (!orgId) {
      orgId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    }

    const collections = await GalleryService.getPublicCollections(orgId);
    res.status(200).json(collections);
  } catch (error) {
    next(error);
  }
}

/**
 * Public: Get Published Collection by Slug
 * GET /api/gallery/collections/:slug
 */
export async function getPublicCollectionBySlugController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { slug } = req.params;
    const proposedSlug = req.headers['x-organization-slug'] as string;
    const proposedId = req.headers['x-organization-id'] as string;

    let orgId: string | undefined = proposedId;
    if (!orgId && proposedSlug) {
      const org = await prisma.organization.findUnique({
        where: { slug: proposedSlug }
      });
      orgId = org?.id;
    }

    if (!orgId) {
      orgId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    }

    const result = await GalleryService.getPublicCollectionBySlug(orgId, slug);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
