'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PriceDataRow, COMPANIES, QUARTERS } from '../data/dummyData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { AreaChart } from 'lucide-react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface PriceChartProps {
  data: PriceDataRow[];
  selectedItem: string;
  onPointClick?: (company: string, quarter: string, amount: number) => void;
}

export const formatKRW = (value: number): string => {
  return new Intl.NumberFormat('ko-KR').format(value) + '원';
};

export const formatBillionKRW = (value: number): string => {
  if (value === 0) return '0원';
  const billion = value / 100000000;
  return billion.toFixed(1) + '억 원';
};

export const COMPANY_COLORS: { [key: string]: string } = {
  '대우건설': '#2563eb',
  'GS건설': '#10b981',
  'DL E&C': '#f59e0b',
  '포스코이앤씨': '#6366f1',
  '롯데건설': '#f43f5e',
  '현대산업개발': '#8b5cf6',
  '두산건설': '#06b6d4',
  '평균': '#64748b'
};

export const PriceChart: React.FC<PriceChartProps> = ({ data, selectedItem }) => {
  const [selectedCompanies, setSelectedCompanies] = React.useState<string[]>([
    ...COMPANIES,
    '평균'
  ]);

  const quartersList = React.useMemo(() => {
    const list = [...QUARTERS];
    data.forEach(row => {
      if (!list.includes(row.quarter)) {
        list.push(row.quarter);
      }
    });
    return list;
  }, [data]);

  const allSeries = React.useMemo(() => {
    const companySeries = COMPANIES.map((company) => {
      const companyData = quartersList.map(quarter => {
        const rows = data.filter(
          row =>
            row.company === company &&
            row.quarter === quarter &&
            (selectedItem === '전체 합계' ? true : row.itemName === selectedItem) &&
            row.includeInGraph
        );
        return rows.reduce((sum, row) => sum + row.quantity * row.price, 0);
      });

      return {
        name: company,
        data: companyData
      };
    });

    const averageData = quartersList.map(quarter => {
      const activeAmounts = COMPANIES.map(company => {
        const rows = data.filter(
          row =>
            row.company === company &&
            row.quarter === quarter &&
            (selectedItem === '전체 합계' ? true : row.itemName === selectedItem) &&
            row.includeInGraph
        );
        if (rows.length === 0) return null;
        return rows.reduce((sum, row) => sum + row.quantity * row.price, 0);
      }).filter((amt): amt is number => amt !== null);

      if (activeAmounts.length === 0) return 0;
      return Math.round(activeAmounts.reduce((sum, val) => sum + val, 0) / activeAmounts.length);
    });

    const avgSeries = {
      name: '평균',
      data: averageData
    };

    return [...companySeries, avgSeries];
  }, [data, quartersList, selectedItem]);

  const activeSeries = React.useMemo(() => {
    return allSeries.filter(s => selectedCompanies.includes(s.name));
  }, [allSeries, selectedCompanies]);

  const activeColors = React.useMemo(() => {
    return activeSeries.map(s => COMPANY_COLORS[s.name] || '#64748b');
  }, [activeSeries]);

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      height: 380,
      toolbar: {
        show: true,
        tools: {
          download: false,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        },
        autoSelected: 'zoom'
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent'
    },
    colors: activeColors,
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: activeSeries.map(s => s.name === '평균' ? 3.5 : 2.5),
      dashArray: activeSeries.map(s => s.name === '평균' ? 5 : 0)
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 95, 100]
      }
    },
    markers: {
      size: 5,
      strokeWidth: 2,
      hover: {
        size: 7,
        sizeOffset: 3
      }
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
      padding: {
        left: 20,
        right: 20
      },
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    xaxis: {
      categories: quartersList,
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        formatter: (val) => formatBillionKRW(val),
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => formatKRW(val)
      },
      x: {
        show: true
      },
      theme: 'light',
      style: {
        fontSize: '13px'
      }
    },
    legend: {
      show: false
    }
  };

  return (
    <Card className="w-full bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800/80 shadow-md">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-3 space-y-0 gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <AreaChart className="h-5 w-5 text-blue-500" />
            건설사별 골조공사 실적 추이
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
            선택된 품명 <strong>[{selectedItem}]</strong>의 분기별 실적 합계 금액 (Quantity × Price) Trend 분석
          </CardDescription>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 bg-white dark:bg-slate-950">
          <span className="font-semibold text-slate-500">Tip:</span>
          <span>마우스로 드래그하여 X축을 확대(Zoom)할 수 있습니다.</span>
        </div>
      </CardHeader>

      <div className="px-6 pb-4 flex flex-wrap gap-2 items-center border-b border-slate-100 dark:border-slate-800/50">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">그래프 표시:</span>
        <button
          onClick={() => {
            const allItems = [...COMPANIES, '평균'];
            if (selectedCompanies.length === allItems.length) {
              setSelectedCompanies([]);
            } else {
              setSelectedCompanies(allItems);
            }
          }}
          className="px-2 py-1 text-[11px] font-bold rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          {selectedCompanies.length === COMPANIES.length + 1 ? '전체 해제' : '전체 선택'}
        </button>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
        {[...COMPANIES, '평균'].map(name => {
          const isSelected = selectedCompanies.includes(name);
          const color = COMPANY_COLORS[name];
          
          return (
            <button
              key={name}
              onClick={() => {
                if (isSelected) {
                  setSelectedCompanies(prev => prev.filter(c => c !== name));
                } else {
                  setSelectedCompanies(prev => [...prev, name]);
                }
              }}
              style={{
                borderColor: isSelected ? color : '#e2e8f0',
                backgroundColor: isSelected ? `${color}12` : 'transparent',
                color: isSelected ? color : undefined
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
                isSelected 
                  ? 'border-2 font-bold' 
                  : 'border-slate-200 dark:border-slate-800/80 text-slate-450 dark:text-slate-500 hover:border-slate-350 dark:hover:border-slate-700'
              }`}
            >
              <span 
                className={`w-2 h-2 rounded-full ${name === '평균' ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: color }} 
              />
              {name}
            </button>
          );
        })}
      </div>

      <CardContent className="pt-4">
        <div className="w-full overflow-hidden min-h-[380px]">
          {activeSeries.length > 0 ? (
            <Chart
              options={chartOptions}
              series={activeSeries}
              type="area"
              height={380}
            />
          ) : (
            <div className="h-[380px] flex flex-col items-center justify-center text-slate-450 dark:text-slate-550 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <AreaChart className="h-10 w-10 text-slate-300 mb-2 animate-bounce" />
              <p className="text-sm font-semibold">표시할 그래프가 없습니다.</p>
              <p className="text-xs mt-1">상단에서 표시할 건설사나 평균을 선택해주세요.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
