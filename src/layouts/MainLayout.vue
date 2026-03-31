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
import { useQuasar } from 'quasar'
import {
  getDecodedJwtPayload,
  extractCountryFromPayload,
  resolveCountryCode
} from '../utils/ciam-user'

// === CONFIG ===
const SFDC_COMMUNITY_LOGOUT_URL =
  'https://menarinipharma--test.sandbox.my.site.com/ciam/secur/logout.jsp?startURL=/s/login?source=logout%26retURL=https://google.com'
const PREFERENCE_CENTER_URL_BY_COUNTRY = Object.freeze({
  UK: 'https://daisytestsandbox-privacy-sandbox-428.my.onetrust.com/ui/#/preferences/multipage/login/cc2e1747-e899-4d1a-9e3d-76ba387d0d2f',
  DE: 'https://daisytestsandbox-privacy-sandbox-428.my.onetrust.com/ui/#/preferences/multipage/login/0028c7f3-5a50-4715-8400-abe7847b00aa',
  TH: 'https://daisytestsandbox-privacy-sandbox-428.my.onetrust.com/ui/#/preferences/multipage/login/42f4a2fb-15e0-40e1-87d9-c11c35f570be',
  VT: 'https://daisytestsandbox-privacy-sandbox-428.my.onetrust.com/ui/#/preferences/multipage/login/5c376cb9-1c65-4062-a32d-7ac83f2d8f4e',
  HK: 'https://daisytestsandbox-privacy-sandbox-428.my.onetrust.com/ui/#/preferences/multipage/login/b866cbea-adef-4c00-af40-d2ee55a0d4ca'
})

const $q = useQuasar()

// === MENU ACTIONS ===
const openPreferenceCenter = () => {
  const decodedPayload = getDecodedJwtPayload()
  const rawCountry = extractCountryFromPayload(decodedPayload)
  const countryCode = resolveCountryCode(rawCountry)
  const url = PREFERENCE_CENTER_URL_BY_COUNTRY[countryCode]

  if (!rawCountry) {
    $q.notify({
      color: 'warning',
      message: 'Country utente non trovata',
      position: 'top'
    })
    return
  }

  if (!url) {
    $q.notify({
      color: 'warning',
      message: `Preference Center non configurato per country ${rawCountry}`,
      position: 'top'
    })
    return
  }

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
