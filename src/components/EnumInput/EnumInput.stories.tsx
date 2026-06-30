import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";

import { EnumInput } from "./EnumInput";

type Alignment = "left" | "center" | "right";

const meta = {
  title: "Components/EnumInput",
  component: EnumInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: { setValue: () => {} },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <EnumInput
        {...args}
        value={value}
        setValue={(v) => updateArgs({ value: v })}
      />
    );
  },
} satisfies Meta<typeof EnumInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: "left" as Alignment,
    options: { left: "Left", center: "Center", right: "Right" } as Record<
      Alignment,
      string
    >,
  },
};

export const WithLabel: Story = {
  args: {
    label: "Alignment",
    value: "left" as Alignment,
    options: { left: "Left", center: "Center", right: "Right" } as Record<
      Alignment,
      string
    >,
  },
};
