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

function extractSessionUuid(input: string): string {
  if (!input) return '';
  let finalUuid = input;

  // 1. Double-decode to handle any URL-encoding issues immediately
  try {
    let decoded = input;
    let prev = '';
    while (decoded !== prev) {
      prev = decoded;
      decoded = decodeURIComponent(decoded);
    }
    finalUuid = decoded;
  } catch (e) {
    // Fall back to direct string on error
  }

  // 2. Extract UUID from standard URL structure if applicable
  if (finalUuid.includes('http://') || finalUuid.includes('https://') || finalUuid.includes('?')) {
    try {
      let urlObj: URL;
      if (finalUuid.startsWith('http://') || finalUuid.startsWith('https://')) {
        urlObj = new URL(finalUuid);
      } else {
        urlObj = new URL(finalUuid, 'https://dummy.domain');
      }
      finalUuid = urlObj.searchParams.get('uuid') || urlObj.searchParams.get('scene') || finalUuid;
    } catch (e) {
      const match = finalUuid.match(/[?&](uuid|scene)=([^&]+)/);
      if (match) {
        finalUuid = match[2];
      }
    }
  }
  
  if (finalUuid.includes('uuid=') || finalUuid.includes('uuid%3D')) {
    try {
      const decodedSub = decodeURIComponent(finalUuid);
      const matchSub = decodedSub.match(/[?&]?uuid=([^&]+)/) || decodedSub.match(/^uuid=([^&]+)/);
      if (matchSub) {
        finalUuid = matchSub[1];
      }
    } catch (e) {}
  }

  if (finalUuid.startsWith('uuid=')) {
    finalUuid = finalUuid.substring(5);
  } else if (finalUuid.startsWith('scene=')) {
    finalUuid = finalUuid.substring(6);
  }

  finalUuid = finalUuid.split('#')[0].split('?')[0];
  return finalUuid.trim();
}

