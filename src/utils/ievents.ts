// This file defines each event type as being the union of the native JS event
// and its React counterpart, to ensure that our event handlers are generic
// and can be used either as native event handlers or React event handlers.

import * as React from "react";

export type IMouseEvent = MouseEvent | React.MouseEvent;
export type IPointerEvent = PointerEvent | React.PointerEvent;
export type IWheelEvent = WheelEvent | React.WheelEvent;

/**
 * This alias is equivalent to IMouseEvent, but it is more explicit and points
 * to the following documentation that explains why using a MouseEvent can be
 * preferrable to using a PointerEvent.
 *
 * In React, the built-in `onClick` and `onDoubleClick` properties are defined
 * as a `MouseEventHandler` rather than a `PointerEventHandler`:
 *
 * https://react.dev/reference/react-dom/components/common#mouseevent-handler
 *
 * This is different from modern JS spec that now defines these events as
 * pointer events (in earlier spec, they were defined as mouse events):
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event
 *
 * Therefore, even though in modern JS, using pointer events is generally
 * recommended over using mouse events, it's still sometimes necessary for
 * callbacks and helper functions to take as input a MouseEvent rather than
 * the more specific PointerEvent, so they can be used in React's onClick
 * event handlers.
 */
export type IMouseOrPointerEvent = IMouseEvent | IPointerEvent;
