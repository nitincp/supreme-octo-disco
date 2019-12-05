import { getRow } from "./getRow";
import { Column, Position, firstPosition, Range } from "./index";
export function getBody<T>(collection: T[], columns: Column<T>[], startAt: Position = firstPosition) {
  let lastRowRange: Range = { min: startAt, max: startAt };
  const rows = collection.map(item => {
    const rowStartAt = lastRowRange.max == startAt ? startAt : { row: lastRowRange.max.row + 1, column: lastRowRange.min.column };
    const { rows, range } = getRow<T>(item, columns, rowStartAt);
    lastRowRange = range;
    return rows;
  }).reduce((pv, cv) => ([...pv, ...cv]));
  const range = { min: startAt, max: lastRowRange.max };
  return { rows, range };
}
