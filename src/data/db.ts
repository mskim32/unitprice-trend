import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { PriceDataRow, generateDummyData } from './dummyData';

const DB_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');

// Initialize Supabase Client if environment variables are set
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const useSupabase = !!(supabaseUrl && supabaseKey);
const supabase = useSupabase ? createClient(supabaseUrl!, supabaseKey!) : null;

if (useSupabase) {
  console.log('Database Mode: Supabase PostgreSQL connected.');
} else {
  console.log('Database Mode: Local JSON File Fallback active (src/data/db.json).');
}

// Helper to load local JSON database
function getLocalData(): PriceDataRow[] {
  if (!fs.existsSync(DB_FILE_PATH)) {
    const empty: PriceDataRow[] = [];
    // Ensure parent directories exist
    fs.mkdirSync(path.dirname(DB_FILE_PATH), { recursive: true });
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(empty, null, 2), 'utf-8');
    return empty;
  }
  try {
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse local DB json, returning empty list', e);
    return [];
  }
}

// Helper to save local JSON database
function saveLocalData(data: PriceDataRow[]) {
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getAllPrices(): Promise<PriceDataRow[]> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('price_performance')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        console.log('Supabase table is empty.');
        return [];
      }

      // Map database schema columns back to camelCase PriceDataRow interface
      return data.map((row: any) => ({
        id: row.id,
        quarter: row.quarter,
        company: row.company,
        siteName: row.site_name,
        division: row.division,
        itemName: row.item_name,
        spec: row.spec,
        unit: row.unit,
        quantity: row.quantity,
        price: row.price,
        includeInGraph: row.include_in_graph
      }));
    } catch (err) {
      console.error('Supabase fetch failed, falling back to local storage:', err);
      return getLocalData();
    }
  }
  return getLocalData();
}

export async function insertPrices(newRows: PriceDataRow[]): Promise<void> {
  if (useSupabase && supabase) {
    try {
      const dbRows = newRows.map(row => ({
        id: row.id,
        quarter: row.quarter,
        company: row.company,
        site_name: row.siteName,
        division: row.division,
        item_name: row.itemName,
        spec: row.spec,
        unit: row.unit,
        quantity: row.quantity,
        price: row.price,
        include_in_graph: row.includeInGraph
      }));
      const { error } = await supabase.from('price_performance').insert(dbRows);
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Supabase insert failed, falling back to local:', err);
    }
  }
  
  const current = getLocalData();
  saveLocalData([...newRows, ...current]);
}

export async function updatePrice(updatedRow: PriceDataRow): Promise<void> {
  if (useSupabase && supabase) {
    try {
      const { error } = await supabase
        .from('price_performance')
        .update({
          quarter: updatedRow.quarter,
          company: updatedRow.company,
          site_name: updatedRow.siteName,
          division: updatedRow.division,
          item_name: updatedRow.itemName,
          spec: updatedRow.spec,
          unit: updatedRow.unit,
          quantity: updatedRow.quantity,
          price: updatedRow.price,
          include_in_graph: updatedRow.includeInGraph
        })
        .eq('id', updatedRow.id);
      
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Supabase update failed, falling back to local:', err);
    }
  }

  const current = getLocalData();
  const index = current.findIndex(row => row.id === updatedRow.id);
  if (index !== -1) {
    current[index] = updatedRow;
    saveLocalData(current);
  }
}

export async function deletePrices(ids: string[]): Promise<void> {
  if (useSupabase && supabase) {
    try {
      const { error } = await supabase
        .from('price_performance')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      return;
    } catch (err) {
      console.error('Supabase delete failed, falling back to local:', err);
    }
  }

  const current = getLocalData();
  const filtered = current.filter(row => !ids.includes(row.id));
  saveLocalData(filtered);
}
