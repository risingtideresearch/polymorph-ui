import { GizmoHelper, GizmoViewport } from "@react-three/drei";

import { defaultFontFamily } from "../utils";

/**
 * The orientation gizmo shown in the corner of a `Canvas3D`: a small set of XYZ
 * axes that reflect the current camera orientation and let the user snap the
 * view to an axis by clicking it.
 *
 * It carries a high `pointerEventPriority` so that clicking it takes precedence
 * over the scene behind it (see `filterByPointerEventPriority`).
 *
 * Must be rendered inside a `@react-three/fiber` canvas; it is included by
 * `Canvas3D` by default.
 */
export function Canvas3DAxesGizmo() {
  return (
    <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
      <GizmoViewport
        userData={{ pointerEventPriority: 100 }}
        font={`18px ${defaultFontFamily}`}
      />
    </GizmoHelper>
  );
}
