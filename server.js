/* eslint-disable camelcase,no-console */
require('dotenv').config()

const express    = require('express')
const axios      = require('axios')
const path       = require('path')
const bodyParser = require('body-parser')
const cors       = require('cors')

const app  = express()
const port = process.env.PORT || 3000

/* ---------------------------------------------------------------------------
   CONFIG
--------------------------------------------------------------------------- */
const clientId    = process.env.CLIENT_ID
  || '3MVG9kfeuo6xCm.r16r._goNjZJwm9BX9OEpyjQIaM0IFaHzM03TumZzRG55dLBMo0s8Dip4zslg.gbarRkjA'

// ⚠️ Deve combaciare 1:1 con ciò usato in /auth-url (e registrato nella Connected App)
const redirectUri = process.env.REDIRECT_URI // es: http://localhost:3000/callback

// EXPID opzionale: se assente NON lo aggiungiamo all'authorize URL
const expId       = (process.env.EXPID || '').trim()
const oneTrustBaseUrl = (
  process.env.ONETRUST_BASE_URL || 'https://daisytestsandbox-sandbox-428.my.onetrust.com'
).replace(/\/+$/, '')
const oneTrustClientId = (process.env.ONETRUST_CLIENT_ID || '').trim()
const oneTrustClientSecret = (process.env.ONETRUST_CLIENT_SECRET || '').trim()
const oneTrustPopupPurposeName = (process.env.ONETRUST_POPUP_PURPOSE_NAME || 'Channels allowed|095').trim()
const oneTrustSearchPageSize = Number(process.env.ONETRUST_SEARCH_PAGE_SIZE || 25)
let oneTrustTokenCache = {
  accessToken: '',
  expiresAt: 0
}

/* ---------------------------------------------------------------------------
   MIDDLEWARE
--------------------------------------------------------------------------- */
app.use(cors())
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'dist/spa')))

/* ---------------------------------------------------------------------------
   HELPERS
--------------------------------------------------------------------------- */
function ensureRedirectUriPresent(res) {
  if (!redirectUri) {
    res.status(500).json({
      error: 'missing_redirect_uri',
      error_description: 'REDIRECT_URI env var is not set on the server'
    })
    return false
  }
  return true
}

function ensureOneTrustConfigPresent(res) {
  if (!oneTrustClientId || !oneTrustClientSecret) {
    res.status(500).json({
      error: 'missing_onetrust_credentials',
      error_description: 'ONETRUST_CLIENT_ID and ONETRUST_CLIENT_SECRET must be set on the server'
    })
    return false
  }

  return true
}

