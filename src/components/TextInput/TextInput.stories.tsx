import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";

import { TextInput } from "./TextInput";

const meta = {
  title: "Components/TextInput",
  component: TextInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: { onTextChange: () => {} },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <TextInput
        {...args}
        value={value}
        onTextChange={(v) => updateArgs({ value: v })}
      />
    );
  },
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Name",
    value: "Hello World",
  },
};

export const NoLabel: Story = {
  args: {
    value: "No label",
  },
};

export const WithPattern: Story = {
  args: {
    label: "Integer",
    value: "42",
    onInputPattern: "^[+-]?[0-9]*$",
    onChangePattern: "^[+-]?[0-9]+$",
  },
};

export const Placeholder: Story = {
  args: {
    label: "Search",
    value: "",
    placeholder: "Type to search…",
  },
};
