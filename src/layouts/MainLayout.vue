<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>Menarini</q-toolbar-title>

        <div class="q-gutter-sm row items-center no-wrap q-mb">
          <!-- Icona profilo con menu -->
          <q-btn round dense flat color="white" icon="person">
            <q-tooltip>Profile & More</q-tooltip>

            <q-menu anchor="bottom right" self="top right" :offset="[0, 8]">
              <q-list style="min-width: 200px">
                <q-item clickable v-ripple @click="openPreferenceCenter">
                  <q-item-section avatar>
                    <q-icon name="tune" />
                  </q-item-section>
                  <q-item-section>Preference Center</q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-ripple @click="logout">
                  <q-item-section avatar>
                    <q-icon name="logout" />
                  </q-item-section>
                  <q-item-section>Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list>
        <q-item-label header>Menu</q-item-label>
        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
/* eslint-disable no-console */
import { ref } from 'vue'

// === CONFIG ===
const SFDC_COMMUNITY_LOGOUT_URL =
  'https://menarinipharma--test.sandbox.my.site.com/ciam/secur/logout.jsp?retUrl=https://google.com/'

// === MENU ACTIONS ===
const openPreferenceCenter = () => {
  const url =
    'https://privacyportaluatde.onetrust.com/ui/#/preferences/multipage/token/6ffcd06d-7ede-4217-b94b-3a96a366b208/Emv7TKQV8QCvDr05czK8GvQY%2FMZ0F3B9H49ilnKO4Ys%3D'
  window.open(url, '_blank', 'noopener,noreferrer')
}

const logout = () => {
  try {
    // pulizia stato locale
    localStorage.clear()
    sessionStorage.clear()
  } finally {
    // logout community + ritorno a /login
    const ret = `${SFDC_COMMUNITY_LOGOUT_URL}`
    window.location.href = ret
  }
}

const leftDrawerOpen = ref(false)
const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

defineOptions({
  name: 'MainLayout'
})
</script>

<style scoped>
/* Stili opzionali */
</style>
