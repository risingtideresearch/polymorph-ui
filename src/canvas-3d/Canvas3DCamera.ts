import { OrthographicCamera, PerspectiveCamera } from "three";

/**
 * The camera types supported by `Canvas3D`.
 */
export type Canvas3DCamera = PerspectiveCamera | OrthographicCamera;

/**
 * A type that exposes all possible camera props.
 */
export interface Canvas3DCameraOptions {
  // Common camera props
  near?: number; // Note: can be 0 for orthographic cameras, but not for perspective cameras
  far?: number;
  position?: [number, number, number];
  up?: [number, number, number];

  // Perspective camera props
  fov?: number;
  aspect?: number;

  // Orthographic camera props
  zoom?: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

/**
 * The default camera options of Canvas3D: it frames a scene assumed to be
 * centered near the origin and a few hundred units across. The camera position
 * doesn't belong to any 45-degree plane to prevent visual overlapping in the
 * rendering of default grids/planes.
 */
export const defaultCanvas3DCameraOptions: Canvas3DCameraOptions = {
  fov: 40,
  aspect: 1,
  near: 1,
  far: 10000,
  position: [-190, -300, 210],
  up: [0, 0, 1],
  zoom: 1,
};
