'use client';

import React, { useState, useMemo } from 'react';
import { PriceDataRow, ITEM_CONFIGS, ItemConfig } from '../data/dummyData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Select } from './ui/select';
import { TrendingUp, TrendingDown, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatKRW } from './PriceChart';

interface QuarterlyComparisonProps {
  data: PriceDataRow[];
  quarters: string[];
  companies: string[];
}

export const QuarterlyComparison: React.FC<QuarterlyComparisonProps> = ({
  data,
  quarters,
  companies
}) => {
  // Default to the latest quarter
  const [selectedQuarter, setSelectedQuarter] = useState<string>(
    quarters.length > 0 ? quarters[quarters.length - 1] : ''
  );

  // Find previous quarter
  const prevQuarter = useMemo(() => {
    if (!selectedQuarter) return null;
    const idx = quarters.indexOf(selectedQuarter);
    return idx > 0 ? quarters[idx - 1] : null;
  }, [selectedQuarter, quarters]);

  // Dropdown options for selecting quarter
  const quarterOptions = useMemo(() => {
    return quarters.map((q) => ({ value: q, label: q }));
  }, [quarters]);

  // Calculate grid metrics
  const comparisonData = useMemo(() => {
    if (!selectedQuarter) return null;

    // Filter rows for current and previous quarter
    const currentRows = data.filter((r) => r.quarter === selectedQuarter && r.includeInGraph);
    const prevRows = prevQuarter ? data.filter((r) => r.quarter === prevQuarter && r.includeInGraph) : [];

    // Map by [company][itemName] for quick lookup
    const currentMap: { [key: string]: { [key: string]: PriceDataRow } } = {};
    const prevMap: { [key: string]: { [key: string]: PriceDataRow } } = {};

    companies.forEach((comp) => {
      currentMap[comp] = {};
      prevMap[comp] = {};
    });

    currentRows.forEach((row) => {
      if (currentMap[row.company]) {
        currentMap[row.company][row.itemName] = row;
      }
    });

    prevRows.forEach((row) => {
      if (prevMap[row.company]) {
        prevMap[row.company][row.itemName] = row;
      }
    });

    // Calculate details for each company
    const companyTotals = companies.map((comp) => {
      let currentTotalAmount = 0;
      let prevTotalAmount = 0;

      ITEM_CONFIGS.forEach((cfg) => {
        const curRow = currentMap[comp][cfg.name];
        const prevRow = prevMap[comp][cfg.name];

        const curPrice = curRow ? curRow.price : 0;
        const prevPrice = prevRow ? prevRow.price : 0;

        currentTotalAmount += curPrice * cfg.quantity;
        prevTotalAmount += prevPrice * cfg.quantity;
      });

      const ratio = prevTotalAmount > 0 ? Math.round((currentTotalAmount / prevTotalAmount) * 100) : null;
      const changeRate = prevTotalAmount > 0 ? Math.round(((currentTotalAmount - prevTotalAmount) / prevTotalAmount) * 1000) / 10 : null;

      return {
        company: comp,
        currentTotal: currentTotalAmount,
        prevTotal: prevTotalAmount,
        ratio,
        changeRate
      };
    });

    // Calculate averages across all companies for each item
    const itemAverages: { 
      [itemName: string]: { 
        currentAvgPrice: number; 
        prevAvgPrice: number; 
      } 
    } = {};

    let avgTotalCurrent = 0;
    let avgTotalPrev = 0;

    ITEM_CONFIGS.forEach((cfg) => {
      const curPricesForCfg: number[] = [];
      const prevPricesForCfg: number[] = [];

      companies.forEach((comp) => {
        const curRow = currentMap[comp]?.[cfg.name];
        const prevRow = prevMap[comp]?.[cfg.name];

        if (curRow && curRow.price > 0) curPricesForCfg.push(curRow.price);
        if (prevRow && prevRow.price > 0) prevPricesForCfg.push(prevRow.price);
      });

      const currentAvgPrice = curPricesForCfg.length > 0 
        ? curPricesForCfg.reduce((sum, val) => sum + val, 0) / curPricesForCfg.length 
        : 0;
      
      const prevAvgPrice = prevPricesForCfg.length > 0 
        ? prevPricesForCfg.reduce((sum, val) => sum + val, 0) / prevPricesForCfg.length 
        : 0;

      itemAverages[cfg.name] = { currentAvgPrice, prevAvgPrice };

      avgTotalCurrent += currentAvgPrice * cfg.quantity;
      avgTotalPrev += prevAvgPrice * cfg.quantity;
    });

    return {
      currentMap,
      prevMap,
      companyTotals,
      itemAverages,
      avgTotalCurrent,
      avgTotalPrev
    };
  }, [data, selectedQuarter, prevQuarter, companies]);

  const renderTrendBadge = (curr: number, prev: number) => {
    if (!prev || !curr) return null;
    const diff = curr - prev;
    const percent = Math.round((diff / prev) * 1000) / 10;
    const ratio = Math.round((curr / prev) * 100);

    if (diff > 0) {
      return (
        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center justify-end gap-0.5 mt-0.5">
          <ArrowUpRight className="h-3 w-3" /> {ratio}% (+{percent}%)
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-end gap-0.5 mt-0.5">
          <ArrowDownRight className="h-3 w-3" /> {ratio}% ({percent}%)
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center justify-end gap-0.5 mt-0.5">
        100% (0.0%)
      </span>
    );
  };

  if (quarters.length === 0 || !selectedQuarter || !comparisonData) {
    return null;
  }

  return (
    <Card className="w-full bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800/80 shadow-md">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Percent className="h-5 w-5 text-indigo-500" />
            건설사별 분기 실적단가 및 금액 비교 현황
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            선택된 분기의 공종별 단가 및 수량 곱 연산 금액을 보여주며, 전분기 대비 증감율을 건설사별 및 전체 평균으로 확인합니다.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
            비교 기준 분기:
          </span>
          <Select
            value={selectedQuarter}
            onChange={setSelectedQuarter}
            options={quarterOptions}
            className="w-44"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full text-xs text-left border-collapse min-w-[1400px] table-fixed">
            <thead>
              {/* Dummy row to enforce exact column widths in table-fixed layout */}
              <tr className="h-0 select-none pointer-events-none p-0 border-none">
                <th className="h-0 py-0 border-none w-16"></th>
                <th className="h-0 py-0 border-none w-52"></th>
                <th className="h-0 py-0 border-none w-12"></th>
                <th className="h-0 py-0 border-none w-20"></th>
                {companies.map((comp) => (
                  <React.Fragment key={`col-size-${comp}`}>
                    <th className="h-0 py-0 border-none w-32"></th>
                    <th className="h-0 py-0 border-none w-40"></th>
                  </React.Fragment>
                ))}
                {/* Average columns size */}
                <th className="h-0 py-0 border-none w-32"></th>
                <th className="h-0 py-0 border-none w-40"></th>
              </tr>
              {/* Row 1: Headers */}
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                <th rowSpan={2} className="px-3 py-3 text-center border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-slate-50 dark:bg-slate-900 z-20">구분</th>
                <th rowSpan={2} className="px-3 py-3 text-center border-r border-slate-200 dark:border-slate-800 sticky left-[64px] bg-slate-50 dark:bg-slate-900 z-20">품명</th>
                <th rowSpan={2} className="px-3 py-3 text-center border-r border-slate-200 dark:border-slate-800 sticky left-[272px] bg-slate-50 dark:bg-slate-900 z-20">단위</th>
                <th rowSpan={2} className="px-3 py-3 text-center border-r border-slate-200 dark:border-slate-800 sticky left-[320px] bg-slate-50 dark:bg-slate-900 z-20">수량</th>
                {companies.map((comp) => (
                  <th key={comp} colSpan={2} className="px-3 py-3 text-center border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 font-extrabold text-sm">
                    {comp}
                  </th>
                ))}
                {/* Average Column Header */}
                <th colSpan={2} className="px-3 py-3 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-extrabold text-sm">
                  평균
                </th>
              </tr>
              {/* Row 2: Headers */}
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-550 font-bold">
                {companies.map((comp) => (
                  <React.Fragment key={`sub-${comp}`}>
                    <th className="px-3 py-2 text-right border-r border-slate-100 dark:border-slate-800/55">단가</th>
                    <th className="px-3 py-2 text-right border-r border-slate-200 dark:border-slate-800">금액</th>
                  </React.Fragment>
                ))}
                {/* Average Sub Headers */}
                <th className="px-3 py-2 text-right border-r border-slate-100 dark:border-slate-800/55 bg-indigo-50/20 dark:bg-indigo-950/10 text-indigo-900 dark:text-indigo-305">단가</th>
                <th className="px-3 py-2 text-right border-r border-slate-200 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-305">금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {ITEM_CONFIGS.map((cfg, idx) => {
                const isBondong = cfg.division === '본동(아파트)';

                const avgPrice = comparisonData.itemAverages[cfg.name]?.currentAvgPrice || 0;
                const prevAvgPrice = comparisonData.itemAverages[cfg.name]?.prevAvgPrice || 0;
                const avgAmount = avgPrice * cfg.quantity;

                return (
                  <tr key={cfg.name} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                    {/* Division column */}
                    <td className="px-2 py-3 font-bold text-center bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-10 text-[11px] text-slate-500">
                      {isBondong ? (
                        <>
                          <span>본동</span>
                          <span className="block text-[9px] font-normal text-slate-400 dark:text-slate-500">(아파트)</span>
                        </>
                      ) : (
                        <>
                          <span>부대동</span>
                          <span className="block text-[9px] font-normal text-slate-400 dark:text-slate-500">(주차장)</span>
                        </>
                      )}
                    </td>

                    {/* Sticky columns */}
                    <td className="px-3 py-2.5 font-medium border-r border-slate-150 dark:border-slate-850 sticky left-[64px] bg-white dark:bg-slate-950 z-10 truncate" title={cfg.displayName || cfg.name}>
                      {cfg.displayName || cfg.name}
                    </td>
                    <td className="px-3 py-2.5 text-center border-r border-slate-150 dark:border-slate-850 sticky left-[272px] bg-white dark:bg-slate-950 z-10 text-slate-400">
                      {cfg.unit}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium border-r border-slate-200 dark:border-slate-800 sticky left-[320px] bg-white dark:bg-slate-950 z-10 text-slate-500">
                      {cfg.quantity.toLocaleString()}
                    </td>

                    {/* Company Unit Price / Amount */}
                    {companies.map((comp) => {
                      const curRow = comparisonData.currentMap[comp]?.[cfg.name];
                      const prevRow = comparisonData.prevMap[comp]?.[cfg.name];

                      const curPrice = curRow ? curRow.price : 0;
                      const prevPrice = prevRow ? prevRow.price : 0;
                      const curAmount = curPrice * cfg.quantity;

                      return (
                        <React.Fragment key={`${comp}-${cfg.name}`}>
                          {/* Unit Price with Growth Badge */}
                          <td className="px-3 py-2.5 text-right border-r border-slate-100 dark:border-slate-800/55 font-medium">
                            {curPrice > 0 ? (
                              <>
                                <span className="text-slate-800 dark:text-slate-200">{curPrice.toLocaleString()}원</span>
                                {renderTrendBadge(curPrice, prevPrice)}
                              </>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700">-</span>
                            )}
                          </td>
                          {/* Total Amount */}
                          <td className="px-3 py-2.5 text-right border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-slate-100 bg-slate-50/10 dark:bg-slate-900/5">
                            {curPrice > 0 ? (
                              `${curAmount.toLocaleString()}원`
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700">-</span>
                            )}
                          </td>
                        </React.Fragment>
                      );
                    })}

                    {/* Average Unit Price / Amount Columns */}
                    <td className="px-3 py-2.5 text-right border-r border-slate-100 dark:border-slate-800/55 font-semibold bg-indigo-50/10 dark:bg-indigo-950/5 text-indigo-905 dark:text-indigo-200">
                      {avgPrice > 0 ? (
                        <>
                          <span className="text-slate-800 dark:text-slate-200">{Math.round(avgPrice).toLocaleString()}원</span>
                          {renderTrendBadge(avgPrice, prevAvgPrice)}
                        </>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right border-r border-slate-200 dark:border-slate-800 font-extrabold bg-indigo-50/20 dark:bg-indigo-950/10 text-indigo-905 dark:text-indigo-200">
                      {avgPrice > 0 ? (
                        `${Math.round(avgAmount).toLocaleString()}원`
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Total Sum Row */}
              <tr className="bg-slate-50/70 dark:bg-slate-900/60 border-t-2 border-slate-350 dark:border-slate-750 font-bold text-slate-800 dark:text-slate-205">
                <td colSpan={4} className="px-4 py-3 text-center border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-slate-100 dark:bg-slate-900 z-20 font-bold text-sm text-indigo-700 dark:text-indigo-400">
                  합 계
                </td>
                {companies.map((comp) => {
                  const totals = comparisonData.companyTotals.find(t => t.company === comp);
                  return (
                    <React.Fragment key={`total-${comp}`}>
                      <td className="px-3 py-3 border-r border-slate-100 dark:border-slate-800/55 bg-indigo-50/5 dark:bg-indigo-950/5"></td>
                      <td className="px-3 py-3 text-right border-r border-slate-200 dark:border-slate-800 font-extrabold text-sm text-indigo-700 dark:text-indigo-400 bg-indigo-50/10 dark:bg-indigo-950/10">
                        {totals && totals.currentTotal > 0 ? (
                          `${totals.currentTotal.toLocaleString()}원`
                        ) : (
                          '-'
                        )}
                      </td>
                    </React.Fragment>
                  );
                })}
                {/* Average Total Sum */}
                <td className="px-3 py-3 border-r border-slate-100 dark:border-slate-800/55 bg-indigo-100/10 dark:bg-indigo-900/10"></td>
                <td className="px-3 py-3 text-right border-r border-slate-200 dark:border-slate-800 font-black text-sm text-indigo-800 dark:text-indigo-300 bg-indigo-100/20 dark:bg-indigo-900/20">
                  {comparisonData.avgTotalCurrent > 0 ? (
                    `${Math.round(comparisonData.avgTotalCurrent).toLocaleString()}원`
                  ) : (
                    '-'
                  )}
                </td>
              </tr>

              {/* vs. Previous Quarter Row */}
              <tr className="bg-amber-50/30 dark:bg-amber-950/10 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200">
                <td colSpan={4} className="px-4 py-3.5 text-center border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-amber-100 dark:bg-amber-900 z-20 font-extrabold text-amber-700 dark:text-amber-400">
                  前 분기 대비
                </td>
                {companies.map((comp) => {
                  const totals = comparisonData.companyTotals.find(t => t.company === comp);
                  const hasPrev = totals && totals.prevTotal > 0;
                  const ratio = totals ? totals.ratio : null;
                  const rate = totals ? totals.changeRate : null;

                  let textColor = "text-slate-500 dark:text-slate-400";
                  let bgTint = "bg-amber-50/5 dark:bg-amber-950/5";
                  let icon = null;

                  if (rate && rate > 0) {
                    textColor = "text-rose-600 dark:text-rose-400";
                    bgTint = "bg-rose-50/5 dark:bg-rose-950/5";
                    icon = <TrendingUp className="h-4 w-4 text-rose-500 inline mr-0.5" />;
                  } else if (rate && rate < 0) {
                    textColor = "text-blue-600 dark:text-blue-400";
                    bgTint = "bg-blue-50/5 dark:bg-blue-950/5";
                    icon = <TrendingDown className="h-4 w-4 text-blue-500 inline mr-0.5" />;
                  }

                  return (
                    <td key={`ratio-${comp}`} colSpan={2} className={`px-3 py-3.5 text-center border-r border-slate-250 dark:border-slate-800 font-extrabold text-sm ${textColor} ${bgTint}`}>
                      {hasPrev && ratio !== null && rate !== null ? (
                        <span className="flex items-center justify-center gap-1">
                          {icon}
                          <span>{ratio}%</span>
                          <span className="text-[11px] font-semibold">({rate > 0 ? `+${rate}` : rate}%)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-650 font-normal">-</span>
                      )}
                    </td>
                  );
                })}

                {/* Average vs. Previous Quarter */}
                {(() => {
                  const avgTotalCurrent = comparisonData.avgTotalCurrent;
                  const avgTotalPrev = comparisonData.avgTotalPrev;
                  const hasPrev = avgTotalPrev > 0;
                  const ratio = hasPrev ? Math.round((avgTotalCurrent / avgTotalPrev) * 100) : null;
                  const rate = hasPrev ? Math.round(((avgTotalCurrent - avgTotalPrev) / avgTotalPrev) * 1000) / 10 : null;

                  let textColor = "text-slate-500 dark:text-slate-400";
                  let bgTint = "bg-indigo-50/10 dark:bg-indigo-950/10";
                  let icon = null;

                  if (rate && rate > 0) {
                    textColor = "text-rose-600 dark:text-rose-455 font-black";
                    icon = <TrendingUp className="h-4 w-4 text-rose-500 inline mr-0.5" />;
                  } else if (rate && rate < 0) {
                    textColor = "text-blue-600 dark:text-blue-455 font-black";
                    icon = <TrendingDown className="h-4 w-4 text-blue-500 inline mr-0.5" />;
                  }

                  return (
                    <td colSpan={2} className={`px-3 py-3.5 text-center border-r border-slate-250 dark:border-slate-800 font-extrabold text-sm ${textColor} ${bgTint}`}>
                      {hasPrev && ratio !== null && rate !== null ? (
                        <span className="flex items-center justify-center gap-1">
                          {icon}
                          <span>{ratio}%</span>
                          <span className="text-[11px] font-semibold">({rate > 0 ? `+${rate}` : rate}%)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-650 font-normal">-</span>
                      )}
                    </td>
                  );
                })()}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
