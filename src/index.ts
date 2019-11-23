import faker from "faker";
import ExcelJS from "exceljs";

interface Person {
  id: number;
  FirstName: string;
  LastName: string;
}

interface Position {
  row: number;
  column: number;
}

interface Range {
  min: Position,
  max: Position
}

interface Cell<T> extends Position {
  value: unknown
}

interface Row<T> {
  cells: Cell<T>[]
}

type Rows<T> = Row<T>[];

interface RowsWithRange<T> {
  rows: Rows<T>,
  range: Range
}

interface Column<T> {
  name: string;
  value<V>(item: T): V
}

const firstPosition: Position = { row: 1, column: 1 };

function getColumns<T>(item: T): Column<T>[] {

  const propertyNames = getPropertyNames(item);
  return propertyNames.map(x => {
    return {
      name: x,
      value: (obj: T) => getProperty(obj, x)
    } as Column<T>;
  })
}

function getPropertyNames<T, K extends keyof T>(item: T) {
  return Object.keys(item as any) as K[];
}

function getProperty<T, K extends keyof T>(o: T, propertyName: K): T[K] {
  return o[propertyName]; // o[propertyName] is of type T[K]
}

function getBody<T>(collection: T[], columns: Column<T>[], startAt: Position = firstPosition) {

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

function getRow<T>(item: T, columns: Column<T>[], startAt: Position): RowsWithRange<T> {
  let rowNum = startAt.row;
  let colNum = startAt.column;
  const cells = columns.map<Cell<T>>(col => ({ row: rowNum, column: colNum++, value: col.value(item) }));
  const rows = [{ cells }];
  const range: Range = { min: startAt, max: { row: rowNum, column: colNum - 1 } }
  return { rows, range };
}

function getHeader<T>(columns: Column<T>[], startAt: Position = firstPosition) {

  let rowNum = startAt.row;
  let colNum = startAt.column;
  const rows: Rows<string> = [
    {
      cells: columns.map(c => ({ row: rowNum, column: colNum++, value: c.name }))
    }
  ];

  const range: Range = { min: startAt, max: { row: rowNum, column: colNum - 1 } }

  return { rows, range };
}

function printRow<T>(row: Row<T>) {
  const print = row.cells.map(cell => `(${cell.row},${cell.column})${cell.value}`).join('\t')
  console.log(print);
}

function plot<T>(rowsWithRange: RowsWithRange<T>, ws: ExcelJS.Worksheet) {
  rowsWithRange.rows.forEach(row => {
    // printRow(row);
    row.cells.forEach(cell => {
      ws.getCell(cell.row, cell.column).value = cell.value as any;
    });
  });
}

type KeyGetter<T, K> = (item: T) => K;

interface TableConfig<T> {
  columns?: Column<T>[],
  getHeader?: (columns: Column<T>[], startAt: Position) => RowsWithRange<string>
  startAt?: Position,
  groupBy?: (item: T) => any
}

function getTable<T>(collection: T[], config?: TableConfig<T>) {

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

  const header = config.getHeader(columns, startAt);

  let body: RowsWithRange<T>;

  if (config.groupBy) {
    let lastGroupRange = header.range;
    const groups = groupBy(collection, config.groupBy);
    const groupRows: Rows<T> = [];
    groups.forEach((groupCollection, groupKey) => {
      
      const groupStartsAt: Position = { row: lastGroupRange.max.row + 1, column: lastGroupRange.min.column }
      
      const groupTable = getTable(groupCollection, {
        columns,
        getHeader: (columns, startAt) => {
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
        }, // getHeader(columns, groupStartsAt),
        startAt: groupStartsAt
      });

      groupRows.push(...groupTable.rows);
      lastGroupRange = groupTable.range;
    });

    body = { rows: groupRows, range: { min: { row: header.range.max.row + 1, column: header.range.min.column }, max: lastGroupRange.max } }

  } else {
    const bodyStartsAt: Position = { row: header.range.max.row + 1, column: header.range.min.column } // getNextPosition(header);
    body = getBody(collection, columns, bodyStartsAt);
  }

  const rows = [...header.rows, ...body.rows];
  const range: Range = { min: startAt, max: body.range.max };
  const table: RowsWithRange<T> = { rows, range };
  return table;
}

function groupBy<T, K>(list: T[], keyGetter: (item: T) => K) {
  const map = new Map<K, T[]>();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}

function getRandomData(total = 10) {
  const people: Person[] = [];
  for (let idx = 0; idx < total; idx++) {
    people.push({
      id: idx,
      FirstName: faker.name.firstName(),
      LastName: faker.name.lastName()
    });
  }
  return people;
}

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('My Book');

const people: Person[] = getRandomData();

plot(getTable(getRandomData()), ws);
// plot(getTable(getRandomData(), { startAt: { row: 3, column: 5 } }), ws);
// plot(getTable(getRandomData(), { startAt: { row: 15, column: 1 } }), ws);
// plot(getTable(getRandomData(100), { startAt: { row: 15, column: 5 } }), ws);

const groupByConfig: TableConfig<Person> = {
  groupBy: (item) => item.FirstName[0]
};
plot(getTable(getRandomData(100), groupByConfig), ws);

wb.xlsx.writeFile(`out/${faker.system.commonFileName('xlsx')}`);
