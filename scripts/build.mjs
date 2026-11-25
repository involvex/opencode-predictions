import { build as viteBuild } from "vite"
import { gui } from "@opencode/plugin/gui/vite"
import { chmod } from "node:fs/promises"

const result = await Bun.build({
  entrypoints: ["src/index.ts", "src/tui.ts", "src/rpc.ts", "src/pilot.ts"],
  outdir: "dist",
  target: "node",
  format: "esm",
  sourcemap: "external",
  packages: "external",
})
if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}
await viteBuild({ configFile: false, plugins: [gui({ entry: "src/gui.ts", outFile: "dist/gui-experimental.cjs" })] })
await chmod("dist/pilot.js", 0o755)
