import { useRef, useState } from 'react';
import styles from '../styles/Home.module.css';
import SongQuiz from '../components/SongQuiz';
import { Button, TextField, Card, Container, Typography } from '@mui/material';

export default function Home() {
  const [artist, setArtist] = useState();
  const [playlist, setPlaylist] = useState([]);
  const [currSong, setCurrSong] = useState(0);
  const [search, setSearch] = useState('');
  const [guess, setGuess] = useState('');
  const [disableGuess, setDisableGuess] = useState(false);
  const [verse, setVerse] = useState('');
  const [type, setType] = useState('song quiz');
  const audioRef = useRef();

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

  const getLyrics = async (artistName, songName) => {
    const response = await fetch(
      `https://api.lyrics.ovh/v1/${artistName}/${trimString(songName)}`
    );
    const data = await response.json();
    const lyrics = data.lyrics?.split('\n').filter((str) => str.length > 0) ?? [''];
    console.log(lyrics);
    const randomNum = Math.floor(Math.random() * lyrics.length);
    setVerse(lyrics);
  };

  const getSongs = async (_search) => {
    const response = await fetch(
      `http://localhost:1338/api/${_search ?? search}`
    );
    const data = await response.json();
    const filteredSongs = data.songs.filter((song) => Boolean(song.url));
    if (filteredSongs.length === 0) {
      alert(`no songs found for ${data.artist.name}`);
      return;
    }

    getLyrics(data.artist.name, filteredSongs[0].name);
    setPlaylist(filteredSongs);
    setArtist(data.artist);
    updateSong(true);
  };
  const nextSong = async () => {
    updateSong();
    getLyrics(artist.name, playlist[currSong].name);
    if (audioRef.current) audioRef.current.controls = false;
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
    if (audioRef.current) {
      audioRef.current.controls = true;
      audioRef.current.play();
    }
  };
  const startOver = (quizType) => {
    quizType && setType(quizType);
    setPlaylist([]);
    setGuess('');
    setSearch('');
  };

  return (
    <Container>
      <div className={styles.container}>
        <main className={styles.main}>
          <div style={{ display: 'flex' }}>
            <Button
              style={{ margin: '0 1rem' }}
              variant='contained'
              onClick={() => startOver('song quiz')}
            >
              Song Quiz
            </Button>
            <Button
              style={{ margin: '0 1rem' }}
              variant='contained'
              onClick={() => startOver('lyric quiz')}
            >
              Lyrics Quiz
            </Button>
          </div>
          {playlist.length === 0 && (
            <Card className={styles.search}>
              <TextField
                id='search'
                placeholder='Enter the Name of an Artist'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && getSongs(e.target.value)}
              />
              <Button
                variant='contained'
                id='submit'
                onClick={() => getSongs()}
              >
                Search
              </Button>
            </Card>
          )}
          <>
            {!!playlist.length && (
              <>
                {type === 'song quiz' ? (
                  <SongQuiz
                    artist={artist}
                    onTimeUpdate={onTimeUpdate}
                    audioRef={audioRef}
                    currentSong={playlist[currSong]}
                  />
                ) : (
                  <Typography
                    sx={{ display: 'flex', justifyContent: 'center' }}
                    component='div'
                    variant='h5'
                  >
                    {verse.join(' ')}
                  </Typography>
                )}
                <div className={styles.guessForm}>
                  <TextField
                    sx={{ flexGrow: 4 }}
                    type='text'
                    id='guess'
                    placeholder='Guess The Song!'
                    value={guess}
                    disabled={disableGuess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && checkGuess(e.target.value)
                    }
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
              </>
            )}
          </>
        </main>
      </div>
    </Container>
  );
}
