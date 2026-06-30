import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";

import { NumberInput } from "./NumberInput";

const meta = {
  title: "Components/NumberInput",
  component: NumberInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: { onChange: () => {} },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <NumberInput
        {...args}
        value={value}
        onChange={(v) => updateArgs({ value: v })}
      />
    );
  },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Value",
    value: 42,
  },
};

export const WithMinMax: Story = {
  args: {
    label: "Opacity",
    value: 0.5,
    min: 0,
    max: 1,
  },
};
