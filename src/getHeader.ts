import { Column, Position, firstPosition, Range } from "./index";
import { Rows } from "./getRow";
export function getHeader<T>(columns: Column<T>[], startAt: Position = firstPosition) {
  let rowNum = startAt.row;
  let colNum = startAt.column;
  const rows: Rows<string> = [
    {
      cells: columns.map(c => ({ row: rowNum, column: colNum++, value: c.name }))
    }
  ];
  const range: Range = { min: startAt, max: { row: rowNum, column: colNum - 1 } };
  return { rows, range };
}
