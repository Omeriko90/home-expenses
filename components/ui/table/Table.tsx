"use client";

import * as React from "react";
import {
  Table as TableRoot,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./baseTableComponents";

export type TableColumn<T> = {
  header?: React.ReactNode;
  headClassName?: string;
  cell: (row: T, index: number) => React.ReactNode;
  cellClassName?: string | ((row: T, index: number) => string | undefined);
};

export function Table<T>({
  columns,
  data,
  rowKey,
  rowClassName,
  className,
  containerClassName,
  headerClassName,
  headRowClassName,
}: {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => React.Key;
  rowClassName?: string | ((row: T, index: number) => string | undefined);
  className?: string;
  containerClassName?: string;
  headerClassName?: string;
  headRowClassName?: string;
}) {
  return (
    <TableRoot className={className} containerClassName={containerClassName}>
      <TableHeader className={headerClassName}>
        <TableRow className={headRowClassName}>
          {columns.map((c, i) => (
            <TableHead key={i} className={c.headClassName}>
              {c.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow
            key={rowKey(row, rowIndex)}
            className={
              typeof rowClassName === "function"
                ? rowClassName(row, rowIndex)
                : rowClassName
            }
          >
            {columns.map((c, colIndex) => (
              <TableCell
                key={colIndex}
                className={
                  typeof c.cellClassName === "function"
                    ? c.cellClassName(row, rowIndex)
                    : c.cellClassName
                }
              >
                {c.cell(row, rowIndex)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </TableRoot>
  );
}
