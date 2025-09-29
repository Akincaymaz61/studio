'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { DbData, dbDataSchema } from './schema';

// Vercel'in yazılabilir tek alanı /tmp klasörüdür.
// Projenin kök dizini salt okunurdur.
const isVercel = process.env.VERCEL === '1';
const dbPath = isVercel ? path.join('/tmp', 'db.json') : path.join(process.cwd(), 'db.json');
const initialDbPath = path.join(process.cwd(), 'db.json');


async function ensureDbFile() {
  try {
    // /tmp klasöründeki dosyanın varlığını kontrol et
    await fs.access(dbPath);
  } catch (error) {
    // Eğer /tmp'de dosya yoksa, proje kökündeki orijinal dosyayı oraya kopyala
    try {
      const initialData = await fs.readFile(initialDbPath, 'utf8');
      await fs.writeFile(dbPath, initialData, 'utf8');
    } catch (copyError) {
       // Kök dizinde de dosya yoksa (örneğin ilk dağıtım), boş bir tane oluştur.
       await fs.writeFile(dbPath, JSON.stringify({ quotes: [], customers: [], companyProfiles: [] }, null, 2), 'utf8');
    }
  }
}

/**
 * db.json dosyasından tüm veriyi okur.
 * @returns {Promise<DbData>} Veritabanı içeriği
 */
export async function getDbData(): Promise<DbData> {
  await ensureDbFile();
  try {
    const fileContent = await fs.readFile(dbPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Tarih alanlarını Date nesnesine çevir
    if (data.quotes) {
        data.quotes.forEach((quote: any) => {
            if (quote.quoteDate) quote.quoteDate = new Date(quote.quoteDate);
            if (quote.validUntil) quote.validUntil = new Date(quote.validUntil);
            if (quote.updatedAt) quote.updatedAt = new Date(quote.updatedAt);
        });
    }

    // Veriyi schema'ya göre doğrula
    const validatedData = dbDataSchema.parse(data);
    return validatedData;

  } catch (error) {
    console.error('Error reading or parsing db.json:', error);
    // Hata durumunda veya dosya boşsa, boş bir veritabanı yapısı döndür.
    return { quotes: [], customers: [], companyProfiles: [] };
  }
}

/**
 * Gelen veriyi db.json dosyasına yazar.
 * @param {DbData} data Kaydedilecek tüm veritabanı objesi
 */
export async function saveDbData(data: DbData): Promise<void> {
  await ensureDbFile();
  try {
    // Veriyi schema'ya göre doğrula
    const validatedData = dbDataSchema.parse(data);
    const fileContent = JSON.stringify(validatedData, null, 2);
    await fs.writeFile(dbPath, fileContent, 'utf8');
  } catch (error) {
     console.error('Error validating or writing to db.json:', error);
     throw new Error('Failed to save data.');
  }
}
