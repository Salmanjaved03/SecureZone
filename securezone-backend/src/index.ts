import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({ message: 'Login successful', user });
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { email, password, username } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  const user = await prisma.user.create({
    data: { email, password, username, role: 'NORMAL' },
  });

  res.status(201).json({ message: 'Signup successful', user });
});

// Profile endpoint
app.get('/api/profile/:email', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.params.email } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ message: `Profile for ${user.username}`, user });
});

// Admin dashboard endpoint
app.get('/api/admin-dashboard/:email', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.params.email } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json({ message: 'Admin dashboard accessed successfully' });
});

// Moderator reports endpoint
app.get('/api/moderator-reports/:email', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.params.email } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (user.role !== 'MODERATOR') {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json({ message: 'Moderator reports accessed successfully' });
});

// Create incident report endpoint
app.post('/api/reports', async (req, res) => {
  const { title, description, location, userId } = req.body;

  if (!title || !description || !location || !userId) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const report = await prisma.IncidentReport.create({
    data: { title, description, location, userId },
  });

  res.status(201).json({ message: 'Incident report created successfully', report });
});

// Fetch all incident reports endpoint
app.get('/api/reports', async (req, res) => {
  const reports = await prisma.IncidentReport.findMany({
    include: { user: true }, // Include the user who created the report
    orderBy: { createdAt: 'desc' }, // Sort by creation date (newest first)
  });

  res.json({ reports });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});