import { TableConfig } from ".";

export class Table<T> {
  constructor(private config: TableConfig<T>) {
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
      config.getHeader = (columns) => getHeader(columns, startAt)
    }
  
  }
}
