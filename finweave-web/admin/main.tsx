import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { AdminApp } from './AdminApp';
import '../src/design/tokens.css';
import '../src/design/base.css';
import './admin.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><AdminApp /></BrowserRouter></React.StrictMode>);
