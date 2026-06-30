import type { Meta, StoryObj } from "@storybook/react-vite";

import { InvalidIcon } from "./InvalidIcon";

const meta = {
  title: "Components/InvalidIcon",
  component: InvalidIcon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof InvalidIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
