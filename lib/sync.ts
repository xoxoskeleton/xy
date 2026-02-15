export interface SyncProvider {
  push(): Promise<void>
  pull(): Promise<void>
}

export const localOnlySyncProvider: SyncProvider = {
  async push() {
    return
  },
  async pull() {
    return
  }
}

export const featureFlags = {
  accountSync: false
}
