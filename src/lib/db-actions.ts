'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { DbData, dbDataSchema } from './schema';

// Veritabanı dosyasının yolu. process.cwd() projenin kök dizinini verir.
const dbPath = path.join(process.cwd(), 'db.json');

// Dosyanın var olup olmadığını kontrol edip, yoksa oluşturan yardımcı fonksiyon
async function ensureDbFileExists() {
  try {
    await fs.access(dbPath);
  } catch {
    // Dosya yoksa, boş bir veritabanı yapısıyla oluştur.
    await fs.writeFile(dbPath, JSON.stringify({ quotes: [], customers: [], companyProfiles: [] }, null, 2), 'utf8');
  }
}

/**
 * db.json dosyasından tüm veriyi okur.
 * @returns {Promise<DbData>} Veritabanı içeriği
 */
export async function getDbData(): Promise<DbData> {
  await ensureDbFileExists();
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
  await ensureDbFileExists();
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
