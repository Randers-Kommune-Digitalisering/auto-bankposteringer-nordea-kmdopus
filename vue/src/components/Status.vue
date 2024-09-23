<script setup>
import { ref } from 'vue';
const statusExpress = ref(null);
const statusNodered = ref(null);

// Express status
fetch('/status')
    .then(response => response = response.json())
    .then(value => statusExpress.value = value.status == "running" ? "Forbundet" : null)
    .then(value => console.log("Express status: \n" + value))

// Node-RED status (uses /api/ proxy defined in Vite config)
fetch('/api/status')
    .then(response => response = response.json())
    .then(value => statusNodered.value = value.success ? "Forbundet" : null)
    .then(value => console.log("Node-RED status: \n" + value))

</script>

<template>    
    <div>
        <span>Express (front-end)</span>:
        <span v-if="statusExpress" class="green heavy">{{statusExpress}}</span>
        <span v-else="statusExpress" class="red heavy">Ingen forbindelse</span>
    </div>

    <div>
        <span>Node-RED (back-end)</span>:
        <span v-if="statusNodered" class="green heavy">{{statusNodered}}</span>
        <span v-else="statusNodered" class="red heavy">Ingen forbindelse</span>
    </div>
</template>

<style scoped>
    div
    {
        margin-top: 1rem;
        padding-left: 1.5rem;
        border-left: 0.1rem solid var(--color-border);
    }
</style>
