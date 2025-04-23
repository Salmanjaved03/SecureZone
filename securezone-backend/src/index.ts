import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient, User, IncidentReport, Comment, Tag } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Extend Express Request type directly in this file
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const app = express();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
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

// Configure CORS to allow multiple origins
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Define a custom RequestHandler type that allows async handlers
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Middleware to check user role
const checkRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { adminEmail } = req.body;
    if (!adminEmail) {
      console.log('checkRole: adminEmail is missing');
      res.status(400).json({ message: 'Admin email is required' });
      return;
    }

    const user: User | null = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!user) {
      console.log(`checkRole: Admin user not found for email=${adminEmail}`);
      res.status(404).json({ message: 'Admin user not found' });
      return;
    }

    console.log(`checkRole: adminEmail=${adminEmail}, user.role=${user.role}`);
    if (!roles.includes(user.role.toUpperCase())) {
      console.log(`checkRole: Access denied for role=${user.role}, expected=${roles}`);
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    next();
  };
};

// Middleware to check if user exists (for voting, commenting, and profile updates)
const checkUser = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { userEmail } = req.body;
    if (!userEmail) {
      console.log('checkUser: userEmail is missing');
      res.status(400).json({ message: 'User email is required' });
      return;
    }

    const user: User | null = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      console.log(`checkUser: User not found for email=${userEmail}`);
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.isBanned) {
      console.log(`checkUser: User is banned, email=${userEmail}`);
      res.status(403).json({ message: 'Your account has been banned' });
      return;
    }

    req.user = user; // Attach user to the request
    next();
  };
};

// Middleware to check if user is report owner or has role
const checkReportOwnerOrRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { userEmail } = req.body;
    const { reportId } = req.params;

    if (!userEmail) {
      console.log('checkReportOwnerOrRole: userEmail is missing');
      res.status(400).json({ message: 'User email is required' });
      return;
    }

    const user: User | null = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      console.log(`checkReportOwnerOrRole: User not found for email=${userEmail}`);
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.isBanned) {
      console.log(`checkReportOwnerOrRole: User is banned, email=${userEmail}`);
      res.status(403).json({ message: 'Your account has been banned' });
      return;
    }

    const report: IncidentReport | null = await prisma.incidentReport.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      console.log(`checkReportOwnerOrRole: Report not found: reportId=${reportId}`);
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    const isOwner = report.userId === user.id;
    const hasRole = roles.includes(user.role.toUpperCase());

    if (!isOwner && !hasRole) {
      console.log(`checkReportOwnerOrRole: Access denied for userId=${user.id}, role=${user.role}`);
      res.status(403).json({ message: 'Access denied: You are not the owner or authorized' });
      return;
    }

    req.user = user;
    next();
  };
};

// Login endpoint
const loginHandler: AsyncRequestHandler = async (req, res) => {
  const { email, password } = req.body;
  const user: User | null = await prisma.user.findUnique({ where: { email } });

  if (!user || user.password !== password) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  if (user.isBanned) {
    res.status(403).json({ message: 'Your account has been banned' });
    return;
  }

  res.json({ message: 'Login successful', user });
};
app.post('/api/login', loginHandler);

// Signup endpoint
const signupHandler: AsyncRequestHandler = async (req, res) => {
  const { email, password, username } = req.body;

  const existingUser: User | null = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(400).json({ message: 'Email already exists' });
    return;
  }

  const user: User = await prisma.user.create({
    data: { email, password, username: username.toLowerCase(), role: 'NORMAL' },
  });

  res.status(201).json({ message: 'Signup successful', user });
};
app.post('/api/signup', signupHandler);

// Profile endpoint
const profileHandler: AsyncRequestHandler = async (req, res) => {
  const { email } = req.params;
  const user: User | null = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ message: `Profile for ${user.username}`, user });
};
app.get('/api/profile/:email', profileHandler);

