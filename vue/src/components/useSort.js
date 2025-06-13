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
    return [...list].sort((a, b) => {
      if (a[key] == null) return 1
      if (b[key] == null) return -1
      if (a[key] === b[key]) return 0
      if (sortAsc.value) {
        return a[key] > b[key] ? 1 : -1
      } else {
        return a[key] < b[key] ? 1 : -1
      }
    })
  }

  return { sortKey, sortAsc, sortList }
}