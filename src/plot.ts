import ExcelJS from "exceljs";
import { RowsWithRange } from "./getRow";
export function plot<T>(rowsWithRange: RowsWithRange<T>, ws: ExcelJS.Worksheet) {
  rowsWithRange.rows.forEach(row => {
    // printRow(row);
    row.cells.forEach(cell => {
      ws.getCell(cell.row, cell.column).value = cell.value as any;
    });
  });
}