// Update profile endpoint
const updateProfileHandler: AsyncRequestHandler = async (req, res) => {
  const { email } = req.params;
  const { username, password } = req.body;

  const user: User | null = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (user.isBanned) {
    res.status(403).json({ message: 'Your account has been banned' });
    return;
  }

  // Check if the new username is unique (if changed)
  if (username && username.toLowerCase() !== user.username.toLowerCase()) {
    const existingUserWithUsername = await prisma.user.findFirst({
      where: { username: username.toLowerCase() },
    });
    if (existingUserWithUsername) {
      res.status(400).json({ message: 'Username already taken' });
      return;
    }
  }

  // Update user data
  const updatedData: { username?: string; password?: string } = {};
  if (username) updatedData.username = username.toLowerCase();
  if (password) updatedData.password = password;

  const updatedUser = await prisma.user.update({
    where: { email },
    data: updatedData,
  });

  res.json({ message: 'Profile updated successfully', user: updatedUser });
};
app.put('/api/profile/:email', updateProfileHandler);

// Admin dashboard endpoint
const adminDashboardHandler: AsyncRequestHandler = async (req, res) => {
  const { adminEmail } = req.body;
  const user: User | null = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ message: 'Admin dashboard accessed successfully', user });
};
app.post('/api/admin-dashboard', checkRole(['ADMIN']), adminDashboardHandler);

// Ban user endpoint
const banUserHandler: AsyncRequestHandler = async (req, res) => {
  const { username } = req.body;
  const userToBan: User | null = await prisma.user.findFirst({
    where: { username: username.toLowerCase() },
  });

  if (!userToBan) {
    console.log(`banUser: User not found: username=${username}`);
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (userToBan.role === 'ADMIN') {
    res.status(403).json({ message: 'Cannot ban an admin' });
    return;
  }

  await prisma.user.update({
    where: { id: userToBan.id },
    data: { isBanned: true },
  });

  res.json({ message: `User ${username} has been banned` });
};
app.post('/api/admin/ban-user', checkRole(['ADMIN']), banUserHandler);

// Delete user endpoint
const deleteUserHandler: AsyncRequestHandler = async (req, res) => {
  const { username } = req.body;
  console.log(`deleteUser: Attempting to delete username=${username}`);
  const userToDelete: User | null = await prisma.user.findFirst({
    where: { username: username.toLowerCase() },
  });

  if (!userToDelete) {
    console.log(`deleteUser: User not found: username=${username}`);
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (userToDelete.role === 'ADMIN') {
    console.log(`deleteUser: Cannot delete admin: username=${username}`);
    res.status(403).json({ message: 'Cannot delete an admin' });
    return;
  }

  await prisma.user.delete({ where: { id: userToDelete.id } });
  console.log(`deleteUser: Successfully deleted username=${username}`);

  res.json({ message: `User ${username} has been deleted` });
};
app.delete('/api/admin/delete-user', checkRole(['ADMIN']), deleteUserHandler);

// Promote user to moderator endpoint
const promoteToModeratorHandler: AsyncRequestHandler = async (req, res) => {
  const { username } = req.body;
  const userToPromote: User | null = await prisma.user.findFirst({
    where: { username: username.toLowerCase() },
  });

  if (!userToPromote) {
    console.log(`promoteToModerator: User not found: username=${username}`);
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (userToPromote.role === 'ADMIN') {
    res.status(403).json({ message: 'Cannot change admin role' });
    return;
  }

  await prisma.user.update({
    where: { id: userToPromote.id },
    data: { role: 'MODERATOR' },
  });

  res.json({ message: `User ${username} has been promoted to moderator` });
};
app.post('/api/admin/promote-to-moderator', checkRole(['ADMIN']), promoteToModeratorHandler);

// Delete report endpoint
const deleteReportHandler: AsyncRequestHandler = async (req, res) => {
  const { reportId } = req.params;
  console.log(`deleteReport: Attempting to delete reportId=${reportId}`);
  const report: IncidentReport | null = await prisma.incidentReport.findUnique({ where: { id: reportId } });
  if (!report) {
    console.log(`deleteReport: Report not found: reportId=${reportId}`);
    res.status(404).json({ message: 'Report not found' });
    return;
  }

  await prisma.incidentReport.delete({ where: { id: reportId } });
  console.log(`deleteReport: Successfully deleted reportId=${reportId}`);

  res.json({ message: 'Report deleted successfully' });
};
app.delete('/api/reports/:reportId', checkRole(['ADMIN', 'MODERATOR']), deleteReportHandler);

// Flag report as false information endpoint
const flagReportHandler: AsyncRequestHandler = async (req, res) => {
  const { reportId } = req.params;
  console.log(`flagReport: Attempting to flag reportId=${reportId}`);
  const report: IncidentReport | null = await prisma.incidentReport.findUnique({ where: { id: reportId } });
  if (!report) {
    console.log(`flagReport: Report not found: reportId=${reportId}`);
    res.status(404).json({ message: 'Report not found' });
    return;
  }

  await prisma.incidentReport.update({
    where: { id: reportId },
    data: { isFlagged: true },
  });

  res.json({ message: 'Report flagged as false information' });
};
app.put('/api/reports/:reportId/flag', checkRole(['ADMIN', 'MODERATOR']), flagReportHandler);

// Create comment endpoint
const createCommentHandler: AsyncRequestHandler = async (req, res) => {
  const { reportId } = req.params;
  const { userEmail, content } = req.body;
  const user: User | undefined = req.user; // From checkUser middleware

  if (!user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    console.log(`createComment: Invalid content for reportId=${reportId}, userEmail=${userEmail}`);
    res.status(400).json({ message: 'Comment content is required' });
    return;
  }

  console.log(`createComment: Creating comment for reportId=${reportId}, userEmail=${userEmail}`);

  const report: IncidentReport | null = await prisma.incidentReport.findUnique({ where: { id: reportId } });
  if (!report) {
    console.log(`createComment: Report not found: reportId=${reportId}`);
    res.status(404).json({ message: 'Report not found' });
    return;
  }

  const comment: Comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      userId: user.id,
      reportId,
    },
    include: { user: true },
  });

  res.status(201).json({ message: 'Comment created successfully', comment });
};
app.post('/api/reports/:reportId/comments', checkUser(), createCommentHandler);

