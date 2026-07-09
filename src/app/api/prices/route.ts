import { NextResponse } from 'next/server';
import { getAllPrices, insertPrices, updatePrice, deletePrices } from '../../../data/db';
import { generateDummyData } from '../../../data/dummyData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restore = searchParams.get('restore');

    if (restore === 'true') {
      const dummyData = generateDummyData();
      const daewooRows = dummyData.filter(
        row => row.quarter === '25년 3/4분기' && row.company === '대우건설'
      );

      const currentPrices = await getAllPrices();
      const existing = currentPrices.filter(
        row => row.quarter === '25년 3/4분기' && row.company === '대우건설'
      );

      if (existing.length === 0) {
        const rowsToInsert = daewooRows.map((row, idx) => ({
          ...row,
          id: `row-restore-${Date.now()}-${idx}`
        }));
        await insertPrices(rowsToInsert);
        return NextResponse.json({ success: true, restoredCount: rowsToInsert.length });
      } else {
        return NextResponse.json({ success: true, message: 'Data already exists, no restore needed.', count: existing.length });
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
