const express = require('express')
const path = require('path')
const app = express()
const port = process.env.PORT || 4200
const dist = path.join(__dirname, 'dist', 'turnoplus', 'browser')
app.use(express.static(dist))
app.get('*', (req, res) => {
  res.sendFile(path.join(dist, 'index.html'))
})
app.listen(port)