import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { EditableLabel } from "./EditableLabel";

const meta = {
  title: "Components/EditableLabel",
  component: EditableLabel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EditableLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: "", setValue: () => {} },
  render: function Render() {
    const [value, setValue] = useState("Double-click to edit");
    return (
      <EditableLabel
        style={{
          width: "200px",
          background: "var(--primary-background-color)",
        }}
        value={value}
        setValue={setValue}
      />
    );
  },
};