// Fetch comments endpoint
const getCommentsHandler: AsyncRequestHandler = async (req, res) => {
  const { reportId } = req.params;

  const report: IncidentReport | null = await prisma.incidentReport.findUnique({ where: { id: reportId } });
  if (!report) {
    console.log(`getComments: Report not found: reportId=${reportId}`);
    res.status(404).json({ message: 'Report not found' });
    return;
  }

  const comments: (Comment & { user: User })[] = await prisma.comment.findMany({
    where: { reportId },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });

  const transformedComments = comments.map(comment => ({
    ...comment,
    user: {
      id: comment.user.id,
      username: comment.user.username,
    },
  }));

  res.json({ comments: transformedComments });
};
app.get('/api/reports/:reportId/comments', getCommentsHandler);

// Upvote report endpoint
const upvoteReportHandler: AsyncRequestHandler = async (req, res) => {
  const { reportId } = req.params;
  const { userEmail } = req.body;
  const user: User | undefined = req.user; // From checkUser middleware

  if (!user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  console.log(`upvoteReport: reportId=${reportId}, userEmail=${userEmail}`);

  const report: IncidentReport | null = await prisma.incidentReport.findUnique({ where: { id: reportId } });
  if (!report) {
    console.log(`upvoteReport: Report not found: reportId=${reportId}`);
    res.status(404).json({ message: 'Report not found' });
    return;
  }

  const existingVote = await prisma.vote.findUnique({
    where: {
      userId_reportId: { userId: user.id, reportId },
    },
  });

  let updatedReport: IncidentReport & { user: User };
  if (existingVote) {
    if (existingVote.voteType === 'UPVOTE') {
      // User already upvoted, remove the vote
      await prisma.vote.delete({
        where: { id: existingVote.id },
      });
      updatedReport = await prisma.incidentReport.update({
        where: { id: reportId },
        data: { upvotes: { decrement: 1 } },
        include: { user: true },
      });
      res.json({ message: 'Upvote removed', report: updatedReport });
    } else if (existingVote.voteType === 'DOWNVOTE') {
      // User previously downvoted, switch to upvote
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { voteType: 'UPVOTE' },
      });
      updatedReport = await prisma.incidentReport.update({
        where: { id: reportId },
        data: {
          upvotes: { increment: 1 },
          downvotes: { decrement: 1 },
        },
        include: { user: true },
      });
      res.json({ message: 'Changed to upvote', report: updatedReport });
    } else {
      // This should not happen unless voteType is invalid
      res.status(400).json({ message: 'Invalid vote type' });
      return;
    }
  } else {
    // New upvote
    await prisma.vote.create({
      data: {
        userId: user.id,
        reportId,
        voteType: 'UPVOTE',
      },
    });
    updatedReport = await prisma.incidentReport.update({
      where: { id: reportId },
      data: { upvotes: { increment: 1 } },
      include: { user: true },
    });
    res.json({ message: 'Report upvoted', report: updatedReport });
  }
};
app.post('/api/reports/:reportId/upvote', checkUser(), upvoteReportHandler);

interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; username: string; password: string; role: string; isBanned: boolean };
}

const checkAuthenticated: express.RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userEmail } = req.query.userEmail ? req.query : req.body;
    if (!userEmail) {
      res.status(401).json({ message: 'User email is required' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    req.user = user;
    next(); // No return needed
  } catch (error) {
    console.error('Error in checkAuthenticated:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Downvote report endpoint
const downvoteReportHandler: AsyncRequestHandler = async (req, res) => {
  const { reportId } = req.params;
  const { userEmail } = req.body;
  const user: User | undefined = req.user; // From checkUser middleware

  if (!user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  console.log(`downvoteReport: reportId=${reportId}, userEmail=${userEmail}`);

  const report: IncidentReport | null = await prisma.incidentReport.findUnique({ where: { id: reportId } });
  if (!report) {
    console.log(`downvoteReport: Report not found: reportId=${reportId}`);
    res.status(404).json({ message: 'Report not found' });
    return;
  }

  const existingVote = await prisma.vote.findUnique({
    where: {
      userId_reportId: { userId: user.id, reportId },
    },
  });

  let updatedReport: IncidentReport & { user: User };
  if (existingVote) {
    if (existingVote.voteType === 'DOWNVOTE') {
      // User already downvoted, remove the vote
      await prisma.vote.delete({
        where: { id: existingVote.id },
      });
      updatedReport = await prisma.incidentReport.update({
        where: { id: reportId },
        data: { downvotes: { decrement: 1 } },
        include: { user: true },
      });
      res.json({ message: 'Downvote removed', report: updatedReport });
    } else if (existingVote.voteType === 'UPVOTE') {
      // User previously upvoted, switch to downvote
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { voteType: 'DOWNVOTE' },
      });
      updatedReport = await prisma.incidentReport.update({
        where: { id: reportId },
        data: {
          upvotes: { decrement: 1 },
          downvotes: { increment: 1 },
        },
        include: { user: true },
      });
      res.json({ message: 'Changed to downvote', report: updatedReport });
    } else {
      // This should not happen unless voteType is invalid
      res.status(400).json({ message: 'Invalid vote type' });
      return;
    }
  } else {
    // New downvote
    await prisma.vote.create({
      data: {
        userId: user.id,
        reportId,
        voteType: 'DOWNVOTE',
      },
    });
    updatedReport = await prisma.incidentReport.update({
      where: { id: reportId },
      data: { downvotes: { increment: 1 } },
      include: { user: true },
    });
    res.json({ message: 'Report downvoted', report: updatedReport });
  }
};
app.post('/api/reports/:reportId/downvote', checkUser(), downvoteReportHandler);

// Moderator reports endpoint
const moderatorReportsHandler: AsyncRequestHandler = async (req, res) => {
  const { adminEmail } = req.body;
  const user: User | null = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ message: 'Moderator reports accessed successfully', user });
};
app.post('/api/moderator-reports', checkRole(['MODERATOR']), moderatorReportsHandler);

// Create incident report endpoint with image upload
const createReportHandler: AsyncRequestHandler = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    const { title, description, location, userId, isAnonymous, tags } = req.body;

    if (!title || !description || !location || !userId) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const user: User | null = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    // Parse tags (handle both array and comma-separated string)
    let tagsArray: string[] = [];
    if (tags) {
      if (Array.isArray(tags)) {
        tagsArray = tags.map(tag => tag.trim()).filter(tag => tag);
      } else if (typeof tags === 'string') {
        tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    // Create the incident report
    const report: IncidentReport = await prisma.incidentReport.create({
      data: {
        title,
        description,
        location,
        userId,
        imageUrl,
        isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      },
    });

    // Create tags and link to the report
    if (tagsArray.length > 0) {
      await prisma.tag.createMany({
        data: tagsArray.map(tag => ({
          name: tag,
          incidentReportId: report.id,
        })),
      });
    }

    // Fetch the report with tags and user for the response
    const reportWithTags = await prisma.incidentReport.findUnique({
      where: { id: report.id },
      include: { user: true, tags: true },
    });

    res.status(201).json({ message: 'Incident report created successfully', report: reportWithTags });
  } catch (error: any) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Failed to create incident report', error: error.message });
  }
};
app.post('/api/reports', upload.single('image'), createReportHandler);

