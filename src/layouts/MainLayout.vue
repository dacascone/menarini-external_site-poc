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
import { jwtDecode } from 'jwt-decode'

// === CONFIG ===
const SFDC_COMMUNITY_LOGOUT_URL =
  'https://menarinipharma--developer.sandbox.my.site.com/ciam/secur/logout.jsp?startURL=/s/login?source=logout%26retURL=https://google.com'
const PREFERENCE_CENTER_URL_BY_COUNTRY = Object.freeze({
  UK: 'https://daisytestsandbox-privacy-sandbox-428.my.onetrust.com/ui/#/preferences/multipage/login/cc2e1747-e899-4d1a-9e3d-76ba387d0d2f',
  DE: 'https://daisytestsandbox-privacy-sandbox-428.my.onetrust.com/ui/#/preferences/multipage/login/0028c7f3-5a50-4715-8400-abe7847b00aa',
  TH: 'https://daisytestsandbox-privacy-sandbox-428.my.onetrust.com/ui/#/preferences/multipage/login/42f4a2fb-15e0-40e1-87d9-c11c35f570be',
  VT: 'https://daisytestsandbox-privacy-sandbox-428.my.onetrust.com/ui/#/preferences/multipage/login/5c376cb9-1c65-4062-a32d-7ac83f2d8f4e',
  HK: 'https://daisytestsandbox-privacy-sandbox-428.my.onetrust.com/ui/#/preferences/multipage/login/b866cbea-adef-4c00-af40-d2ee55a0d4ca'
})
const COUNTRY_ALIAS_TO_CODE = Object.freeze({
  UK: 'UK',
  GB: 'UK',
  'UNITED KINGDOM': 'UK',
  'GREAT BRITAIN': 'UK',
  ENGLAND: 'UK',
  DE: 'DE',
  GERMANY: 'DE',
  DEUTSCHLAND: 'DE',
  TH: 'TH',
  THAILAND: 'TH',
  VT: 'VT',
  VN: 'VT',
  VIETNAM: 'VT',
  'VIET NAM': 'VT',
  HK: 'HK',
  'HONG KONG': 'HK',
  'HONG KONG SAR CHINA': 'HK'
})

const $q = useQuasar()

const normalizeCountry = (value) => String(value || '').trim().toUpperCase()

const getDecodedJwtPayload = () => {
  const tokenKeys = ['access_token', 'sf_access_token']
  const decodedAttempts = tokenKeys
    .map((tokenKey) => ({ tokenKey, token: localStorage.getItem(tokenKey) }))
    .filter(({ token }) => Boolean(token))
    .map(({ tokenKey, token }) => {
      try {
        return { payload: jwtDecode(token), tokenKey }
      } catch (error) {
        console.warn(`[PreferenceCenter] Token ${tokenKey} non decodificabile`, error)
        return { payload: null, tokenKey }
      }
    })

  const validPayload = decodedAttempts.find(({ payload }) => Boolean(payload))
  return validPayload ? validPayload.payload : null
}

const extractCountryFromPayload = (payload) => {
  if (!payload) return ''
  return payload.address?.country || payload.country || payload.countryCode || payload.country_code || ''
}

const resolveCountryCode = (rawCountry) => {
  const normalized = normalizeCountry(rawCountry)
  if (!normalized) return ''
  return COUNTRY_ALIAS_TO_CODE[normalized] || normalized
}

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
