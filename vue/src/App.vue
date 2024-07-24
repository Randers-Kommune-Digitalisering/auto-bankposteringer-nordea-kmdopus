<script setup>
import { ref } from 'vue';

import Header from './components/Menu.vue'
const headerComponent = ref(null)
const currentComponent = ref(null)

// Function to update header alert from currentComponent
const setHeaderAlert = (headerItemTitle, alertText) => {
    headerComponent.value.setAlert(headerItemTitle, alertText)
};
</script>

<template>

  <header>

      <Header ref="headerComponent" />

  </header>
  
  <main>

      <div class="content">
          <router-view ref="currentComponent" @onHeaderAlert="setHeaderAlert"></router-view>
      </div>

  </main>

</template>


<style scoped>
/* Mobile first */
.content
{
    width: 100vw;
    border-left: 0rem;
    border-right: 0rem;

    background-color: var(--color-bg-light);

    padding: 2.5rem 3.5rem;
    padding-bottom: 6rem;
}

main
{
    /* Add padding for header */
    padding-top: 6rem;
}

/* Tablet or desktop */
@media screen and (min-width: 75rem) /* 1200px or 120rem using 16 px conversion */
{
    .content
    {
        /* Set width of main content */
        width: 120rem;

        border-left: 0.1rem solid var(--color-border);
        border-right: 0.1rem solid var(--color-border);
    }
}
@media screen and (min-width: 80rem)
{
    main
    {
        /* Remove padding for header as header becomes side menu */
        padding-top: 0rem;
    }
}
</style>