<template>
  <q-layout>
    <q-page-container className="bg-primary">
      <q-page className="q-pa-md flex flex-center">
        <div className="column items-center">
          <div className="q-pb-md">
            <img
              src="~assets/menarini.svg"
              style="width: 150px;"
            >
          </div>
          <q-spinner color="primary" size="50px"/>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
/* eslint-disable no-console */
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce-utils'

const API_BASE_URL = /* 'http://localhost:3000' */ 'http://localhost:3000'

// Imposta qui la community che stai usando (release/ciam come dai log)
const SFDC_COMMUNITY_URL = 'https://menarinipharma--release.sandbox.my.site.com/ciam'

export default {
  mounted() {
    this.handleSalesforceLogin()
  },
  methods: {
    async handleSalesforceLogin() {
      try {
        const codeVerifier = generateCodeVerifier()
        const codeChallenge = await generateCodeChallenge(codeVerifier)
        localStorage.setItem('code_verifier', codeVerifier)

        const response = await fetch(`${API_BASE_URL}/auth-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // 👇 passiamo anche la community per allineare authorize/token/revoke
          body: JSON.stringify({
            code_challenge: codeChallenge,
            sfdc_community_url: SFDC_COMMUNITY_URL
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch auth URL (${response.status})`)
        }

        const { authUrl } = await response.json()
        console.log('[LOGIN] authUrl:', authUrl)

        // Redirect verso Salesforce (PKCE)
        window.location.href = authUrl
      } catch (error) {
        console.error('Error during Salesforce login:', error)
        this.$q.notify({
          color: 'negative',
          message: 'Login automatico fallito, riprova più tardi',
          position: 'top'
        })
      }
    }
  }
}
</script>
