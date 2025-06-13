import { ref } from 'vue'

export function useSort() {
  const sortKey = ref(null)
  const sortAsc = ref(true)

  function sortList(list, key) {
    if (sortKey.value === key) {
      sortAsc.value = !sortAsc.value
    } else {
      sortKey.value = key
      sortAsc.value = true
    }
    if (!Array.isArray(list)) return []

    // Tjek om der skal sorteres numerisk
    const numericKeys = ['amount1', 'amount2']

    return [...list].sort((a, b) => {
      let aVal = a[key]
      let bVal = b[key]

      if (aVal == null) return 1
      if (bVal == null) return -1
      if (aVal === bVal) return 0

      if (numericKeys.includes(key)) {
        // Konverter til tal, fjern evt. komma/point og mellemrum
        aVal = parseFloat(String(aVal).replace(',', '.').replace(/\s/g, ''))
        bVal = parseFloat(String(bVal).replace(',', '.').replace(/\s/g, ''))
        if (isNaN(aVal)) return 1
        if (isNaN(bVal)) return -1
        return sortAsc.value ? aVal - bVal : bVal - aVal
      } else {
        return sortAsc.value
          ? aVal > bVal ? 1 : -1
          : aVal < bVal ? 1 : -1
      }
    })
  }

  return { sortKey, sortAsc, sortList }
}