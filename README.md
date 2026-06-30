# Polymorph's UI Library

A styled and slightly opinionated React component library for building CAD web
applications.

It provides the building blocks such an app tends to need: resizable areas,
panels, property grids, numeric inputs with click-and-drag editing, menus, and
the supporting hooks and pointer-event plumbing. The components come
pre-styled, so you get a coherent look out of the box, with room to override via
`className` and CSS variables where it matters.

---

## Installation

Client applications declare the `polymorph-ui` package as a dependency in their
`package.json` (e.g. as a git submodule or git dependency). `react` and
`react-dom` are peer dependencies of `polymorph-ui` and must therefore be
declared as dependencies of the client application.

Then, the library components can be imported via:

```ts
import { Area, Panel, NumberInput } from "polymorph-ui";
```

It is recommended to import the following two stylesheets at your application's
entry point, or otherwise at least provide compatible CSS variables:

```ts
import "polymorph-ui/reset.css"; // normalizes browser defaults
import "polymorph-ui/base.css"; // base typography, colors, and CSS variables
```

---

## Quick start

A minimal CAD-like React application with:

- on the left, an SVG viewport showing a circle, and
- on the right, a properties panel where the radius/position of the circle can be edited

```tsx
import { useState } from "react";
import { Vector2 } from "three";

import {
  Area,
  AreaGroup,
  AreaSeparator,
  PointerEventsContainer,
  Panel,
  Property,
  PropertyGrid,
  NumberInput,
  Vector2Input,
} from "polymorph-ui";

import "polymorph-ui/reset.css";
import "polymorph-ui/base.css";

function App() {
  const [radius, setRadius] = useState(50);
  const [center, setCenter] = useState(new Vector2(0, 0));

  return (
    // PointerEventsContainer enables the unified pointer handling that the
    // draggable inputs and resizable areas rely on.
    <PointerEventsContainer>
      <AreaGroup orientation="horizontal">
        <Area defaultSize={90} style={{ position: "relative" }}>
          <svg
            viewBox="-500 -500 1000 1000"
            style={{ display: "block", width: "100%", height: "100%" }}
          >
            <circle cx={center.x} cy={center.y} r={radius} />
          </svg>
        </Area>

        {/* Draggable separator between the two areas */}
        <AreaSeparator />

        {/* Properties panel */}
        <Area defaultSize={30}>
          <Panel title="Properties">
            <PropertyGrid>
              <Property name="Radius">
                <NumberInput
                  label="r"
                  value={radius}
                  onChange={setRadius}
                  min={0}
                />
              </Property>
              <Property name="Center">
                <Vector2Input getValue={() => center} setValue={setCenter} />
              </Property>
            </PropertyGrid>
          </Panel>
        </Area>
      </AreaGroup>
    </PointerEventsContainer>
  );
}
```

This example is available at [`examples/quickstart.tsx`](examples/quickstart.tsx) and
can be run with `npm run dev` or `npm run example -- quickstart`.

Individual components can be tested in our Storybook:

```bash
npm run storybook
```

A few things worth noting from the example:

- **`AreaGroup` / `Area` / `AreaSeparator`** build resizable, splittable
  layouts. `Area`'s `defaultSize` is a percentage; groups can be nested and
  given either `"horizontal"` or `"vertical"` orientation.
- **`NumberInput`** is more than a text field: it supports click-and-drag to
  scrub the value, validates input as you type, and clamps to `min`/`max`. It
  also has optional `onDragStart` / `onDragMove` / `onDragEnd` callbacks for
  cases where dragging values can be optimized (e.g., caching on drag start),
  otherwise each drag move defaults to calling `onChange`.
- **`Property` + `PropertyGrid`** lay out labeled controls in a tidy
  name/value grid — the bread and butter of a CAD inspector.

---

## What's included

Components:

| Layout | `Area`, `AreaGroup`, `AreaSeparator`, `Panel`, `InputGroup`, `Property`, `PropertyGrid` |
| Low-level inputs | `InputContainer`, `InputLabel`, `Select`, `SelectOption`, `Input` |
| High-level inputs | `NumberInput`, `TextInput`, `EnumInput`, `Vector2Input`, `EditableLabel` |
| Menus | `Menu`, `MenuItem`, `MenuCheckboxItem`, `MenuSeparator`, `SubMenu`, `MenuRightSlot` |

Utilities:

| Abstract event types | `IMouseEvent`, `IPointerEvent`, `IWheelEvent`, `IMouseOrPointerEvent` |
| Keyboard events | `KeyboardModifiers`, `KeyboardShortcut` |
| Pointer events | `PointerEventsContainer`, `usePointerEvents`, `PointerShortcut`, `getPointerPosition` |
| Positionning | `useClientSize`, `getContentBoxPosition`, `getPointerWindowPosition`, `getPointerViewPosition` |
| Misc | `styled`, , `useInputIdBase`, `useMergedRefs`, `Pattern`, `dragReorder` |

---

## Project layout

```
src/
├── components/   the components above (one .tsx + .module.css per component)
├── contexts/     React contexts (e.g. pointer events)
├── hooks/        useClientSize, usePointerEvents, useInputIdBase
├── utils/        styled(), pointer/gesture helpers, Pattern, drag-reorder
├── reset.css     browser reset
├── base.css      base styles and CSS variables
└── main.ts       public entry point
```

## Development

```bash
npm run build                # build the library
npm run check                # typecheck + lint + format check
npm run test                 # vitest
npm run dev                  # runs the quickstart example
npm run example -- <name>    # runs the examples/<name>.tsx example
npm run storybook            # runs the Storybook app to test individual components
```
