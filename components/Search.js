import styles from '../styles/Home.module.css';
import { Button, TextField, Card } from '@mui/material';

export default function Search({
  placeholder,
  value,
  onChange,
  onKeyDown,
  onClick,
  buttonText
}) {
  return (
    <Card className={styles.search}>
      <TextField
        id='search'
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      <Button variant='contained' id='submit' onClick={onClick}>
        {buttonText}
      </Button>
    </Card>
  );
}