// Costruisce dinamicamente gli endpoint a partire da una communityUrl se fornita
function buildSalesforceEndpoints(communityUrl) {
  // Se arriva dal FE, usiamo quello (es: https://.../ciam), altrimenti fallback release/ciam
  const base = (communityUrl && communityUrl.trim())
    ? communityUrl.replace(/\/+$/, '') // strip trailing slash
    : 'https://menarinipharma--test.sandbox.my.site.com/ciam'

  // authorize: con expid se presente, altrimenti senza segmento
  const authorize = expId
    ? `${base}/services/oauth2/authorize/expid_${expId}`
    : `${base}/services/oauth2/authorize`

  const token  = `${base}/services/oauth2/token`
  const revoke = `${base}/services/oauth2/revoke`

  return { authorize, token, revoke }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function getOneTrustDataElementEntries(dataSubject) {
  const dataElements = dataSubject?.dataElements || {}

  if (Array.isArray(dataElements)) {
    return dataElements.map((entry) => [entry.Name, entry.Value])
  }

  return Object.entries(dataElements)
}

function selectBestMatchingDataSubject(dataSubjects, email) {
  const normalizedEmail = normalizeEmail(email)
  const exactMatches = dataSubjects
    .filter((dataSubject) => {
      if (normalizeEmail(dataSubject?.identifier) === normalizedEmail) {
        return true
      }

      return getOneTrustDataElementEntries(dataSubject)
        .some(([, value]) => normalizeEmail(value) === normalizedEmail)
    })
    .sort((left, right) => {
      const leftHasGermanyEmail = getOneTrustDataElementEntries(left)
        .some(([name, value]) => name.includes('|DE|') && normalizeEmail(value) === normalizedEmail)
      const rightHasGermanyEmail = getOneTrustDataElementEntries(right)
        .some(([name, value]) => name.includes('|DE|') && normalizeEmail(value) === normalizedEmail)

      if (leftHasGermanyEmail !== rightHasGermanyEmail) {
        return rightHasGermanyEmail - leftHasGermanyEmail
      }

      return new Date(right.lastUpdatedDate || 0) - new Date(left.lastUpdatedDate || 0)
    })

  return exactMatches[0] || null
}

async function getOneTrustAccessToken() {
  const now = Date.now()

  if (oneTrustTokenCache.accessToken && oneTrustTokenCache.expiresAt > now) {
    return oneTrustTokenCache.accessToken
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: oneTrustClientId,
    client_secret: oneTrustClientSecret
  })

  const { status, data } = await axios.post(
    `${oneTrustBaseUrl}/api/access/v1/oauth/token`,
    body.toString(),
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      validateStatus: () => true
    }
  )

  if (status >= 400 || !data?.access_token) {
    throw new Error(`OneTrust token request failed (${status})`)
  }

  const expiresInSeconds = Number(data.expires_in || 3600)
  oneTrustTokenCache = {
    accessToken: data.access_token,
    expiresAt: now + Math.max(expiresInSeconds - 60, 60) * 1000
  }

  return oneTrustTokenCache.accessToken
}

async function searchOneTrustDataSubjectsByEmail(email) {
  const accessToken = await getOneTrustAccessToken()
  const { status, data } = await axios.post(
    `${oneTrustBaseUrl}/api/consentmanager/v2/datasubjects/search`,
    { query: email },
    {
      params: {
        size: oneTrustSearchPageSize,
        properties: 'ignoreCount'
      },
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true
    }
  )

  if (status >= 400) {
    throw new Error(`OneTrust search request failed (${status})`)
  }

  return Array.isArray(data?.content) ? data.content : []
}

async function getOneTrustProfileByIdentifier(identifier) {
  const accessToken = await getOneTrustAccessToken()
  const { status, data } = await axios.get(
    `${oneTrustBaseUrl}/api/consentmanager/v1/datasubjects/profiles`,
    {
      params: {
        size: 1,
        properties: 'ignoreCount'
      },
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        Identifier: identifier
      },
      validateStatus: () => true
    }
  )

  if (status >= 400) {
    throw new Error(`OneTrust profile request failed (${status})`)
  }

  return Array.isArray(data?.content) ? data.content[0] || null : null
}

function resolvePopupStatusFromProfile(profile) {
  if (!profile) {
    return {
      showPopup: true,
      consentStatus: 'NOT_FOUND'
    }
  }

  const purpose = (profile.Purposes || [])
    .find(({ Name }) => Name === oneTrustPopupPurposeName)

  if (!purpose) {
    return {
      showPopup: true,
      consentStatus: 'MISSING'
    }
  }

  return {
    showPopup: purpose.Status === 'NO_CONSENT',
    consentStatus: purpose.Status || 'UNKNOWN'
  }
}

/* ---------------------------------------------------------------------------
   ENDPOINTS
--------------------------------------------------------------------------- */

