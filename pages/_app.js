import React from 'react';
import Head from 'next/head';
import socketio from 'socket.io-client';
import '../styles/globals.css';

export const socket = socketio.connect(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL);
export const SocketContext = React.createContext();

function MyApp({ Component, pageProps }) {
  console.log(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL);
  console.log(process.env.NEXT_PUBLIC_SERVER_URL);
  return (
    <SocketContext.Provider value={socket}>
      <Head>
        <link rel='shortcut icon' href='#' />
      </Head>
      <Component {...pageProps} />
    </SocketContext.Provider>
  );
}

export default MyApp;
