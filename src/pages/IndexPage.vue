<template>
  <q-page className="flex flex-center">
    <!-- Container for Preference Manager -->
    <div id="pref-center-main"></div>
  </q-page>
</template>

<script setup>
import {onMounted} from 'vue'

defineOptions({
  name: 'IndexPage'
})

onMounted(() => {
  // Inject the Preference Manager CSS
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.type = 'text/css'
  link.href = 'https://menarinipharma--developer.sandbox.my.salesforce.com/prefcenter/preference-center-1.2.0/css/pref-center-slds.css'
  document.head.appendChild(link)

  // Inject the Preference Manager Script
  const script = document.createElement('script')
  script.id = 'preference-center'
  script.src = 'https://menarinipharma--developer.sandbox.my.salesforce.com/prefcenter/preference-center-1.2.0/js/main.js'
  script.setAttribute('pref-center-host', 'https://menarinipharma--developer.sandbox.my.salesforce.com')
  script.setAttribute('pref-center-name', 'Detailed_test')
  script.setAttribute('pref-center-param', 'pctoken')
  script.setAttribute('pctoken', 'QUtJMDAwMDAwY01qYWVUYUlGWHoxSExzZFVhUFhINHVuWnBwZ0o0bEliZ2dDWXlUbERoNXdDaFcxQ2FLZGQvdHAyMFRyWmU5M3g3U0lHODRBbUh0RFgrYW5RUHV3SHFCOE1MMURTQ1hnUUlEZ2VhQ2I4STdsV1VWZUhUZ3ZzNjMyS3huejdGN3hHbGpNUUdBWWpoYWNReStQOFdvaXFzNFQvdz09')
  script.async = true

  script.onload = () => {
    console.log('Preference Manager script loaded successfully.')
  }

  script.onerror = () => {
    console.error('Error loading the Preference Manager script.')
  }

  document.body.appendChild(script)
})
</script>
