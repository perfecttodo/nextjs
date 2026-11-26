import { put, del, list } from '@vercel/blob';
import { NextRequest } from 'next/server';

export interface BlobUploadResult {
  url: string;
  blobId: string;
}

export async function uploadAudioFile(
  file: File,
  filename: string
): Promise<BlobUploadResult> {
  try {
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return {
      url: blob.url,
      blobId: blob.pathname,
    };
  } catch (error) {
    console.error('Error uploading file to blob:', error);
    throw new Error('Failed to upload file');
  }
}

export async function deleteAudioFile(blobId: string): Promise<void> {
  try {
    await del(blobId);
  } catch (error) {
    console.error('Error deleting file from blob:', error);
    throw new Error('Failed to delete file');
  }
}

export async function listAudioFiles(prefix?: string) {
  try {
    const { blobs } = await list({ prefix });
    return blobs;
  } catch (error) {
    console.error('Error listing files from blob:', error);
    throw new Error('Failed to list files');
  }
}
