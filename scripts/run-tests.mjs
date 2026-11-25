import { Glob } from "bun"

const files = [...new Glob("tests/*.test.ts").scanSync()].sort()
if (!files.length) {
  console.error("No tests matched tests/*.test.ts")
  process.exit(1)
}
const result = Bun.spawnSync(["bun", "test", ...files, ...process.argv.slice(2)], {
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
})
process.exit(result.exitCode ?? 1)
