<template>
  <div v-if="false" />
</template>

<script setup>
/* eslint-disable no-console */
import { onMounted } from 'vue'
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
}

onMounted(async () => {
  try {
    await loadPopupIfNeeded()
  } catch (error) {
    console.error('[OneTrust Popup] Errore durante l\'inizializzazione', error)
  }
})
</script>
