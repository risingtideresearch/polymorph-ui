import { useCallback, useState } from "react";
import { Vector2 } from "three";

import {
  Area,
  AreaGroup,
  AreaSeparator,
  Canvas2D,
  Canvas2DDrawCallback,
  PointerEventsContainer,
  Panel,
  Property,
  PropertyGrid,
  NumberInput,
  Vector2Input,
  drawCanvasGrid,
  drawCanvasBackground,
  setCanvasTransform,
} from "polymorph-ui";

import "polymorph-ui/reset.css";
import "polymorph-ui/base.css";

export const BACKGROUND_COLOR = "#e0e0e0";
export const CIRCLE_COLOR = "#000000";

export function App() {
  // Circle parameters.
  const [radius, setRadius] = useState(50);
  const [center, setCenter] = useState(new Vector2(0, 0));

  // Redraw whenever the circle parameters or the Canvas2D's camera change.
  const onCanvasDraw = useCallback<Canvas2DDrawCallback>(
    (ctx, camera) => {
      // Draw the background and grid.
      drawCanvasBackground(ctx, BACKGROUND_COLOR);
      drawCanvasGrid(ctx, camera);

      // Draw the circle in world coordinates.
      setCanvasTransform(ctx, camera);
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = CIRCLE_COLOR;
      ctx.fill();
    },
    [radius, center],
  );

  return (
    <PointerEventsContainer>
      <AreaGroup orientation="horizontal">
        <Area defaultSize={90}>
          <Canvas2D onCanvasDraw={onCanvasDraw} />
        </Area>
        <AreaSeparator />
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
