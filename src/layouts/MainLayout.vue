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
                  <q-item-section>
                    Preference Center
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-ripple @click="logout">
                  <q-item-section avatar>
                    <q-icon name="logout" />
                  </q-item-section>
                  <q-item-section>
                    Logout
                  </q-item-section>
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
        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
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
import axios from 'axios'

// === CONFIG ===
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL
  || 'https://menarini-external-site-poc-a6774a35f622.herokuapp.com'

// Per pulire anche i cookie SSO della community (opzionale ma consigliato)
const SALESFORCE_LOGOUT_URL =
  'https://menarinipharma--release.sandbox.my.site.com/secur/logout.jsp' // usa l’endpoint dell’ambiente attuale
const APP_RETURN_URL = `${window.location.origin}/login`

// === MENU ACTIONS ===
const openPreferenceCenter = () => {
  const url = 'https://privacyportaluatde.onetrust.com/ui/#/preferences/multipage/token/6ffcd06d-7ede-4217-b94b-3a96a366b208/Emv7TKQV8QCvDr05czK8GvQY%2FMZ0F3B9H49ilnKO4Ys%3D'
  window.open(url, '_blank', 'noopener,noreferrer')
}

const logout = async () => {
  try {
    const idToken      = localStorage.getItem('access_token')     // id_token salvato dall’app
    const sfAccess     = localStorage.getItem('sf_access_token')  // access_token reale (se presente)
    const refreshToken = localStorage.getItem('refresh_token')

    // tenta revoca server-side (non blocca se fallisce)
    if (sfAccess || refreshToken || idToken) {
      await axios.post(`${API_BASE_URL}/logout`, {
        access_token: sfAccess || idToken,
        refresh_token: refreshToken
      }).catch(() => void 0)
    }
  } finally {
    // pulizia storage locale
    localStorage.removeItem('access_token')     // id_token
    localStorage.removeItem('sf_access_token')  // access_token (opz.)
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('code_verifier')

    // redirect a logout Salesforce per chiudere anche la sessione community
    const ret = `${SALESFORCE_LOGOUT_URL}?retUrl=${encodeURIComponent(APP_RETURN_URL)}`
    window.location.href = ret

    // Se preferisci restare nell’app: usa router.push('/login') e rimuovi il redirect sopra.
  }
}

const leftDrawerOpen = ref(false)
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

defineOptions({
  name: 'MainLayout'
})
</script>
