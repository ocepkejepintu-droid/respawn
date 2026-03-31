"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  sortable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  emptyState?: React.ReactNode;
  loading?: boolean;
  className?: string;
  onRowClick?: (item: T) => void;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

function DataTable<T>({
  data,
  columns,
  keyExtractor,
  sortable = true,
  filterable = true,
  pagination = true,
  pageSize = 10,
  emptyState,
  loading = false,
  className,
  onRowClick,
  selectedRows = [],
  onSelectionChange,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig | null>(null);
  const [filterText, setFilterText] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  // Handle sorting
  const handleSort = (key: string) => {
    if (!sortable) return;

    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  };

  // Filter and sort data
  const processedData = React.useMemo(() => {
    let result = [...data];

    // Filter
    if (filterText && filterable) {
      const lowerFilter = filterText.toLowerCase();
      result = result.filter((item) =>
        columns.some((col) => {
          const value = (item as Record<string, unknown>)[col.key];
          return String(value).toLowerCase().includes(lowerFilter);
        })
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = (a as Record<string, unknown>)[sortConfig.key];
        const bValue = (b as Record<string, unknown>)[sortConfig.key];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filterText, sortConfig, columns, filterable]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = pagination
    ? processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : processedData;

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterText]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (!onSelectionChange) return;

    const allIds = paginatedData.map(keyExtractor);
    const allSelected = allIds.every((id) => selectedRows.includes(id));

    if (allSelected) {
      onSelectionChange(selectedRows.filter((id) => !allIds.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedRows, ...allIds])]);
    }
  };

  const toggleSelectRow = (id: string) => {
    if (!onSelectionChange) return;

    if (selectedRows.includes(id)) {
      onSelectionChange(selectedRows.filter((rowId) => rowId !== id));
    } else {
      onSelectionChange([...selectedRows, id]);
    }
  };

  const getSortIcon = (column: Column<T>) => {
    if (!sortable || !column.sortable) return null;

    if (sortConfig?.key !== column.key) {
      return <ChevronsUpDown className="ml-1 h-4 w-4 text-neutral-400" />;
    }

    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4 text-primary-600" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 text-primary-600" />
    );
  };

  if (loading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-10 w-full rounded-lg bg-neutral-200 dark:bg-neutral-700 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 w-full rounded-lg bg-neutral-200 dark:bg-neutral-700"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter */}
      {filterable && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="h-10 w-full rounded-lg border border-neutral-300 bg-white pl-10 pr-4 text-sm placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                {onSelectionChange && (
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={
                        paginatedData.length > 0 &&
                        paginatedData.every((item) =>
                          selectedRows.includes(keyExtractor(item))
                        )
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 dark:border-neutral-600"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300",
                      sortable &&
                        column.sortable &&
                        "cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      column.width && column.width
                    )}
                    style={column.width ? { width: column.width } : undefined}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center">
                      {column.header}
                      {getSortIcon(column)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                    className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400"
                  >
                    {emptyState || "No data available"}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const id = keyExtractor(item);
                  return (
                    <tr
                      key={id}
                      onClick={() => onRowClick?.(item)}
                      className={cn(
                        "bg-white dark:bg-neutral-900",
                        onRowClick && "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                        selectedRows.includes(id) && "bg-primary-50 dark:bg-primary-900/20"
                      )}
                    >
                      {onSelectionChange && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(id)}
                            onChange={() => toggleSelectRow(id)}
                            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 dark:border-neutral-600"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className="px-4 py-3 text-neutral-900 dark:text-neutral-100"
                        >
                          {column.render
                            ? column.render(item)
                            : String(
                                (item as Record<string, unknown>)[column.key] ??
                                  ""
                              )}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, processedData.length)} of{" "}
            {processedData.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-8 items-center rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-neutral-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium",
                        currentPage === page
                          ? "bg-primary-600 text-white"
                          : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      )}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex h-8 items-center rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable, type Column, type DataTableProps };
