'use server';

import { DbData, dbDataSchema } from './schema';

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
const BIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

const initialData: DbData = {
  quotes: [],
  customers: [],
  companyProfiles: [],
  users: [],
};

function getHeaders() {
    if (!JSONBIN_API_KEY) {
        throw new Error("JSONBIN_API_KEY ortam değişkeni ayarlanmamış.");
    }
    return {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY,
        'X-Access-Key': JSONBIN_API_KEY,
    };
}

async function checkEnvVariables() {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) {
        console.warn('JSONBIN_API_KEY ve/veya JSONBIN_BIN_ID ortam değişkenleri ayarlanmamış. Veriler kalıcı olmayacak. Lütfen README.md dosyasını kontrol edin.');
        return false;
    }
    return true;
}


export async function getDbData(): Promise<DbData> {
  const envsAreSet = await checkEnvVariables();
  if (!envsAreSet) return initialData;
  
  try {
    const response = await fetch(`${BIN_URL}/latest`, {
      method: 'GET',
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
        // 404 (Not Found) hatası, yeni oluşturulmuş boş bir bin anlamına gelebilir, bu normaldir.
        if (response.status === 404) {
            console.warn("JSONBin.io 'bin' bulunamadı. Boş veri setiyle başlanıyor. Bu, ilk kullanım için normaldir.");
            return initialData;
        }
        // Diğer hataları fırlat
        throw new Error(`JSONBin'den okuma başarısız: ${response.statusText} (status: ${response.status})`);
    }
    
    // JSONBin /latest uç noktası veriyi { record: {...} } içinde döndürür.
    const data = await response.json();
    const record = data.record;
    
    // Eğer kayıt boşsa veya hiç yoksa, başlangıç verisini döndür.
    if (!record || typeof record !== 'object' || Object.keys(record).length === 0) {
        return initialData;
    }

    // Tarih alanlarını string'den Date nesnesine dönüştür
    if (record.quotes && Array.isArray(record.quotes)) {
        record.quotes.forEach((quote: any) => {
            if (quote.quoteDate) quote.quoteDate = new Date(quote.quoteDate);
            if (quote.validUntil) quote.validUntil = new Date(quote.validUntil);
            if (quote.updatedAt) quote.updatedAt = new Date(quote.updatedAt);
        });
    }

    // Son olarak, veriyi şemaya göre doğrula.
    const validatedData = dbDataSchema.safeParse(record);
    if (validatedData.success) {
      return validatedData.data;
    } else {
      console.error('Veritabanından gelen veri Zod doğrulamasından geçemedi:', validatedData.error);
      // Hatalı veri yerine güvenli bir başlangıç noktası sun
      return initialData;
    }

  } catch (error) {
    console.error('JSONBin.io\'dan veri okunurken bir istisna oluştu:', error);
    // Hata durumunda uygulamanın çökmesini engelle
    return initialData;
  }
}


export async function saveDbData(data: DbData): Promise<{success: boolean, error?: any}> {
  const envsAreSet = await checkEnvVariables();
  if (!envsAreSet) {
      console.warn("Kaydetme işlemi atlandı: Ortam değişkenleri ayarlanmamış.");
      return { success: false, error: 'Ortam değişkenleri ayarlanmamış.' };
  }

  // Gönderilen veriyi Zod şemasıyla doğrula
  const validationResult = dbDataSchema.safeParse(data);

  if (!validationResult.success) {
    console.error('Kaydedilecek veri Zod doğrulamasını geçemedi:', validationResult.error);
    return { success: false, error: validationResult.error };
  }

  try {
    const response = await fetch(BIN_URL, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(validationResult.data), // Doğrulanmış veriyi gönder
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('JSONBin\'e yazma başarısız oldu:', response.status, response.statusText, errorBody);
        throw new Error(`JSONBin'e yazma başarısız: ${response.statusText}`);
    }
    
    return { success: true };

  } catch (error) {
     console.error('JSONBin.io\'ya yazılırken bir istisna oluştu:', error);
     return { success: false, error: error };
  }
}
