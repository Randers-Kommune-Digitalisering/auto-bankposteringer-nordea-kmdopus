<script setup lang="ts">
const { user } = useOidcAuth()
</script>

<template>
  <UDashboardPanel id="no-access">
    <template #header>
      <UDashboardNavbar title="Ingen adgang" />
    </template>

    <template #body>
      <div class="space-y-3">
        <p>Du har ikke adgang til nogen sider endnu.</p>
        <p v-if="user?.userName">Bruger: {{ user.userName }}</p>
        <p v-if="user?.userInfo">Roller: {{ user.userInfo.roles }}</p>
      </div>
    </template>
  </UDashboardPanel>
</template>
