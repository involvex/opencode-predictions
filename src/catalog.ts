import type { CatalogModel } from "./models.ts"

export type CatalogLocation = { directory: string; workspaceID?: string }

/** Project host model metadata into the safe catalog shape. Drop entries that cannot be shown. */
export function projectCatalog(models: readonly unknown[]): CatalogModel[] {
  const out: CatalogModel[] = []
  for (const raw of models) {
    if (!raw || typeof raw !== "object") continue
    const model = raw as Record<string, unknown>
    if (typeof model.providerID !== "string" || !model.providerID || typeof model.id !== "string" || !model.id) continue
    const variants = Array.isArray(model.variants)
      ? model.variants.flatMap(variant => {
          if (!variant || typeof variant !== "object") return []
          const id = (variant as { id?: unknown }).id
          return typeof id === "string" && id ? [{ id }] : []
        })
      : []
    out.push({
      providerID: model.providerID,
      id: model.id,
      ...(typeof model.name === "string" ? { name: model.name } : {}),
      enabled: model.enabled !== false,
      variants,
    })
  }
  return out
}

/** Flatten provider records that carry a models map, array, or config object into catalog entries. */
export function catalogFromProviders(providers: readonly unknown[]): CatalogModel[] {
  const out: CatalogModel[] = []
  for (const raw of providers) {
    if (!raw || typeof raw !== "object") continue
    const provider = raw as Record<string, unknown>
    const providerID = typeof provider.id === "string" ? provider.id
      : typeof provider.providerID === "string" ? provider.providerID
      : undefined
    if (!providerID) continue
    const models = provider.models
    if (!models) continue
    const entries: unknown[] = models instanceof Map ? [...models.values()]
      : Array.isArray(models) ? models
      : typeof models === "object" ? Object.entries(models as Record<string, unknown>).map(([id, value]) => {
          if (value && typeof value === "object") return { id, providerID, ...(value as object) }
          return { id, providerID }
        })
      : []
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") continue
      const model = entry as Record<string, unknown>
      out.push(...projectCatalog([{ ...model, providerID: typeof model.providerID === "string" ? model.providerID : providerID, id: typeof model.id === "string" ? model.id : typeof model.modelID === "string" ? model.modelID : undefined }]))
    }
  }
  return out
}

export type CatalogSource = {
  listModels(location: CatalogLocation | undefined, signal: AbortSignal): Promise<readonly unknown[]>
  listProviders?(location: CatalogLocation | undefined, signal: AbortSignal): Promise<readonly unknown[]>
}

/** Load models for a location; when the list is empty, project any models attached to providers. */
export async function loadCatalog(source: CatalogSource, location: CatalogLocation | undefined, signal: AbortSignal): Promise<CatalogModel[]> {
  const listed = projectCatalog(await source.listModels(location, signal))
  if (listed.length || !source.listProviders) return listed
  return catalogFromProviders(await source.listProviders(location, signal))
}
