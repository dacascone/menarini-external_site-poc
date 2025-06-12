/* eslint-disable camelcase,no-console */
const express = require('express')
const axios = require('axios')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
const port = process.env.PORT || 3000

const clientId = '3MVG9Lu3LaaTCEgI8_6qsui3DTcHOgNEzZ1CW4UduSa7IH6O08ncPT6oblRBSSDenx6pxjYajvjIBXX5dK7AF'
const redirectUri = process.env.REDIRECT_URI // 'http://localhost:3000/callback'

app.use(cors())
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'dist/spa')))

app.post('/auth-url', (req, res) => {
  const { code_challenge } = req.body

  const authUrl = `https://menarinipharma--developer.sandbox.my.site.com/services/oauth2/authorize/expid_12345?response_type=code&&client_id=${clientId}&redirect_uri=${redirectUri}&code_challenge=${code_challenge}&code_challenge_method=S256&scope=openid profile email offline_access address phone`

  res.json({ authUrl })
})

app.post('/oauth2/callback', async (req, res) => {
  const { code, code_verifier } = req.body
  try {
    const response = await axios.post('https://menarinipharma--developer.sandbox.my.site.com/services/oauth2/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
        code_verifier
      }
    })
    console.log(response.data)
    res.json(response.data)
  } catch (error) {
    console.error('Errore nello scambio del codice:', error.response?.data || error.message)
    res.status(500).send('Errore durante il login')
  }
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/spa/index.html'))
})

app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`)
})
