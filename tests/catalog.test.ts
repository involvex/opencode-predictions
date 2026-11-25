import { test } from "node:test"
import assert from "node:assert/strict"
import { catalogFromProviders, loadCatalog, projectCatalog } from "../src/catalog.ts"

test("projectCatalog keeps safe fields and defaults a missing variants array", () => {
  assert.deepEqual(projectCatalog([
    { providerID: "local", id: "a", name: "A", enabled: true, variants: [{ id: "low", private: "x" }], private: "y" },
    { providerID: "local", id: "b", enabled: false },
    { providerID: "local", id: "c", variants: "broken" },
    { providerID: "", id: "skip" },
    { id: "missing-provider" },
    null,
  ]), [
    { providerID: "local", id: "a", name: "A", enabled: true, variants: [{ id: "low" }] },
    { providerID: "local", id: "b", enabled: false, variants: [] },
    { providerID: "local", id: "c", enabled: true, variants: [] },
  ])
})

test("catalogFromProviders projects map, array, and config-object model inventories", () => {
  assert.deepEqual(catalogFromProviders([
    { id: "map", models: new Map([["one", { id: "one", name: "One", enabled: true, variants: [{ id: "low" }] }]]) },
    { id: "list", models: [{ id: "two", enabled: false, variants: [] }] },
    { providerID: "config", models: { three: { name: "Three", variants: [{ id: "high" }] } } },
    { id: "empty" },
  ]), [
    { providerID: "map", id: "one", name: "One", enabled: true, variants: [{ id: "low" }] },
    { providerID: "list", id: "two", enabled: false, variants: [] },
    { providerID: "config", id: "three", name: "Three", enabled: true, variants: [{ id: "high" }] },
  ])
})

test("loadCatalog uses model.list for a location and falls back to providers when empty", async () => {
  const calls: unknown[] = []
  const location = { directory: "/project" }
  const signal = new AbortController().signal
  const first = await loadCatalog({
    listModels: async (at, abort) => { calls.push(["models", at, abort]); return [{ providerID: "local", id: "a", enabled: true, variants: [] }] },
    listProviders: async () => { calls.push("providers"); return [] },
  }, location, signal)
  assert.deepEqual(first, [{ providerID: "local", id: "a", enabled: true, variants: [] }])
  assert.deepEqual(calls, [["models", location, signal]])

  calls.length = 0
  const second = await loadCatalog({
    listModels: async (at) => { calls.push(["models", at!.directory]); return [] },
    listProviders: async (at) => { calls.push(["providers", at!.directory]); return [{ id: "paid", models: { flash: { name: "Flash" } } }] },
  }, location, signal)
  assert.deepEqual(second, [{ providerID: "paid", id: "flash", name: "Flash", enabled: true, variants: [] }])
  assert.deepEqual(calls, [["models", "/project"], ["providers", "/project"]])
})
