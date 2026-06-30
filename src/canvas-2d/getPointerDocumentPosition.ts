import { IMouseOrPointerEvent, getPointerViewPosition } from "../utils";

import { Camera2 } from "./Camera2";

/**
 * Return the position of the pointer event in document coordinates, assuming the
 * document is drawn into the content box of the given HTML element using the
 * given camera.
 */
export function getPointerDocumentPosition(
  event: IMouseOrPointerEvent,
  element: HTMLElement,
  camera: Camera2,
) {
  const viewToDocument = camera.viewMatrix().invert();
  return getPointerViewPosition(event, element).applyMatrix3(viewToDocument);
}
