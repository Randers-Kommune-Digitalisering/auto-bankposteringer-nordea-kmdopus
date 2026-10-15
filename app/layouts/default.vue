<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'
import { canAccessPath } from '~/lib/authz/policy'
import type { OpenTransactionsResponse } from '~/types/transactions'

const APP_TITLE = 'FOBI'
const open = ref(false)
const route = useRoute()
const { user, roles } = useAuthz()

const appConfig = useAppConfig()
const canViewOpenItems = computed(() => canAccessPath('/aabne-poster', roles.value))
const openItemsCount = ref<number | null>(null)
const { data: openItemsSummary, refresh: refreshOpenItemsSummary } = useFetch<
  Pick<OpenTransactionsResponse, 'totalSamleposter'>
>('/api/transactions', {
  key: 'navigation-open-items-count',
  query: { mode: 'open-items', limit: 1 },
  server: false,
  immediate: false,
  default: () => ({ totalSamleposter: undefined }),
})

watch(
  () => openItemsSummary.value?.totalSamleposter,
  (count) => {
    if (typeof count === 'number') openItemsCount.value = count
  },
  { immediate: true },
)

watch(canViewOpenItems, (canView) => {
  if (canView) void refreshOpenItemsSummary()
}, { immediate: true })

function normalizePath(path: string): string {
  const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path
  try {
    return decodeURI(trimmed)
  } catch {
    return trimmed
  }
}

function findLabelByPath(items: NavigationMenuItem[] | undefined, path: string): string | undefined {
  const normalizedPath = normalizePath(path)

  for (const item of items ?? []) {
    const itemPath = typeof item.to === 'string' ? normalizePath(item.to) : undefined

    if (itemPath && itemPath === normalizedPath) {
      return item.label
    }

    if (item.children?.length) {
      const childLabel = findLabelByPath(item.children as NavigationMenuItem[], path)
      if (childLabel) {
        return childLabel
      }
    }

    if (itemPath && itemPath !== '/' && normalizedPath.startsWith(`${itemPath}/`)) {
      return item.label
    }
  }
}

const primaryLinks: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    icon: appConfig.ui.icons.clipboard,
    to: '/',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Konteringsregler',
    icon: appConfig.ui.icons.notebook,
    to: '/konteringsregler',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Åbne poster',
    icon: appConfig.ui.icons.inbox,
    to: '/aabne-poster',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Kontoudtog',
    icon: appConfig.ui.icons.accountStatement,
    to: '/kontoudtog',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Kørsler',
    icon: appConfig.ui.icons.clock,
    to: '/koersler',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Indstillinger',
    to: '/indstillinger',
    icon: appConfig.ui.icons.settings,
    defaultOpen: false,
    type: 'trigger',
    children: [
      {
        label: 'Regeladministration',
        to: '/indstillinger/regler',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Tags',
        to: '/indstillinger/tags',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Bankintegration',
        to: '/indstillinger/bank',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'ERP-integration',
        to: '/indstillinger/erp',
        onSelect: () => {
          open.value = false
        }
      },
    ]
  },
  {
    label: 'Kontrol',
    to: '/fejlhaandtering',
    icon: appConfig.ui.icons.warning,
    defaultOpen: false,
    type: 'trigger',
    children: [
      {
        label: 'Kørsler',
        to: '/fejlhaandtering/koe',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'ERP-integration',
        to: '/fejlhaandtering/erp',
        onSelect: () => {
          open.value = false
        }
      }
    ]
  }
]

const userLabel = computed(() => {
  return user.value?.userName ?? 'Bruger'
})

const links = computed(() => {
  const visiblePrimaryLinks = primaryLinks
    .map((item) => {
      const children = (item.children as NavigationMenuItem[] | undefined)
        ?.filter((child) => canAccessPath(child.to as string, roles.value))

      return {
        ...item,
        children,
      }
    })
    .filter((item) => {
      const hasChildren =
        Array.isArray(item.children) &&
        item.children.length > 0

      return canAccessPath(item.to as string, roles.value) || hasChildren
    })

  const secondaryLinks: NavigationMenuItem[] = [
    {
      label: userLabel.value,
      icon: appConfig.ui.icons.user,
    },
  ]

  return [visiblePrimaryLinks, secondaryLinks]
})

const activePageLabel = computed(() => {
  const allItems = links.value.flat()
  return findLabelByPath(allItems, route.path)
})

useHead(() => ({
  title: activePageLabel.value ? `${APP_TITLE} · ${activePageLabel.value}` : APP_TITLE
}))
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #default="{ collapsed }">
        <!-- Header -->
        <template v-if="!collapsed">
          <div class="flex items-center justify-center w-full px-3 py-3 border-b border-default">
            <span class="font-semibold text-xl truncate">
              FOBI
            </span>
          </div>
        </template>

        <!-- Primær navigation -->
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          :ui="{ 
            linkLeadingIcon: 'size-6',
            childLinkIcon: 'size-6'
          }" 
          orientation="vertical"
          tooltip
          popover
          class="mt-2"
        >
          <template #item-leading="{ item, active, ui }">
            <UChip
              v-if="item.to === '/aabne-poster'"
              :show="openItemsCount !== 0"
              color="error"
              size="lg"
            >
              <UIcon
                v-if="item.icon"
                :name="item.icon"
                :class="ui.linkLeadingIcon({ active, disabled: !!item.disabled })"
              />
            </UChip>
            <UIcon
              v-else-if="item.icon"
              :name="item.icon"
              :class="ui.linkLeadingIcon({ active, disabled: !!item.disabled })"
            />
          </template>
        </UNavigationMenu>

        <!-- Sekundær navigation / bund -->
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />

        <!-- Separator + color mode nederst -->
        <div class="border-t border-default mt-4 pt-3 flex justify-center">
          <UColorModeSelect
            size="xl"
            aria-label="Farvetema"
            class="w-full"
          />
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>

