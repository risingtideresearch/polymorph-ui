import type { Meta, StoryObj } from "@storybook/react-vite";

import { Area2x2Grid } from "./Area2x2Grid";
import styles from "./Area2x2Grid.stories.module.css";

const meta = {
  title: "Components/Area2x2Grid",
  component: Area2x2Grid,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof Area2x2Grid>;

export default meta;

function Cell({ label }: { label: string }) {
  return <div className={styles.cell}>{label}</div>;
}

export const Default: StoryObj<typeof Area2x2Grid> = {
  render: () => (
    <div className={styles.parent}>
      <Area2x2Grid
        topLeft={<Cell label="Top Left" />}
        topRight={<Cell label="Top Right" />}
        bottomLeft={<Cell label="Bottom Left" />}
        bottomRight={<Cell label="Bottom Right" />}
      />
    </div>
  ),
};
