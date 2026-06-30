import { createContext, useContext, useState } from "react";
import { Vector2 } from "three";

export interface ClickCandidate {
  priority: number;
  onClick: (event: PointerEvent) => void;
}

export interface DragCandidate {
  priority: number;
  onDragStart: (event: PointerEvent) => void;
  onDragMove: (event: PointerEvent) => void;
  onDragEnd: (event: PointerEvent) => void;
}

export type Subscriber = () => void;
export type UnsubscribeFunction = () => void;

export class PointerEventsState {
  id: string;
  private startEvent_: false | PointerEvent = false;
  private isDragging_: false | DragCandidate = false;
  private clickCandidates_: ClickCandidate[] = [];
  private dragCandidates_: DragCandidate[] = [];
  private subscribers_: Subscriber[] = [];
  private cleanupPointerListeners = () => {};

  constructor() {
    this.id = Math.random().toString(16).slice(2);
  }

  /**
   * Returns whether there is an ongoing click or drag operation.
   */
  get isClickOrDragging(): boolean {
    return this.startEvent_ !== false;
  }

  /**
   * Returns whether there is an ongoing drag operation.
   */
  get isDragging(): boolean {
    return this.isDragging_ !== false;
  }

  /**
   * Returns the button number of the pointer involved in the ongoing click or
   * drag operation, if any.
   */
  get clickOrDragButton(): number {
    return this.startEvent_ ? this.startEvent_.button : -1;
  }

  /**
   * Registers a subscriber callback that is called whenever the pointer events
   * state changes.
   *
   * This is meant to be used with `useSyncExternalStore` for React components
   * to subscribe to changes in the pointer events state.
   */
  subscribe(subscriber: Subscriber): UnsubscribeFunction {
    this.subscribers_.push(subscriber);
    return () => {
      this.subscribers_ = this.subscribers_.filter((l) => l !== subscriber);
    };
  }

  private emitChange() {
    for (const subscriber of this.subscribers_) {
      subscriber();
    }
  }

  /**
   * This function should be called on pointer down events to register a potential
   * click action that could occur as a result of the pointer down.
   */
  registerClickCandidate(event: PointerEvent, candidate: ClickCandidate) {
    if (this.startEvent_ && event.button !== this.startEvent_.button) {
      // Ignore other buttons during click or drag
      return;
    }
    this.onPointerDown(event);
    this.clickCandidates_.push(candidate);
  }

  /**
   * This function should be called on pointer down events to register a potential
   * drag action that could occur as a result of the pointer down.
   */
  registerDragCandidate(event: PointerEvent, candidate: DragCandidate) {
    if (this.startEvent_ && event.button !== this.startEvent_.button) {
      // Ignore other buttons during click or drag
      return;
    }
    this.onPointerDown(event);
    this.dragCandidates_.push(candidate);
  }

  private onPointerDown(event: PointerEvent) {
    if (this.startEvent_ && event.button !== this.startEvent_.button) {
      // Ignore other buttons during click or drag
      return;
    }
    if (!this.startEvent_) {
      this.startEvent_ = event;
      const onPointerMove_ = (event: PointerEvent) => {
        this.onPointerMove(event);
      };
      const onPointerUp_ = (event: PointerEvent) => {
        this.onPointerUp(event);
      };
      const onContextMenu_ = (event: MouseEvent) => {
        this.onContextMenu(event);
      };
      this.cleanupPointerListeners = () => {
        document.removeEventListener("pointermove", onPointerMove_);
        document.removeEventListener("pointerup", onPointerUp_);
        document.removeEventListener("contextmenu", onContextMenu_);
      };
      document.addEventListener("pointermove", onPointerMove_);
      document.addEventListener("pointerup", onPointerUp_);
      document.addEventListener("contextmenu", onContextMenu_);
      this.emitChange();
    }
  }

