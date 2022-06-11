import { useRef, useState, useEffect, useContext } from 'react';
import styles from '../styles/Home.module.css';
import Search from '../components/Search';
import { SocketContext } from './_app.js';
import {
  Button,
  TextField,
  CardMedia,
  Container,
  Typography,
  CircularProgress,
  Box,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PauseIcon from '@mui/icons-material/Pause';
import Link from 'next/link';

export default function Home() {
  const socket = useContext(SocketContext);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState('success');
  const [artist, setArtist] = useState();
  const [playlist, setPlaylist] = useState([]);
  const [currSong, setCurrSong] = useState(0);
  const [search, setSearch] = useState('');
  const [guess, setGuess] = useState('');
  const [disableGuess, setDisableGuess] = useState(false);
  const [verse, setVerse] = useState('');
  const [type, setType] = useState('song');
  const [currRoom, setCurrRoom] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [players, setPlayers] = useState([]);
  const [alertMsg, setAlertMsg] = useState('');
  const audioRef = useRef();

  const handleCorrectAnswer = (socketId) => {
    const newScores = players.map((player) => {
      console.log(player.id);
      if (player.id === socketId) return { ...player, score: player.score + 1 };
      else {
        setSeverity('error')
        return player
      };
    });
    setPlayers(newScores);
    setAlertMsg(`${socketId} got it right`);
    showSnackbar();
    setTimeout(nextSong, 5000);
  };
  const handleGetRooms = (allRooms) => {
    setRooms(allRooms);
  };
  const handlePlaylist = (songs, artist, playerIds) => {
    setPlaylist(songs);
    setArtist(artist);
    updateSong(true);
    const newPlayers = playerIds.map((id) => ({
      id,
      score: 0,
    }));
    setPlayers(newPlayers);
  };
  useEffect(() => {
    socket.on('showCorrectAnswer', handleCorrectAnswer);

    return () => {
      socket.off('showCorrectAnswer', handleCorrectAnswer);
    };
  }, [players]);

  useEffect(() => {
    // as soon as the component is mounted, do the following tasks:
    // subscribe to socket events
    socket.on('showCorrectAnswer', handleCorrectAnswer);
    socket.on('nextSong', nextSong);
    socket.on('allRooms', handleGetRooms);
    socket.on('playlist', handlePlaylist);

    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
      socket.off('nextSong', nextSong);
      socket.off('allRooms', handleGetRooms);
      socket.off('playlist', handlePlaylist);
    };
  }, []);

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

  const createRoom = (_search) => {
    socket.emit('joinRoom', _search ?? search);
    setCurrRoom(_search ?? search);
  };
  const joinRoom = (room) => {
    socket.emit('joinRoom', room);
    setCurrRoom(room);
  };
  const nextSong = async () => {
    setLoading(true);
    updateSong();
  };
  const getSongs = async (_search) => {
    setLoading(true);

    const response = await fetch(
      `http://localhost:1338/api/${_search ?? search}`
    );
    const data = await response.json();
    const filteredSongs = data.songs.filter((song) => Boolean(song.url));
    if (filteredSongs.length === 0) {
      alert(`no songs found for ${data.artist.name}`);
      setLoading(false);
      return;
    }
    socket.emit('getSongs', filteredSongs, data.artist, currRoom);
  };
  const checkGuess = async (_guess) => {
    const correctSong = trimString(playlist[currSong].name);
    const songGuess = _guess ?? guess;
    if (songGuess.toLowerCase() === correctSong.toLowerCase())
      socket.emit('correctAnswer', currRoom);
    else if (guess === '') alert("You didn't even try!");
    else alert('Wrong, try again');
  };
  const startOver = (quizType) => {
    quizType && setType(quizType);
    setPlaylist([]);
    setGuess('');
    setSearch('');
    setArtist(null);
    setVerse('');
  };

  const showSnackbar = () => {
    setOpen(true);
  };

  const hideSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  return (
    <Container>
      <div className={styles.container}>
        <main className={styles.main}>
          <div style={{ display: 'flex' }}>
            <Link href='/'>
              <Button style={{ margin: '0 1rem' }} variant={'text'}>
                Local
              </Button>
            </Link>
            <Button
              style={{ margin: '0 1rem' }}
              variant={'contained'}
              onClick={() => startOver('song')}
            >
              Multiplayer
            </Button>
          </div>
          {!currRoom ? (
            <>
              <div>
                {Object.keys(rooms).map((roomName, ind) => (
                  <Button key={ind} onClick={() => joinRoom(roomName)}>
                    {roomName}
                  </Button>
                ))}
              </div>
              <Search
                placeholder='Enter room name'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && createRoom(e.target.value)
                }
                onClick={() => createRoom()}
                buttonText='Create'
              />
            </>
          ) : (
            <>
              <Typography
                sx={{ display: 'flex', justifyContent: 'center' }}
                component='div'
                variant='h5'
              >
                {`room-name: ${currRoom} user-id: ${socket.id}`}
              </Typography>
              <Search
                placeholder='Enter the Name of an Artist'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && getSongs(e.target.value)}
                onClick={() => getSongs()}
                buttonText='Search'
              />
              <div className={styles.scoreBoard}>
                {players.map((player, i) => (
                  <div key={i}>
                    <h1>{player.score}</h1>
                  </div>
                ))}
              </div>
            </>
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
                </div>
              </>
            )}
          </>
          <Snackbar open={open} autoHideDuration={60000} onClose={hideSnackbar}>
            <Alert
              onClose={hideSnackbar}
              severity={severity}
              sx={{ width: '100%' }}
            >
              {alertMsg}
            </Alert>
          </Snackbar>
        </main>
      </div>
    </Container>
  );
}
