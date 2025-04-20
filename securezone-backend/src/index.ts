import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';

const app = express();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only .jpg, .jpeg, and .png files are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Define a custom RequestHandler type that allows async handlers
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Login endpoint
const loginHandler: AsyncRequestHandler = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.password !== password) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  res.json({ message: 'Login successful', user });
};
app.post('/api/login', loginHandler);

// Signup endpoint
const signupHandler: AsyncRequestHandler = async (req, res) => {
  const { email, password, username } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(400).json({ message: 'Email already exists' });
    return;
  }

  const user = await prisma.user.create({
    data: { email, password, username, role: 'NORMAL' },
  });

  res.status(201).json({ message: 'Signup successful', user });
};
app.post('/api/signup', signupHandler);

// Profile endpoint
const profileHandler: AsyncRequestHandler = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.params.email } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ message: `Profile for ${user.username}`, user });
};
app.get('/api/profile/:email', profileHandler);

// Admin dashboard endpoint
const adminDashboardHandler: AsyncRequestHandler = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.params.email } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Access denied' });
    return;
  }
  res.json({ message: 'Admin dashboard accessed successfully' });
};
app.get('/api/admin-dashboard/:email', adminDashboardHandler);

// Moderator reports endpoint
const moderatorReportsHandler: AsyncRequestHandler = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.params.email } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (user.role !== 'MODERATOR') {
    res.status(403).json({ message: 'Access denied' });
    return;
  }
  res.json({ message: 'Moderator reports accessed successfully' });
};
app.get('/api/moderator-reports/:email', moderatorReportsHandler);

// Create incident report endpoint with image upload
const createReportHandler: AsyncRequestHandler = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  const { title, description, location, userId } = req.body;

  if (!title || !description || !location || !userId) {
    res.status(400).json({ message: 'All fields are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  const report = await prisma.incidentReport.create({
    data: {
      title,
      description,
      location,
      userId,
      imageUrl,
    },
  });

  res.status(201).json({ message: 'Incident report created successfully', report });
};
app.post('/api/reports', upload.single('image'), createReportHandler);

// Fetch all incident reports endpoint
const getReportsHandler: AsyncRequestHandler = async (req, res) => {
  const reports = await prisma.incidentReport.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ reports });
};
app.get('/api/reports', getReportsHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});