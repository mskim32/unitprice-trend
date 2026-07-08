'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ITEM_CONFIGS, ItemConfig, COMPANIES, QUARTERS } from '../data/dummyData';
import { Plus, PlusCircle, Building2, Calendar, MapPin, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface InputPanelProps {
  onAddData: (newData: {
    quarter: string;
    company: string;
    siteName: string;
    prices: { [itemName: string]: number };
  }) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onAddData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [company, setCompany] = useState(COMPANIES[0]);
  const [quarter, setQuarter] = useState(QUARTERS[0]);
  const [isCustomQuarter, setIsCustomQuarter] = useState(false);
  const [customQuarter, setCustomQuarter] = useState('');
  const [siteName, setSiteName] = useState('');

  // Initial prices state, default to empty strings
  const [prices, setPrices] = useState<{ [key: string]: string }>(() => {
    const initial: { [key: string]: string } = {};
    ITEM_CONFIGS.forEach(cfg => {
      initial[cfg.name] = '';
    });
    return initial;
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePriceChange = (itemName: string, value: string) => {
    // Only allow numbers
    const cleanValue = value.replace(/[^0-9]/g, '');
    setPrices(prev => ({
      ...prev,
      [itemName]: cleanValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedQuarter = isCustomQuarter ? customQuarter.trim() : quarter;

    // Validate inputs
    if (!selectedQuarter) {
      setMessage({ type: 'error', text: '분기를 선택하거나 입력해주세요.' });
      return;
    }


    // Parse prices
    const parsedPrices: { [itemName: string]: number } = {};
    let hasError = false;

    ITEM_CONFIGS.forEach(cfg => {
      const priceStr = prices[cfg.name];
      if (!priceStr) {
        hasError = true;
      }
      parsedPrices[cfg.name] = parseInt(priceStr, 10) || 0;
    });

    if (hasError) {
      setMessage({ type: 'error', text: '모든 품명의 단가를 입력해주세요.' });
      return;
    }

    const finalSiteName = siteName.trim() || '-';

    // Call submit handler
    onAddData({
      quarter: selectedQuarter,
      company,
      siteName: finalSiteName,
      prices: parsedPrices
    });

    // Success feedback
    setMessage({ type: 'success', text: `${company} [${selectedQuarter}${finalSiteName !== '-' ? ` - ${finalSiteName}` : ''}] 실적 데이터가 등록되었습니다.` });
    
    // Reset form fields (except company/quarter for batch convenience)
    setSiteName('');
    setPrices(() => {
      const initial: { [key: string]: string } = {};
      ITEM_CONFIGS.forEach(cfg => {
        initial[cfg.name] = '';
      });
      return initial;
    });

    // Clear feedback message after 3 seconds
    setTimeout(() => {
      setMessage(null);
    }, 4000);
  };



  // Group configurations by division
  const bondongConfigs = ITEM_CONFIGS.filter(cfg => cfg.division === '본동(아파트)');
  const budaedongConfigs = ITEM_CONFIGS.filter(cfg => cfg.division === '부대동(주차장등)');

  return (
    <Card className="w-full border-slate-200 dark:border-slate-800 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left focus:outline-none cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors rounded-t-2xl"
      >
        <div className="flex items-center gap-3">
          <div className={clsx(
            "p-2 rounded-xl text-white transition-all duration-300",
            isOpen ? "bg-blue-600 shadow-md shadow-blue-500/20" : "bg-slate-700"
          )}>
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              분기별 실적 데이터 신규 등록
              {!isOpen && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              특정 분기, 건설사, 현장에 대해 본동/부대동 8개 표준 공종의 실제 실적 단가를 일괄 입력하여 대시보드에 반영합니다.
            </CardDescription>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <CardContent className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-5">
            {/* Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
              {/* Construction Company */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-blue-500" /> 건설사 선택
                </label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  {COMPANIES.map(comp => (
                    <option key={comp} value={comp}>{comp}</option>
                  ))}
                </select>
              </div>

              {/* Quarter Selection */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-500" /> 분기 선택
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomQuarter(!isCustomQuarter)}
                    className="text-[10px] text-blue-600 hover:underline focus:outline-none dark:text-blue-400 font-semibold"
                  >
                    {isCustomQuarter ? '선택창으로 전환' : '직접 입력하기'}
                  </button>
                </div>
                {isCustomQuarter ? (
                  <input
                    type="text"
                    value={customQuarter}
                    onChange={(e) => setCustomQuarter(e.target.value)}
                    placeholder="예: 26년 2/4분기"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                ) : (
                  <select
                    value={quarter}
                    onChange={(e) => setQuarter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    {QUARTERS.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Site Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-rose-500" /> 현장명 입력
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="예: 서울 마포 현장, 경기 분당 현장 (선택사항)"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Price Inputs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Group A: Bondong */}
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-blue-500 rounded-full" />
                  본동 (아파트) 공종 단가 설정
                </h4>
                <div className="flex flex-col gap-4">
                  {bondongConfigs.map((cfg) => (
                    <div key={cfg.name} className="grid grid-cols-12 items-center gap-2 text-xs">
                      <div className="col-span-6 flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={cfg.displayName || cfg.name}>
                          {cfg.displayName || cfg.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          수량: {cfg.quantity.toLocaleString()} {cfg.unit}
                        </span>
                      </div>
                      <div className="col-span-6 relative flex items-center">
                        <input
                          type="text"
                          required
                          value={prices[cfg.name]}
                          onChange={(e) => handlePriceChange(cfg.name, e.target.value)}
                          placeholder="단가 입력"
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-right text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                        />
                        <span className="absolute right-3 text-[10px] text-slate-400 font-bold">원</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group B: Budaedong */}
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full" />
                  부대동 (주차장 등) 공종 단가 설정
                </h4>
                <div className="flex flex-col gap-4">
                  {budaedongConfigs.map((cfg) => (
                    <div key={cfg.name} className="grid grid-cols-12 items-center gap-2 text-xs">
                      <div className="col-span-6 flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={cfg.displayName || cfg.name}>
                          {cfg.displayName || cfg.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          수량: {cfg.quantity.toLocaleString()} {cfg.unit}
                        </span>
                      </div>
                      <div className="col-span-6 relative flex items-center">
                        <input
                          type="text"
                          required
                          value={prices[cfg.name]}
                          onChange={(e) => handlePriceChange(cfg.name, e.target.value)}
                          placeholder="단가 입력"
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-right text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                        />
                        <span className="absolute right-3 text-[10px] text-slate-400 font-bold">원</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions and Messages */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div>
                {message && (
                  <div className={clsx(
                    "text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2",
                    message.type === 'success' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                  )}>
                    {message.type === 'success' && <Check className="h-3.5 w-3.5" />}
                    {message.text}
                  </div>
                )}
              </div>
              <div className="flex gap-2 self-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-lg cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-200"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  실적 데이터 일괄 등록
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
};
