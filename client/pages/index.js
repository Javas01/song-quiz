import { useRef, useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import * as React from 'react';
import {
  Button,
  Icon,
  TextField,
  Card,
  CardMedia,
  Container,
  Box,
  CardContent,
  Typography,
  IconButton,
  useTheme,
} from '@mui/material';

export default function Home() {
  const [artist, setArtist] = useState();
  const [playlist, setPlaylist] = useState([]);
  const [currSong, setCurrSong] = useState(0);
  const [search, setSearch] = useState('');
  const [guess, setGuess] = useState('');
  const [disableGuess, setDisableGuess] = useState(false);
  const audioRef = useRef();
  const theme = useTheme();

  const trimString = (s) => {
    var n = s.indexOf('(');
    return s.substring(0, n != -1 ? n : s.length).trim();
  };

  const onTimeUpdate = (e) => {
    if (disableGuess === false && e.target.currentTime >= 10) {
      e.target.pause();
    }
  };

  const updateSong = (resetCount) => {
    setGuess('');
    setDisableGuess(false);
    setCurrSong((prev) => (resetCount ? 0 : prev + 1));
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play();
    }
  };

  const getSongs = async (_search) => {
    const response = await fetch(
      `http://localhost:1338/api/${_search ?? search}`
    );
    const data = await response.json();
    const filteredSongs = data.songs.filter((song) => Boolean(song.url));
    console.log(filteredSongs);
    console.log(data.artist);
    if (filteredSongs.length === 0) {
      alert(`no songs found for ${data.artist.name}`);
      return;
    }
    setPlaylist(filteredSongs);
    setArtist(data.artist);
    updateSong(true);
  };
  const nextSong = async () => {
    updateSong();
    audioRef.current.controls = false;
  };
  const checkGuess = async (_guess) => {
    const answer = trimString(playlist[currSong].name);
    setDisableGuess(true);
    const check = _guess ?? guess;
    if (check.toLowerCase() === answer.toLowerCase())
      alert(`Correct! The song is ${playlist[currSong].name}`);
    else if (guess === '')
      alert(`You didn't even try! The answer is ${playlist[currSong].name}`);
    else alert(`Wrong. The right answer is ${playlist[currSong].name}`);
    audioRef.current.controls = true;
    audioRef.current.play();
  };
  const startOver = () => {
    setPlaylist([]);
    setGuess('');
    setSearch('');
  };

  return (
    <Container>
      <div className={styles.container}>
        <main className={styles.main}>
          <Button variant='contained' onClick={startOver}>
            Welcome to Song Quizzer!
          </Button>
          {playlist.length === 0 && (
            <Card className={styles.search}>
              <TextField
                id='search'
                placeholder='Enter the Name of an Artist'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && getSongs(e.target.value)}
              />
              <Button variant='contained' id='submit' onClick={() => getSongs()}>
                Search
              </Button>
            </Card>
          )}
          <>
            {!!playlist.length && (
              <div>
                <div className={styles.songCard}>
                  <CardContent>
                    <Typography
                      sx={{ display: 'flex', justifyContent: 'center' }}
                      component='div'
                      variant='h3'
                    >
                      {artist.name}
                    </Typography>
                  </CardContent>
                  <CardMedia
                    sx={{ flexGrow: 1, borderRadius: '15px' }}
                    component='img'
                    image={artist.imgSrc}
                    alt='artist image'
                  />
                  <div className={styles.audioWrapper}>
                    <audio
                      onTimeUpdate={onTimeUpdate}
                      id='myVideo'
                      autoPlay
                      ref={audioRef}
                    >
                      <source src={playlist[currSong].url} type='audio/mpeg' />
                    </audio>
                  </div>
                </div>
                <div className={styles.guessForm}>
                  <TextField
                    sx={{ flexGrow: 4 }}
                    type='text'
                    id='guess'
                    placeholder='Guess The Song!'
                    value={guess}
                    disabled={disableGuess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && checkGuess(e.target.value)}
                  />
                  <Button
                    variant='contained'
                    id='submit'
                    disabled={disableGuess}
                    onClick={() => checkGuess()}
                  >
                    Guess
                  </Button>
                  <Button
                    variant='contained'
                    id='next'
                    onClick={
                      currSong === playlist.length - 1 ? startOver : nextSong
                    }
                  >
                    {currSong === playlist.length - 1
                      ? 'Start Over'
                      : disableGuess
                      ? 'Next Song'
                      : 'Skip Song'}
                  </Button>
                </div>
              </div>
            )}
          </>
        </main>
      </div>
    </Container>
  );
}
