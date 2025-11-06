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
/* eslint-disable camelcase,no-console */
import axios from 'axios'

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL
  || /* 'http://localhost:3000' */ 'https://menarini-external-site-poc-a6774a35f622.herokuapp.com'

export default {
  data() {
    return {
      router: null
    }
  },
  mounted() {
    this.router = this.$router

    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const sfdcCommunityUrl = urlParams.get('sfdc_community_url')
    const state = urlParams.get('state')
    const codeVerifier = localStorage.getItem('code_verifier')

    console.log('sfdcCommunityUrl: ', sfdcCommunityUrl)
    console.log('codeVerifier: ', codeVerifier)
    console.log('code: ', code)

    if (code && codeVerifier) {
      axios.post(`${API_BASE_URL}/oauth2/callback`, {
        code,
        sfdc_community_url: sfdcCommunityUrl,
        code_verifier: codeVerifier,
        state
      })
        .then(response => {
          const { id_token, access_token, refresh_token } = response.data
          if (id_token)      localStorage.setItem('access_token', id_token)
          if (access_token)  localStorage.setItem('sf_access_token', access_token)
          if (refresh_token) localStorage.setItem('refresh_token', refresh_token)
          this.router.push('/')
        })
        .catch(error => {
          // 👇 ora vedi l’errore reale (SF) inoltrato dal server
          console.error('Errore durante l’autenticazione:', error?.response?.data || error.message)
        })
    }
  }
}
</script>
