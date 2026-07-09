'use client';

import React, { useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, CellValueChangedEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { PriceDataRow, QUARTERS, COMPANIES, ITEM_CONFIGS } from '../data/dummyData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, CheckSquare, Edit3 } from 'lucide-react';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Register all community features (such as cell editors)
ModuleRegistry.registerModules([AllCommunityModule]);

// Korean localization for AG Grid
const AG_GRID_LOCALE_KO = {
  // Set Filter
  selectAll: '(전체 선택)',
  selectAllSearchResults: '(검색 결과 전체 선택)',
  searchOoo: '검색...',
  noMatches: '일치하는 결과가 없습니다.',

  // Number Filter & Text Filter
  filterOoo: '필터...',
  equals: '같음',
  notEqual: '같지 않음',
  blank: '빈 값',
  notBlank: '빈 값 아님',
  empty: '선택해 주세요',

  // Number Filter
  lessThan: '미만',
  greaterThan: '초과',
  lessThanOrEqual: '이하',
  greaterThanOrEqual: '이상',
  inRange: '범위 내',
  inRangeStart: '시작값',
  inRangeEnd: '종료값',

  // Text Filter
  contains: '포함',
  notContains: '포함하지 않음',
  startsWith: '시작 문자',
  endsWith: '끝 문자',

  // Date Filter
  dateFormatOoo: 'yyyy-mm-dd',
  before: '이전',
  after: '이후',

  // Filter Conditions
  andCondition: '그리고',
  orCondition: '또는',

  // Filter Buttons
  applyFilter: '적용',
  clearFilter: '지우기',
  resetFilter: '초기화',
  cancelFilter: '취소',

  // Header Options
  pinColumn: '열 고정',
  pinLeft: '왼쪽 고정',
  pinRight: '오른쪽 고정',
  noPin: '고정 해제',
  valueAggregation: '값 합계',
  autosizeThiscolumn: '이 열 너비 자동 맞춤',
  autosizeAllColumns: '모든 열 너비 자동 맞춤',
  groupBy: '그룹화 기준',
  ungroupBy: '그룹화 해제',
  addToValues: '값에 추가',
  addToLabels: '레이블에 추가',

  // Rows
  noRowsToShow: '표시할 행이 없습니다.',

  // Column Menu
  pinColumnTitle: '열 고정',
  valueAggregationTitle: '값 집계',
  autosizeThiscolumnTitle: '이 열 너비 자동 맞춤',
  autosizeAllColumnsTitle: '모든 열 너비 자동 맞춤',
  groupByTitle: '그룹화 기준',
  ungroupByTitle: '그룹화 해제',
  
  // Grid
  loadingOoo: '불러오는 중...',
};

interface PriceGridProps {
  rowData: PriceDataRow[];
  onRowDataChange: (updatedRow: PriceDataRow) => void;
  onDeleteRows: (ids: string[]) => void;
  onEditBatch: (company: string, quarter: string, siteName: string) => void;
}

// Custom Checkbox Cell Renderer for interactive toggle
const CheckboxCellRenderer = (params: any) => {
  const checked = params.value;
  const handleChange = () => {
    const newValue = !checked;
    params.node.setDataValue(params.colDef.field, newValue);
  };

  return (
    <div className="flex items-center justify-center h-full">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600 transition-colors"
      />
    </div>
  );
};

export const PriceGrid: React.FC<PriceGridProps> = ({
  rowData,
  onRowDataChange,
  onDeleteRows,
  onEditBatch
}) => {
  const gridRef = useRef<AgGridReact<PriceDataRow>>(null);

  const handleDeleteSelected = () => {
    const selectedData = (gridRef.current?.api.getSelectedRows() || []) as PriceDataRow[];
    if (selectedData.length === 0) {
      alert('삭제할 데이터를 선택해주세요.');
      return;
    }
    if (window.confirm(`선택한 ${selectedData.length}개의 실적 데이터를 정말로 삭제하시겠습니까?`)) {
      const idsToDelete = selectedData.map(row => row.id);
      onDeleteRows(idsToDelete);
    }
  };

  // Configure row selection for AG Grid v32
  const rowSelection = useMemo(() => ({
    mode: 'multiRow' as const,
    checkboxes: true,
    headerCheckbox: true,
  }), []);

  // Column definitions
  const columnDefs = useMemo<ColDef<PriceDataRow>[]>(() => [
    {
      headerName: '그래프 반영',
      field: 'includeInGraph',
      width: 110,
      cellRenderer: CheckboxCellRenderer,
      pinned: 'left',
      filter: false,
      sortable: false,
      cellClass: 'flex items-center justify-center'
    },
    {
      headerName: '분기 (선택수정 ✎)',
      field: 'quarter',
      width: 140,
      filter: 'agTextColumnFilter',
      pinned: 'left',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: QUARTERS
      }
    },
    {
      headerName: '건설사 (선택수정 ✎)',
      field: 'company',
      width: 140,
      filter: 'agTextColumnFilter',
      pinned: 'left',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: COMPANIES
      }
    },
    {
      headerName: '현장명',
      field: 'siteName',
      minWidth: 260,
      flex: 1,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: '구분',
      field: 'division',
      width: 130,
      filter: 'agTextColumnFilter',
      cellClass: 'text-center'
    },
    {
      headerName: '품명',
      field: 'itemName',
      width: 250,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: '규격 (선택수정 ✎)',
      field: 'spec',
      width: 180,
      filter: 'agTextColumnFilter',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: Array.from(new Set(ITEM_CONFIGS.map(cfg => cfg.spec)))
      }
    },
    {
      headerName: '단위',
      field: 'unit',
      width: 90,
      cellClass: 'text-center'
    },
    {
      headerName: '수량',
      field: 'quantity',
      width: 120,
      type: 'numericColumn',
      valueFormatter: (params) => {
        return params.value ? new Intl.NumberFormat('ko-KR').format(params.value) : '0';
      }
    },
    {
      headerName: '단가 (수정가능 ✎)',
      field: 'price',
      width: 140,
      editable: true,
      type: 'numericColumn',
      cellClass: 'editable-price-cell text-right font-semibold border-l border-r border-blue-200/50 dark:border-blue-800/40',
      valueFormatter: (params) => {
        return params.value ? new Intl.NumberFormat('ko-KR').format(params.value) + '원' : '0원';
      },
      valueParser: (params) => {
        if (typeof params.newValue === 'string') {
          const cleanValue = params.newValue.replace(/,/g, '');
          const newValue = parseInt(cleanValue, 10);
          return isNaN(newValue) ? 0 : newValue;
        }
        const newValue = parseInt(params.newValue, 10);
        return isNaN(newValue) ? 0 : newValue;
      }
    },
    {
      headerName: '총 금액 (단가×수량)',
      width: 180,
      type: 'numericColumn',
      valueGetter: (params) => {
        if (!params.data) return 0;
        return params.data.price * params.data.quantity;
      },
      valueFormatter: (params) => {
        return params.value ? new Intl.NumberFormat('ko-KR').format(params.value) + '원' : '0원';
      },
      cellClass: 'font-semibold text-slate-800 dark:text-slate-200'
    }
  ], []);

  // Default column properties
  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    suppressMovable: true
  }), []);

  // Handle cell value change
  const handleCellValueChanged = (event: CellValueChangedEvent<PriceDataRow>) => {
    if (event.data) {
      onRowDataChange(event.data);
    }
  };

  return (
    <Card className="w-full bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800/80">
      <CardHeader className="flex flex-col gap-1 pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Table className="h-5 w-5 text-indigo-500" />
              현장별 상세 실적 데이터 관리
            </CardTitle>
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white rounded-lg cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-500/10 hover:shadow-rose-500/20 transition-all duration-200"
            >
              선택 삭제
            </button>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded"></span>
              <span className="text-slate-500 dark:text-slate-400">인라인 단가 입력 칸 (수정 시 실시간 차트 반영)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 flex items-center justify-center border border-slate-300 rounded bg-slate-50"><CheckSquare className="w-3 h-3 text-blue-600" /></span>
              <span className="text-slate-500 dark:text-slate-400">체크 해제 시 차트에서 실시간 제외</span>
            </div>
          </div>
        </div>
        <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
          단가 셀을 <strong>더블 클릭하여 금액을 직접 변경</strong>하거나, 그래프 반영 체크박스를 선택 해제하여 제외할 수 있습니다. 
          또한, <strong>행을 클릭하면 상단 신규등록 패널이 수정 모드로 전환</strong>되어 일괄 수정등록이 가능합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="ag-theme-quartz dark:ag-theme-quartz-dark w-full h-[520px] rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800">
          <AgGridReact
            ref={gridRef}
            theme="legacy"
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
            onCellValueChanged={handleCellValueChanged}
            suppressCellFocus={true}
            headerHeight={48}
            rowHeight={44}
            rowSelection={rowSelection}
            suppressRowClickSelection={true}
            localeText={AG_GRID_LOCALE_KO}
            onRowClicked={(event) => {
              if (event.data) {
                const { company, quarter, siteName } = event.data;
                onEditBatch(company, quarter, siteName);
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
