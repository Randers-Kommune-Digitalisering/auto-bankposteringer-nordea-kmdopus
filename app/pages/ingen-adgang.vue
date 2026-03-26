<script setup lang="ts">
const { username, roles } = useAuthz()
</script>

<template>
  <UDashboardPanel id="no-access">
    <template #header>
      <UDashboardNavbar title="Ingen adgang" />
    </template>

    <template #body>
      <div class="space-y-3">
        <p>Du har ikke adgang til nogen sider endnu.</p>
        <p v-if="username">Bruger: {{ username }}</p>
        <p v-if="roles?.length">Roller: {{ roles.join(', ') }}</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
