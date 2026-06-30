/**
 * Moves the element currently at index `dragIndex` between the elements
 * currently at index `dropIndex - 1` and `dropIndex`.
 *
 * The input list is not modified:
 *
 * - If the operation is a no-op, then the input list is returned as is.
 *
 * - Otherwise, the function returns a new list, containing the same elements
 *   as in the original list (shallow copy), but reordered.
 */
export function dragReorder<T>(
  list: T[],
  dragIndex: number,
  dropIndex: number,
): T[] {
  if (dragIndex < 0) {
    return list;
  }
  if (dragIndex >= list.length) {
    return list;
  }
  if (dropIndex < 0) {
    dropIndex = 0;
  }
  if (dropIndex > list.length) {
    dropIndex = list.length;
  }
  const oldIndex = dragIndex;
  const newIndex = dropIndex <= dragIndex ? dropIndex : dropIndex - 1;
  if (oldIndex == newIndex) {
    return list;
  }
  const movedElement = list[oldIndex];
  const newList = [...list];
  newList.splice(oldIndex, 1);
  newList.splice(newIndex, 0, movedElement);
  return newList;
}

function areShallowEqual<T>(list1: T[], list2: T[]) {
  if (list1.length !== list2.length) {
    return false;
  }
  for (let i = 0; i < list1.length; i++) {
    if (list1[i] !== list2[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Moves the elements currently at the given `dragIndices` between the
 * elements currently at index `dropIndex - 1` and `dropIndex`.
 *
 * The input list is not modified:
 *
 * - If the operation is a no-op, then the input list is returned as is.
 *
 * - Otherwise, the function returns a new list, containing the same elements
 *   as in the original list (shallow copy), but reordered.
 */
export function multiDragReorder<T>(
  list: T[],
  dragIndices: number[],
  dropIndex: number,
): T[] {
  const cleanedDragIndices = dragIndices.filter(
    (i) => i >= 0 && i < list.length,
  );
  if (cleanedDragIndices.length === 0) {
    return list;
  }
  if (dropIndex < 0) {
    dropIndex = 0;
  }
  if (dropIndex > list.length) {
    dropIndex = list.length;
  }

  // Pre-compute which indices are dragged for O(1) query. This makes the algo O(n).
  const isDragged = new Array<boolean>(list.length).fill(false);
  for (const i of cleanedDragIndices) {
    isDragged[i] = true;
  }

  const newList = new Array<T>();

  // Add all non-dragged elements before the drop index
  for (let i = 0; i < dropIndex; ++i) {
    if (!isDragged[i]) {
      newList.push(list[i]);
    }
  }

  // Add all dragged elements
  for (let i = 0; i < list.length; ++i) {
    if (isDragged[i]) {
      newList.push(list[i]);
    }
  }

  // Add all non-dragged elements after the drop index
  for (let i = dropIndex; i < list.length; ++i) {
    if (!isDragged[i]) {
      newList.push(list[i]);
    }
  }

  if (areShallowEqual(list, newList)) {
    return list;
  } else {
    return newList;
  }
}
