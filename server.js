/* eslint-disable camelcase,no-console */
require('dotenv').config()   // legge le variabili da .env (in locale)

const express    = require('express')
const axios      = require('axios')
const path       = require('path')
const bodyParser = require('body-parser')
const cors       = require('cors')

const app  = express()
const port = process.env.PORT || 3000

/* ---------------------------------------------------------------------------
   CONFIGURAZIONE
--------------------------------------------------------------------------- */
const clientId    = process.env.CLIENT_ID
  || '3MVG94wTqkLCfCy0zcQFIaCMArbfauGKTH2V.sODtRuRzUoLwtcKPT9ynvyD3FDdPiWaiyT1ukWvsCx2O93c6'
const redirectUri = process.env.REDIRECT_URI   // es. http://localhost:3000/callback
const expId       = process.env.EXPID          // es. 12345

// costruisce il segmento expid_<valore> solo se EXPID è valorizzato
const expIdSegment = expId ? `expid_${expId}` : 'expid_12345'

/* ---------------------------------------------------------------------------
   MIDDLEWARE
--------------------------------------------------------------------------- */
app.use(cors())
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'dist/spa')))

/* ---------------------------------------------------------------------------
   REST ENDPOINTS
--------------------------------------------------------------------------- */
// 1) Restituisce l’URL di autorizzazione (PKCE)
app.post('/auth-url', (req, res) => {
  const { code_challenge } = req.body
  console.log('ciao Dario')
  const authUrl =
    `https://menarinipharma--developer.sandbox.my.site.com/ciam/services/oauth2/authorize/${expIdSegment}` +
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&code_challenge=${code_challenge}` +
    `&code_challenge_method=S256` +
    `&scope=openid profile email offline_access address phone`

  res.json({ authUrl })
})

// 2) Scambia l’authorization code per l’access/refresh token
app.post('/oauth2/callback', async (req, res) => {
  const { code, code_verifier } = req.body

  try {
    const { data } = await axios.post(
      'https://menarinipharma--developer.sandbox.my.site.com/ciam/services/oauth2/token',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code,
          code_verifier
        }
      }
    )

    console.log('[TOKEN]', data)
    res.json(data)
  } catch (error) {
    console.error('Errore nello scambio del codice:', error.response?.data || error.message)
    res.status(500).send('Errore durante il login')
  }
})

/* ---------------------------------------------------------------------------
   SPA fallback
--------------------------------------------------------------------------- */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/spa/index.html'))
})

/* ---------------------------------------------------------------------------
   AVVIO SERVER
--------------------------------------------------------------------------- */
app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`)
})
