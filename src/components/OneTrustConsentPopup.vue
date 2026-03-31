<template>
  <div v-if="isLoading" class="popup-loader-backdrop" aria-live="polite" aria-busy="true">
    <div class="popup-loader-card">
      <div class="popup-loader-spinner" />
      <div class="popup-loader-text">Loading your preferences...</div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable no-console */
import { onMounted, ref } from 'vue'
import {
  extractCountryFromPayload,
  extractEmailFromPayload,
  getDecodedJwtPayload,
  resolveCountryCode
} from '../utils/ciam-user'

const getApiBaseUrl = () => process.env.VUE_APP_API_BASE_URL || window.location.origin

const TARGET_COUNTRY_CODE = 'DE'
const OT_SCRIPT_ID = 'menarini-onetrust-popup-script'
const OT_SCRIPT_SRC = 'https://daisytestsandbox-privacy-sandbox-428.my.onetrust.com/consent-embedded-forms/consent-receipt-scripts/OtFormStub.js'
const OT_DATA_ID = '45e0801a-31b6-4247-a6a7-7bff3084463a'
const OT_COLLECTION_POINT_ID = '5929819a-edf3-47f9-8ef8-9b3e67bf5a9e'
const OT_WORKER_URL = 'https://consent-api.onetrust.com'
const OT_POPUP_KEY_NAME = 'menariniOneTrustPopupKey'
const isLoading = ref(false)

const loadOneTrustStub = () => new Promise((resolve, reject) => {
  const existingScript = document.getElementById(OT_SCRIPT_ID)

  if (existingScript) {
    if (window.OneTrust?.webform || window.OtSdk) {
      resolve()
      return
    }

    existingScript.addEventListener('load', () => resolve(), { once: true })
    existingScript.addEventListener('error', () => reject(new Error('OtFormStub load failed')), { once: true })
    return
  }

  const script = document.createElement('script')
  script.id = OT_SCRIPT_ID
  script.src = OT_SCRIPT_SRC
  script.dataset.id = OT_DATA_ID
  script.setAttribute('worker', OT_WORKER_URL)
  script.onload = () => resolve()
  script.onerror = () => reject(new Error('OtFormStub load failed'))
  document.head.appendChild(script)
})

const installPopup = ({ individualId, email }) => new Promise((resolve, reject) => {
  const popupKey = `${individualId}:${email}`

  if (window[OT_POPUP_KEY_NAME] === popupKey) {
    resolve()
    return
  }

  window.OtSdk = window.OtSdk || function otSdkQueue(...args) {
    (window.OtSdk.q = window.OtSdk.q || []).push(args)
  }

  const prefillController = (attempt = 0) => {
    if (window.OneTrust?.webform) {
      try {
        window.OneTrust.webform.preFill(
          {
            IndividualID: individualId,
            'E-Mail': email
          },
          OT_COLLECTION_POINT_ID
        )
        window[OT_POPUP_KEY_NAME] = popupKey
        resolve()
        return
      } catch (error) {
        if (attempt >= 50) {
          reject(error)
          return
        }
      }
    }

    if (attempt < 50) {
      window.setTimeout(() => prefillController(attempt + 1), 50)
      return
    }

    reject(new Error('Timed out while prefilling OneTrust popup'))
  }

  window.OtSdk('consent', 'InstallCP', OT_COLLECTION_POINT_ID, (isSuccess, response) => {
    if (!isSuccess) {
      reject(new Error(`InstallCP failed: ${JSON.stringify(response)}`))
      return
    }

    prefillController()
  })
})

const loadPopupIfNeeded = async () => {
  const payload = getDecodedJwtPayload()
  const countryCode = resolveCountryCode(extractCountryFromPayload(payload))

  if (countryCode !== TARGET_COUNTRY_CODE) {
    return
  }

  isLoading.value = true

  try {
    const email = extractEmailFromPayload(payload)
    if (!email) {
      console.warn('[OneTrust Popup] Email utente non trovata nel token CIAM')
      return
    }

    const response = await fetch(`${getApiBaseUrl()}/onetrust/popup-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(`Popup status request failed (${response.status}): ${message}`)
    }

    const popupStatus = await response.json()
    if (!popupStatus.showPopup) {
      return
    }

    if (!popupStatus.individualId) {
      console.warn('[OneTrust Popup] IndividualID non trovato per email', email)
      return
    }

    await loadOneTrustStub()
    await installPopup({
      individualId: popupStatus.individualId,
      email: popupStatus.email || email
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  try {
    await loadPopupIfNeeded()
  } catch (error) {
    console.error('[OneTrust Popup] Errore durante l\'inizializzazione', error)
  }
})
</script>

<style scoped>
.popup-loader-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(3px);
}

.popup-loader-card {
  min-width: 240px;
  padding: 18px 22px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 40px rgba(13, 33, 61, 0.16);
  text-align: center;
}

.popup-loader-spinner {
  width: 36px;
  height: 36px;
  margin: 0 auto 12px;
  border: 3px solid rgba(176, 186, 196, 0.5);
  border-top-color: #0d5cab;
  border-radius: 50%;
  animation: popup-loader-spin 0.8s linear infinite;
}

.popup-loader-text {
  color: #12324d;
  font-size: 15px;
  font-weight: 600;
}

@keyframes popup-loader-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
