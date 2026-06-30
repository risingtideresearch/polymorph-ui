import { Intersection, Object3D } from "three";

// By default, pointer events are delivered to objects based on their distance
// to the camera (closer objects get events first).
//
// However, it can be useful to override this behavior for certain objects, for
// example to ensure that solid faces receive pointer events instead of being
// missed in favor of nearby transparent planes.
//
// This file implements the ability to assign such "pointer event priority" to
// objects via:
//
// ```
//  <mesh userData={{ pointerEventPriority: 10 }} />
// ```

/**
 * Determines the priority of a given object for the purpose of pointer events.
 *
 * The priority is determined by looking for a `pointerEventPriority` value in
 * the object's `userData` property, or any of its ancestors.
 *
 * If not found, returns 0.
 */
export function pointerEventPriority(target: Object3D | null | undefined) {
  let current = target;
  while (current) {
    const priority = current.userData?.pointerEventPriority;
    if (typeof priority === "number") {
      return priority;
    }
    current = current.parent;
  }
  return 0;
}

export function filterByPointerEventPriority(items: Intersection[]) {
  // Note: we assume that `sort` is stable, which is the case in modern JS and
  // mandated by ECMAScript 2019.
  return items
    .map((item) => ({
      item,
      priority: pointerEventPriority(item.object),
    }))
    .sort((a, b) => {
      return b.priority - a.priority;
    })
    .map(({ item }) => item);
}
