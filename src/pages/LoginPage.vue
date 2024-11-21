<template>
  <q-layout>
    <q-page-container class="bg-primary">
      <q-page class="q-pa-md flex flex-center">
        <div class="column items-center">
          <div class="q-pb-md">
            <img
              src="~assets/menarini.svg"
              style="width: 150px;"
            >
          </div>
          <q-card class="q-pa-md" style="width: 300px">
            <q-card-section>
              <div class="text-h6 text-ce">Log Into Menarini</div>
            </q-card-section>
            <q-card-section>
              <q-input v-model="username" label="Username" outlined />
              <q-input v-model="password" type="password" label="Password" outlined class="q-mt-md" />
            </q-card-section>
            <q-card-actions align="center">
              <q-btn label="Login" color="primary" @click="handleLogin" />
            </q-card-actions>
            <q-separator />
            <q-card-actions align="center">
              <q-btn label="Login with Salesforce" style="background-color:#0176d3; color: #ffffff" @click="handleSalesforceLogin" />
            </q-card-actions>
          </q-card>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import {generateCodeVerifier, generateCodeChallenge} from '../utils/pkce-utils'

export default {
  data() {
    return {
      username: '',
      password: ''
    }
  },
  methods: {
    handleLogin() {
      if (this.username === 'user' && this.password === 'pass') {
        localStorage.setItem('authenticated', 'true')
        this.$router.push('/')
      } else {
        this.$q.notify({
          color: 'negative',
          message: 'Username o password errati',
          position: 'top'
        })
      }
    },
    async handleSalesforceLogin() {
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)
      sessionStorage.setItem('code_verifier', codeVerifier)

      // https://menarini-external-site-poc-a6774a35f622.herokuapp.com/auth-url
      const response = await fetch('http://localhost:3000/auth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code_challenge: codeChallenge })
      })

      const { authUrl } = await response.json()
      window.location.href = authUrl
    }
  }
}
</script>
