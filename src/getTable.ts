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
  outlineLevel?: number
  // groupBy?: (item: T) => any
}

export class SpreadsheetConfig<T> {

  static readonly defaultConfig = {};
  private _columns: Column<T>[] = [];
  get columns() {
    return this._columns;
  }
  set columns(v) {
    this._columns = v;
  }
}

export function getTable<T>(collection: T[], _config?: TableConfig<T>) {

  const config = _config || { outlineLevel: 0 };

  const startAt = config.startAt || firstPosition;
  if (!collection || collection.length == 0) {
    return { rows: [], range: { min: startAt, max: startAt } } as RowsWithRange<T>;
  }
  if (!config.columns) {
    config.columns = getColumns(collection[0]);
  }
  if (!config.getHeader) {
    config.getHeader = (columns, startAt) => getHeader(columns, startAt);
  }
  const outlineLevel = config.outlineLevel || 0;
  const header = config.getHeader(config.columns, startAt);
  header.rows.forEach(row => {
    row.outlineLevel = outlineLevel
  });
  
  let body: RowsWithRange<T>;
  if (config.groupByConfig) {
    let lastGroupRange = header.range;
    const groups = groupBy(collection, config.groupByConfig.groupBy);
    const groupRows: Rows<T> = [];
    const groupByTableConfig = config.groupByConfig.tableConfig;
    groups.forEach((groupCollection, groupKey) => {
      const groupStartsAt: Position = { row: lastGroupRange.max.row + 1, column: lastGroupRange.min.column };
      const groupTable = getTable(groupCollection, Object.assign({
        columns: config.columns,
        getHeader: getGroupHeader<T>(groupKey, groupStartsAt),
        startAt: groupStartsAt,
        outlineLevel: (config.outlineLevel || 0) + 1
      } as TableConfig<T>, groupByTableConfig));
      groupRows.push(...groupTable.rows);
      lastGroupRange = groupTable.range;
    });
    body = { rows: groupRows, range: { min: { row: header.range.max.row + 1, column: header.range.min.column }, max: lastGroupRange.max } };
  }
  else {
    const bodyStartsAt: Position = { row: header.range.max.row + 1, column: header.range.min.column }; // getNextPosition(header);
    body = getBody(collection, config.columns, bodyStartsAt); 
  }

  if (outlineLevel > 0) {
    body.rows.forEach(row => {
      row.outlineLevel = outlineLevel + 1
    });
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
