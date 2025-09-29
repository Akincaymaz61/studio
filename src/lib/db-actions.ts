'use server';

import { DbData, dbDataSchema } from './schema';

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
const BIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

const initialData: DbData = {
  quotes: [],
  customers: [],
  companyProfiles: [],
};

async function checkEnvVariables() {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) {
        throw new Error('JSONBIN_API_KEY ve JSONBIN_BIN_ID ortam değişkenleri ayarlanmamış. Lütfen README.md dosyasını kontrol edin.');
    }
}


export async function getDbData(): Promise<DbData> {
  await checkEnvVariables();
  
  try {
    const response = await fetch(`${BIN_URL}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_API_KEY!,
      },
      cache: 'no-store', // Verinin her zaman en güncel halini al
    });

    if (!response.ok) {
        // Eğer bin bulunamazsa (404), başlangıç verisini döndür
        if(response.status === 404) {
            console.warn("JSONBin.io üzerinde belirtilen ID ile bir bin bulunamadı. Başlangıç verisi kullanılıyor.");
            return initialData;
        }
        throw new Error(`JSONBin'den veri okunamadı: ${response.statusText}`);
    }
    
    const data = await response.json();
    const record = data.record;

    // Tarih alanlarını Date nesnesine çevir
    if (record.quotes) {
        record.quotes.forEach((quote: any) => {
            if (quote.quoteDate) quote.quoteDate = new Date(quote.quoteDate);
            if (quote.validUntil) quote.validUntil = new Date(quote.validUntil);
            if (quote.updatedAt) quote.updatedAt = new Date(quote.updatedAt);
        });
    }

    const validatedData = dbDataSchema.safeParse(record);
    if (validatedData.success) {
      return validatedData.data;
    } else {
      console.error('JSONBin verisi Zod şemasıyla uyuşmuyor, başlangıç verisi döndürülüyor:', validatedData.error);
      return initialData;
    }

  } catch (error) {
    console.error('JSONBin.io\'dan veri okunurken hata oluştu:', error);
    return initialData;
  }
}


export async function saveDbData(data: DbData): Promise<void> {
  await checkEnvVariables();

  try {
    const validatedData = dbDataSchema.parse(data);

    const response = await fetch(BIN_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': JSONBIN_API_KEY!,
        },
        body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
        throw new Error(`JSONBin'e veri yazılamadı: ${response.statusText}`);
    }

  } catch (error) {
     console.error('Veri doğrulanırken veya JSONBin.io\'ya yazılırken hata oluştu:', error);
     throw new Error('Veri kaydedilemedi.');
  }
}
