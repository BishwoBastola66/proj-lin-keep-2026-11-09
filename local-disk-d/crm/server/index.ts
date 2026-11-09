import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import express from 'express';
import cors from 'cors';

import dashboardRoutes from './routes/dashboard';
import facilitiesRoutes from './routes/facilities';
import tasksRoutes from './routes/tasks';
import emailRoutes from './routes/email';
import interactionsRoutes from './routes/interactions';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/interactions', interactionsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

import { startImapListener } from './imapListener';

app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`Express API server running on port ${PORT}`);
  // Start listening for incoming emails via IMAP
  startImapListener();
});
