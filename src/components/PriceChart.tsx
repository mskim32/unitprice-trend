'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PriceDataRow, COMPANIES, QUARTERS } from '../data/dummyData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { AreaChart, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

// Dynamically import react-apexcharts to prevent SSR errors in Next.js
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface PriceChartProps {
  data: PriceDataRow[];
  selectedItem: string;
  onPointClick: (company: string, quarter: string, amount: number) => void;
}

export const formatKRW = (value: number): string => {
  return new Intl.NumberFormat('ko-KR').format(value) + '원';
};

export const formatBillionKRW = (value: number): string => {
  if (value === 0) return '0원';
  const billion = value / 100000000;
  return billion.toFixed(1) + '억 원';
};

export const PriceChart: React.FC<PriceChartProps> = ({ data, selectedItem, onPointClick }) => {
  // Get all unique quarters present in the data, maintaining the standard order first, then adding new ones
  const quartersList = React.useMemo(() => {
    const list = [...QUARTERS];
    data.forEach(row => {
      if (!list.includes(row.quarter)) {
        list.push(row.quarter);
      }
    });
    return list;
  }, [data]);

  // Aggregate data for each company and quarter
  // Series format: { name: '대우건설', data: [amountQ1, amountQ2, ...] }
  const series = COMPANIES.map((company, cIdx) => {
    const companyData = quartersList.map(quarter => {
      // Find all rows matching company, quarter, and item, and check if includeInGraph is true
      const rows = data.filter(
        row =>
          row.company === company &&
          row.quarter === quarter &&
          (selectedItem === '전체 합계' ? true : row.itemName === selectedItem) &&
          row.includeInGraph
      );
      // Sum up amount = quantity * price
      const totalAmount = rows.reduce((sum, row) => sum + row.quantity * row.price, 0);
      return totalAmount;
    });

    return {
      name: company,
      data: companyData
    };
  });

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
      events: {
        markerClick: (event: any, chartContext: any, { seriesIndex, dataPointIndex }: any) => {
          const company = COMPANIES[seriesIndex];
          const quarter = quartersList[dataPointIndex];
          const amount = series[seriesIndex].data[dataPointIndex];
          onPointClick(company, quarter, amount);
        },
        dataPointSelection: (event: any, chartContext: any, { seriesIndex, dataPointIndex }: any) => {
          const company = COMPANIES[seriesIndex];
          const quarter = quartersList[dataPointIndex];
          const amount = series[seriesIndex].data[dataPointIndex];
          onPointClick(company, quarter, amount);
        },
        click: (event: any, chartContext: any, config: any) => {
          const { seriesIndex, dataPointIndex } = config;
          if (seriesIndex !== -1 && dataPointIndex !== -1 && seriesIndex !== undefined && dataPointIndex !== undefined) {
            const company = COMPANIES[seriesIndex];
            const quarter = quartersList[dataPointIndex];
            const amount = series[seriesIndex].data[dataPointIndex];
            onPointClick(company, quarter, amount);
          }
        }
      },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent'
    },
    colors: [
      '#2563eb', // 대우건설 - Blue
      '#10b981', // GS건설 - Emerald
      '#f59e0b', // DL E&C - Amber
      '#6366f1', // 포스코이앤씨 - Indigo
      '#f43f5e', // 롯데건설 - Rose
      '#8b5cf6', // 현대산업개발 - Violet
      '#06b6d4'  // 두산건설 - Cyan
    ],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2.5
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
      position: 'top',
      horizontalAlign: 'center',
      fontSize: '13px',
      markers: {
        shape: 'circle'
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    }
  };

  return (
    <Card className="w-full bg-slate-50/50 dark:bg-slate-900/10 backdrop-blur-sm border-slate-200/80 dark:border-slate-800/80">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <AreaChart className="h-5 w-5 text-blue-500" />
            건설사별 분기 실적단가 총 금액 추이
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
      <CardContent className="pt-4">
        <div className="w-full overflow-hidden min-h-[380px]">
          <Chart
            options={chartOptions}
            series={series}
            type="area"
            height={380}
          />
        </div>
      </CardContent>
    </Card>
  );
};
