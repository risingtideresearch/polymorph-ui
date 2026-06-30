import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { StoryContainer } from "../StoryContainer/StoryContainer";

import {
  Item,
  HoverZone,
  Label,
  SecretZone,
  SingleCharacterButton,
} from "./Item";
import { EditableLabel } from "../EditableLabel/EditableLabel";

const meta = {
  title: "Components/Item",
  component: Item,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Item>;

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
      </Container>
    );
  },
};

export const WithSecretZone: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<number>(2);
    return (
      <Container>
        {items.map((item) => (
          <Item key={item.id} tinyGap isSelected={item.id === selectedId}>
            <SecretZone>
              <SingleCharacterButton title="Delete">-</SingleCharacterButton>
              <SingleCharacterButton title="Add">+</SingleCharacterButton>
            </SecretZone>
            <HoverZone withPadding onClick={() => setSelectedId(item.id)}>
              <Label>{item.label}</Label>
            </HoverZone>
          </Item>
        ))}
      </Container>
    );
  },
};

export const WithEditableNames: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<number>(2);
    const [itemNames, setItemNames] = useState<Map<number, string>>(
      () => new Map(items.map((item) => [item.id, item.label])),
    );
    const itemIds = Array.from(itemNames.keys());
    return (
      <Container>
        {itemIds.map((id) => (
          <Item
            key={id}
            isSelected={id === selectedId}
            onClick={() => setSelectedId(id)}
          >
            <HoverZone>
              <EditableLabel
                value={itemNames.get(id) || ""}
                setValue={(newValue) => {
                  setItemNames((prev) => new Map(prev).set(id, newValue));
                }}
              />
            </HoverZone>
          </Item>
        ))}
      </Container>
    );
  },
};
