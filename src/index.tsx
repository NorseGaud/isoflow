// This is an entry point for running the app in dev mode.
import React from 'react';
import ReactDOM from 'react-dom/client';
import GlobalStyles from '@mui/material/GlobalStyles';
import { ThemeProvider, createTheme } from '@mui/material';
import { App } from './app/App';
import { themeConfig } from './styles/theme';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <GlobalStyles
      styles={{
        '*, *::before, *::after': {
          boxSizing: 'border-box'
        },
        html: {
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        },
        body: {
          margin: 0,
          width: '100%',
          maxWidth: '100%',
          height: '100%',
          overflow: 'hidden'
        },
        '#root': {
          width: '100%',
          maxWidth: '100%',
          height: '100%',
          minWidth: 0,
          overflow: 'hidden'
        }
      }}
    />
    <ThemeProvider theme={createTheme({ ...themeConfig, palette: {} })}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
