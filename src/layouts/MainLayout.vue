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
          <q-btn round dense flat color="white" icon="person" @click="goToProfile">
            <q-tooltip>Profile</q-tooltip>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { jwtDecode } from 'jwt-decode'

const router = useRouter()


const goToProfile = () => {
  const idToken = localStorage.getItem('access_token')

  if (!idToken) {
    console.error('Token non presente. Reindirizzo al login.')
    router.push('/login')
    return
  }

  try {
    // Decodifica il token
    const decodedToken = jwtDecode(idToken)

    // Estrarre l'ID dalla chiave "profile"
    const profileUrl = decodedToken.profile
    const userId = profileUrl.split('/').pop() // Ottiene l'ultima parte dell'URL

    console.log('ID Utente:', userId)

    // Costruisce l'URL del profilo
    const userProfileUrl = `https://menarinipharma--developer.sandbox.my.site.com/portal/s/profile/${userId}`
    window.open(userProfileUrl, '_blank')
  } catch (error) {
    console.error('Errore nella decodifica del token:', error)
    router.push('/login')
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
