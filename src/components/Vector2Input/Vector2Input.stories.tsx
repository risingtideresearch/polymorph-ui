import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Vector2 } from "three";

import { Vector2Input } from "./Vector2Input";

const meta = {
  title: "Components/Vector2Input",
  component: Vector2Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Vector2Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { getValue: () => new Vector2(), setValue: () => {} },
  render: function Render() {
    const [value, setValue] = useState(() => new Vector2(0, 0));
    return <Vector2Input getValue={() => value} setValue={setValue} />;
  },
};

export const NonZero: Story = {
  args: { getValue: () => new Vector2(), setValue: () => {} },
  render: function Render() {
    const [value, setValue] = useState(() => new Vector2(120, 80));
    return <Vector2Input getValue={() => value} setValue={setValue} />;
  },
};
