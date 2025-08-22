// utils/uploadUtils.ts
import { presignUploadSingle, presignUploadBatch } from '@/lib/presign';

export const uploadFile = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<{ publicUrl: string }> => {
  const presign = await presignUploadSingle(file.name, file.type);

  const putRes = await new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presign.uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };
    
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onload = () => {
      const status = xhr.status;
      const statusText = xhr.statusText;
      const headers = new Headers();
      const res = new Response(xhr.response, { status, statusText, headers });
      resolve(res);
    };
    
    xhr.onabort = () => reject(new Error('Upload aborted'));
    xhr.send(file);
  });
  
  if (!putRes.ok) throw new Error('Direct upload to storage failed');
  return { publicUrl: presign.publicUrl };
};

export const uploadHLSFiles = async (
  files: Array<{ name: string; type: string; data: Uint8Array }>,
  onProgress: (progress: number) => void
): Promise<{ playlistPublicUrl: string }> => {
  const presign = await presignUploadBatch(
    'HLS recording',
    files.map(f => ({ name: f.name, contentType: f.type }))
  );

  const nameToUploadUrl = new Map<string, string>(
    presign.files.map((f: any) => [f.name, f.uploadUrl])
  );
  
  let uploadedBytes = 0;
  const totalBytes = files.reduce((sum, file) => sum + file.data.byteLength, 0);
  
  for (const f of files) {
    const uploadUrl = nameToUploadUrl.get(f.name);
    if (!uploadUrl) throw new Error(`Missing upload URL for ${f.name}`);

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', f.type);
      const arrayBuffer = f.data.buffer.slice(
        f.data.byteOffset,
        f.data.byteOffset + f.data.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: f.type });
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const currentFileUploaded = e.loaded;
          const otherBytes = uploadedBytes;
          const percent = Math.round(((otherBytes + currentFileUploaded) / totalBytes) * 100);
          onProgress(percent);
        }
      };
      
      xhr.onerror = () => reject(new Error(`Network error during upload of ${f.name}`));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          uploadedBytes += f.data.byteLength;
          onProgress(Math.round((uploadedBytes / totalBytes) * 100));
          resolve();
        } else {
          reject(new Error(`Failed to upload ${f.name}`));
        }
      };
      
      xhr.onabort = () => reject(new Error(`Upload of ${f.name} aborted`));
      xhr.send(blob);
    });
  }

  return { playlistPublicUrl: presign.playlistPublicUrl };
};