import { useRef, useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import {
  Button,
  TextField,
  Card,
  CardMedia,
  Container,
  Typography,
  CircularProgress,
  Box,
  IconButton,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import Link from 'next/link';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [artist, setArtist] = useState();
  const [playlist, setPlaylist] = useState([]);
  const [currSong, setCurrSong] = useState(0);
  const [search, setSearch] = useState('');
  const [guess, setGuess] = useState('');
  const [disableGuess, setDisableGuess] = useState(false);
  const [verse, setVerse] = useState('');
  const [type, setType] = useState('song');
  const [correctLyric, setCorrectLyric] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const audioRef = useRef();

  const trimString = (s) => {
    var n = s.indexOf('(');
    return s.substring(0, n != -1 ? n : s.length).trim();
  };

  const onTimeUpdate = (e) => {
    if (disableGuess === false && e.target.currentTime >= 10) {
      e.target.pause();
      setShowPlayButton(false);
    } else setShowPlayButton(true);
  };
  const pause = (e) => {
    setIsPaused(true);
  };
  const play = (e) => {
    setIsPaused(false);
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

  useEffect(() => {
    if (type === 'song') return;
    if (!playlist.length) return;
    if (currSong >= playlist.length) {
      alert('No song lyrics found');
      startOver();
    } else getLyrics(artist.name, playlist[currSong].name);
  }, [currSong, playlist]);

  useEffect(() => {
    type === 'lyric' && verse && setLoading(false);
  }, [verse]);
  useEffect(() => {
    type === 'song' && playlist.length && setLoading(false);
  }, [playlist, currSong]);

  const getLyrics = async (artistName, songName) => {
    const response = await fetch(
      `https://api.lyrics.ovh/v1/${artistName}/${songName}`
    );
    const data = await response.json();
    const lyrics = data.lyrics?.split('\n').filter((str) => str.length > 0);
    if (!lyrics) {
      nextSong();
      return;
    }
    const snippet = [lyrics[6], lyrics[7], lyrics[8]].join(' ');
    let snippetArr = snippet.split(' ');
    const randomNum = Math.floor(Math.random() * snippetArr.length);
    console.log(snippetArr);
    setCorrectLyric(snippetArr[randomNum]);
    snippetArr[randomNum] = '_______';
    setVerse(snippetArr.join(' '));
  };

  const getSongs = async (_search) => {
    setLoading(true);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}${_search ?? search}`
    );
    const data = await response.json();
    const filteredSongs = data.songs.filter((song) => Boolean(song.url));
    if (filteredSongs.length === 0) {
      alert(`no songs found for ${data.artist.name}`);
      setLoading(false);
      return;
    }

    setPlaylist(filteredSongs);
    setArtist(data.artist);
    updateSong(true);
  };
  const nextSong = async () => {
    setLoading(true);
    updateSong();
    if (audioRef.current) audioRef.current.controls = false;
  };
  const checkGuess = async (_guess) => {
    if (type === 'song') {
      const correctSong = trimString(playlist[currSong].name);
      setDisableGuess(true);
      const songGuess = _guess ?? guess;
      if (songGuess.toLowerCase() === correctSong.toLowerCase())
        alert(`Correct! The song is ${playlist[currSong].name}`);
      else if (guess === '')
        alert(`You didn't even try! The answer is ${playlist[currSong].name}`);
      else alert(`Wrong. The right answer is ${playlist[currSong].name}`);
      if (audioRef.current) {
        audioRef.current.controls = true;
        audioRef.current.play();
      }
    } else {
      setDisableGuess(true);
      const lyricGuess = _guess ?? guess;
      const lyricAnswer = correctLyric.replace(/[^a-zA-Z0-9 ]/g, '');
      if (lyricGuess.toLowerCase() === lyricAnswer.toLowerCase())
        alert(`Correct! The Lyric is ${lyricAnswer}`);
      else if (guess === '')
        alert(`You didn't even try! The lyric is ${lyricAnswer}`);
      else alert(`Wrong. The right answer is ${lyricAnswer}`);
    }
  };
  const startOver = (quizType) => {
    quizType && setType(quizType);
    setPlaylist([]);
    setGuess('');
    setSearch('');
    setArtist(null);
    setVerse('');
  };

  return (
    <Container>
      <div className={styles.container}>
        <main className={styles.main}>
          <div style={{ display: 'flex' }}>
            <Button
              style={{ margin: '0 1rem' }}
              variant={type === 'song' ? 'contained' : 'text'}
              onClick={() => startOver('song')}
            >
              Song Quiz
            </Button>
            <Button
              style={{ margin: '0 1rem' }}
              variant={type === 'lyric' ? 'contained' : 'text'}
              onClick={() => startOver('lyric')}
            >
              Lyrics Quiz
            </Button>
            <Link href='/multiplayer'>
              <Button style={{ margin: '0 1rem' }}>Multiplayer</Button>
            </Link>
          </div>
          {playlist.length === 0 && !loading && (
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
            {artist && (
              <div className={styles.songCard}>
                <Typography
                  sx={{ display: 'flex', justifyContent: 'center' }}
                  component='div'
                  variant='h3'
                >
                  {artist.name}
                </Typography>
                <CardMedia
                  sx={{
                    flexGrow: 1,
                    borderRadius: '15px',
                    maxWidth: '500px',
                    marginTop: '2rem',
                  }}
                  component='img'
                  image={artist.imgSrc}
                  alt='artist image'
                />
              </div>
            )}
            {loading && (
              <Box sx={{ display: 'flex' }}>
                <CircularProgress />
              </Box>
            )}
            {playlist.length > 0 && !loading && (
              <>
                {type === 'song' ? (
                  <div className={styles.audioWrapper}>
                    <IconButton
                      onClick={() => {
                        if (audioRef.current.paused) {
                          audioRef.current.currentTime = 0;
                          audioRef.current.play();
                        } else audioRef.current.currentTime = 0;
                      }}
                      aria-label='replay'
                    >
                      <ReplayIcon />
                    </IconButton>
                    {isPaused ? (
                      <>
                        {showPlayButton && (
                          <IconButton
                            onClick={() => audioRef.current.play()}
                            aria-label='play'
                          >
                            <PlayCircleIcon />
                          </IconButton>
                        )}
                      </>
                    ) : (
                      <IconButton
                        onClick={() => audioRef.current.pause()}
                        aria-label='pause'
                      >
                        <PauseIcon />
                      </IconButton>
                    )}
                    {!(currSong === playlist.length - 1) && (
                      <IconButton onClick={nextSong} aria-label='skip'>
                        <SkipNextIcon />
                      </IconButton>
                    )}
                    <audio
                      onTimeUpdate={onTimeUpdate}
                      onPause={pause}
                      onPlay={play}
                      id='songAudio'
                      autoPlay
                      ref={audioRef}
                    >
                      <source src={playlist[currSong].url} type='audio/mpeg' />
                    </audio>
                  </div>
                ) : (
                  <Typography
                    sx={{ display: 'flex', justifyContent: 'center' }}
                    component='div'
                    variant='h5'
                  >
                    {verse}
                  </Typography>
                )}
                <div className={styles.guessForm}>
                  <TextField
                    sx={{ flexGrow: 4 }}
                    type='text'
                    id='guess'
                    placeholder={`Guess The ${
                      type === 'song' ? 'Song' : 'Lyric'
                    }!`}
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
                    onClick={() => {
                      currSong === playlist.length - 1
                        ? startOver()
                        : nextSong();
                    }}
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
