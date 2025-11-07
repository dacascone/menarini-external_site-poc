<template>
  <q-page class="flex flex-center column q-pa-lg">
    <!-- Immagine centrata -->
    <img
      src="~assets/consensi.png"
      alt="Consensi"
      class="consensi-image q-mb-md"
    />

    <!-- Testo demo -->
    <div class="text-center">
      You are logged in. Please note that this is a <strong>demo site</strong>.
    </div>

    <!-- Preference Center (se necessario) -->
    <div id="pref-center-main" class="q-mt-lg"></div>
  </q-page>
</template>

<script setup>
defineOptions({
  name: 'IndexPage'
})
</script>

<style scoped>
.consensi-image {
  max-width: 300px;
  width: 100%;
  height: auto;
}
</style>
