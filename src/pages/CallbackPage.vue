<template>
  <q-page class="flex flex-center">
    <div>Completing login...</div>
  </q-page>
</template>

<script>
/* eslint-disable no-console */
export default {
  async created() {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const codeVerifier = sessionStorage.getItem('code_verifier')

    if (code && codeVerifier) {
      try {
        // https://menarini-external-site-poc-a6774a35f622.herokuapp.com/oauth2/token
        const response = await fetch('http://localhost:3000/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code,
            code_verifier: codeVerifier
          })
        })

        const data = await response.json()
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token)
          this.$router.push('/')
        } else {
          console.error('Token non ricevuto:', data)
        }
      } catch (error) {
        console.error('Errore durante il login:', error)
      }
    } else {
      console.error('Code o Code Verifier mancante')
    }
  }
}
</script>