// Fetch all incident reports endpoint
const getReportsHandler: AsyncRequestHandler = async (req, res) => {
  const { userEmail } = req.query;

  if (!userEmail || typeof userEmail !== 'string') {
    res.status(400).json({ message: 'User email is required' });
    return;
  }

  const requestingUser: User | null = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!requestingUser) {
    res.status(404).json({ message: 'Requesting user not found' });
    return;
  }

  // Fetch reports with user and tags
  const reports: (IncidentReport & { user: User, tags: Tag[] })[] = await prisma.incidentReport.findMany({
    include: { user: true, tags: true },
    orderBy: { createdAt: 'desc' },
  });

  const transformedReports = reports.map(report => {
    const isPrivilegedUser = requestingUser.role === 'ADMIN' || requestingUser.role === 'MODERATOR';
    const displayUsername = report.isAnonymous && !isPrivilegedUser ? 'Anonymous' : report.user.username;

    return {
      ...report,
      user: {
        ...report.user,
        username: displayUsername,
      },
    };
  });

  res.json({ reports: transformedReports });
};
app.get('/api/reports', getReportsHandler);

// Update report tags endpoint
const updateReportTagsHandler: AsyncRequestHandler = async (req, res) => {
  const { reportId } = req.params;
  const { tags, userEmail } = req.body;

  console.log(`updateReportTags: reportId=${reportId}, userEmail=${userEmail}`);

  const report: IncidentReport | null = await prisma.incidentReport.findUnique({
    where: { id: reportId },
    include: { tags: true },
  });
  if (!report) {
    console.log(`updateReportTags: Report not found: reportId=${reportId}`);
    res.status(404).json({ message: 'Report not found' });
    return;
  }

  // Parse tags (handle both array and comma-separated string)
  let tagsArray: string[] = [];
  if (tags) {
    if (Array.isArray(tags)) {
      tagsArray = tags.map(tag => tag.trim()).filter(tag => tag);
    } else if (typeof tags === 'string') {
      tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
  }

  try {
    // Delete existing tags
    await prisma.tag.deleteMany({
      where: { incidentReportId: reportId },
    });

    // Create new tags
    if (tagsArray.length > 0) {
      await prisma.tag.createMany({
        data: tagsArray.map(tag => ({
          name: tag,
          incidentReportId: reportId,
        })),
      });
    }

    // Fetch updated report with tags and user
    const updatedReport = await prisma.incidentReport.findUnique({
      where: { id: reportId },
      include: { user: true, tags: true },
    });

    res.json({ message: 'Tags updated successfully', report: updatedReport });
  } catch (error: any) {
    console.error('Error updating tags:', error);
    res.status(500).json({ message: 'Failed to update tags', error: error.message });
  }
};

const searchReportsHandler: express.RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { query, userEmail } = req.query;
    if (!userEmail) {
      res.status(401).json({ message: 'User email is required' });
      return;
    }
    if (!query || typeof query !== 'string') {
      res.status(400).json({ message: 'Query parameter is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: userEmail as string } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const reports = await prisma.incidentReport.findMany({
      where: {
        OR: [
          { title: { contains: (query as string).toLowerCase() } },
          { location: { contains: (query as string).toLowerCase() } },
          { tags: { some: { name: { contains: (query as string).toLowerCase() } } } },
        ],
      },
      include: {
        user: true,
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedReports = reports.map((report) => ({
      ...report,
      user: {
        ...report.user,
        username:
          report.isAnonymous && user.role !== 'ADMIN' && user.role !== 'MODERATOR'
            ? 'Anonymous'
            : report.user.username,
      },
    }));

    res.status(200).json({ reports: formattedReports });
  } catch (error) {
    console.error('Error searching reports:', error);
    res.status(500).json({ message: 'Failed to search reports' });
  }
};
app.get('/api/reports/search', checkAuthenticated, searchReportsHandler);

app.put('/api/reports/:reportId/tags', checkReportOwnerOrRole(['ADMIN', 'MODERATOR']), updateReportTagsHandler);

app.get('/api/test', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is running' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});