import type { Meta, StoryObj } from "@storybook/react-vite";

import { InputGroup } from "./InputGroup";
import { NumberInput } from "../NumberInput/NumberInput";

const meta = {
  title: "Components/InputGroup",
  component: InputGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoInputs: Story = {
  render: () => (
    <InputGroup>
      <NumberInput label="X" value={0} onChange={() => {}} />
      <NumberInput label="Y" value={0} onChange={() => {}} />
    </InputGroup>
  ),
};

export const ThreeInputs: Story = {
  render: () => (
    <InputGroup>
      <NumberInput label="R" value={255} onChange={() => {}} />
      <NumberInput label="G" value={128} onChange={() => {}} />
      <NumberInput label="B" value={0} onChange={() => {}} />
    </InputGroup>
  ),
};
