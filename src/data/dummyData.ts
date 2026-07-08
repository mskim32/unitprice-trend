export interface PriceDataRow {
  id: string;
  quarter: string;
  company: string;
  siteName: string;
  itemName: string;
  division: string; // '본동(아파트)' | '부대동(주차장등)'
  spec: string;
  unit: string;
  quantity: number;
  price: number;
  includeInGraph: boolean;
}

export interface ItemConfig {
  name: string;
  displayName?: string;
  division: string;
  unit: string;
  quantity: number;
  basePrice: number;
  spec: string;
}

export const ITEM_CONFIGS: ItemConfig[] = [
  {
    name: '[아파트]거푸집(AL폼)',
    displayName: '거푸집(AL폼)공임+손료(부자재)+정리비',
    division: '본동(아파트)',
    unit: 'M2',
    quantity: 512166,
    basePrice: 17200,
    spec: '본동 거푸집 공사'
  },
  {
    name: '[아파트]철근조립비',
    displayName: '철근조립비(가공비제외)',
    division: '본동(아파트)',
    unit: 'TON',
    quantity: 5006,
    basePrice: 380000,
    spec: '본동 철근 조립'
  },
  {
    name: '[아파트]시스템비계',
    displayName: '시스템비계(공임+사용료)',
    division: '본동(아파트)',
    unit: 'M2',
    quantity: 8047,
    basePrice: 16000,
    spec: '본동 시스템비계'
  },
  {
    name: '[아파트]콘크리트타설',
    displayName: '콘크리트타설(공임+장비비)',
    division: '본동(아파트)',
    unit: 'M3',
    quantity: 67223,
    basePrice: 20000,
    spec: '본동 콘크리트 타설'
  },
  {
    name: '[부대동]철근조립비',
    displayName: '철근조립비(가공비제외)부대동',
    division: '부대동(주차장등)',
    unit: 'TON',
    quantity: 4588,
    basePrice: 390000,
    spec: '부대동 철근 조립'
  },
  {
    name: '[부대동]시스템비계',
    displayName: '시스템비계(공임+사용료)(부대동)',
    division: '부대동(주차장등)',
    unit: 'M2',
    quantity: 14103,
    basePrice: 15500,
    spec: '부대동 시스템비계'
  },
  {
    name: '[부대동]재래식FORM',
    displayName: 'WOOD FORM(공임+사용료)',
    division: '부대동(주차장등)',
    unit: 'M2',
    quantity: 112434,
    basePrice: 73500,
    spec: '부대동 WOOD FORM'
  },
  {
    name: '[부대동]콘크리트타설',
    displayName: '콘크리트타설(공임+장비비)(부대동)',
    division: '부대동(주차장등)',
    unit: 'M3',
    quantity: 67746,
    basePrice: 21000,
    spec: '부대동 콘크리트 타설'
  }
];

export const ITEMS = ITEM_CONFIGS.map(cfg => cfg.name);

export const COMPANIES = [
  '대우건설',
  'GS건설',
  'DL E&C',
  '포스코이앤씨',
  '롯데건설',
  '현대산업개발',
  '두산건설'
];

export const QUARTERS = [
  '23년 2/4분기',
  '23년 3/4분기',
  '23년 4/4분기',
  '24년 1/4분기',
  '24년 2/4분기',
  '24년 3/4분기',
  '24년 4/4분기',
  '25년 1/4분기',
  '25년 2/4분기',
  '25년 3/4분기',
  '25년 4/4분기',
  '26년 1/4분기',
  '26년 2/4분기',
  '26년 3/4분기',
  '26년 4/4분기'
];

// Helper to generate realistic site names
const getSiteName = (company: string, quarter: string, index: number): string => {
  const regions = ['서울 서초', '경기 분당', '인천 송도', '부산 해운대', '대구 수성', '광주 광산', '대전 유성', '경기 일산', '서울 마포', '서울 송파'];
  const types = ['공동주택 신축공사', '주상복합 신축공사', '아파트 재건축사업', '복합시설 건립공사'];
  const region = regions[(company.length + quarter.length + index) % regions.length];
  const type = types[(company.length * index) % types.length];
  return `${region} ${company} ${type}`;
};

// Generate base prices that trend upwards but have some noise
const getTrendedPrice = (basePrice: number, quarterIndex: number, companyIndex: number): number => {
  let trend = quarterIndex * 0.025; // 2.5% increase per quarter
  let companyFactor = 1 + ((companyIndex - 3) * 0.015); // ±4.5% variation by company
  const rawPrice = basePrice * (1 + trend) * companyFactor;
  const noise = (Math.sin(quarterIndex * 1.5 + companyIndex) * 0.02) * basePrice;
  return Math.round((rawPrice + noise) / 100) * 100;
};

// Compile all dummy data
export const generateDummyData = (): PriceDataRow[] => {
  const data: PriceDataRow[] = [];
  let idCounter = 1;

  QUARTERS.forEach((quarter, qIdx) => {
    COMPANIES.forEach((company, cIdx) => {
      // For each company/quarter, add all 8 standard items for Site 1
      const siteName = getSiteName(company, quarter, 1);
      ITEM_CONFIGS.forEach(cfg => {
        const price = getTrendedPrice(cfg.basePrice, qIdx, cIdx);
        data.push({
          id: `row-${idCounter++}`,
          quarter,
          company,
          siteName,
          itemName: cfg.name,
          division: cfg.division,
          spec: cfg.spec,
          unit: cfg.unit,
          quantity: cfg.quantity,
          price,
          includeInGraph: true
        });
      });

      // For some quarters, add an extra site (Site 2) to show multiple-site aggregation
      if ((qIdx + cIdx) % 4 === 0) {
        const siteName2 = getSiteName(company, quarter, 2);
        ITEM_CONFIGS.forEach(cfg => {
          const price = Math.round(getTrendedPrice(cfg.basePrice, qIdx, cIdx) * 1.03 / 100) * 100;
          data.push({
            id: `row-${idCounter++}`,
            quarter,
            company,
            siteName: siteName2,
            itemName: cfg.name,
            division: cfg.division,
            spec: cfg.spec,
            unit: cfg.unit,
            quantity: Math.round(cfg.quantity * 0.5), // half quantity for secondary site
            price,
            includeInGraph: true
          });
        });
      }
    });
  });

  return data;
};
