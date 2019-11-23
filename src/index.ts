import faker from "faker";
import ExcelJS from "exceljs";
import { fstat } from "fs";

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

interface Column<T> {
  name: string;
  value<V>(item: T): V
}

interface TableConfig<T> {
  getColumns?: (item: T) => Column<T>[],
  getHeader?: (columns: Column<T>[]) => Row<string>[]
  getStartAt?: () => Position
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

function getRows<T>(collection: T[], columns: Column<T>[], startAt: Position = firstPosition): Row<T>[] {

  let rowNum = startAt.row;
  return collection.map(item => {

    let colNum = startAt.column;
    const cells = columns.map<Cell<T>>(col => ({ row: rowNum, column: colNum++, value: col.value(item) }));
    rowNum++;
    return { cells };
  });
}

function getHeader<T>(columns: Column<T>[], startAt: Position = firstPosition): Row<string>[] {

  let colNum = startAt.column;
  return [
    {
      cells: columns.map(c => ({ row: startAt.row, column: colNum++, value: c.name }))
    }
  ];
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

function getNextPosition<T>(rows: Row<T>[]): Position {

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

function plot<T>(rows: Row<T>[], ws: ExcelJS.Worksheet) {
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

  if (!config.getStartAt) {
    config.getStartAt = () => firstPosition;
  }

  const startAt = config.getStartAt();

  if (!config.getHeader) {
    config.getHeader = (columns) => getHeader(columns, startAt)
  }

  const header = config.getHeader(columns);

  const rowsStartAt = getNextPosition(header);

  const rows = getRows(collection, columns, rowsStartAt);

  return [...header, ...rows];
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
plot(getTable(getRandomData(), { getStartAt: () => ({ row: 3, column: 5 }) }), ws);
plot(getTable(getRandomData(), { getStartAt: () => ({ row: 15, column: 1 }) }), ws);
plot(getTable(getRandomData(100), { getStartAt: () => ({ row: 15, column: 5 }) }), ws);


wb.xlsx.writeFile(`out/${faker.system.commonFileName('xlsx')}`);
