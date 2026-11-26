import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command,DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { NextRequest } from 'next/server';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configure the S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  },
});

export interface BlobUploadResult {
  url: string;
  blobId: string;
}

export async function uploadAudioFile(
  file: File,
  filename: string
): Promise<BlobUploadResult> {
  try {
    const fileBuffer = await file.arrayBuffer();
    //const randomSuffix = Math.random().toString(36).substring(2, 8);
    const key = `${filename}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
        Body: Buffer.from(fileBuffer),
        ContentType: file.type,
      })
    );

    const publicUrl = `https://${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${key}`;

    return {
      url: publicUrl,
      blobId: key,
    };
  } catch (error) {
    console.error('Error uploading file to R2:', error);
    throw new Error('Failed to upload file');
  }
}

export async function deleteAudioFile(key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    throw new Error('Failed to delete file');
  }
}

export async function listAudioFiles(prefix?: string) {
  try {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Prefix: prefix,
      })
    );

    return response.Contents?.map(item => ({
      key: item.Key,
      url: `https://${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${item.Key}`,
      size: item.Size,
      lastModified: item.LastModified,
    })) || [];
  } catch (error) {
    console.error('Error listing files from R2:', error);
    throw new Error('Failed to list files');
  }
}

export async function generatePresignedUploadUrl(fileKey:string, contentType?: string) {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // URL valid for 1 hour (in seconds)
    });

    console.log("Presigned URL for upload:", signedUrl);
    return {fileKey,signedUrl};
  } catch (error) {
    console.error("Error generating presigned URL:", error);
  }
}

export async function deleteAllAudioFiles(): Promise<void> {
  try {
    let isTruncated = true;
    let continuationToken: string | undefined;

    while (isTruncated) {
      const listParams = {
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        ContinuationToken: continuationToken,
      };

      const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));

      if (listedObjects.Contents && listedObjects.Contents.length > 0) {
        // Create array of delete promises
        const deletePromises = listedObjects.Contents
          .filter(object => object.Key)
          .map(object => 
            s3Client.send(new DeleteObjectCommand({
              Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
              Key: object.Key!,
            }))
          );

        // Execute all delete operations in parallel
        await Promise.all(deletePromises);
        console.log(`Deleted ${listedObjects.Contents.length} objects.`);
      }

      isTruncated = listedObjects.IsTruncated || false;
      continuationToken = listedObjects.NextContinuationToken;
    }
    
    console.log('All audio files deleted successfully.');
  } catch (error) {
    console.error('Error deleting all audio files:', error);
    throw new Error('Failed to delete all files');
  }
}
