/* eslint-disable camelcase,no-console */
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
const port = process.env.PORT || 3000

app.use(cors({
  origin: '*', // Permette l'accesso da qualsiasi dominio
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}))

app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'dist/spa')))

app.post('/auth-url', (req, res) => {
  const { code_challenge } = req.body
  const clientId = '3MVG9gYjOgxHsENIQE2.ZOxlu02BCV7Vs2cCv.ONa4bq7e5pHaCmR4NE8dMToAfuoUBWwYwFxoNFU98IrsFdI'
  // https://menarini-external-site-poc-a6774a35f622.herokuapp.com/callback
  const redirectUri = 'http://localhost:9000/callback'

  const authUrl = `https://menarinipharma.my.site.com/services/auth/sso/Salesforce_Auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&code_challenge=${code_challenge}&code_challenge_method=S256&scope=openid`

  res.json({ authUrl })
})

app.post('/oauth2/token', async (req, res) => {
  const { code, code_verifier } = req.body
  console.log(code)
  console.log(code_verifier)
  const clientId = '3MVG9gYjOgxHsENIQE2.ZOxlu02BCV7Vs2cCv.ONa4bq7e5pHaCmR4NE8dMToAfuoUBWwYwFxoNFU98IrsFdI'
  const clientSecret = 'F5E85869EEE3497420D802CA0E66A92CB38EBD969968EE81BF64A9147A9C0570'
  // https://menarini-external-site-poc-a6774a35f622.herokuapp.com/callback
  const redirectUri = 'http://localhost:9000/callback'

  try {
    const fetch = (await import('node-fetch')).default

    const response = await fetch('https://menarinipharma.my.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        code_verifier,
        redirect_uri: redirectUri
      })
    })

    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Errore durante lo scambio di token:', error)
    res.status(500).json({ error: 'Errore durante lo scambio di token' })
  }
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/spa/index.html'))
})

app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`)
})
