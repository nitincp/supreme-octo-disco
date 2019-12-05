import { getColumns } from "./getColumns";
import { firstPosition, groupBy, Position, Range, Column } from "./index";
import { getBody } from "./getBody";
import { getHeader } from "./getHeader";
import { RowsWithRange, Rows } from "./getRow";

export interface TableConfig<T> {
  columns?: Column<T>[],
  getHeader?: (columns: Column<T>[], startAt: Position) => RowsWithRange<string>
  startAt?: Position,
  groupByConfig?: {
    groupBy: (item: T) => any,
    tableConfig?: TableConfig<T>
  },
  // groupBy?: (item: T) => any
}

export function getTable<T>(collection: T[], config?: TableConfig<T>) {
  if (!config) {
    config = {};
  }
  const startAt = config.startAt || firstPosition;
  if (!collection || collection.length == 0) {
    return { rows: [], range: { min: startAt, max: startAt } } as RowsWithRange<T>;
  }
  if (!config.columns) {
    config.columns = getColumns(collection[0]);
  }
  const columns = config.columns;
  if (!config.getHeader) {
    config.getHeader = (columns) => getHeader(columns, startAt);
  }
  const header = config.getHeader(columns, startAt);
  let body: RowsWithRange<T>;
  if (config.groupByConfig) {
    let lastGroupRange = header.range;
    const groups = groupBy(collection, config.groupByConfig.groupBy);
    const groupRows: Rows<T> = [];
    const groupByTableConfig = config.groupByConfig.tableConfig;
    groups.forEach((groupCollection, groupKey) => {
      const groupStartsAt: Position = { row: lastGroupRange.max.row + 1, column: lastGroupRange.min.column };
      const groupTable = getTable(groupCollection, Object.assign({
        columns,
        getHeader: getGroupHeader<T>(groupKey, groupStartsAt),
        startAt: groupStartsAt
      }, groupByTableConfig));
      groupRows.push(...groupTable.rows);
      lastGroupRange = groupTable.range;
    });
    body = { rows: groupRows, range: { min: { row: header.range.max.row + 1, column: header.range.min.column }, max: lastGroupRange.max } };
  }
  else {
    const bodyStartsAt: Position = { row: header.range.max.row + 1, column: header.range.min.column }; // getNextPosition(header);
    body = getBody(collection, columns, bodyStartsAt);
  }
  const rows = [...header.rows, ...body.rows];
  const range: Range = { min: startAt, max: body.range.max };
  const table: RowsWithRange<T> = { rows, range };
  return table;
}
function getGroupHeader<T>(groupKey: unknown, groupStartsAt: Position): ((columns: Column<T>[], startAt: Position) => RowsWithRange<string>) | undefined {
  return (columns, startAt) => {
    return {
      rows: [
        {
          cells: [
            {
              value: groupKey,
              row: groupStartsAt.row,
              column: groupStartsAt.column
            }
          ]
        }
      ],
      range: { min: groupStartsAt, max: groupStartsAt }
    };
  };
}

