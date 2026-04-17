import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import db from './src/server/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'xinghe_default_secret_key_2026';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // --- SQLite Auth Logic ---
  app.post('/api/auth/register', async (req, res) => {
    const { username, password, name, className, category, intro, memberCode } = req.body;
    
    // Check member registration code from env
    const expectedCode = process.env.MEMBER_REGISTRATION_CODE || 'XINGHE2026';
    if (memberCode !== expectedCode) {
      return res.status(401).json({ success: false, error: 'Invalid member registration code (会员号错误)' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = Date.now().toString();
      const insert = db.prepare('INSERT INTO users (id, username, password, name, className, category, intro) VALUES (?, ?, ?, ?, ?, ?, ?)');
      insert.run(id, username, hashedPassword, name, className, category || 'core', intro || '');
      
      // Initialize presence
      db.prepare('INSERT INTO presence (userId, status) VALUES (?, ?)').run(id, 'offline');
      
      res.json({ success: true });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ success: false, error: 'Username already exists or invalid data' });
    }
  });

  app.get('/api/members', (req, res) => {
    try {
      const users = db.prepare('SELECT id, username, name, className, avatar, category, intro FROM users').all() as any[];
      res.json(users);
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch members' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
      if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ 
        success: true, 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          className: user.className, 
          avatar: user.avatar,
          category: user.category,
          intro: user.intro
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  });

  // --- Socket.io Presence Logic ---
  const activeUsers = new Map<string, string>(); // socketId -> userId

  io.on('connection', (socket) => {
    socket.on('auth:init', (userId) => {
      if (!userId) return;
      activeUsers.set(socket.id, userId);
      db.prepare('UPDATE presence SET status = ?, lastSeen = CURRENT_TIMESTAMP WHERE userId = ?').run('online', userId);
      io.emit('presence:update', getOnlineUsers());
    });

    socket.on('disconnect', () => {
      const userId = activeUsers.get(socket.id);
      if (userId) {
        activeUsers.delete(socket.id);
        // If user has no more active sockets, mark offline
        const stillConnected = Array.from(activeUsers.values()).includes(userId);
        if (!stillConnected) {
          db.prepare('UPDATE presence SET status = ?, lastSeen = CURRENT_TIMESTAMP WHERE userId = ?').run('offline', userId);
        }
        io.emit('presence:update', getOnlineUsers());
      }
    });
  });

  function getOnlineUsers() {
    try {
      const rows = db.prepare("SELECT userId FROM presence WHERE status = 'online'").all() as any[];
      return rows.map(r => r.userId);
    } catch (err) {
      console.error('Error fetching online users:', err);
      return [];
    }
  }

  app.get('/api/presence', (req, res) => {
    res.json(getOnlineUsers());
  });

  // --- Email Logic ---
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  app.post('/api/notify', async (req, res) => {
    const { type, data } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || 'aqxytwxsh@163.com';

    let subject = '';
    let text = '';

    if (type === 'recruitment') {
      subject = `[星河协会] 新的招新报名：${data.name}`;
      text = `
        新的招新报名信息：
        姓名：${data.name}
        学号：${data.studentId}
        专业班级：${data.majorClass}
        联系电话：${data.phone}
        个人简介：${data.intro}
        提交时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
      `;
    } else if (type === 'message') {
      subject = `[星河协会] 新的联系留言：${data.subject}`;
      text = `
        新的联系留言信息：
        姓名：${data.name}
        电子邮箱：${data.email}
        主题：${data.subject}
        内容：${data.content}
        提交时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
      `;
    }

    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials not configured. Skipping email send.');
        return res.json({ success: true, message: 'Email skipped (not configured)' });
      }

      await transporter.sendMail({
        from: `"星河协会通知" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        replyTo: type === 'message' ? data.email : undefined,
        subject: subject,
        text: text,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to send email:', error);
      res.status(500).json({ success: false, error: 'Failed to send email notification' });
    }
  });

  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