  private onPointerMove(event: PointerEvent) {
    // This shouldn't happen.
    const startEvent = this.startEvent_;
    if (!startEvent) {
      return;
    }

    // If we're already dragging, keep dragging.
    if (this.isDragging_) {
      this.isDragging_.onDragMove(event);
      return;
    }

    // If there are no drag candidates, nothing to do.
    if (this.dragCandidates_.length === 0) {
      return;
    }

    // Otherwise, detect whether we should start dragging now.
    const startPosition = new Vector2(startEvent.clientX, startEvent.clientY);
    const currentPosition = new Vector2(event.clientX, event.clientY);
    const dragDistance = startPosition.distanceTo(currentPosition);
    const dragThreshold = 5;
    if (dragDistance > dragThreshold) {
      // Start dragging with the highest-priority drag candidate.
      let bestCandidate = this.dragCandidates_[0];
      for (const candidate of this.dragCandidates_) {
        if (candidate.priority > bestCandidate.priority) {
          bestCandidate = candidate;
        }
      }
      this.isDragging_ = bestCandidate;
      bestCandidate.onDragStart(startEvent);
      this.isDragging_.onDragMove(event);
      this.emitChange();
    }
  }

  private completeClickOrDrag(event: PointerEvent) {
    if (this.isDragging_) {
      // End the drag operation.
      this.isDragging_.onDragEnd(event);
      this.isDragging_ = false;
    } else if (this.clickCandidates_.length > 0) {
      // Not dragging, so this is a click.
      let bestCandidate = this.clickCandidates_[0];
      for (const candidate of this.clickCandidates_) {
        if (candidate.priority > bestCandidate.priority) {
          bestCandidate = candidate;
        }
      }
      bestCandidate.onClick(event);
    }

    this.startEvent_ = false;
    this.isDragging_ = false;
    this.clickCandidates_ = [];
    this.dragCandidates_ = [];
    this.cleanupPointerListeners();
    this.cleanupPointerListeners = () => {};
    this.emitChange();
  }

  private onPointerUp(event: PointerEvent) {
    // Nothing to do unless a click or drag is ongoing and the button of this
    // pointerup matches the button that started the click or drag.
    if (this.startEvent_ && this.startEvent_.button === event.button) {
      this.completeClickOrDrag(event);
    }
  }

  // If the browser's context menu opens (typically via right-click), it means
  // the browser has effectively consumed the "pointerup" for the right button,
  // and onDocPointerUp will never be called, so the application will get stuck
  // in a dragging state.
  //
  // To prevent this, we listen to contextmenu events when initiating a click or
  // drag action, and if we detect that the context menu is opening, we complete
  // any ongoing click or drag action.
  //
  private onContextMenu(event: MouseEvent) {
    if (
      this.startEvent_ &&
      this.startEvent_.button === 2 &&
      this.dragCandidates_.length > 0
    ) {
      // If the user initiated a click or drag operation with the right-click
      // and there is indeed a drag candidate, then we must disable opening the
      // context menu, otherwise such right-button drag is impossible.
      event.preventDefault();
      return;
    }

    // Our current version of TS (5.6 as of writing this) expects that
    // contextmenu events are of type MouseEvent, so we oblige. But recent
    // browsers and recent versions of TS (5.9+) actually use PointerEvent for
    // contextmenu events. Once we upgrade TS to 5.9+, we can change
    // MouseEvent to PointerEvent in the signature of this callback.
    this.completeClickOrDrag(event as PointerEvent);
  }
}

export const PointerEventsContext = createContext<PointerEventsState>(
  new PointerEventsState(),
);

export const usePointerEventsContext = (): PointerEventsState => {
  return useContext(PointerEventsContext);
};

export function useNewPointerEventsContext(): PointerEventsState {
  // Note: we want to be able to mutate the PointerEventsState without causing
  // re-renders. The most idiomatic way to do this in React would be to use
  // `useRef`, either:
  //
  // 1. const stateRef = useRef(new PointerEventsState());
  //
  //    This would allow us to directly mutate the state as:
  //
  //    stateRef.current.isDragging = candidate;
  //
  //    However, useRef doesn't support passing an initializer function, so this
  //    actually calls `new PointerEventsState()` at each render, which is
  //    wasteful.
  //
  //  2. const initial = useMemo(() => (new PointerEventsState()), []);
  //     const stateRef = useRef(initial);
  //
  //    This would avoid the repeated `new`, but it's two cache accesses.
  //
  // Instead, we use `useState` without ever calling setState but directly
  // mutate the state object, which is not what React intends but it has the
  // same behavior and semantics as useRef (does not cause re-renders), and has
  // the advantages to provide an initializer function to avoid the repeated
  // `new`.
  //
  const [state] = useState<PointerEventsState>(() => new PointerEventsState());
  return state;
}
