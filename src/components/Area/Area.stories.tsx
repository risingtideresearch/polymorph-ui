import type { Meta, StoryObj } from "@storybook/react-vite";

import { Area, AreaGroup, AreaSeparator } from "./Area";
import styles from "./Area.stories.module.css";

// ---- Shared types ----

type AreaFields = {
  defaultSize?: string;
  minSize?: string;
  maxSize?: string;
  collapsible?: boolean;
};

type Prefixed<P extends string, T> = {
  [K in keyof T as `${P}${Capitalize<string & K>}`]: T[K];
};

type GroupArgs = { orientation: "horizontal" | "vertical" };

// ---- Control definitions (single source of truth) ----

const areaControlDefs: Record<
  keyof AreaFields,
  { control: string; description: string }
> = {
  defaultSize: {
    control: "text",
    description: "Default size of the area (px or %).",
  },
  minSize: {
    control: "text",
    description: "Minimum size of the area (px or %).",
  },
  maxSize: {
    control: "text",
    description: "Maximum size of the area (px or %).",
  },
  collapsible: {
    control: "boolean",
    description: "Whether the area can be collapsed below its min size.",
  },
};

const groupArgTypes = {
  orientation: {
    control: { type: "radio" as const },
    options: ["horizontal", "vertical"],
    description: "Layout direction of the area group.",
    table: { category: "AreaGroup" },
  },
};

function makeAreaArgTypes(prefix: string, category: string) {
  return Object.fromEntries(
    Object.entries(areaControlDefs).map(([key, def]) => [
      prefix + key[0].toUpperCase() + key.slice(1),
      { ...def, table: { category } },
    ]),
  );
}

function prefixDefaults(prefix: string, defaults: AreaFields) {
  return Object.fromEntries(
    Object.entries(defaults).map(([k, v]) => [
      prefix + k[0].toUpperCase() + k.slice(1),
      v,
    ]),
  );
}

function pickAreaArgs(
  args: Record<string, unknown>,
  prefix: string,
): AreaFields {
  return Object.fromEntries(
    (Object.keys(areaControlDefs) as (keyof AreaFields)[])
      .map((key) => [key, args[prefix + key[0].toUpperCase() + key.slice(1)]])
      .filter(([, v]) => v !== undefined),
  ) as AreaFields;
}

// ---- Meta ----

const meta = {
  title: "Components/Area",
  component: Area,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof Area>;

export default meta;

// ---- Default area field values ----

const defaultAreaFields: AreaFields = {
  defaultSize: "50%",
  minSize: "30px",
  collapsible: false,
};

// ---- Stories ----

type TwoAreaArgs = GroupArgs &
  Prefixed<"area1", AreaFields> &
  Prefixed<"area2", AreaFields>;
type ThreeAreaArgs = GroupArgs &
  Prefixed<"area1", AreaFields> &
  Prefixed<"area2", AreaFields> &
  Prefixed<"area3", AreaFields>;

export const Horizontal: StoryObj<TwoAreaArgs> = {
  argTypes: {
    ...groupArgTypes,
    ...makeAreaArgTypes("area1", "Area 1"),
    ...makeAreaArgTypes("area2", "Area 2"),
  },
  args: {
    orientation: "horizontal",
    ...prefixDefaults("area1", defaultAreaFields),
    ...prefixDefaults("area2", defaultAreaFields),
  },
  render: (args) => {
    const area1 = pickAreaArgs(args as Record<string, unknown>, "area1");
    const area2 = pickAreaArgs(args as Record<string, unknown>, "area2");
    return (
      <div className={styles.parent}>
        <AreaGroup className={styles.group} orientation={args.orientation}>
          <Area {...area1}>
            <div className={styles.areaContent}>Left Area</div>
          </Area>
          <AreaSeparator className={styles.separator} />
          <Area {...area2}>
            <div className={styles.areaContent}>Right Area</div>
          </Area>
        </AreaGroup>
      </div>
    );
  },
};

export const Vertical: StoryObj<TwoAreaArgs> = {
  argTypes: {
    ...groupArgTypes,
    ...makeAreaArgTypes("area1", "Area 1"),
    ...makeAreaArgTypes("area2", "Area 2"),
  },
  args: {
    orientation: "vertical",
    ...prefixDefaults("area1", defaultAreaFields),
    ...prefixDefaults("area2", defaultAreaFields),
  },
  render: (args) => {
    const area1 = pickAreaArgs(args as Record<string, unknown>, "area1");
    const area2 = pickAreaArgs(args as Record<string, unknown>, "area2");
    return (
      <div className={styles.parent}>
        <AreaGroup className={styles.group} orientation={args.orientation}>
          <Area {...area1}>
            <div className={styles.areaContent}>Top Area</div>
          </Area>
          <AreaSeparator className={styles.separator} />
          <Area {...area2}>
            <div className={styles.areaContent}>Bottom Area</div>
          </Area>
        </AreaGroup>
      </div>
    );
  },
};

export const ThreeAreas: StoryObj<ThreeAreaArgs> = {
  argTypes: {
    ...groupArgTypes,
    ...makeAreaArgTypes("area1", "Area 1"),
    ...makeAreaArgTypes("area2", "Area 2"),
    ...makeAreaArgTypes("area3", "Area 3"),
  },
  args: {
    orientation: "horizontal",
    ...prefixDefaults("area1", { ...defaultAreaFields, defaultSize: "33%" }),
    ...prefixDefaults("area2", { ...defaultAreaFields, defaultSize: "33%" }),
    ...prefixDefaults("area3", { ...defaultAreaFields, defaultSize: "33%" }),
  },
  render: (args) => {
    const area1 = pickAreaArgs(args as Record<string, unknown>, "area1");
    const area2 = pickAreaArgs(args as Record<string, unknown>, "area2");
    const area3 = pickAreaArgs(args as Record<string, unknown>, "area3");
    return (
      <div className={styles.parent}>
        <AreaGroup className={styles.group} orientation={args.orientation}>
          <Area {...area1}>
            <div className={styles.areaContent}>Left Area</div>
          </Area>
          <AreaSeparator className={styles.separator} />
          <Area {...area2}>
            <div className={styles.areaContent}>Center Area</div>
          </Area>
          <AreaSeparator className={styles.separator} />
          <Area {...area3}>
            <div className={styles.areaContent}>Right Area</div>
          </Area>
        </AreaGroup>
      </div>
    );
  },
};