// 1) Restituisce l’URL di autorizzazione (PKCE)
app.post('/auth-url', (req, res) => {
  if (!ensureRedirectUriPresent(res)) return
  const { code_challenge, sfdc_community_url, sfdcCommunityUrl } = req.body || {}
  const communityUrl = sfdcCommunityUrl || sfdc_community_url || ''

  const { authorize } = buildSalesforceEndpoints(communityUrl)

  const authUrl =
    `${authorize}` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code_challenge=${encodeURIComponent(code_challenge)}` +
    `&code_challenge_method=S256` +
    `&scope=${encodeURIComponent('openid profile offline_access address phone')}`

  console.log('[AUTH-URL] communityUrl:', communityUrl || '(default release/ciam)')
  console.log('[AUTH-URL] redirect_uri:', redirectUri)
  console.log('[AUTH-URL] built:', authUrl)
  res.json({ authUrl })
})

app.post('/onetrust/popup-status', async (req, res) => {
  if (!ensureOneTrustConfigPresent(res)) return

  const email = normalizeEmail(req.body?.email)
  if (!email) {
    res.status(400).json({
      error: 'missing_email',
      error_description: 'email is required'
    })
    return
  }

  try {
    const searchResults = await searchOneTrustDataSubjectsByEmail(email)
    const matchedDataSubject = selectBestMatchingDataSubject(searchResults, email)

    if (!matchedDataSubject?.identifier) {
      res.json({
        email,
        individualId: '',
        consentStatus: 'INDIVIDUAL_NOT_FOUND',
        showPopup: false
      })
      return
    }

    const profile = await getOneTrustProfileByIdentifier(matchedDataSubject.identifier)
    const popupStatus = resolvePopupStatusFromProfile(profile)

    res.json({
      email,
      individualId: matchedDataSubject.identifier,
      consentStatus: popupStatus.consentStatus,
      showPopup: popupStatus.showPopup
    })
  } catch (error) {
    console.error('[ONETRUST][POPUP-STATUS]', error?.response?.data || error.message)
    res.status(500).json({
      error: 'onetrust_popup_status_failed',
      error_description: error.message || 'unknown_error'
    })
  }
})

// 2) Scambia l’authorization code per i token
app.post('/oauth2/callback', async (req, res) => {
  if (!ensureRedirectUriPresent(res)) return
  const { code, code_verifier, sfdc_community_url, sfdcCommunityUrl } = req.body || {}
  const communityUrl = sfdcCommunityUrl || sfdc_community_url || ''

  const { token } = buildSalesforceEndpoints(communityUrl)

  console.log('[TOKEN] Using token endpoint:', token)
  console.log('[TOKEN] redirect_uri:', redirectUri)

  try {
    const { data } = await axios.post(
      token,
      null,
      {
        params: {
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code,
          code_verifier
        },
        validateStatus: () => true
      }
    )

    if (data.error) {
      console.error('[TOKEN][SF ERROR]', data)
      // Propaga errore al FE (invalid_grant, redirect_uri mismatch, ecc.)
      res.status(400).json(data)
    } else {
      console.log('[TOKEN][OK] received keys:', Object.keys(data))
      console.log('[TOKEN][OK] access_token:', data.access_token)
      console.log('[TOKEN][OK] id_token:', data.id_token)
      console.log('[TOKEN][OK] scope:', data.scope)
      res.json(data)
    }
  } catch (error) {
    const payload = error?.response?.data || error.message || 'unknown_error'
    console.error('[TOKEN][EXCEPTION]', payload)
    res.status(500).json({ error: 'token_exchange_failed', details: payload })
  }
})

// 3) Revoca token e logout server-side
app.post('/logout', async (req, res) => {
  const { access_token, refresh_token, sfdc_community_url, sfdcCommunityUrl } = req.body || {}
  const communityUrl = sfdcCommunityUrl || sfdc_community_url || ''
  const { revoke } = buildSalesforceEndpoints(communityUrl)

  try {
    const tokenToRevoke = refresh_token || access_token
    if (tokenToRevoke) {
      const { status, data } = await axios.post(revoke, null, { params: { token: tokenToRevoke } })
      console.log('[REVOKE] status:', status, 'data:', data && Object.keys(data).length ? data : '(empty)')
    }
    res.sendStatus(204)
  } catch (e) {
    console.error('[REVOKE][EXCEPTION]', e.response?.data || e.message)
    // Non bloccare il logout client
    res.sendStatus(204)
  }
})

/* ---------------------------------------------------------------------------
   SPA fallback
--------------------------------------------------------------------------- */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/spa/index.html'))
})

/* ---------------------------------------------------------------------------
   START
--------------------------------------------------------------------------- */
app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`)
})
