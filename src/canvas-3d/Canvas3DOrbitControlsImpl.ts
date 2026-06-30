import {
  Box3,
  EventDispatcher,
  Matrix4,
  MOUSE,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Sphere,
  Spherical,
  TOUCH,
  Vector2,
  Vector3,
} from "three";

/**
 * The camera types this controller knows how to drive.
 */
export type OrbitCamera = PerspectiveCamera | OrthographicCamera;

/**
 * Events emitted by `Canvas3DOrbitControlsImpl`, matching the names used by
 * three's stock `OrbitControls` so that consumers expecting that contract (e.g.
 * `@react-three/drei`'s `GizmoHelper`) keep working.
 */
interface OrbitControlsEventMap {
  /** Fired whenever the camera (position, orientation, or zoom) changed. */
  change: object;
  /** Fired when a user gesture (rotate/pan/dolly/wheel) starts. */
  start: object;
  /** Fired when a user gesture ends. */
  end: object;
}

const CHANGE_EVENT = { type: "change" as const };
const START_EVENT = { type: "start" as const };
const END_EVENT = { type: "end" as const };

const STATE = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
} as const;
type State = (typeof STATE)[keyof typeof STATE];

// Below this squared movement / orientation change, `update()` considers the
// camera unchanged and does not emit a "change" event.
const EPS = 1e-6;

// When `autoNear` is enabled, `near` is set to `far / NEAR_FAR_RATIO`. Depth
// precision is governed by the near/far ratio (dramatically so for a
// perspective camera, where the depth buffer is non-linear), so capping that
// ratio keeps precision reasonable no matter how large `far` grows — e.g. when
// `bounds` fits `far` to a sprawling scene. The value is a compromise: a 24-bit
// depth buffer stays comfortable across the whole frustum, while `near` remains
// small enough that geometry between the camera and its target is essentially
// never clipped when zoomed in. It matches the order of magnitude of three's
// stock perspective default (near 0.1, far 2000).
const NEAR_FAR_RATIO = 10000;

// The reference "up" the spherical math is expressed in. The camera's own `up`
// is rotated onto this axis before computing spherical coordinates, so any `up`
// is supported (this viewport uses Z-up).
const Y_UP = /* @__PURE__ */ new Vector3(0, 1, 0);

// Vertical pointer travel, in CSS pixels, that dollies the camera by one zoom
// "step" (a factor of 0.95 at the default zoom speed) when dragging with the
// middle mouse button. The dolly is exponential in this distance, so the total
// zoom of a drag depends only on its start and end positions, not on how fast
// the pointer moved (see `handleMouseMoveDolly`).
const DOLLY_PIXELS_PER_STEP = 5;

// Scratch objects reused by `update()` and the pan helpers. They are
// module-level (rather than per-instance) because every method that uses them
// runs to completion synchronously and never re-enters, so a single instance
// can never observe another's intermediate values.
const _offset = /* @__PURE__ */ new Vector3();
const _quat = /* @__PURE__ */ new Quaternion();
const _quatInverse = /* @__PURE__ */ new Quaternion();
const _panV = /* @__PURE__ */ new Vector3();
const _panEye = /* @__PURE__ */ new Vector3();
const _sphere = /* @__PURE__ */ new Sphere();

/**
 * A from-scratch orbit/pan/dolly camera controller, written to replace three's
 * stock `OrbitControls` (and `@react-three/drei`'s wrapper) so that we can
 * change how zooming an orthographic camera behaves.
 *
 * Standard `OrbitControls` zooms an orthographic camera purely by changing
 * `camera.zoom`, leaving the camera's position—and therefore its distance to
 * the near/far clipping planes—fixed. Here, zooming an orthographic camera
 * *also* dollies the camera along its view direction, exactly like it does for
 * a perspective camera. The orthographic projection is invariant to translation
 * along the view axis, so this does not shift the rendered image; it only moves
 * the camera relative to the scene, which makes the near/far clipping planes
 * track the zoom level instead of staying put.
 *
 * Aside from that single behavioral change, the gesture mapping mirrors the
 * stock controls: left-drag rotates, right-drag pans, middle-drag dollies, the
 * wheel zooms, and Ctrl/Shift/Meta + left-drag pans. One-finger touch rotates
 * and two-finger touch dollies + pans. Damping, auto-rotate, keyboard panning,
 * and zoom-to-cursor are intentionally omitted as they are unused here.
 */
