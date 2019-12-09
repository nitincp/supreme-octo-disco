import ExcelJS from "exceljs";
import { RowsWithRange } from "./getRow";
export function plot<T>(rowsWithRange: RowsWithRange<T>, ws: ExcelJS.Worksheet) {
  rowsWithRange.rows.forEach(row => {
    // printRow(row);
    if(row.cells.length > 0) {
      row.cells.forEach(cell => {
        ws.getCell(cell.row, cell.column).value = cell.value as any;
      });
      if(row.outlineLevel || -1 !== -1) {
        ws.getRow(row.cells[0].row).outlineLevel = row.outlineLevel;
      }
    }
  });
}
