// Makes TypeScript happy with `main.tsx`. In practice, the App type is provided
// dynamically when doing `npm run example -- <name>` (see vite.config.ts).
declare module "virtual:example-app" {
  import type { FC } from "react";
  export const App: FC;
}
