import faker from "faker";
import ExcelJS from "exceljs";
import { getTable, TableConfig } from "./getTable";
import { Row } from "./getRow";
import { plot } from "./plot";

interface Person {
  id: number;
  FirstName: string;
  LastName: string;
}

export interface Position {
  row: number;
  column: number;
}

export interface Range {
  min: Position,
  max: Position
}

export interface Cell<T> extends Position {
  value: unknown
}

export interface Column<T> {
  name: string;
  value<V>(item: T): V
}

type KeyGetter<T, K> = (item: T) => K;

export const firstPosition: Position = { row: 1, column: 1 };

export function getPropertyNames<T, K extends keyof T>(item: T) {
  return Object.keys(item as any) as K[];
}

export function getProperty<T, K extends keyof T>(o: T, propertyName: K): T[K] {
  return o[propertyName]; // o[propertyName] is of type T[K]
}

function printRow<T>(row: Row<T>) {
  const print = row.cells.map(cell => `(${cell.row},${cell.column})${cell.value}`).join('\t')
  console.log(print);
}

export function groupBy<T, K>(list: T[], keyGetter: (item: T) => K) {
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

// plot(getTable(getRandomData()), ws);
// plot(getTable(getRandomData(), { startAt: { row: 3, column: 5 } }), ws);
// plot(getTable(getRandomData(), { startAt: { row: 15, column: 1 } }), ws);
// plot(getTable(getRandomData(100), { startAt: { row: 15, column: 5 } }), ws);

const groupByConfig: TableConfig<Person> = {
  groupByConfig: {
    groupBy: (item) => item.FirstName[0],
    tableConfig: {
      groupByConfig: {
        groupBy: (item1) => item1.LastName[0]
      }
    }
  }
};

console.time('program');
const randomData = getRandomData(1000 * 10);
console.timeLog('program', 'random data generated.');
const table = getTable(randomData, groupByConfig);
console.timeLog('program', 'table created.');
plot(table, ws);
console.timeLog('program', 'table plotted.');

const fileName = faker.system.commonFileName('xlsx');
wb.xlsx.writeFile(`out/${fileName}`);
// console.log(`new file generated, ${fileName}`);
console.timeLog('program', `new file generated, ${fileName}`);
console.timeEnd('program');