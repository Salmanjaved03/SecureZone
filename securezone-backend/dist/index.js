"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `${uniqueSuffix}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only .jpg, .jpeg, and .png files are allowed!'));
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
// Serve static files from the uploads directory
app.use('/uploads', express_1.default.static('uploads'));
// Middleware to check user role
const checkRole = (roles) => {
    return async (req, res, next) => {
        const { adminEmail } = req.body;
        if (!adminEmail) {
            console.log('checkRole: adminEmail is missing');
            res.status(400).json({ message: 'Admin email is required' });
            return;
        }
        const user = await prisma.user.findUnique({ where: { email: adminEmail } });
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
// Middleware to check if user exists (for voting and profile updates)
const checkUser = () => {
    return async (req, res, next) => {
        const { userEmail } = req.body;
        if (!userEmail) {
            console.log('checkUser: userEmail is missing');
            res.status(400).json({ message: 'User email is required' });
            return;
        }
        const user = await prisma.user.findUnique({ where: { email: userEmail } });
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
// Login endpoint
const loginHandler = async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
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
const signupHandler = async (req, res) => {
    const { email, password, username } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        res.status(400).json({ message: 'Email already exists' });
        return;
    }
    const user = await prisma.user.create({
        data: { email, password, username: username.toLowerCase(), role: 'NORMAL' },
    });
    res.status(201).json({ message: 'Signup successful', user });
};
app.post('/api/signup', signupHandler);
// Profile endpoint
const profileHandler = async (req, res) => {
    const { email } = req.params;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.json({ message: `Profile for ${user.username}`, user });
};
app.get('/api/profile/:email', profileHandler);
// Update profile endpoint
const updateProfileHandler = async (req, res) => {
    const { email } = req.params;
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
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
    const updatedData = {};
    if (username)
        updatedData.username = username.toLowerCase();
    if (password)
        updatedData.password = password;
    const updatedUser = await prisma.user.update({
        where: { email },
        data: updatedData,
    });
    res.json({ message: 'Profile updated successfully', user: updatedUser });
};
app.put('/api/profile/:email', updateProfileHandler);
// Admin dashboard endpoint
const adminDashboardHandler = async (req, res) => {
    const { adminEmail } = req.body;
    const user = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.json({ message: 'Admin dashboard accessed successfully', user });
};
app.post('/api/admin-dashboard', checkRole(['ADMIN']), adminDashboardHandler);
// Ban user endpoint
const banUserHandler = async (req, res) => {
    const { username } = req.body;
    const userToBan = await prisma.user.findFirst({
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
const deleteUserHandler = async (req, res) => {
    const { username } = req.body;
    const userToDelete = await prisma.user.findFirst({
        where: { username: username.toLowerCase() },
    });
    if (!userToDelete) {
        console.log(`deleteUser: User not found: username=${username}`);
        res.status(404).json({ message: 'User not found' });
        return;
    }
    if (userToDelete.role === 'ADMIN') {
        res.status(403).json({ message: 'Cannot delete an admin' });
        return;
    }
    await prisma.incidentReport.deleteMany({ where: { userId: userToDelete.id } });
    await prisma.user.delete({ where: { id: userToDelete.id } });
    res.json({ message: `User ${username} has been deleted` });
};
app.delete('/api/admin/delete-user', checkRole(['ADMIN']), deleteUserHandler);
// Promote user to moderator endpoint
const promoteToModeratorHandler = async (req, res) => {
    const { username } = req.body;
    const userToPromote = await prisma.user.findFirst({
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
const deleteReportHandler = async (req, res) => {
    const { reportId } = req.params;
    console.log(`deleteReport: reportId=${reportId}`);
    const report = await prisma.incidentReport.findUnique({ where: { id: reportId } });
    if (!report) {
        console.log(`deleteReport: Report not found: reportId=${reportId}`);
        res.status(404).json({ message: 'Report not found' });
        return;
    }
    await prisma.incidentReport.delete({ where: { id: reportId } });
    res.json({ message: 'Report deleted successfully' });
};
app.delete('/api/reports/:reportId', checkRole(['ADMIN', 'MODERATOR']), deleteReportHandler);
// Flag report as false information endpoint
const flagReportHandler = async (req, res) => {
    const { reportId } = req.params;
    console.log(`flagReport: reportId=${reportId}`);
    const report = await prisma.incidentReport.findUnique({ where: { id: reportId } });
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
// Upvote report endpoint
const upvoteReportHandler = async (req, res) => {
    const { reportId } = req.params;
    const { userEmail } = req.body;
    const user = req.user; // From checkUser middleware
    if (!user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    console.log(`upvoteReport: reportId=${reportId}, userEmail=${userEmail}`);
    const report = await prisma.incidentReport.findUnique({ where: { id: reportId } });
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
    let updatedReport;
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
        }
        else if (existingVote.voteType === 'DOWNVOTE') {
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
        }
        else {
            // This should not happen unless voteType is invalid
            res.status(400).json({ message: 'Invalid vote type' });
            return;
        }
    }
    else {
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
// Downvote report endpoint
const downvoteReportHandler = async (req, res) => {
    const { reportId } = req.params;
    const { userEmail } = req.body;
    const user = req.user; // From checkUser middleware
    if (!user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    console.log(`downvoteReport: reportId=${reportId}, userEmail=${userEmail}`);
    const report = await prisma.incidentReport.findUnique({ where: { id: reportId } });
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
    let updatedReport;
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
        }
        else if (existingVote.voteType === 'UPVOTE') {
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
        }
        else {
            // This should not happen unless voteType is invalid
            res.status(400).json({ message: 'Invalid vote type' });
            return;
        }
    }
    else {
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
const moderatorReportsHandler = async (req, res) => {
    const { adminEmail } = req.body;
    const user = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.json({ message: 'Moderator reports accessed successfully', user });
};
app.post('/api/moderator-reports', checkRole(['MODERATOR']), moderatorReportsHandler);
// Create incident report endpoint with image upload
const createReportHandler = async (req, res) => {
    try {
        const { title, description, location, userId, isAnonymous } = req.body;
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
                isAnonymous: isAnonymous === 'true' || isAnonymous === true,
            },
        });
        res.status(201).json({ message: 'Incident report created successfully', report });
    }
    catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ message: 'Failed to create incident report', error: error.message });
    }
};
app.post('/api/reports', upload.single('image'), createReportHandler);
// Fetch all incident reports endpoint
const getReportsHandler = async (req, res) => {
    const { userEmail } = req.query;
    if (!userEmail || typeof userEmail !== 'string') {
        res.status(400).json({ message: 'User email is required' });
        return;
    }
    const requestingUser = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!requestingUser) {
        res.status(404).json({ message: 'Requesting user not found' });
        return;
    }
    // Explicitly type the reports to include the user relation
    const reports = await prisma.incidentReport.findMany({
        include: { user: true },
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
