'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { DbData, dbDataSchema } from './schema';

// Veritabanı dosyası her zaman projenin kök dizininde olacak.
const dbPath = path.join(process.cwd(), 'db.json');

async function ensureDbFile() {
  try {
    // dosyanın varlığını kontrol et
    await fs.access(dbPath);
  } catch (error) {
    // Eğer dosya yoksa, boş bir tane oluştur.
    try {
      await fs.writeFile(dbPath, JSON.stringify({ quotes: [], customers: [], companyProfiles: [] }, null, 2), 'utf8');
      console.log('db.json created as it did not exist.');
    } catch (createError) {
      console.error('Failed to create db.json:', createError);
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
    // Dosya boşsa veya sadece boş bir nesne/dizi içeriyorsa varsayılan yapıya dön
    if (!fileContent.trim()) {
        return { quotes: [], customers: [], companyProfiles: [] };
    }
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
