import { Column, Position, Cell, Range } from "./index";

export interface Row<T> {
  cells: Cell<T>[]
}

export type Rows<T> = Row<T>[];

export interface RowsWithRange<T> {
  rows: Rows<T>,
  range: Range
}


export function getRow<T>(item: T, columns: Column<T>[], startAt: Position): RowsWithRange<T> {
  let rowNum = startAt.row;
  let colNum = startAt.column;
  const cells = columns.map<Cell<T>>(col => ({ row: rowNum, column: colNum++, value: col.value(item) }));
  const rows = [{ cells }];
  const range: Range = { min: startAt, max: { row: rowNum, column: colNum - 1 } };
  return { rows, range };
}
