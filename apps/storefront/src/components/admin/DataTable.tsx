"use client";

import React, { useState, useMemo } from "react";
import { showConfirm } from "@/components/ui/AlertModal";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Check,
  Trash2,
  SlidersHorizontal,
  RefreshCw
} from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  hidden?: boolean;
  searchValue?: (item: T) => string;
  sortValue?: (item: T) => any;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  initialPageSize?: number;
  loading?: boolean;
  onRefresh?: () => void;
  onBulkDelete?: (selectedIds: string[]) => void;
  actions?: React.ReactNode;
  exportFileName?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  title,
  subtitle,
  searchPlaceholder = "Search across records...",
  initialPageSize = 10,
  loading = false,
  onRefresh,
  onBulkDelete,
  actions,
  exportFileName = "export",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnVisibility, setColumnVisibility] = useState<{ [key: string]: boolean }>(() => {
    const map: { [key: string]: boolean } = {};
    columns.forEach((col) => {
      map[col.key] = !col.hidden;
    });
    return map;
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  // 1. Filtered Data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const rawSearch = searchTerm.trim().toLowerCase();
    const tokens = rawSearch.split(/\s+/).filter(Boolean);

    return data.filter((item) => {
      // Build composite searchable corpus
      const compositeParts: string[] = [];

      columns.forEach((col) => {
        if (col.searchable === false) return;
        if (col.searchValue) {
          const custom = col.searchValue(item);
          if (custom) compositeParts.push(String(custom));
        } else if (item[col.key] !== undefined && item[col.key] !== null) {
          compositeParts.push(String(item[col.key]));
        }
      });

      // Canonical fallbacks for items with title, sku, id, handle, or name
      if (item.title) compositeParts.push(String(item.title));
      if (item.name) compositeParts.push(String(item.name));
      if (item.sku) compositeParts.push(String(item.sku));
      if (item.supplier_sku) compositeParts.push(String(item.supplier_sku));
      if (item.id) compositeParts.push(String(item.id));
      if (item.handle) compositeParts.push(String(item.handle));
      if (item.category_id) compositeParts.push(String(item.category_id));

      const fullText = compositeParts.join(" ").toLowerCase();

      // Direct full substring match
      if (fullText.includes(rawSearch)) return true;

      // Multi-token match with flexible s/5 number equivalence (e.g. S22 vs 522)
      return tokens.every((token) => {
        if (fullText.includes(token)) return true;
        const altToken = token.startsWith("5")
          ? "s" + token.slice(1)
          : token.startsWith("s")
          ? "5" + token.slice(1)
          : null;
        if (altToken && fullText.includes(altToken)) return true;
        return false;
      });
    });
  }, [data, searchTerm, columns]);

  // 2. Sorted Data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const currentCol = columns.find((c) => c.key === sortKey);

    return [...filteredData].sort((a, b) => {
      let aVal = currentCol?.sortValue ? currentCol.sortValue(a) : a[sortKey];
      let bVal = currentCol?.sortValue ? currentCol.sortValue(b) : b[sortKey];

      if (aVal === undefined && (sortKey === "product" || sortKey === "title")) aVal = a.title || a.name;
      if (bVal === undefined && (sortKey === "product" || sortKey === "title")) bVal = b.title || b.name;

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // 3. Paginated Data
  const totalRecords = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handlers
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allCurrentIds = new Set(paginatedData.map(keyExtractor));
      setSelectedIds(allCurrentIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exportToCSV = () => {
    const visibleCols = columns.filter((c) => columnVisibility[c.key]);
    const headers = visibleCols.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",");
    const rows = sortedData.map((item) =>
      visibleCols
        .map((c) => {
          const val = item[c.key];
          const str = val !== null && val !== undefined ? String(val) : "";
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${exportFileName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const visibleColumns = columns.filter((c) => columnVisibility[c.key]);
  const isAllSelected = paginatedData.length > 0 && paginatedData.every((item) => selectedIds.has(keyExtractor(item)));

  return (
    <div className="w-full space-y-4">
      {/* Top Header & Global Actions Bar */}
      {(title || actions || onRefresh) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          {title && (
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#00072D]">{title}</h2>
              {subtitle && <p className="text-xs text-[#4F6D7A] mt-0.5">{subtitle}</p>}
            </div>
          )}
          <div className="flex items-center gap-2.5 flex-wrap">
            {actions}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E8E2D5] hover:bg-[#F4F1EA] text-[#00072D] rounded-lg text-xs font-semibold transition-colors"
                title="Refresh table data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#C89B3C]" : ""}`} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Control Bar: Search, Bulk Toolbar, Columns Toggle, CSV Export */}
      <div className="p-3 bg-white border border-[#E8E2D5] rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#4F6D7A] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E8E2D5] text-xs text-[#00072D] focus:outline-none focus:ring-2 focus:ring-[#00072D]"
          />
        </div>

        {/* Selected Rows Counter & Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-sand-100 rounded-lg border border-sand-300 text-xs font-semibold text-[#00072D] animate-in fade-in">
            <span>{selectedIds.size} Selected</span>
            {onBulkDelete && (
              <button
                type="button"
                onClick={async () => {
                  const confirmed = await showConfirm({
                    title: "Bulk Delete Records",
                    message: `Are you sure you want to permanently delete ${selectedIds.size} selected record(s)? This action cannot be undone.`,
                    confirmText: `Delete ${selectedIds.size} Records`,
                    type: "danger"
                  });
                  if (confirmed) {
                    onBulkDelete(Array.from(selectedIds));
                    setSelectedIds(new Set());
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold transition-colors ml-2 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3 h-3" />
                <span>Bulk Delete</span>
              </button>
            )}
          </div>
        )}

        {/* Right Tools: Column Visibility & Export CSV */}
        <div className="flex items-center gap-2">
          {/* Column Toggler */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E8E2D5] hover:bg-slate-50 text-[#00072D] rounded-lg text-xs font-medium transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C89B3C]" />
              <span>Columns</span>
              <ChevronDown className="w-3 h-3 text-[#4F6D7A]" />
            </button>

            {isColumnDropdownOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-[#E8E2D5] rounded-xl shadow-xl z-30 p-2 text-xs space-y-1 animate-in fade-in">
                <div className="px-2 py-1 font-semibold text-[#00072D] border-b border-[#E8E2D5] mb-1">
                  Toggle Columns
                </div>
                {columns.map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-sand-50 rounded cursor-pointer text-[#00072D]"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(columnVisibility[c.key])}
                      onChange={(e) =>
                        setColumnVisibility((prev) => ({ ...prev, [c.key]: e.target.checked }))
                      }
                      className="rounded text-[#00072D] focus:ring-[#00072D]"
                    />
                    <span>{c.header}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E8E2D5] hover:bg-[#F4F1EA] text-[#00072D] rounded-lg text-xs font-medium transition-colors"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#E8E2D5] rounded-xl shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm divide-y divide-[#E8E2D5]">
            <thead className="bg-[#FAF8F5] text-[#00072D] text-xs uppercase font-semibold select-none">
              <tr>
                {/* Selection Checkbox Header */}
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all rows on current page"
                    className="rounded text-[#00072D] focus:ring-[#00072D] cursor-pointer"
                  />
                </th>

                {visibleColumns.map((col) => {
                  const isSorted = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                      style={{ width: col.width }}
                      className={`py-3 px-4 ${
                        col.sortable !== false ? "cursor-pointer hover:bg-sand-100/60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable !== false && (
                          <span className="text-[#4F6D7A]">
                            {isSorted ? (
                              sortDirection === "asc" ? (
                                <ChevronUp className="w-3.5 h-3.5 text-[#C89B3C]" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-[#C89B3C]" />
                              )
                            ) : (
                              <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E8E2D5]">
              {loading && paginatedData.length === 0 ? (
                [...Array(6)].map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-3.5 px-4 w-10">
                      <div className="w-4 h-4 bg-sand-200 rounded" />
                    </td>
                    {visibleColumns.map((col, cIdx) => (
                      <td key={col.key} className="py-3.5 px-4">
                        <div
                          className="h-3.5 bg-sand-200/80 rounded"
                          style={{ width: `${Math.max(35, 80 - ((cIdx % 4) * 15))}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="py-16 text-center text-sm text-[#4F6D7A]">
                    No records found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => {
                  const id = keyExtractor(item);
                  const isSelected = selectedIds.has(id);
                  return (
                    <tr
                      key={id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? "bg-[#FAF8F5]/80" : ""
                      }`}
                    >
                      <td className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(id)}
                          aria-label={`Select row ${id}`}
                          className="rounded text-[#00072D] focus:ring-[#00072D] cursor-pointer"
                        />
                      </td>

                      {visibleColumns.map((col) => (
                        <td key={col.key} style={{ width: col.width }} className="py-3 px-4 text-xs text-[#00072D]">
                          {col.cell ? col.cell(item, index) : item[col.key] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#4F6D7A]">
          <div className="flex items-center gap-3">
            <span>
              Showing{" "}
              <strong>
                {totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </strong>{" "}
              to{" "}
              <strong>
                {Math.min(currentPage * pageSize, totalRecords)}
              </strong>{" "}
              of <strong>{totalRecords}</strong> records
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#E8E2D5] rounded px-2 py-1 text-xs text-[#00072D] focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-[#E8E2D5] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-[#00072D]" />
            </button>

            <span className="px-2 font-semibold text-[#00072D]">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-[#E8E2D5] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-[#00072D]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
