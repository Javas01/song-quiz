const express = require('express')

const app = express()

app.get('/api/', (req, res) => {
	res.send('Happy Hacking!').end()
})

app.listen(1338, console.log('Listening on port: 1338'))