export class Canvas3DOrbitControlsImpl extends EventDispatcher<OrbitControlsEventMap> {
  /** The camera being controlled. */
  object: OrbitCamera;

  /** The DOM element gestures are read from, set by `connect()`. */
  domElement?: HTMLElement;

  /** Set to false to disable all interaction. */
  enabled = true;

  /** The point the camera orbits around and looks at. */
  target = new Vector3();

  /**
   * If set (and non-empty), `update()` keeps the camera's `far` clipping plane
   * large enough to contain this box from the camera's current position, so its
   * contents are never clipped away as the camera dollies (zooms). The `near`
   * plane is left untouched. Set to `undefined` to leave `far` as-is.
   */
  bounds?: Box3;

  /**
   * When true, `update()` derives the `near` clipping plane from `far` as
   * `far / NEAR_FAR_RATIO`, keeping the near/far ratio—and therefore depth
   * precision—bounded as `far` grows (e.g. via {@link bounds}). When false (the
   * default), `near` is left under the caller's control.
   */
  autoNear = false;

  // Dolly (perspective) / position distance limits.
  minDistance = 0;
  maxDistance = Infinity;

  // Zoom (orthographic) limits.
  minZoom = 0;
  maxZoom = Infinity;

  // Vertical orbit limits, in radians (0 .. PI). The presence of
  // `minPolarAngle` is also how `drei`'s `GizmoHelper` detects orbit controls.
  minPolarAngle = 0;
  maxPolarAngle = Math.PI;

  // Horizontal orbit limits, in radians.
  minAzimuthAngle = -Infinity;
  maxAzimuthAngle = Infinity;

  enableZoom = true;
  zoomSpeed = 1;
  wheelZoomSpeed = 4;
  enableRotate = true;
  rotateSpeed = 1;
  enablePan = true;
  panSpeed = 1;

  /** When true, panning moves in the camera's screen plane. */
  screenSpacePanning = true;

  mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };
  touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };

  // --- Internal gesture state ---

  private state: State = STATE.NONE;

  // Current spherical coordinates of the camera relative to `target`, and the
  // pending delta to apply on the next `update()`.
  private spherical = new Spherical();
  private sphericalDelta = new Spherical();

  // Pending dolly/zoom factor and pan translation, applied on the next
  // `update()`. `scale` < 1 zooms in, > 1 zooms out.
  private scale = 1;
  private panOffset = new Vector3();

  // Gesture tracking points, in client/page pixels.
  private rotateStart = new Vector2();
  private rotateEnd = new Vector2();
  private rotateDelta = new Vector2();
  private panStart = new Vector2();
  private panEnd = new Vector2();
  private panDelta = new Vector2();
  private dollyStart = new Vector2();
  private dollyEnd = new Vector2();
  private dollyDelta = new Vector2();

  // Active pointers, used for multi-touch gestures.
  private pointers: PointerEvent[] = [];
  private pointerPositions: Record<number, Vector2> = {};

  // Last emitted camera pose, for change detection in `update()`.
  private lastPosition = new Vector3();
  private lastQuaternion = new Quaternion();

  constructor(object: OrbitCamera, domElement?: HTMLElement) {
    super();
    this.object = object;
    if (domElement !== undefined) {
      this.connect(domElement);
    }
    // Initialize `spherical`, `lastPosition`, etc. from the camera's pose.
    this.update();
  }

  // --- Public API ---

  /**
   * Attaches gesture listeners to `domElement`. Pointer move/up are listened
   * for on the owning document so a gesture keeps tracking even if the pointer
   * leaves the element (or the element becomes non-interactive) mid-drag.
   */
  connect(domElement: HTMLElement) {
    this.domElement = domElement;
    domElement.style.touchAction = "none";
    domElement.addEventListener("contextmenu", this.onContextMenu);
    domElement.addEventListener("pointerdown", this.onPointerDown);
    domElement.addEventListener("pointercancel", this.onPointerUp);
    domElement.addEventListener("wheel", this.onMouseWheel, { passive: false });
  }

  /** Removes all listeners added by `connect()`. */
  dispose() {
    const domElement = this.domElement;
    if (!domElement) {
      return;
    }
    domElement.style.touchAction = "auto";
    domElement.removeEventListener("contextmenu", this.onContextMenu);
    domElement.removeEventListener("pointerdown", this.onPointerDown);
    domElement.removeEventListener("pointercancel", this.onPointerUp);
    domElement.removeEventListener("wheel", this.onMouseWheel);
    domElement.ownerDocument.removeEventListener(
      "pointermove",
      this.onPointerMove,
    );
    domElement.ownerDocument.removeEventListener("pointerup", this.onPointerUp);
  }

  /**
   * Recomputes the camera pose from `target`, the pending rotate/pan/dolly
   * deltas, and (for an orthographic camera) the zoom.
   *
   * This is deliberately stateless with respect to the camera's position: it
   * re-derives the spherical coordinates from `object.position` each call, so it
   * stays correct even when the position is changed externally between calls
   * (for example by `GizmoHelper` while animating to an axis view).
   *
   * Returns true if the camera pose changed.
   */
  update(): boolean {
    const object = this.object;
    const position = object.position;

    // Express the camera offset in a frame where `object.up` points along +Y,
    // so spherical math is independent of the world up direction.
    _quat.setFromUnitVectors(object.up, Y_UP);
    _quatInverse.copy(_quat).invert();

    _offset.copy(position).sub(this.target);
    _offset.applyQuaternion(_quat);
    this.spherical.setFromVector3(_offset);

    // Apply the pending orbit, clamped to the configured angle limits.
    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;
    this.spherical.theta = Math.max(
      this.minAzimuthAngle,
      Math.min(this.maxAzimuthAngle, this.spherical.theta),
    );
    this.spherical.phi = Math.max(
      this.minPolarAngle,
      Math.min(this.maxPolarAngle, this.spherical.phi),
    );
    this.spherical.makeSafe();

    // Apply the pending pan to the orbit target.
    this.target.add(this.panOffset);

    // Apply the pending dolly to the camera distance. Unlike stock
    // OrbitControls, we do this for orthographic cameras too (see class doc),
    // so the camera physically moves toward/away from the target on zoom.
    this.spherical.radius = this.clampDistance(
      this.spherical.radius * this.scale,
    );

    // Recompute the camera position and make it look at the target.
    _offset.setFromSpherical(this.spherical);
    _offset.applyQuaternion(_quatInverse);
    position.copy(this.target).add(_offset);
    object.lookAt(this.target);

    // Consume the pending deltas.
    this.sphericalDelta.set(0, 0, 0);
    this.panOffset.set(0, 0, 0);

    // For an orthographic camera, the dolly above does not change the apparent
    // size of objects (parallel projection), so we additionally adjust `zoom`
    // to produce the actual zoom effect.
    let zoomChanged = false;
    if (object instanceof OrthographicCamera) {
      if (this.scale !== 1) {
        object.zoom = Math.max(
          this.minZoom,
          Math.min(this.maxZoom, object.zoom / this.scale),
        );
        object.updateProjectionMatrix();
        zoomChanged = true;
      }
    }
    this.scale = 1;

    // If bounds are set, grow/shrink `far` to exactly contain them from the
    // camera's new position. We bound the box by its enclosing sphere so the
    // result is independent of the view direction: every point of the box is
    // within `distanceToCenter + radius` of the camera, so that distance is the
    // tightest `far` that never clips the box.
    let farChanged = false;
    if (this.bounds && !this.bounds.isEmpty()) {
      this.bounds.getBoundingSphere(_sphere);
      // Keep `far` strictly greater than (and float-distinct from) `near`,
      // which would otherwise make the projection matrix singular. This only
      // bites in the degenerate case where the box lies entirely in front of the
      // near plane: there is nothing of it to show, so we just fall back to a
      // minimal valid frustum. The margin scales with `|near|` so it stays
      // distinct at any magnitude and sign — orthographic cameras allow `near`
      // to be zero or negative — with an absolute floor so `near === 0` still
      // yields a positive margin.
      const minFar = object.near + Math.max(Math.abs(object.near), 1) * 1e-6;
      const far = Math.max(
        position.distanceTo(_sphere.center) + _sphere.radius,
        minFar,
      );
      if (object.far !== far) {
        object.far = far;
        object.updateProjectionMatrix();
        farChanged = true;
      }
    }

    // If `autoNear` is set, derive `near` from the (possibly just-refitted)
    // `far` to keep the near/far ratio—and thus depth precision—bounded. This
    // runs after the `far` block above so it always sees the latest `far`; the
    // `minFar` floor there reads `near` from the previous frame, but that only
    // matters in the degenerate empty-frustum fallback, so the one-frame lag is
    // harmless. `far / NEAR_FAR_RATIO` is positive whenever `far` is, keeping
    // `near` valid for a perspective camera (which requires `near > 0`).
    let nearChanged = false;
    if (this.autoNear) {
      const near = object.far / NEAR_FAR_RATIO;
      if (object.near !== near) {
        object.near = near;
        object.updateProjectionMatrix();
        nearChanged = true;
      }
    }

    if (
      zoomChanged ||
      farChanged ||
      nearChanged ||
      this.lastPosition.distanceToSquared(object.position) > EPS ||
      8 * (1 - this.lastQuaternion.dot(object.quaternion)) > EPS
    ) {
      this.dispatchEvent(CHANGE_EVENT);
      this.lastPosition.copy(object.position);
      this.lastQuaternion.copy(object.quaternion);
      return true;
    }
    return false;
  }

  // --- Gesture math ---

  private getZoomScale(speed?: number): number {
    return Math.pow(0.95, speed ?? this.zoomSpeed);
  }

  private clampDistance(distance: number) {
    return Math.max(this.minDistance, Math.min(this.maxDistance, distance));
  }

  private rotateLeft(angle: number) {
    this.sphericalDelta.theta -= angle;
  }

  private rotateUp(angle: number) {
    this.sphericalDelta.phi -= angle;
  }

  private panLeft(distance: number, objectMatrix: Matrix4) {
    _panV.setFromMatrixColumn(objectMatrix, 0);
    _panV.multiplyScalar(-distance);
    this.panOffset.add(_panV);
  }

  private panUp(distance: number, objectMatrix: Matrix4) {
    if (this.screenSpacePanning) {
      _panV.setFromMatrixColumn(objectMatrix, 1);
    } else {
      _panV.setFromMatrixColumn(objectMatrix, 0);
      _panV.crossVectors(this.object.up, _panV);
    }
    _panV.multiplyScalar(distance);
    this.panOffset.add(_panV);
  }

  private pan(deltaX: number, deltaY: number) {
    const element = this.domElement;
    if (!element) {
      return;
    }
    const object = this.object;
    if (object instanceof PerspectiveCamera) {
      // Scale screen-space movement to world units at the target distance.
      _panEye.copy(object.position).sub(this.target);
      let targetDistance = _panEye.length();
      targetDistance *= Math.tan(((object.fov / 2) * Math.PI) / 180);
      this.panLeft(
        (2 * deltaX * targetDistance) / element.clientHeight,
        object.matrix,
      );
      this.panUp(
        (2 * deltaY * targetDistance) / element.clientHeight,
        object.matrix,
      );
    } else {
      this.panLeft(
        (deltaX * (object.right - object.left)) /
          object.zoom /
          element.clientWidth,
        object.matrix,
      );
      this.panUp(
        (deltaY * (object.top - object.bottom)) /
          object.zoom /
          element.clientHeight,
        object.matrix,
      );
    }
  }

  private dollyOut(dollyScale: number) {
    this.scale /= dollyScale;
  }

  private dollyIn(dollyScale: number) {
    this.scale *= dollyScale;
  }

  // --- Mouse handlers ---

  private handleMouseMoveRotate(event: PointerEvent) {
    this.rotateEnd.set(event.clientX, event.clientY);
    this.rotateDelta
      .subVectors(this.rotateEnd, this.rotateStart)
      .multiplyScalar(this.rotateSpeed);
    const element = this.domElement;
    if (element) {
      this.rotateLeft(
        (2 * Math.PI * this.rotateDelta.x) / element.clientHeight,
      );
      this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight);
    }
    this.rotateStart.copy(this.rotateEnd);
    this.update();
  }

  private handleMouseMoveDolly(event: PointerEvent) {
    this.dollyEnd.set(event.clientX, event.clientY);
    this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);
    // Dolly by an amount exponential in the vertical drag distance: dragging
    // down zooms out, dragging up zooms in. Because the per-event factors
    // multiply (so their exponents add), a drag split into many small move
    // events (a slow pointer) produces exactly the same total zoom as the same
    // drag in a few large events (a fast pointer). The zoom therefore depends
    // only on where the drag started and ended, not on the pointer speed.
    const zoomSteps =
      (this.dollyDelta.y * this.zoomSpeed) / DOLLY_PIXELS_PER_STEP;
    this.dollyOut(this.getZoomScale(zoomSteps));
    this.dollyStart.copy(this.dollyEnd);
    this.update();
  }

  private handleMouseMovePan(event: PointerEvent) {
    this.panEnd.set(event.clientX, event.clientY);
    this.panDelta
      .subVectors(this.panEnd, this.panStart)
      .multiplyScalar(this.panSpeed);
    this.pan(this.panDelta.x, this.panDelta.y);
    this.panStart.copy(this.panEnd);
    this.update();
  }

  private onMouseDown(event: PointerEvent) {
    let mouseAction: number;
    switch (event.button) {
      case 0:
        mouseAction = this.mouseButtons.LEFT;
        break;
      case 1:
        mouseAction = this.mouseButtons.MIDDLE;
        break;
      case 2:
        mouseAction = this.mouseButtons.RIGHT;
        break;
      default:
        mouseAction = -1;
    }
    switch (mouseAction) {
      case MOUSE.DOLLY:
        if (!this.enableZoom) {
          return;
        }
        this.dollyStart.set(event.clientX, event.clientY);
        this.state = STATE.DOLLY;
        break;
      case MOUSE.ROTATE:
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          if (!this.enablePan) {
            return;
          }
          this.panStart.set(event.clientX, event.clientY);
          this.state = STATE.PAN;
        } else {
          if (!this.enableRotate) {
            return;
          }
          this.rotateStart.set(event.clientX, event.clientY);
          this.state = STATE.ROTATE;
        }
        break;
      case MOUSE.PAN:
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          if (!this.enableRotate) {
            return;
          }
          this.rotateStart.set(event.clientX, event.clientY);
          this.state = STATE.ROTATE;
        } else {
          if (!this.enablePan) {
            return;
          }
          this.panStart.set(event.clientX, event.clientY);
          this.state = STATE.PAN;
        }
        break;
      default:
        this.state = STATE.NONE;
    }
    if (this.state !== STATE.NONE) {
      this.dispatchEvent(START_EVENT);
    }
  }

  private onMouseMove(event: PointerEvent) {
    switch (this.state) {
      case STATE.ROTATE:
        if (!this.enableRotate) {
          return;
        }
        this.handleMouseMoveRotate(event);
        break;
      case STATE.DOLLY:
        if (!this.enableZoom) {
          return;
        }
        this.handleMouseMoveDolly(event);
        break;
      case STATE.PAN:
        if (!this.enablePan) {
          return;
        }
        this.handleMouseMovePan(event);
        break;
    }
  }

  private onMouseWheel = (event: WheelEvent) => {
    if (
      !this.enabled ||
      !this.enableZoom ||
      (this.state !== STATE.NONE && this.state !== STATE.ROTATE)
    ) {
      return;
    }
    event.preventDefault();
    this.dispatchEvent(START_EVENT);
    if (event.deltaY < 0) {
      this.dollyIn(this.getZoomScale(this.wheelZoomSpeed));
    } else if (event.deltaY > 0) {
      this.dollyOut(this.getZoomScale(this.wheelZoomSpeed));
    }
    this.update();
    this.dispatchEvent(END_EVENT);
  };

  private onContextMenu = (event: MouseEvent) => {
    if (!this.enabled) {
      return;
    }
    event.preventDefault();
  };

  // --- Touch handlers ---

  private handleTouchStartRotate() {
    if (this.pointers.length === 1) {
      this.rotateStart.set(this.pointers[0].pageX, this.pointers[0].pageY);
    } else {
      const x = 0.5 * (this.pointers[0].pageX + this.pointers[1].pageX);
      const y = 0.5 * (this.pointers[0].pageY + this.pointers[1].pageY);
      this.rotateStart.set(x, y);
    }
  }

  private handleTouchStartPan() {
    if (this.pointers.length === 1) {
      this.panStart.set(this.pointers[0].pageX, this.pointers[0].pageY);
    } else {
      const x = 0.5 * (this.pointers[0].pageX + this.pointers[1].pageX);
      const y = 0.5 * (this.pointers[0].pageY + this.pointers[1].pageY);
      this.panStart.set(x, y);
    }
  }

  private handleTouchStartDolly() {
    const dx = this.pointers[0].pageX - this.pointers[1].pageX;
    const dy = this.pointers[0].pageY - this.pointers[1].pageY;
    this.dollyStart.set(0, Math.sqrt(dx * dx + dy * dy));
  }

  private handleTouchStartDollyPan() {
    if (this.enableZoom) {
      this.handleTouchStartDolly();
    }
    if (this.enablePan) {
      this.handleTouchStartPan();
    }
  }

  private handleTouchMoveRotate(event: PointerEvent) {
    if (this.pointers.length === 1) {
      this.rotateEnd.set(event.pageX, event.pageY);
    } else {
      const position = this.getSecondPointerPosition(event);
      const x = 0.5 * (event.pageX + position.x);
      const y = 0.5 * (event.pageY + position.y);
      this.rotateEnd.set(x, y);
    }
    this.rotateDelta
      .subVectors(this.rotateEnd, this.rotateStart)
      .multiplyScalar(this.rotateSpeed);
    const element = this.domElement;
    if (element) {
      this.rotateLeft(
        (2 * Math.PI * this.rotateDelta.x) / element.clientHeight,
      );
      this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight);
    }
    this.rotateStart.copy(this.rotateEnd);
  }

  private handleTouchMovePan(event: PointerEvent) {
    if (this.pointers.length === 1) {
      this.panEnd.set(event.pageX, event.pageY);
    } else {
      const position = this.getSecondPointerPosition(event);
      const x = 0.5 * (event.pageX + position.x);
      const y = 0.5 * (event.pageY + position.y);
      this.panEnd.set(x, y);
    }
    this.panDelta
      .subVectors(this.panEnd, this.panStart)
      .multiplyScalar(this.panSpeed);
    this.pan(this.panDelta.x, this.panDelta.y);
    this.panStart.copy(this.panEnd);
  }

  private handleTouchMoveDolly(event: PointerEvent) {
    const position = this.getSecondPointerPosition(event);
    const dx = event.pageX - position.x;
    const dy = event.pageY - position.y;
    this.dollyEnd.set(0, Math.sqrt(dx * dx + dy * dy));
    this.dollyDelta.set(
      0,
      Math.pow(this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed),
    );
    this.dollyOut(this.dollyDelta.y);
    this.dollyStart.copy(this.dollyEnd);
  }

  private handleTouchMoveDollyPan(event: PointerEvent) {
    if (this.enableZoom) {
      this.handleTouchMoveDolly(event);
    }
    if (this.enablePan) {
      this.handleTouchMovePan(event);
    }
  }

  private onTouchStart(event: PointerEvent) {
    this.trackPointer(event);
    switch (this.pointers.length) {
      case 1:
        switch (this.touches.ONE) {
          case TOUCH.ROTATE:
            if (!this.enableRotate) {
              return;
            }
            this.handleTouchStartRotate();
            this.state = STATE.TOUCH_ROTATE;
            break;
          case TOUCH.PAN:
            if (!this.enablePan) {
              return;
            }
            this.handleTouchStartPan();
            this.state = STATE.TOUCH_PAN;
            break;
          default:
            this.state = STATE.NONE;
        }
        break;
      case 2:
        switch (this.touches.TWO) {
          case TOUCH.DOLLY_PAN:
            if (!this.enableZoom && !this.enablePan) {
              return;
            }
            this.handleTouchStartDollyPan();
            this.state = STATE.TOUCH_DOLLY_PAN;
            break;
          default:
            this.state = STATE.NONE;
        }
        break;
      default:
        this.state = STATE.NONE;
    }
    if (this.state !== STATE.NONE) {
      this.dispatchEvent(START_EVENT);
    }
  }

  private onTouchMove(event: PointerEvent) {
    this.trackPointer(event);
    switch (this.state) {
      case STATE.TOUCH_ROTATE:
        if (!this.enableRotate) {
          return;
        }
        this.handleTouchMoveRotate(event);
        this.update();
        break;
      case STATE.TOUCH_PAN:
        if (!this.enablePan) {
          return;
        }
        this.handleTouchMovePan(event);
        this.update();
        break;
      case STATE.TOUCH_DOLLY_PAN:
        if (!this.enableZoom && !this.enablePan) {
          return;
        }
        this.handleTouchMoveDollyPan(event);
        this.update();
        break;
      default:
        this.state = STATE.NONE;
    }
  }

  // --- Pointer plumbing ---

  private onPointerDown = (event: PointerEvent) => {
    if (!this.enabled) {
      return;
    }
    if (this.pointers.length === 0) {
      const doc = this.domElement?.ownerDocument;
      doc?.addEventListener("pointermove", this.onPointerMove);
      doc?.addEventListener("pointerup", this.onPointerUp);
    }
    this.pointers.push(event);
    if (event.pointerType === "touch") {
      this.onTouchStart(event);
    } else {
      this.onMouseDown(event);
    }
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.enabled) {
      return;
    }
    if (event.pointerType === "touch") {
      this.onTouchMove(event);
    } else {
      this.onMouseMove(event);
    }
  };

  private onPointerUp = (event: PointerEvent) => {
    this.removePointer(event);
    if (this.pointers.length === 0) {
      const domElement = this.domElement;
      domElement?.releasePointerCapture(event.pointerId);
      domElement?.ownerDocument.removeEventListener(
        "pointermove",
        this.onPointerMove,
      );
      domElement?.ownerDocument.removeEventListener(
        "pointerup",
        this.onPointerUp,
      );
    }
    this.dispatchEvent(END_EVENT);
    this.state = STATE.NONE;
  };

  private trackPointer(event: PointerEvent) {
    let position = this.pointerPositions[event.pointerId];
    if (position === undefined) {
      position = new Vector2();
      this.pointerPositions[event.pointerId] = position;
    }
    position.set(event.pageX, event.pageY);
  }

  private getSecondPointerPosition(event: PointerEvent) {
    const pointer =
      event.pointerId === this.pointers[0].pointerId
        ? this.pointers[1]
        : this.pointers[0];
    return this.pointerPositions[pointer.pointerId];
  }

  private removePointer(event: PointerEvent) {
    delete this.pointerPositions[event.pointerId];
    for (let i = 0; i < this.pointers.length; i++) {
      if (this.pointers[i].pointerId === event.pointerId) {
        this.pointers.splice(i, 1);
        return;
      }
    }
  }
}
