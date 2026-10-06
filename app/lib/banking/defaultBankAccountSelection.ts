export type DefaultBankAccountFilterState = {
  autoAppliedDefaultId: string | null
  initialized: boolean
}

export type DefaultBankAccountFilterTransition = {
  state: DefaultBankAccountFilterState
  selectedIds: string[] | null
}

export function transitionDefaultBankAccountFilter(
  selectedIds: readonly string[],
  defaultAccountId: string | null,
  state: DefaultBankAccountFilterState,
): DefaultBankAccountFilterTransition {
  if (
    state.autoAppliedDefaultId
    && selectedIds.length === 1
    && selectedIds[0] === state.autoAppliedDefaultId
  ) {
    if (defaultAccountId === state.autoAppliedDefaultId) {
      return { state, selectedIds: null }
    }

    return {
      state: { autoAppliedDefaultId: defaultAccountId, initialized: true },
      selectedIds: defaultAccountId ? [defaultAccountId] : [],
    }
  }

  if (selectedIds.length || state.autoAppliedDefaultId || state.initialized) {
    return {
      state: { autoAppliedDefaultId: null, initialized: true },
      selectedIds: null,
    }
  }

  return {
    state: { autoAppliedDefaultId: defaultAccountId, initialized: true },
    selectedIds: defaultAccountId ? [defaultAccountId] : null,
  }
}