<template>
  <q-layout>
    <q-page-container>
      <q-page class="q-pa-md flex flex-center">
        <p>Authenticating, please wait...</p>
      </q-page>
  </q-page-container>
  </q-layout>
</template>

<script>
/* eslint-disable camelcase */
import axios from 'axios'

export default {
  data() {
    return {
      router: null
    }
  },
  mounted() {
    this.router = this.$router // Associa il router

    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const sfdcCommunityUrl = urlParams.get('sfdc_community_url')
    const codeVerifier = sessionStorage.getItem('code_verifier')

    if (code && codeVerifier) {
      axios.post('http://localhost:3000/oauth2/callback', {
        code,
        sfdc_community_url: sfdcCommunityUrl,
        code_verifier: codeVerifier
      })
        .then(response => {
          const { access_token } = response.data
          localStorage.setItem('access_token', access_token)

          this.router.push('/') // Usa il router per il redirect
        })
        .catch(error => {
          console.error('Errore durante l’autenticazione:', error)
        })
    }
  }
}
</script>
