export type PresignSingleResponse = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
};

export type PresignBatchFile = { name: string; contentType?: string };
export type PresignBatchResponse = {
  baseFolder: string;
  files: Array<{ name: string; key: string; uploadUrl: string; publicUrl: string }>;
  playlistPublicUrl?: string | null;
};

export async function presignUploadSingle(filename: string, contentType?: string): Promise<PresignSingleResponse> {
  const res = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get presigned URL');
  return data as PresignSingleResponse;
}

export async function presignUploadBatch(title: string, files: PresignBatchFile[]): Promise<PresignBatchResponse> {
  const res = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, files })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get presigned URLs');
  return data as PresignBatchResponse;
}


