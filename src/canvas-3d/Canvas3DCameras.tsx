import { useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrthographicCamera, PerspectiveCamera, Vector3 } from "three";

import { Canvas3DCamera, Canvas3DCameraOptions } from "./Canvas3DCamera";

/**
 * The world-space height of `camera`'s viewport at a point `distance` in front
 * of it. For a perspective camera this grows with distance (it is the chord of
 * the vertical field of view); for an orthographic camera it is constant. Both
 * are scaled by `1 / zoom`, matching three's projection matrices.
 */
function visibleHeightAt(camera: Canvas3DCamera, distance: number): number {
  if (camera instanceof PerspectiveCamera) {
    return (
      (2 * distance * Math.tan(((camera.fov / 2) * Math.PI) / 180)) /
      camera.zoom
    );
  }
  return (camera.top - camera.bottom) / camera.zoom;
}

/**
 * The zoom that makes `camera`'s viewport exactly `height` world units tall at
 * `distance` in front of it — the inverse of {@link visibleHeightAt}.
 */
function zoomForVisibleHeight(
  camera: Canvas3DCamera,
  height: number,
  distance: number,
): number {
  if (camera instanceof PerspectiveCamera) {
    return (
      (2 * distance * Math.tan(((camera.fov / 2) * Math.PI) / 180)) / height
    );
  }
  return (camera.top - camera.bottom) / height;
}

/**
 * The orbit point of the scene's active controls, if any expose a `target`
 * vector (three's `OrbitControls`, and our `Canvas3DOrbitControls`, both do).
 * Used to measure the distance at which the apparent scale is matched when
 * switching projection.
 */
function orbitTarget(controls: unknown): Vector3 | undefined {
  const target = (controls as { target?: unknown } | null)?.target;
  return target instanceof Vector3 ? target : undefined;
}

interface Canvas3DCamerasProps {
  /** When true the orthographic camera is the default, otherwise the perspective one. */
  orthographic: boolean;

  /** Initial configuration applied to both cameras. */
  camera: Canvas3DCameraOptions;
}

/**
 * Adds both a perspective and an orthographic camera to the scene and makes one
 * of them the canvas's default according to `orthographic`, allowing switching
 * between them without remounting the canvas.
 *
 * When switching, we match the camera position, near/far planes, and derive a
 * zoom that preserves the apparent scale at the orbit target, so the view does
 * not jump too much.
 *
 * Both cameras are kept matched to the viewport on every resize (aspect for the
 * perspective camera, frustum extents for the orthographic one), so the
 * inactive one is already correctly sized the moment it becomes active.
 */
export function Canvas3DCameras({
  orthographic,
  camera,
}: Canvas3DCamerasProps) {
  const perspectiveRef = useRef<PerspectiveCamera>(null);
  const orthographicRef = useRef<OrthographicCamera>(null);
  const size = useThree((state) => state.size);
  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);

  // Keep both cameras matched to the viewport. The frustum convention matches
  // r3f's own `updateCamera`, so the rendered scale is identical to letting r3f
  // size the (single) default camera.
  useLayoutEffect(() => {
    const perspectiveCamera = perspectiveRef.current;
    if (perspectiveCamera) {
      perspectiveCamera.aspect = size.width / size.height;
      perspectiveCamera.updateProjectionMatrix();
    }
    const orthographicCamera = orthographicRef.current;
    if (orthographicCamera) {
      orthographicCamera.left = size.width / -2;
      orthographicCamera.right = size.width / 2;
      orthographicCamera.top = size.height / 2;
      orthographicCamera.bottom = size.height / -2;
      orthographicCamera.updateProjectionMatrix();
    }
  }, [size]);

  // Make the selected camera the default. On the first run the cameras already
  // carry their configured pose, so we only aim at the origin (matching r3f's
  // default; `Canvas3DOrbitControls`, if present, re-aims at its target on
  // mount). On a later switch we carry the outgoing camera's live pose and clip
  // planes onto the incoming one so the view does not jump.
  //
  // Zoom cannot simply be copied: a perspective and an orthographic camera with
  // the same `zoom` show wildly different scales. Instead we derive the incoming
  // camera's zoom so its viewport is the same number of world units tall at the
  // orbit target as the outgoing camera's was — i.e. the scale at the target is
  // preserved across the switch. (Off the target plane the two projections still
  // differ, as they must.) Without an orbit target there is nothing to match
  // against, so we fall back to carrying the zoom over unchanged.
  const isFirstRef = useRef(true);
  useLayoutEffect(() => {
    const next = orthographic
      ? orthographicRef.current
      : perspectiveRef.current;
    if (!next) {
      return;
    }
    if (isFirstRef.current) {
      isFirstRef.current = false;
      next.lookAt(0, 0, 0);
    } else {
      const previous = get().camera;
      if (previous !== next) {
        next.position.copy(previous.position);
        next.quaternion.copy(previous.quaternion);
        next.near = previous.near;
        next.far = previous.far;
        const target = orbitTarget(get().controls);
        if (target) {
          const distance = next.position.distanceTo(target);
          const height = visibleHeightAt(previous, distance);
          next.zoom = zoomForVisibleHeight(next, height, distance);
        } else {
          next.zoom = previous.zoom;
        }
        next.updateProjectionMatrix();
      }
    }
    next.updateMatrixWorld();
    set({ camera: next });
  }, [orthographic, get, set]);

  return (
    <>
      <perspectiveCamera
        ref={perspectiveRef}
        position={camera.position}
        up={camera.up}
        fov={camera.fov}
        near={camera.near}
        far={camera.far}
        zoom={camera.zoom}
      />
      <orthographicCamera
        ref={orthographicRef}
        position={camera.position}
        up={camera.up}
        near={camera.near}
        far={camera.far}
        zoom={camera.zoom}
      />
    </>
  );
}
