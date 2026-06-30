import type { Meta, StoryObj } from "@storybook/react-vite";

import { Property, PropertyGrid } from "./Property";

import { StoryContainer } from "../StoryContainer/StoryContainer";

const meta = {
  title: "Components/Property",
  component: Property,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Property>;

export default meta;
type Story = StoryObj<typeof meta>;

function Container({ children }: { children: React.ReactNode }) {
  return <StoryContainer withPadding>{children}</StoryContainer>;
}

export const Default: Story = {
  args: { name: "" },
  render: () => (
    <Container>
      <PropertyGrid>
        <Property name="Color">
          <span>#ff0000</span>
        </Property>
      </PropertyGrid>
    </Container>
  ),
};

export const MultipleProperties: Story = {
  args: { name: "" },
  render: () => (
    <Container>
      <PropertyGrid>
        <Property name="Width">
          <span>800px</span>
        </Property>
        <Property name="Height">
          <span>600px</span>
        </Property>
        <Property name="Opacity">
          <span>100%</span>
        </Property>
        <Property name="Blend Mode">
          <span>Normal</span>
        </Property>
      </PropertyGrid>
    </Container>
  ),
};
