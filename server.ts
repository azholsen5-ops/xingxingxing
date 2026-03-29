import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Email configuration
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // API route for email notification
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

  // Vite middleware for development
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
