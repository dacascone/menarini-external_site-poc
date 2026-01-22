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
  || '3MVG94wTqkLCfCy0zcQFIaCMArbfauGKTH2V.sODtRuRzUoLwtcKPT9ynvyD3FDdPiWaiyT1ukWvsCx2O93c6'

// ⚠️ Deve combaciare 1:1 con ciò usato in /auth-url (e registrato nella Connected App)
const redirectUri = process.env.REDIRECT_URI // es: http://localhost:3000/callback

// EXPID opzionale: se assente NON lo aggiungiamo all'authorize URL
const expId       = (process.env.EXPID || '').trim()

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

// Costruisce dinamicamente gli endpoint a partire da una communityUrl se fornita
function buildSalesforceEndpoints(communityUrl) {
  // Se arriva dal FE, usiamo quello (es: https://.../ciam), altrimenti fallback release/ciam
  const base = (communityUrl && communityUrl.trim())
    ? communityUrl.replace(/\/+$/, '') // strip trailing slash
    : 'https://menarinipharma--release.sandbox.my.site.com/ciam'

  // authorize: con expid se presente, altrimenti senza segmento
  const authorize = expId
    ? `${base}/services/oauth2/authorize/expid_${expId}`
    : `${base}/services/oauth2/authorize`

  const token  = `${base}/services/oauth2/token`
  const revoke = `${base}/services/oauth2/revoke`

  return { authorize, token, revoke }
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
