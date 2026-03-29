import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'aqxytwxsh@163.com';

  console.log('Notification request received:', { type, adminEmail });

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('Missing SMTP credentials in environment variables');
    return res.status(500).json({ 
      success: false, 
      error: 'SMTP credentials not configured on server' 
    });
  }

  // Email configuration
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');
  const isSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: smtpPort,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Add timeout to prevent hanging
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

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
}
