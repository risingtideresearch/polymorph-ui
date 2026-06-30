import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Menu,
  MenuItem,
  MenuSeparator,
  SubMenu,
  MenuCheckboxItem,
  MenuItemIndicator,
  MenuTriggerButton,
} from "./Menu";
import { CheckIcon, ListIcon } from "@phosphor-icons/react";

const meta = {
  title: "Components/Menu",
  component: Menu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

const hamburger = (
  <MenuTriggerButton>
    <ListIcon size={16} />
  </MenuTriggerButton>
);

export const Default: Story = {
  args: { trigger: hamburger },
  render: () => {
    const [showGrid, setShowGrid] = useState(true);
    const [showRulers, setShowRulers] = useState(false);
    return (
      <Menu trigger={hamburger}>
        <MenuItem>New File</MenuItem>
        <MenuItem>Open File</MenuItem>
        <MenuSeparator />
        <MenuItem>Save</MenuItem>
        <MenuItem>Save As…</MenuItem>
        <SubMenu name="Export">
          <MenuItem>Export as PNG</MenuItem>
          <MenuItem>Export as SVG</MenuItem>
          <MenuItem>Export as PDF</MenuItem>
        </SubMenu>
        <MenuSeparator />
        <MenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
          <MenuItemIndicator>
            <CheckIcon />
          </MenuItemIndicator>
          Show Grid
        </MenuCheckboxItem>
        <MenuCheckboxItem checked={showRulers} onCheckedChange={setShowRulers}>
          <MenuItemIndicator>
            <CheckIcon />
          </MenuItemIndicator>
          Show Rulers
        </MenuCheckboxItem>
        <MenuSeparator />
        <MenuItem>Quit</MenuItem>
      </Menu>
    );
  },
};
