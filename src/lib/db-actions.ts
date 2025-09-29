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
        console.warn('JSONBIN_API_KEY and/or JSONBIN_BIN_ID environment variables are not set. Data will not be persisted. Please check README.md');
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
      headers: {
        'X-Access-Key': JSONBIN_API_KEY!,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
        if(response.status === 404) {
            console.warn("JSONBin.io bin not found. Returning initial data.");
            return initialData;
        }
        throw new Error(`Failed to read from JSONBin: ${response.statusText}`);
    }
    
    const data = await response.json();
    const record = data.record;

    if (!record || Object.keys(record).length === 0) {
        return initialData;
    }

    // Ensure dates are converted from strings to Date objects
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
      console.error('Zod validation failed for JSONBin data, returning initial data:', validatedData.error);
      return initialData;
    }

  } catch (error) {
    console.error('Error reading from JSONBin.io:', error);
    return initialData;
  }
}


export async function saveDbData(data: DbData): Promise<void> {
  const envsAreSet = await checkEnvVariables();
  if (!envsAreSet) {
      console.warn("Cannot save data, environment variables are not set.");
      return;
  };

  try {
    const validatedData = dbDataSchema.parse(data);

    const response = await fetch(BIN_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Access-Key': JSONBIN_API_KEY!,
        },
        body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
        throw new Error(`Failed to write to JSONBin: ${response.statusText}`);
    }

  } catch (error) {
     console.error('Error validating or writing to JSONBin.io:', error);
     throw new Error('Data could not be saved.');
  }
}
