'use client';

import React from 'react';
import { Dialog } from './ui/dialog';
import { PriceDataRow } from '../data/dummyData';
import { formatKRW } from './PriceChart';
import { Building2, Calendar, HardHat, ShieldCheck, TrendingUp, Layers } from 'lucide-react';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPoint: {
    company: string;
    quarter: string;
    amount: number;
  } | null;
  selectedItem: string;
  data: PriceDataRow[];
}

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  selectedPoint,
  selectedItem,
  data
}) => {
  if (!selectedPoint) return null;

  const { company, quarter, amount } = selectedPoint;

  // Filter rows contributing to this specific point (only those with includeInGraph = true)
  const contributingRows = data.filter(
    row =>
      row.company === company &&
      row.quarter === quarter &&
      (selectedItem === '전체 합계' ? true : row.itemName === selectedItem) &&
      row.includeInGraph
  );

  // Compute total quantity and weighted average unit price
  const totalQty = contributingRows.reduce((sum, row) => sum + row.quantity, 0);
  const weightedAvgPrice = totalQty > 0 ? Math.round(amount / totalQty) : 0;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl"
    >
      <div className="flex flex-col gap-4">
        {/* Header Section */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              {company} 실적 상세 내역
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3 w-3" /> {quarter} | 품명: {selectedItem}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-500" /> 총 금액
            </span>
            <span className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100">
              {amount > 0 ? formatKRW(amount) : '0원'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <HardHat className="h-3 w-3 text-indigo-500" /> 총 합계수량
            </span>
            <span className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100">
              {totalQty > 0 ? new Intl.NumberFormat('ko-KR').format(totalQty) : '0'} {contributingRows[0]?.unit || ''}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Layers className="h-3 w-3 text-emerald-500" /> 가중평균 단가
            </span>
            <span className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100">
              {weightedAvgPrice > 0 ? formatKRW(weightedAvgPrice) : '0원'}
            </span>
          </div>
        </div>

        {/* Contributing Sites List */}
        <div className="mt-2">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            현장별 세부 구성 내역
          </h4>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-[220px] overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="px-4 py-2.5">현장명</th>
                  {selectedItem === '전체 합계' && <th className="px-4 py-2.5">품명</th>}
                  <th className="px-4 py-2.5">규격</th>
                  <th className="px-4 py-2.5 text-right">수량</th>
                  <th className="px-4 py-2.5 text-right">단가</th>
                  <th className="px-4 py-2.5 text-right">금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {contributingRows.length > 0 ? (
                  contributingRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{row.siteName}</td>
                      {selectedItem === '전체 합계' && <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium">{row.itemName}</td>}
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{row.spec}</td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {new Intl.NumberFormat('ko-KR').format(row.quantity)} {row.unit}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-blue-600 dark:text-blue-400">
                        {formatKRW(row.price)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold">
                        {formatKRW(row.price * row.quantity)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={selectedItem === '전체 합계' ? 6 : 5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                      그래프에 반영된 실적 데이터가 존재하지 않습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </Dialog>
  );
};
