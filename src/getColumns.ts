import { Column, getPropertyNames, getProperty } from "./index";
export function getColumns<T>(item: T): Column<T>[] {
  const propertyNames = getPropertyNames(item);
  return propertyNames.map(x => {
    return {
      name: x,
      value: (obj: T) => getProperty(obj, x)
    } as Column<T>;
  });
}
