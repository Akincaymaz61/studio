'use server';

import { DbData, dbDataSchema } from './schema';

const API_KEY = process.env.JSONBIN_API_KEY;
const BIN_ID = process.env.JSONBIN_BIN_ID;
const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const initialData: DbData = {
  quotes: [],
  customers: [],
  companyProfiles: [],
};

async function ensureBinExists(): Promise<void> {
  if (!API_KEY || !BIN_ID) {
    throw new Error('JSONBin API Key veya Bin ID ortam değişkenlerinde tanımlanmamış.');
  }
  try {
    const response = await fetch(`${BIN_URL}/latest`, {
        headers: { 'X-Master-Key': API_KEY },
        cache: 'no-store',
    });
    
    if (response.status === 404) {
      // Bin yok, oluşturalım
      const createResponse = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY,
          'X-Bin-Name': 'TeklifAI-DB',
          'X-Bin-Private': 'true',
        },
        body: JSON.stringify(initialData),
      });
      if (!createResponse.ok) {
        const errorBody = await createResponse.text();
        throw new Error(`Failed to create bin: ${errorBody}`);
      }
      const newBin = await createResponse.json();
      console.log(`JSONBin.io bin başarıyla oluşturuldu. Yeni Bin ID: ${newBin.metadata.id}. Lütfen bu ID'yi ortam değişkenlerinize ekleyin.`);

    }
  } catch (error) {
    console.error('Error ensuring bin exists:', error);
    throw error;
  }
}

/**
 * JSONBin.io'dan tüm veriyi okur.
 * @returns {Promise<DbData>} Veritabanı içeriği
 */
export async function getDbData(): Promise<DbData> {
  if (!API_KEY || !BIN_ID) {
    console.warn("JSONBin.io anahtarları ayarlanmamış, boş veri döndürülüyor.");
    return initialData;
  }
  
  await ensureBinExists();

  try {
    const response = await fetch(`${BIN_URL}/latest`, {
      headers: {
        'X-Master-Key': API_KEY,
      },
      cache: 'no-store', // Verinin her zaman en güncel halini almak için
    });

    if (!response.ok) {
        if(response.status === 404) {
             console.log("Bin bulunamadı, başlangıç verisi döndürülüyor.");
             return initialData;
        }
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    
    const data = await response.json();
    const record = data.record;

    // Eğer bin boşsa veya beklenen yapıda değilse, başlangıç verisini döndür.
    if (Object.keys(record).length === 0) {
        return initialData;
    }

    // Tarih alanlarını Date nesnesine çevir
    if (record.quotes) {
        record.quotes.forEach((quote: any) => {
            if (quote.quoteDate) quote.quoteDate = new Date(quote.quoteDate);
            if (quote.validUntil) quote.validUntil = new Date(quote.validUntil);
            if (quote.updatedAt) quote.updatedAt = new Date(quote.updatedAt);
        });
    }

    const validatedData = dbDataSchema.parse(record);
    return validatedData;

  } catch (error) {
    console.error('Error reading or parsing data from JSONBin.io:', error);
    return initialData;
  }
}

/**
 * Gelen veriyi JSONBin.io'ya yazar.
 * @param {DbData} data Kaydedilecek tüm veritabanı objesi
 */
export async function saveDbData(data: DbData): Promise<void> {
   if (!API_KEY || !BIN_ID) {
    throw new Error('Kaydetme başarısız: JSONBin API Key veya Bin ID ayarlanmamış.');
  }

  try {
    const validatedData = dbDataSchema.parse(data);
    const response = await fetch(BIN_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
       const errorBody = await response.text();
       throw new Error(`Failed to save data: ${response.statusText} - ${errorBody}`);
    }
  } catch (error) {
     console.error('Error validating or writing to JSONBin.io:', error);
     throw new Error('Veri kaydedilemedi.');
  }
}
