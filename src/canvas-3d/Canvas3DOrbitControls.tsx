import { useEffect, useRef, useState } from "react";
import { Box3, Euler, EventDispatcher, Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";

import { Canvas3DOrbitControlsImpl } from "./Canvas3DOrbitControlsImpl";
import { usePointerEventsContext } from "../contexts";

export interface Canvas3DOrbitControlsProps {
  /**
   * The point the camera orbits around. Defaults to the world origin.
   */
  target?: [number, number, number] | Vector3;

  /**
   * When true, the controls measure the rendered scene and keep the camera's
   * `far` clipping plane large enough to contain it, so geometry is never
   * clipped away as the camera dollies (zooms). The `near` plane is left
   * untouched. Defaults to false, leaving `far` under the caller's control.
   */
  autoFar?: boolean;

  /**
   * When true, the controls derive the camera's `near` clipping plane from its
   * `far` plane, keeping the near/far ratio—and therefore depth precision—from
   * blowing up as `far` grows. This is most useful together with `autoFar`,
   * whose fitted `far` would otherwise pair with a fixed `near` to give a huge
   * ratio and z-fighting (especially for a perspective camera). Defaults to
   * false, leaving `near` under the caller's control.
   */
  autoNear?: boolean;
}

/**
 * Orbit/pan/dolly camera controls for a `Canvas3D`, integrated with the shared
 * `PointerEventsContext`.
 *
 * The actual camera math lives in `Canvas3DOrbitControlsImpl`, a from-scratch
 * replacement for `@react-three/drei`'s `OrbitControls`. It behaves like the
 * stock controls except that zooming an orthographic camera also dollies the
 * camera along its view direction (just like a perspective camera), so the
 * near/far clipping planes track the zoom level instead of staying fixed.
 *
 * On each pointer down over the canvas, this component registers a drag
 * candidate in the context, so that orbiting participates in the same
 * click-vs-drag disambiguation and mutual exclusion as the rest of the app. As
 * a result:
 *
 * - While orbiting, no other component reacts to the pointer (the
 *   `PointerEventsContainer` sets `pointer-events: none` on its subtree once the
 *   context reports a drag), so for example an area separator cannot be resized,
 *   nor can a 3D object be hovered or selected, at the same time as a rotation.
 *
 * - Conversely, the orbit only commits to a drag once the shared drag threshold
 *   is crossed. Below that threshold the press is treated as a click (handled,
 *   e.g., by `use3DPointerEvents` or the canvas `onPointerMissed`), and any
 *   camera motion that the controls applied in the meantime is reverted.
 *
 * The controls keep doing the actual camera math; this component only wires
 * their lifecycle into the shared arbitration. This works because the controls
 * listen for pointer move/up on the document rather than on the canvas, so an
 * ongoing rotation keeps receiving events even while the canvas itself is made
 * non-interactive.
 *
 * Like drei's `OrbitControls`, this registers itself as the default controls of
 * the `@react-three/fiber` scene (`makeDefault`), so the orientation gizmo can
 * read and drive them.
 */
export function Canvas3DOrbitControls({
  target,
  autoFar = false,
  autoNear = false,
}: Canvas3DOrbitControlsProps) {
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);
  const context = usePointerEventsContext();

  // A single controls instance for the canvas's lifetime. When the active camera
  // changes (e.g. toggling between orthographic and perspective projections), we
  // retarget this instance to the new camera (see below) rather than rebuilding
  // it, so the orbit target and gesture state carry across the switch.
  const [controls] = useState(() => new Canvas3DOrbitControlsImpl(camera));

  // Camera state captured on pointer down, used to revert any orbiting that
  // happened before the drag threshold was reached (i.e., on a click).
  type StartState = {
    cameraPosition: Vector3;
    cameraRotation: Euler;
    controlsTarget: Vector3;
  };
  const startRef = useRef<StartState | undefined>(undefined);

  // Attach the controls to the canvas DOM element for the controls' lifetime.
  useEffect(() => {
    controls.connect(gl.domElement);
    return () => controls.dispose();
  }, [controls, gl]);

  // Register the controls as the scene's default controls (so the orientation
  // gizmo can find them), restoring the previous default on unmount.
  useEffect(() => {
    const previous = get().controls;
    set({ controls: controls as unknown as EventDispatcher });
    return () => set({ controls: previous });
  }, [controls, get, set]);

  // On every camera change, request a render (the canvas uses on-demand
  // rendering) and, while a press has not yet crossed the drag threshold, revert
  // the change so a click does not move the camera.
  //
  // This is registered before the `target` effect below so that the very first
  // target-driven `controls.update()` already triggers a render.
  useEffect(() => {
    const onChange = () => {
      invalidate();
      const start = startRef.current;
      if (!start || context.isDragging) {
        // Either no press is in progress, or the drag threshold has been
        // crossed and we are legitimately orbiting: let the change stand.
        return;
      }
      // The controls moved the camera but the context has not yet confirmed a
      // drag (we are still below the drag threshold), so revert to the press
      // state. Once the pointer moves past the threshold, `context.isDragging`
      // becomes true and we stop reverting.
      camera.position.copy(start.cameraPosition);
      camera.rotation.copy(start.cameraRotation);
      controls.target.copy(start.controlsTarget);
      camera.updateMatrixWorld();
    };
    controls.addEventListener("change", onChange);
    return () => controls.removeEventListener("change", onChange);
  }, [controls, camera, context, invalidate]);

  // Drive whichever camera is currently the scene's default. Switching cameras
  // (e.g. orthographic <-> perspective) only swaps the controlled object: the
  // orbit `target`, configured limits, and gesture state are preserved. The
  // incoming camera already carries the outgoing one's pose (see
  // `Canvas3DCameras`), so re-deriving the orbit from its position keeps the
  // view put. Runs after the "change" effect above so that effect has already
  // re-bound its listener to this camera before `update()` can emit a change.
  useEffect(() => {
    controls.object = camera;
    controls.update();
  }, [controls, camera]);

  // Keep the orbit target in sync with the `target` prop. We depend on the
  // individual coordinates rather than the array/Vector3 reference, so callers
  // can pass a fresh array each render without retriggering this.
  const tx = target
    ? Array.isArray(target)
      ? target[0]
      : target.x
    : undefined;
  const ty = target
    ? Array.isArray(target)
      ? target[1]
      : target.y
    : undefined;
  const tz = target
    ? Array.isArray(target)
      ? target[2]
      : target.z
    : undefined;
  useEffect(() => {
    if (tx === undefined || ty === undefined || tz === undefined) {
      return;
    }
    controls.target.set(tx, ty, tz);
    controls.update();
  }, [controls, tx, ty, tz]);

  // When `autoFar` is enabled, measure the rendered scene each frame
  // and keep the controls' `bounds` in sync with it; the controls then re-fit
  // `far` to those bounds on every camera move (see `Canvas3DOrbitControlsImpl`).
  //
  // Measuring runs in `useFrame`, which—with the canvas's on-demand
  // frameloop—only fires on an actual invalidation (content change, async mount,
  // or camera move), and we only re-fit when the measured bounds change, so an
  // idle scene does no work and there is no render loop. The orientation gizmo
  // lives in its own portaled scene, so it is naturally excluded.
  const sceneBounds = useRef(new Box3());
  useFrame(() => {
    if (!autoFar) {
      return;
    }
    const box = sceneBounds.current.setFromObject(scene);
    if (box.isEmpty() || controls.bounds?.equals(box)) {
      return;
    }
    (controls.bounds ??= new Box3()).copy(box);
    controls.update();
  });

  // When `autoFar` is disabled (the default), stop managing `far` by
  // clearing any bounds the measuring loop may have set.
  useEffect(() => {
    if (!autoFar) {
      controls.bounds = undefined;
    }
  }, [controls, autoFar]);

  // Keep the controls' `autoNear` flag in sync with the prop. The controls then
  // re-derive `near` from `far` on every camera move; we also `update()` here so
  // the change takes effect immediately (e.g. on mount, or right after `autoFar`
  // settles a new `far`) rather than waiting for the next move. Disabling it
  // simply stops managing `near`, leaving it at its last value.
  useEffect(() => {
    controls.autoNear = autoNear;
    controls.update();
  }, [controls, autoNear]);

  // Register a drag candidate on each pointer down over the canvas, so that the
  // orbit interaction is arbitrated by the shared context.
  useEffect(() => {
    const domElement = gl.domElement;
    const onPointerDown = (event: PointerEvent) => {
      startRef.current = {
        cameraPosition: camera.position.clone(),
        cameraRotation: camera.rotation.clone(),
        controlsTarget: controls.target.clone(),
      };
      // The actual rotation is performed by the controls themselves; we only
      // need the context to track the click-or-drag state and arbitrate against
      // other interactions, so the drag callbacks are intentionally empty.
      context.registerDragCandidate(event, {
        priority: 0,
        onDragStart: () => {},
        onDragMove: () => {},
        onDragEnd: () => {},
      });
    };
    domElement.addEventListener("pointerdown", onPointerDown);
    return () => {
      domElement.removeEventListener("pointerdown", onPointerDown);
    };
  }, [gl, camera, controls, context]);

  // Drop the captured start state whenever the click-or-drag ends, so a stale
  // state can never be used to revert a later, unrelated camera change.
  useEffect(() => {
    return context.subscribe(() => {
      if (!context.isClickOrDragging) {
        startRef.current = undefined;
      }
    });
  }, [context]);

  return null;
}