class DbSessionsMap {
  constructor(private prefix: string) {
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS scan_sessions (
          uuid TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          user_data TEXT,
          expiresAt INTEGER NOT NULL
        );
      `);
    } catch (e) {
      console.error('Error creating scan_sessions table:', e);
    }
  }

  get(uuid: string): { status: string; user?: any } | undefined {
    try {
      if (Math.random() < 0.05) {
        db.prepare('DELETE FROM scan_sessions WHERE expiresAt < ?').run(Date.now());
      }
      const cleanUuid = extractSessionUuid(uuid);
      // Clean exact match
      let row = db.prepare('SELECT * FROM scan_sessions WHERE uuid = ?').get(cleanUuid) as any;
      
      // Fuzzy/Partial Match Fallback:
      // If no exact match is found, pull the raw alphanumeric segment (removing prefix like mp_ or qr_).
      // Check if that segment is contained within the DB's UUID, or vice versa.
      if (!row && cleanUuid && cleanUuid.length >= 6) {
        const rawSegment = cleanUuid.replace(/^(mp_|qr_)/, '');
        if (rawSegment.length >= 5) {
          row = db.prepare('SELECT * FROM scan_sessions WHERE uuid LIKE ? OR ? LIKE "%" || uuid || "%"').get(`%${rawSegment}%`, cleanUuid) as any;
        }
      }

      if (!row) return undefined;
      
      if (row.expiresAt < Date.now()) {
        try {
          db.prepare('DELETE FROM scan_sessions WHERE uuid = ?').run(row.uuid);
        } catch (delErr) {}
        return undefined;
      }
      return {
        status: row.status,
        user: row.user_data ? JSON.parse(row.user_data) : undefined
      };
    } catch (e) {
      console.error('Error reading session from DB for UUID ' + uuid + ':', e);
      return undefined;
    }
  }

  set(uuid: string, data: { status: string; user?: any }) {
    try {
      const expiresAt = Date.now() + 30 * 60 * 1000;
      const cleanUuid = extractSessionUuid(uuid);
      const user_data = data.user ? JSON.stringify(data.user) : null;
      db.prepare('INSERT OR REPLACE INTO scan_sessions (uuid, status, user_data, expiresAt) VALUES (?, ?, ?, ?)')
        .run(cleanUuid, data.status, user_data, expiresAt);
    } catch (e) {
      console.error('Error writing session to DB for UUID ' + uuid + ':', e);
    }
  }

  delete(uuid: string) {
    try {
      const cleanUuid = extractSessionUuid(uuid);
      db.prepare('DELETE FROM scan_sessions WHERE uuid = ?').run(cleanUuid);
    } catch (e) {
      console.error('Error deleting session from DB:', e);
    }
  }
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(express.json());

  // --- SQLite Auth Logic ---
  app.post('/api/auth/register', async (req, res) => {
    const { username, password, name, className, category, intro, memberCode, email } = req.body;
    
    // Check member registration code from env
    const expectedCode = process.env.MEMBER_REGISTRATION_CODE || 'XINGHE2026';
    if (memberCode !== expectedCode) {
      return res.status(401).json({ success: false, error: 'Invalid member registration code (会员号错误)' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = Date.now().toString();
      const insert = db.prepare('INSERT INTO users (id, username, password, name, className, category, intro, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      insert.run(id, username, hashedPassword, name, className, category || 'core', intro || '', email ? email.toLowerCase() : null);
      
      // Initialize presence
      db.prepare('INSERT INTO presence (userId, status) VALUES (?, ?)').run(id, 'offline');
      
      res.json({ success: true });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ success: false, error: 'Username already exists or email already registered' });
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
          avatar: user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.email || user.username)}`,
          category: user.category,
          intro: user.intro,
          email: user.email,
          wechat_openid: user.wechat_openid,
          wechat_nickname: user.wechat_nickname
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  });

  app.put('/api/auth/profile', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const { name, className, category, intro, avatar } = req.body;
      const update = db.prepare('UPDATE users SET name = ?, className = ?, category = ?, intro = ?, avatar = ? WHERE id = ?');
      update.run(name, className, category, intro, avatar, decoded.id);

      // Get updated user
      const user = db.prepare('SELECT id, username, name, className, avatar, category, intro, email, wechat_openid, wechat_nickname FROM users WHERE id = ?').get(decoded.id) as any;
      res.json({ success: true, user });
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, error: 'Invalid token or update failed' });
    }
  });

  // --- WeChat QR Authorization Sessions ---
  const qrSessions = new DbSessionsMap('qr');

  app.get('/api/auth/qr-init', (req, res) => {
    const uuid = 'qr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    qrSessions.set(uuid, { status: 'pending' });
    res.json({ uuid });
  });

  app.get('/api/auth/qr-status/:uuid', (req, res) => {
    const { uuid } = req.params;
    const cleanUuid = extractSessionUuid(uuid);
    const session = qrSessions.get(cleanUuid);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session expired' });
    }
    res.json({ success: true, status: session.status, user: session.user });
  });

  app.post('/api/auth/qr-confirm', (req, res) => {
    const { uuid, user } = req.body;
    const finalUuid = extractSessionUuid(uuid);
    let session = qrSessions.get(finalUuid);
    if (!session) {
      console.warn(`[QR Confirm Fallback] Active session not found for finalUuid: "${finalUuid}". Creating dynamic session.`);
      qrSessions.set(finalUuid, { status: 'pending' });
      session = qrSessions.get(finalUuid);
    }
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session expired or invalid' });
    }

    const isMp = finalUuid.startsWith('mp_');
    if (isMp) {
      // Create user payload and sign JWT token if it's an MP session
      const userPayload = {
        id: user.id || 'visit_' + Date.now().toString().slice(-4),
        username: user.username || `mp_user_${user.id}`,
        name: user.name,
        className: user.className || '星河小程序成员',
        avatar: user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.name)}`,
        category: user.category || 'student',
        intro: user.intro || '通过微信小程序扫码同步登录',
        email: user.email || null
      };
      
      const token = jwt.sign({ id: userPayload.id, username: userPayload.username }, JWT_SECRET, { expiresIn: '24h' });
      session.status = 'confirmed';
      session.user = { token, user: userPayload };
      
      // Update DB
      qrSessions.set(finalUuid, session);
      
      // Emit websocket events to both rooms to ensure instant synchronization
      io.to(`mp_room_${finalUuid}`).emit('mp:authenticated', { token, user: userPayload });
      io.to(`qr_room_${finalUuid}`).emit('qr:authenticated', { user: userPayload });
    } else {
      // Standard local QR session
      session.status = 'confirmed';
      session.user = user;
      qrSessions.set(finalUuid, session);
      io.to(`qr_room_${finalUuid}`).emit('qr:authenticated', { user });
    }

    res.json({ success: true });
  });

  // --- Socket.io Presence Logic ---
  const activeUsers = new Map<string, string>(); // socketId -> userId

  io.on('connection', (socket) => {
    // WeChat QR websocket subscription
    socket.on('qr:subscribe', (uuid) => {
      const cleanUuid = extractSessionUuid(uuid);
      socket.join(`qr_room_${cleanUuid}`);
    });

    // WeChat Mini Program websocket subscription
    socket.on('mp:subscribe', (uuid) => {
      const cleanUuid = extractSessionUuid(uuid);
      socket.join(`mp_room_${cleanUuid}`);
    });

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

  // --- Email Authentication Logic ---
  const emailCodes = new Map<string, { code: string; expiresAt: number }>();

  app.post('/api/auth/email-send', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // valid for 5 mins
    emailCodes.set(email.toLowerCase(), { code, expiresAt });

    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

    if (smtpConfigured) {
      try {
        await transporter.sendMail({
          from: `"星河科创网关安全盾" <${process.env.SMTP_USER}>`,
          to: email,
          subject: '[星河科创] 登录授权动态验证码',
          html: `
            <div style="font-family: sans-serif; padding: 20px; background-color: #0b0f19; color: #ffffff; border-radius: 12px; max-width: 500px; border: 1px solid #1e293b;">
              <h2 style="color: #ffb000; margin-bottom: 20px; text-align: center;">星河科创网关 · 安全登录盾</h2>
              <p style="font-size: 14px; line-height: 1.6;">您正在尝试登录星河科创系统。请在登录页面输入以下动态验证码：</p>
              <div style="background-color: rgba(255,176,0,0.1); border: 1px dashed #ffb000; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0;">
                <span style="font-size: 28px; font-weight: bold; color: #ffb000; letter-spacing: 4px;">${code}</span>
              </div>
              <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">本验证码5分钟内有效。若非本人操作，请忽略此邮件。</p>
            </div>
          `
        });
        return res.json({ success: true, message: 'Verification code sent to email.' });
      } catch (err) {
        console.error('Failed to send verification email:', err);
      }
    }

    console.log(`=============================`);
    console.log(`[EMAIL SEND SIMULATION]`);
    console.log(`Target Email: ${email}`);
    console.log(`Verification Code: ${code}`);
    console.log(`=============================`);

    return res.json({ 
      success: true, 
      simulated: true, 
      code, 
      message: `[模拟验证网关] 验证码已生成: ${code}。正式使用请在环境配置中填入 SMTP_USER 与 SMTP_PASS 变量。` 
    });
  });

  app.post('/api/auth/email-login', async (req, res) => {
    const { email, code, name, className } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and verification code are required' });
    }

    const savedRecord = emailCodes.get(email.toLowerCase());
    if (!savedRecord || savedRecord.code !== code) {
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
    }

    if (Date.now() > savedRecord.expiresAt) {
      emailCodes.delete(email.toLowerCase());
      return res.status(400).json({ success: false, error: 'Verification code expired' });
    }

    emailCodes.delete(email.toLowerCase());

    try {
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
      
      if (!user) {
        const id = Date.now().toString();
        const username = 'email_' + id.slice(-6);
        const randomPassword = Math.random().toString(36).substring(2, 10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const displayName = name || `星河居士_${id.slice(-4)}`;
        const displayClass = className || '星河访客成员';
        
        const insert = db.prepare('INSERT INTO users (id, username, password, name, className, category, intro, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        insert.run(id, username, hashedPassword, displayName, displayClass, 'student', '通过统一邮箱安全盾登录', email.toLowerCase());
        
        db.prepare('INSERT INTO presence (userId, status) VALUES (?, ?)').run(id, 'offline');
        
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ 
        success: true, 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          className: user.className, 
          avatar: user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.email || user.username)}`,
          category: user.category,
          intro: user.intro,
          email: user.email
        } 
      });
    } catch (error) {
      console.error('Email authentication user login/registration failure:', error);
      res.status(500).json({ success: false, error: 'Email authentication failed' });
    }
  });

  // --- WeChat Mini Program (MP) Bridge Login & Verification ---
  const mpSessions = new DbSessionsMap('mp');

  app.get('/api/auth/mp-init', (req, res) => {
    const uuid = 'mp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    mpSessions.set(uuid, { status: 'pending' });
    
    res.json({
      success: true,
      uuid,
      appletPath: `pages/auth/index?scene=${uuid}`,
      simulatedCode: uuid,
      message: '星河科创小程序统一网关安全盾通道已建立。扫描小程序动态码登录。'
    });
  });

  app.get('/api/auth/mp-status/:uuid', (req, res) => {
    const { uuid } = req.params;
    const cleanUuid = extractSessionUuid(uuid);
    console.log(`[MP Status Polling] Input: "${uuid}", Parsed cleanUuid: "${cleanUuid}"`);
    const session = mpSessions.get(cleanUuid);
    if (!session) {
      console.warn(`[MP Status Polling FAIL] No session found in DB for cleanUuid: "${cleanUuid}"`);
      return res.status(404).json({ success: false, error: 'Session expired or not found' });
    }
    console.log(`[MP Status Polling SUCCESS] Found session for cleanUuid: "${cleanUuid}", Status: "${session.status}"`);
    res.json({ success: true, status: session.status, user: session.user });
  });

  // Mimics or handles real WeChat Mini Program scan authorizations
  app.post('/api/auth/mp-authorize', async (req, res) => {
    const { uuid, openid, nickname, avatar, email, code } = req.body;
    if (!uuid) {
      return res.status(400).json({ success: false, error: 'Session UUID is required' });
    }
    const finalUuid = extractSessionUuid(uuid);
    console.log(`[MP Authorize] Received Request. Input uuid: "${uuid}", Parsed finalUuid: "${finalUuid}"`);
    let session = mpSessions.get(finalUuid);
    if (!session) {
      console.warn(`[MP Authorize Fallback] Session does not exist in DB for finalUuid: "${finalUuid}". Creating dynamic session.`);
      mpSessions.set(finalUuid, { status: 'pending' });
      session = mpSessions.get(finalUuid);
    }
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session expired or not found' });
    }

    try {
      let targetOpenid = openid;

      // Real WeChat jscode2session integration!
      if (code) {
        const appId = process.env.WECHAT_APP_ID;
        const appSecret = process.env.WECHAT_APP_SECRET;

        if (appId && appSecret) {
          try {
            const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
            const wxRes = await fetch(wxUrl);
            const wxData = await wxRes.json() as any;
            
            if (wxData && wxData.openid) {
              targetOpenid = wxData.openid;
              console.log(`[WeChat Real Auth] Successfully authenticated openid: ${targetOpenid}`);
            } else {
              console.error('[WeChat Real Auth Error] response from WeChat API:', wxData);
              return res.status(400).json({ 
                success: false, 
                error: `微信授权失败: ${wxData.errmsg || 'AppID或AppSecret配置错误或已过期'}` 
              });
            }
          } catch (wxErr) {
            console.error('[WeChat Real Auth Server Network Error]:', wxErr);
            return res.status(500).json({ success: false, error: '无法与微信官方服务器建立安全握手，请稍后再试' });
          }
        } else {
          console.warn('[WeChat Auth Warning] Real login code received, but WECHAT_APP_ID / WECHAT_APP_SECRET are not configured. Falling back to development simulation.');
        }
      }

      // If no openid has been resolved, fallback to mock openid
      if (!targetOpenid) {
        targetOpenid = 'mp_openid_' + Math.random().toString(36).substring(2, 8);
      }
      const targetNickname = nickname || '星河小程序成员_' + Math.random().toString(36).substring(2, 6);
      const targetAvatar = avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(targetOpenid)}`;

      // Try to find user by wechat_openid
      let user = db.prepare('SELECT * FROM users WHERE wechat_openid = ?').get(targetOpenid) as any;

      if (!user && email) {
        // If they provided an email, see if a user has this email and isn't bound to wechat yet
        const emailUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
        if (emailUser) {
          // Auto-link email user to this wechat openid!
          db.prepare('UPDATE users SET wechat_openid = ?, wechat_nickname = ? WHERE id = ?')
            .run(targetOpenid, targetNickname, emailUser.id);
          user = db.prepare('SELECT * FROM users WHERE id = ?').get(emailUser.id) as any;
        }
      }

      if (!user) {
        // Create new account
        const id = Date.now().toString();
        const username = 'mp_user_' + id.slice(-6);
        const randomPassword = Math.random().toString(36).substring(2, 10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const displayClass = '星河小程序成员';

        const insert = db.prepare('INSERT INTO users (id, username, password, name, className, category, intro, email, wechat_openid, wechat_nickname, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        insert.run(
          id, 
          username, 
          hashedPassword, 
          targetNickname, 
          displayClass, 
          'student', 
          '通过微信小程序安全桥接免密安全登录', 
          email ? email.toLowerCase() : null, 
          targetOpenid, 
          targetNickname,
          targetAvatar
        );

        db.prepare('INSERT INTO presence (userId, status) VALUES (?, ?)').run(id, 'offline');
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      const userPayload = {
        id: user.id,
        username: user.username,
        name: user.name,
        className: user.className,
        avatar: user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.wechat_openid || user.username)}`,
        category: user.category,
        intro: user.intro,
        email: user.email,
        wechat_openid: user.wechat_openid,
        wechat_nickname: user.wechat_nickname
      };

      session.status = 'confirmed';
      session.user = { token, user: userPayload };
      mpSessions.set(finalUuid, session);

      // Emit web socket - notify both rooms to ensure seamless synchronization
      io.to(`mp_room_${finalUuid}`).emit('mp:authenticated', { token, user: userPayload });
      io.to(`qr_room_${finalUuid}`).emit('qr:authenticated', { user: userPayload });

      res.json({ success: true, message: 'WeChat Mini Program QR authorization confirmed successfully.' });
    } catch (err) {
      console.error('WeChat mini program bridge auth error:', err);
      res.status(500).json({ success: false, error: 'Authorization error' });
    }
  });


  // --- Unified Account Security Center & Bindings ---
  app.post('/api/auth/bind-email-send', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email address' });
      }

      // Check if email bound to another user
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase(), decoded.id);
      if (existing) {
        return res.status(400).json({ success: false, error: '该邮箱已被其他账号绑定，请更换其他邮箱' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      emailCodes.set(`bind_${email.toLowerCase()}`, { code, expiresAt });

      const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
      if (smtpConfigured) {
        try {
          await transporter.sendMail({
            from: `"星河科创网关" <${process.env.SMTP_USER}>`,
            to: email,
            subject: '[星河科创] 账号安全中心 · 邮箱绑定动态验证码',
            html: `
              <div style="font-family: sans-serif; padding: 20px; background-color: #0b0f19; color: #ffffff; border-radius: 12px; max-width: 500px; border: 1px solid #1e293b;">
                <h2 style="color: #3b82f6; margin-bottom: 20px; text-align: center;">星河科创安全中心 · 邮箱绑定</h2>
                <p style="font-size: 14px; line-height: 1.6;">您好！您正在对您的星河系统身份卡片进行邮箱安全绑定。请输入以下动态验证码：</p>
                <div style="background-color: rgba(59,130,246,0.1); border: 1px dashed #3b82f6; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0;">
                  <span style="font-size: 28px; font-weight: bold; color: #3b82f6; letter-spacing: 4px;">${code}</span>
                </div>
                <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">验证码5分钟内有效。如非本人操作，请确认登录状态安全。</p>
              </div>
            `
          });
          return res.json({ success: true, message: 'Verification code sent.' });
        } catch (mailErr) {
          console.error('Mail error in bind:', mailErr);
        }
      }

      console.log(`=============================`);
      console.log(`[EMAIL BIND CODE SIMULATION]`);
      console.log(`Email to bind: ${email}`);
      console.log(`Verification Code: ${code}`);
      console.log(`=============================`);

      return res.json({
        success: true,
        simulated: true,
        code,
        message: `[安全盾模拟通道] 绑定验证码已生成: ${code}。可在控制台查看细节。`
      });
    } catch (err) {
      res.status(401).json({ success: false, error: 'Unauthorized profile access' });
    }
  });

  app.post('/api/auth/bind-email-confirm', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ success: false, error: 'Email and verification code are required' });
      }

      const record = emailCodes.get(`bind_${email.toLowerCase()}`);
      if (!record || record.code !== code) {
        return res.status(400).json({ success: false, error: '验证码不正确或不存在' });
      }

      if (Date.now() > record.expiresAt) {
        emailCodes.delete(`bind_${email.toLowerCase()}`);
        return res.status(400).json({ success: false, error: '验证码已过期，请重新发送' });
      }

      emailCodes.delete(`bind_${email.toLowerCase()}`);

      // Confirm not used by other user
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase(), decoded.id);
      if (existing) {
        return res.status(400).json({ success: false, error: '该邮箱已被其他账号绑定，请更换其他邮箱' });
      }

      db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email.toLowerCase(), decoded.id);

      const user = db.prepare('SELECT id, username, name, className, avatar, category, intro, email, wechat_openid, wechat_nickname FROM users WHERE id = ?').get(decoded.id) as any;
      res.json({ success: true, user });
    } catch (err) {
      res.status(401).json({ success: false, error: 'Unauthorized profile access or failed update' });
    }
  });

  app.post('/api/auth/bind-mp-confirm', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const { openid, nickname, code } = req.body;
      
      let targetOpenid = openid;

      // Real WeChat binding integration via code
      if (code) {
        const appId = process.env.WECHAT_APP_ID;
        const appSecret = process.env.WECHAT_APP_SECRET;

        if (appId && appSecret) {
          try {
            const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
            const wxRes = await fetch(wxUrl);
            const wxData = await wxRes.json() as any;
            
            if (wxData && wxData.openid) {
              targetOpenid = wxData.openid;
              console.log(`[WeChat Real Bind] Successfully verified openid: ${targetOpenid}`);
            } else {
              console.error('[WeChat Real Bind Error] response from WeChat:', wxData);
              return res.status(400).json({ 
                success: false, 
                error: `微信绑定自验证失败: ${wxData.errmsg || '配置错误'}` 
              });
            }
          } catch (wxErr) {
            console.error('[WeChat Real Bind Server Network Error]:', wxErr);
            return res.status(500).json({ success: false, error: '无法与微信服务器建立安全链接验证' });
          }
        }
      }

      if (!targetOpenid) {
        return res.status(400).json({ success: false, error: 'WeChat openid or authorization code is required' });
      }

      // Check if openid already bound to someone else
      const existing = db.prepare('SELECT id FROM users WHERE wechat_openid = ? AND id != ?').get(targetOpenid, decoded.id);
      if (existing) {
        return res.status(400).json({ success: false, error: '该微信小程序账号已绑定到其他账户，请先将其解绑' });
      }

      db.prepare('UPDATE users SET wechat_openid = ?, wechat_nickname = ? WHERE id = ?')
        .run(targetOpenid, nickname || '星河小程序成员', decoded.id);

      const user = db.prepare('SELECT id, username, name, className, avatar, category, intro, email, wechat_openid, wechat_nickname FROM users WHERE id = ?').get(decoded.id) as any;
      res.json({ success: true, user });
    } catch (err) {
      res.status(401).json({ success: false, error: 'Failed to bind WeChat Mini Program' });
    }
  });

  app.post('/api/auth/unbind-email', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      db.prepare('UPDATE users SET email = NULL WHERE id = ?').run(decoded.id);

      const user = db.prepare('SELECT id, username, name, className, avatar, category, intro, email, wechat_openid, wechat_nickname FROM users WHERE id = ?').get(decoded.id) as any;
      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Unbinding failed' });
    }
  });

  app.post('/api/auth/unbind-mp', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      db.prepare('UPDATE users SET wechat_openid = NULL, wechat_nickname = NULL WHERE id = ?').run(decoded.id);

      const user = db.prepare('SELECT id, username, name, className, avatar, category, intro, email, wechat_openid, wechat_nickname FROM users WHERE id = ?').get(decoded.id) as any;
      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Unbinding failed' });
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
