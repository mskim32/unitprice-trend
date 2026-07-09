import { NextResponse } from 'next/server';
import { getAllPrices, insertPrices, updatePrice, deletePrices } from '../../../data/db';
import { generateDummyData } from '../../../data/dummyData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restore = searchParams.get('restore');

    if (restore === 'all') {
      const dummyData = generateDummyData();
      const currentPrices = await getAllPrices();
      
      // Find rows in dummyData that are missing in current database by looking at their unique attributes:
      // company, quarter, siteName, and itemName.
      const existingKeys = new Set(
        currentPrices.map(r => `${r.company}_${r.quarter}_${r.siteName}_${r.itemName}`)
      );

      const rowsToInsert = dummyData.filter(
        row => !existingKeys.has(`${row.company}_${row.quarter}_${row.siteName}_${row.itemName}`)
      );

      if (rowsToInsert.length > 0) {
        // Assign new unique IDs to be safe
        const preparedRows = rowsToInsert.map((row, idx) => ({
          ...row,
          id: `row-restored-${Date.now()}-${idx}`
        }));
        await insertPrices(preparedRows);
        return NextResponse.json({ success: true, restoredCount: preparedRows.length });
      } else {
        return NextResponse.json({ success: true, message: 'All data is already present.', count: currentPrices.length });
      }
    }

    const data = await getAllPrices();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API GET failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch prices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rows } = body;
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Missing rows array' }, { status: 400 });
    }
    await insertPrices(rows);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API POST failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to insert prices' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const updatedRow = await request.json();
    if (!updatedRow || !updatedRow.id) {
      return NextResponse.json({ error: 'Missing row ID' }, { status: 400 });
    }
    await updatePrice(updatedRow);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API PUT failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to update price' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Missing ids array' }, { status: 400 });
    }
    await deletePrices(ids);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API DELETE failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete prices' }, { status: 500 });
  }
}
