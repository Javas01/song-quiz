const express = require('express')
const axios = require('axios');
const qs = require('qs');
const cors = require('cors');
require('dotenv').config();

const app = express()

app.use(cors({
    origin: '*'
}));

const client_id = process.env.SPOTIFY_API_ID; // Your client id
const client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret
const auth_token = Buffer.from(`${client_id}:${client_secret}`, 'utf-8').toString('base64');

axios.defaults.baseURL = 'https://api.spotify.com/v1';
axios.defaults.headers['Content-Type'] = 'application/json';

const getAuth = async () => {
    try {
        //make post request to SPOTIFY API for access token, sending relavent info
        const token_url = 'https://accounts.spotify.com/api/token';
        const data = qs.stringify({ 'grant_type': 'client_credentials' });

        const response = await axios.post(token_url, data, {
            headers: {
                'Authorization': `Basic ${auth_token}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        //return access token
        return response.data.access_token;
    } catch (error) {
        console.log(error);
    }
}
const getTopTracks = async (id, token) => {
    try {
        const { data: { tracks } } = await axios.get(`/artists/${id}/top-tracks?market=US`, { headers: { 'Authorization': 'Bearer ' + token } })
        return tracks.map(song => ({
            name: song.name,
            url: song.preview_url
        }))
    } catch (error) {
        console.log(error);
    }
}

app.get('/api/:artist', async (req, res) => {
    try {
        const token = await getAuth()
        const { data } = await axios.get(`/search?q=${req.params.artist}&type=artist&limit=1`, { headers: { 'Authorization': 'Bearer ' + token } })

        const topTracks = await getTopTracks(data.artists.items[0].id, token)
        res.json({
            artist: {
                name: data.artists.items[0].name,
                imgSrc: data.artists.items[0].images[1].url
            },
            songs: topTracks
        })
    }
    catch (error) {
        console.error(error);
        res.send('not found').end()
    }
})

app.listen(1338, console.log('Listening on port: 1338'))
