import styles from '../styles/Home.module.css';
import {
  Button,
  TextField,
  CardMedia,
  CardContent,
  Typography,
} from '@mui/material';

export default function SongQuiz({
  artist,
  onTimeUpdate,
  audioRef,
  currentSong
}) {
  return (
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
            <source src={currentSong.url} type='audio/mpeg' />
          </audio>
        </div>
      </div>
    </div>
  );
}
