'use server';

import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

export async function uploadLogo(file: File): Promise<{success: boolean, url?: string, error?: string}> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const error = "Vercel Blob için BLOB_READ_WRITE_TOKEN ortam değişkeni ayarlanmamış.";
    console.error(error);
    return { success: false, error };
  }

  try {
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: false, // We use nanoid to create a unique name
      pathname: `logos/${nanoid()}-${file.name}`,
    });
    return { success: true, url: blob.url };
  } catch (e: any) {
    console.error("Vercel Blob'a yükleme hatası:", e);
    return { success: false, error: e.message || "Dosya yüklenirken sunucuda bir hata oluştu." };
  }
}
