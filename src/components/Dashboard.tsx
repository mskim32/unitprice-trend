'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { generateDummyData, PriceDataRow, ITEMS, ITEM_CONFIGS, COMPANIES, QUARTERS } from '../data/dummyData';
import { Select } from './ui/select';
import { PriceChart, formatKRW, formatBillionKRW } from './PriceChart';
import { PriceGrid } from './PriceGrid';
import { DetailModal } from './DetailModal';
import { InputPanel } from './InputPanel';
import { QuarterlyComparison } from './QuarterlyComparison';
import { Card, CardContent } from './ui/card';
import {
  TrendingUp,
  HardHat,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Activity,
  Calculator
} from 'lucide-react';

export default function Dashboard() {
  // State management
  const [allData, setAllData] = useState<PriceDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string>('[아파트]거푸집(AL폼)');
  const [selectedPoint, setSelectedPoint] = useState<{
    company: string;
    quarter: string;
    amount: number;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<{
    quarter: string;
    company: string;
    siteName: string;
    prices: { [itemName: string]: number };
  } | null>(null);

  // Fetch data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/prices');
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        setAllData(data);
      } catch (err) {
        console.error('Error loading prices:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Map dropdown options
  const dropdownOptions = useMemo(() => {
    return [
      { value: '전체 합계', label: '전체 합계' },
      ...ITEMS.map(item => ({ value: item, label: item }))
    ];
  }, []);

  // Filter data for the grid based on the selected item
  const filteredGridData = useMemo(() => {
    if (selectedItem === '전체 합계') {
      return allData;
    }
    return allData.filter(row => row.itemName === selectedItem);
  }, [allData, selectedItem]);

  // Calculate high-level stats for the current filtered item
  const stats = useMemo(() => {
    const activeRows = filteredGridData.filter(row => row.includeInGraph);
    if (activeRows.length === 0) {
      return { count: 0, maxPrice: 0, minPrice: 0, avgPrice: 0, totalAmount: 0 };
    }

    if (selectedItem === '전체 합계') {
      const uniqueSites = Array.from(new Set(activeRows.map(row => `${row.company}-${row.quarter}-${row.siteName}`))).length;
      const siteGroups: { [key: string]: number } = {};
      activeRows.forEach(r => {
        const key = `${r.company}-${r.quarter}-${r.siteName}`;
        siteGroups[key] = (siteGroups[key] || 0) + (r.price * r.quantity);
      });

      const amounts = Object.values(siteGroups);
      const maxAmount = Math.max(...amounts);
      const minAmount = Math.min(...amounts);
      const totalAmount = amounts.reduce((sum, val) => sum + val, 0);
      const avgAmount = amounts.length > 0 ? Math.round(totalAmount / amounts.length) : 0;

      return {
        count: uniqueSites,
        maxPrice: maxAmount,
        minPrice: minAmount,
        avgPrice: avgAmount,
        totalAmount
      };
    }

    const prices = activeRows.map(row => row.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const totalAmount = activeRows.reduce((sum, r) => sum + r.price * r.quantity, 0);
    const totalQty = activeRows.reduce((sum, r) => sum + r.quantity, 0);
    const avgPrice = totalQty > 0 ? Math.round(totalAmount / totalQty) : 0;

    return {
      count: activeRows.length,
      maxPrice,
      minPrice,
      avgPrice,
      totalAmount
    };
  }, [filteredGridData, selectedItem]);

  // Handle cell edits in the grid
  const handleRowDataChange = async (updatedRow: PriceDataRow) => {
    // Optimistic UI update
    setAllData(prevData =>
      prevData.map(row => (row.id === updatedRow.id ? updatedRow : row))
    );
    try {
      await fetch('/api/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRow)
      });
    } catch (err) {
      console.error('Failed to update price in database:', err);
    }
  };

  // Handle deleting multiple rows
  const handleDeleteRows = async (ids: string[]) => {
    // Optimistic UI update
    setAllData(prevData => prevData.filter(row => !ids.includes(row.id)));
    try {
      await fetch('/api/prices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
    } catch (err) {
      console.error('Failed to delete prices in database:', err);
    }
  };

  // Handle adding new batch of quarterly data
  const handleAddPerformanceData = async (newData: {
    quarter: string;
    company: string;
    siteName: string;
    prices: { [itemName: string]: number };
  }) => {
    const newRows: PriceDataRow[] = ITEM_CONFIGS.map((cfg, index) => {
      const price = newData.prices[cfg.name] || 0;
      return {
        id: `row-new-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        quarter: newData.quarter,
        company: newData.company,
        siteName: newData.siteName,
        itemName: cfg.name,
        division: cfg.division,
        spec: cfg.spec,
        unit: cfg.unit,
        quantity: cfg.quantity,
        price,
        includeInGraph: true
      };
    });

    // Optimistic UI update
    setAllData(prevData => [...newRows, ...prevData]);
    try {
      await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: newRows })
      });
    } catch (err) {
      console.error('Failed to insert prices into database:', err);
    }
  };

  // Handle updating an existing batch of quarterly data (Edit Mode)
  const handleUpdatePerformanceData = async (
    oldBatch: { quarter: string; company: string; siteName: string },
    newBatch: { quarter: string; company: string; siteName: string; prices: { [itemName: string]: number } }
  ) => {
    const matchingOldRows = allData.filter(
      r => r.quarter === oldBatch.quarter && r.company === oldBatch.company && r.siteName === oldBatch.siteName
    );

    const updatedRows: PriceDataRow[] = ITEM_CONFIGS.map((cfg, index) => {
      const price = newBatch.prices[cfg.name] || 0;
      const existingRow = matchingOldRows.find(r => r.itemName === cfg.name);
      
      if (existingRow) {
        return {
          ...existingRow,
          quarter: newBatch.quarter,
          company: newBatch.company,
          siteName: newBatch.siteName,
          price
        };
      } else {
        return {
          id: `row-new-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          quarter: newBatch.quarter,
          company: newBatch.company,
          siteName: newBatch.siteName,
          itemName: cfg.name,
          division: cfg.division,
          spec: cfg.spec,
          unit: cfg.unit,
          quantity: cfg.quantity,
          price,
          includeInGraph: true
        };
      }
    });

    // Optimistic UI update: Filter out old matching rows and prepend updated rows
    setAllData(prevData => {
      const filtered = prevData.filter(
        r => !(r.quarter === oldBatch.quarter && r.company === oldBatch.company && r.siteName === oldBatch.siteName)
      );
      return [...updatedRows, ...filtered];
    });

    setEditingBatch(null);

    // Save changes to database: delete the old ones first, then insert updated ones
    try {
      const oldIds = matchingOldRows.map(r => r.id);
      if (oldIds.length > 0) {
        await fetch('/api/prices', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: oldIds })
        });
      }
      await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: updatedRows })
      });
    } catch (err) {
      console.error('Failed to update batch in database:', err);
    }
  };

  // Handle setting active edit batch from selected grid row
  const handleEditBatch = (company: string, quarter: string, siteName: string) => {
    const matchingRows = allData.filter(
      r => r.company === company && r.quarter === quarter && r.siteName === siteName
    );
    const prices: { [itemName: string]: number } = {};
    matchingRows.forEach(r => {
      prices[r.itemName] = r.price;
    });
    setEditingBatch({ company, quarter, siteName, prices });
  };

  // Handle click on chart markers
  const handleChartPointClick = (company: string, quarter: string, amount: number) => {
    setSelectedPoint({ company, quarter, amount });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-slate-50 dark:bg-slate-900/60 p-4 md:p-8 flex flex-col items-center justify-center min-h-[80vh] gap-4 w-full">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-indigo-500 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
          실적단가 DB 연결 상태를 확인하고 데이터를 불러오는 중입니다...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900/60 p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              CONSTRUCTION COST INTELLIGENCE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            건설사별 분기 실적단가 추이 대시보드
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            건설사별, 분기별 골조공사 실적 낙찰 단가를 표준 물량을 기준으로 모니터링합니다.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-center bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">
            품명 필터:
          </span>
          <Select
            value={selectedItem}
            onChange={setSelectedItem}
            options={dropdownOptions}
          />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Sites */}
        <Card className="hover:border-blue-200 dark:hover:border-blue-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                분석 반영 현장 수
              </span>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {stats.count}개 현장
              </span>
              <span className="text-[11px] text-slate-400">
                {selectedItem === '전체 합계' ? '전체 품종 합산 반영 현장 수' : '전체 등록 대비 그래프 반영 비율'}
              </span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Max Price */}
        <Card className="hover:border-rose-200 dark:hover:border-rose-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {selectedItem === '전체 합계' ? '최고 합산 실적 금액' : '최고 실적 단가'}
              </span>
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 flex items-baseline gap-1">
                {selectedItem === '전체 합계' ? formatBillionKRW(stats.maxPrice) : formatKRW(stats.maxPrice)}
              </span>
              <span className="text-[11px] text-rose-500/80 flex items-center gap-0.5 font-medium">
                <ArrowUpRight className="h-3 w-3" /> {selectedItem === '전체 합계' ? '최고 실적 현장 합산 기준' : '최고 낙찰가 현장 기준'}
              </span>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Min Price */}
        <Card className="hover:border-emerald-200 dark:hover:border-emerald-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {selectedItem === '전체 합계' ? '최저 합산 실적 금액' : '최저 실적 단가'}
              </span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-baseline gap-1">
                {selectedItem === '전체 합계' ? formatBillionKRW(stats.minPrice) : formatKRW(stats.minPrice)}
              </span>
              <span className="text-[11px] text-emerald-500/80 flex items-center gap-0.5 font-medium">
                <ArrowDownRight className="h-3 w-3" /> {selectedItem === '전체 합계' ? '최저 실적 현장 합산 기준' : '최저 낙찰가 현장 기준'}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Weighted Average Price */}
        <Card className="hover:border-indigo-200 dark:hover:border-indigo-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {selectedItem === '전체 합계' ? '총 합산 실적 금액' : '가중 평균 단가'}
              </span>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-baseline gap-1">
                {selectedItem === '전체 합계' ? formatBillionKRW(stats.totalAmount) : formatKRW(stats.avgPrice)}
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <Calculator className="h-3 w-3 text-slate-400" /> {selectedItem === '전체 합계' ? '선택된 전체 품목의 합산 금액' : '총 금액 / 총 수량 산출'}
              </span>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Input Panel for registering or updating data */}
      <InputPanel
        allData={allData}
        onLoadExistingBatch={(company, quarter, siteName, prices) => {
          setEditingBatch({ company, quarter, siteName, prices });
        }}
        onAddData={handleAddPerformanceData}
        editingBatch={editingBatch}
        onUpdateData={handleUpdatePerformanceData}
        onCancelEdit={() => setEditingBatch(null)}
      />

      {/* Main Content Layout */}
      {/* Central Area: Chart */}
      <div className="w-full">
        <PriceChart
          data={allData}
          selectedItem={selectedItem}
          onPointClick={handleChartPointClick}
        />
      </div>

      {/* Comparison Table Panel */}
      <div className="w-full">
        <QuarterlyComparison
          data={allData}
          quarters={QUARTERS}
          companies={COMPANIES}
        />
      </div>

      {/* Lower Area: AG Grid Table */}
      <div className="w-full">
        <PriceGrid
          rowData={filteredGridData}
          onRowDataChange={handleRowDataChange}
          onDeleteRows={handleDeleteRows}
          onEditBatch={handleEditBatch}
        />
      </div>

      {/* Modal/Dialog for Chart point detail view */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedPoint={selectedPoint}
        selectedItem={selectedItem}
        data={allData}
      />
    </div>
  );
}
