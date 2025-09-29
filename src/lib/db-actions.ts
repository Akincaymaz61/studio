'use server';

import { kv } from '@vercel/kv';
import { DbData, dbDataSchema } from './schema';

const DB_KEY = 'teklifai-db';

const initialData: DbData = {
  quotes: [],
  customers: [],
  companyProfiles: [],
};

/**
 * Vercel KV'den tüm veriyi okur.
 * @returns {Promise<DbData>} Veritabanı içeriği
 */
export async function getDbData(): Promise<DbData> {
  try {
    const data = await kv.get(DB_KEY);

    if (!data) {
      console.log("Vercel KV'de veri bulunamadı, başlangıç verisi döndürülüyor.");
      return initialData;
    }
    
    // KV'den gelen veri JSON nesnesi olabilir, parse'a gerek yok.
    const record = data as DbData;
    
    // Tarih alanlarını Date nesnesine çevir
    if (record.quotes) {
        record.quotes.forEach((quote: any) => {
            if (quote.quoteDate) quote.quoteDate = new Date(quote.quoteDate);
            if (quote.validUntil) quote.validUntil = new Date(quote.validUntil);
            if (quote.updatedAt) quote.updatedAt = new Date(quote.updatedAt);
        });
    }

    const validatedData = dbDataSchema.safeParse(record);
    if(validatedData.success) {
        return validatedData.data;
    } else {
        console.error('KV verisi Zod şemasıyla uyuşmuyor:', validatedData.error);
        return initialData;
    }

  } catch (error) {
    console.error('Vercel KV\'den veri okunurken hata oluştu:', error);
    // Hata durumunda uygulamanın çökmemesi için başlangıç verisini döndür
    return initialData;
  }
}

/**
 * Gelen veriyi Vercel KV'ye yazar.
 * @param {DbData} data Kaydedilecek tüm veritabanı objesi
 */
export async function saveDbData(data: DbData): Promise<void> {
  try {
    // @vercel/kv kütüphanesi Date nesnelerini otomatik olarak JSON'a çevirir.
    // Bu yüzden burada tekrar parse etmeye gerek yok, bu hataya neden oluyordu.
    await kv.set(DB_KEY, data);
  } catch (error) {
     console.error('Veri Vercel KV\'ye yazılırken hata oluştu:', error);
     throw new Error('Veri kaydedilemedi.');
  }
}
