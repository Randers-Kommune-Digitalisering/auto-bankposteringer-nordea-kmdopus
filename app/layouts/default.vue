<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const links = [[
  {
    label: 'Dashboard',
    icon: 'solar:clipboard-bold-duotone',
    to: '/',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Konteringsregler',
    icon: 'solar:notebook-bookmark-bold-duotone',
    to: '/rules',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Åbne poster',
    icon: 'solar:inbox-bold-duotone',
    to: '/open-items',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Fejlfinding',
    icon: 'solar:danger-triangle-bold-duotone',
    to: '/runs',
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: 'Indstillinger',
    to: '/settings',
    icon: 'solar:settings-bold-duotone',
    defaultOpen: true,
    type: 'trigger',
    children: [
      {
        label: 'Bankintegration',
        to: '/settings/banking',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'ERP-integration',
        to: '/settings/erp',
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Gendannelse',
        to: '/settings/recovery',
        onSelect: () => {
          open.value = false
        }
      }
    ]
  }
]] satisfies NavigationMenuItem[][]
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
        />

        <!-- Sekundær navigation / bund -->
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />

        <!-- Separator + ColorModeButton nederst -->
        <div class="border-t border-default mt-4 pt-3 flex justify-center">
          <UColorModeButton size="xl"/>
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>

