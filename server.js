const express = require('express')
const path = require('path')

const app = express()
const port = process.env.PORT || 3000

// Servire i file statici dalla cartella di build di Quasar
app.use(express.static(path.join(__dirname, 'dist/spa')))

// Gestione delle richieste con history mode per le SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/spa/index.html'))
})

// Avvia il server
app.listen(port, () => {
})
