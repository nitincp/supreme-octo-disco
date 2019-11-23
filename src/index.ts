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

interface TableConfig<T> {
  getColumns?: (item: T) => Column<T>[],
  getHeader?: (columns: Column<T>[]) => RowsWithRange<string>
  startAt?: Position
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

function getCellsArea<T>(cells: Cell<T>[]) {

  const defaultArea: Range = { min: cells[0], max: cells[0] };

  return cells.reduce((pv, cv) => {
    return {
      min: {
        row: pv.min.row > cv.row ? cv.row : pv.min.row,
        column: pv.min.column > cv.column ? cv.column : pv.min.column
      },
      max: {
        row: pv.max.row < cv.row ? cv.row : pv.max.row,
        column: pv.max.column < cv.column ? cv.column : pv.max.column
      }
    };
  }, defaultArea);
}

function getNextPosition<T>(rows: Rows<T>): Position {

  const allCells = rows.reduce((pv, cv) => {
    return [...pv, ...cv.cells];
  }, [] as Cell<T>[]);

  const cellsArea = getCellsArea<T>(allCells);

  return {
    row: cellsArea.max.row + 1,
    column: cellsArea.min.column
  }
}

function printRow<T>(row: Row<T>) {
  const print = row.cells.map(cell => `(${cell.row},${cell.column})${cell.value}`).join('\t')
  console.log(print);
}

function plot<T>(rows: Rows<T>, ws: ExcelJS.Worksheet) {
  rows.forEach(row => {
    // printRow(row);
    row.cells.forEach(cell => {
      ws.getCell(cell.row, cell.column).value = cell.value as any;
    });
  });
}


function getTable<T>(collection: T[], config?: TableConfig<T>) {

  if (!collection || collection.length == 0) {
    return [];
  }

  if (!config) {
    config = {};
  }

  if (!config.getColumns) {
    config.getColumns = (item) => getColumns(item);
  }

  const columns = config.getColumns(collection[0]);

  const startAt = config.startAt || firstPosition;

  if (!config.getHeader) {
    config.getHeader = (columns) => getHeader(columns, startAt)
  }

  const header = config.getHeader(columns);

  const bodyStartsAt: Position = { row: header.range.max.row + 1, column: header.range.min.column } // getNextPosition(header);

  const body = getBody(collection, columns, bodyStartsAt);

  return [...header.rows, ...body.rows];
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
plot(getTable(getRandomData(), { startAt: { row: 3, column: 5 } }), ws);
plot(getTable(getRandomData(), { startAt: { row: 15, column: 1 } }), ws);
plot(getTable(getRandomData(100), { startAt: { row: 15, column: 5 } }), ws);

wb.xlsx.writeFile(`out/${faker.system.commonFileName('xlsx')}`);
