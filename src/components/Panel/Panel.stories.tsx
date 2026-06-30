import type { Meta, StoryObj } from "@storybook/react-vite";
import { StoryContainer } from "../StoryContainer/StoryContainer";

import { Panel } from "./Panel";

const meta = {
  title: "Components/Panel",
  component: Panel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: "Properties" },
  render: ({ title }) => (
    <StoryContainer>
      <Panel title={title}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p>Panel content goes here.</p>
          <p>It can contain any child elements.</p>
        </div>
      </Panel>
    </StoryContainer>
  ),
};

export const NoBodyPadding: Story = {
  args: { title: "Draw Area" },
  render: ({ title }) => (
    <StoryContainer>
      <Panel title={title} noBodyPadding>
        <div
          style={{
            backgroundColor: "var(--secondary-background-color)",
            width: "300px",
            height: "300px",
          }}
        ></div>
      </Panel>
    </StoryContainer>
  ),
};
