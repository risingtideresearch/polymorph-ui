import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { BasicItemList } from "./BasicItemList";

import { Item, HoverZone, Label } from "../Item/Item";
import { StoryContainer } from "../StoryContainer/StoryContainer";

const meta = {
  title: "Components/BasicItemList",
  component: BasicItemList,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof BasicItemList>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { id: 1, label: "Node 1" },
  { id: 2, label: "Node 2" },
  { id: 3, label: "Node 3" },
  { id: 4, label: "Node 4" },
];

function Container({ children }: { children: React.ReactNode }) {
  return <StoryContainer withPadding>{children}</StoryContainer>;
}

export const Default: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<number>(2);
    return (
      <Container>
        <BasicItemList>
          {items.map((item) => (
            <Item
              key={item.id}
              isSelected={item.id === selectedId}
              onClick={() => setSelectedId(item.id)}
            >
              <HoverZone withPadding>
                <Label>{item.label}</Label>
              </HoverZone>
            </Item>
          ))}
        </BasicItemList>
      </Container>
    );
  },
};
