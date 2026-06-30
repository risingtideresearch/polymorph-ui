// This example is used in README.md, please keep them in sync.

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

export function App() {
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
