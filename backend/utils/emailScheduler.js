/**
  emailScheduler.js
 
  Système de notifications automatiques par email.
  Vérifie toutes les minutes les sessions de révision prévues
  et envoie un email personnalisé à chaque utilisateur concerné.Chaque utilisateur reçoit l'email à l'heure exacte de sa sessionsur son propre email d'inscription.
 */

  const cron = require('node-cron');
  const nodemailer = require('nodemailer');
  const mongoose = require('mongoose');
  
  // Import des modèles (lazy — évite les circular deps)
  let Schedule, User;
  
  function getModels() {
    if (!Schedule) Schedule = require('../models/Schedule');
    if (!User)     User     = require('../models/User');
  }
  
  // Créer le transporteur Gmail
  function createTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  
  // Vérifier si l'email est configuré
  function isEmailConfigured() {
    return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS &&
      process.env.EMAIL_USER !== 'tonmail@gmail.com' &&
      process.env.EMAIL_PASS !== 'xxxx xxxx xxxx xxxx');
  }
  
  /**
   * Convertit "18:00" en { hour: 18, minute: 0 }
   */
  function parseTime(timeStr) {
    const parts = timeStr.trim().split(':');
    return { hour: parseInt(parts[0]), minute: parseInt(parts[1]) };
  }
  
  /**
   * Extrait l'heure de début d'une plage horaire comme "18:00 - 19:30"
   */
  function extractStartTime(timeRange) {
    const start = timeRange.split('-')[0].trim();
    return parseTime(start);
  }
  const path = require('path');
  
  /**
   * Retourne le nom du jour actuel en français
   */
  function getTodayFr() {
    const days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    return days[new Date().getDay()];
  }
  
  /**
   * Template HTML de l'email de rappel
   */
  function buildEmailHTML(userName, session, allTodaySessions) {
    const typeConfig = {
      revision: { label: 'Révision', icon: '📖', color: '#6366f1' },
      quiz:     { label: 'Quiz',     icon: '🧠', color: '#06b6d4' },
      lecture:  { label: 'Lecture',  icon: '📚', color: '#10b981' },
    };
    const cfg = typeConfig[session.type] || typeConfig.revision;
  
    // Liste de toutes les sessions du jour pour contexte
    const otherSessions = allTodaySessions.filter(s => s.time !== session.time);
    const otherHtml = otherSessions.length > 0
      ? `<p style="color:#64748b;font-size:13px;margin-top:14px;margin-bottom:6px;">
          <strong>Autres sessions aujourd'hui :</strong>
         </p>
         <ul style="margin:0;padding-left:20px;">
           ${otherSessions.map(s => `<li style="color:#64748b;font-size:13px;margin-bottom:3px;">${s.time} — ${s.subject}</li>`).join('')}
         </ul>`
      : '';
  
    return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="font-family:'Segoe UI',Arial,sans-serif;background:#f0f4ff;margin:0;padding:20px;">
    <div style="max-width:580px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(99,102,241,0.12);">
  
      <!-- Header gradient -->
                  <div style="background:linear-gradient(135deg,#6366f1,#06b6d4);padding:28px 32px;text-align:center;">
                <img
        src="cid:studyai-logo"
        alt="StudyAI logo"
        style="
          width:70px;
          height:70px;
          border-radius:12px;
          object-fit:contain;
          background-color:transparent;
          padding:4px;
        "
      />   
              <h1 style="color:white;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;">StudyAI</h1>
        <p style="color:rgba(255,255,255,0.82);margin:5px 0 0;font-size:13px;">Assistant Intelligent de Révision</p>
      </div>
  
      <!-- Body -->
      <div style="padding:28px 32px;">
  
        <h2 style="color:#1e293b;font-size:19px;font-weight:700;margin-bottom:5px;">
          ⏰ C'est l'heure de réviser, ${userName} !
        </h2>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:22px;">
          Ta session de révision commence <strong style="color:#6366f1">maintenant</strong>. C'est le moment de te concentrer ! 💪
        </p>
  
        <!-- Session card -->
        <div style="background:#f8f9ff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:20px;border-left:4px solid ${cfg.color};">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <span style="font-size:28px;">${cfg.icon}</span>
            <div>
              <p style="margin:0;font-size:16px;font-weight:700;color:#1e293b;">${session.subject}</p>
              <span style="display:inline-block;padding:2px 10px;border-radius:20px;background:${cfg.color}18;color:${cfg.color};font-size:12px;font-weight:600;">${cfg.label}</span>
            </div>
          </div>
          <div style="display:flex;gap:20px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:16px;">🕐</span>
              <span style="font-size:14px;color:#64748b;">${session.time}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:16px;">⏱️</span>
              <span style="font-size:14px;color:#64748b;">${session.duration} minutes</span>
            </div>
          </div>
          ${session.tip ? `<div style="margin-top:12px;padding:10px 12px;background:white;border-radius:8px;border:1px solid #e2e8f0;">
            <p style="margin:0;font-size:13px;color:#64748b;">💡 ${session.tip}</p>
          </div>` : ''}
        </div>
  
        ${otherHtml}
  
        <!-- CTA button -->
        <div style="text-align:center;margin-top:24px;">
          <a href="http://localhost:3000" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#818cf8);color:white;text-decoration:none;padding:13px 30px;border-radius:12px;font-weight:700;font-size:14px;box-shadow:0 4px 14px rgba(99,102,241,0.3);">
            📚 Ouvrir StudyAI
          </a>
        </div>
      </div>
  
      <!-- Footer -->
      <div style="background:#f8f9ff;padding:18px 32px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.5;">
          StudyAI · Assistant Intelligent de Révision Académique · Maroc 🇲🇦<br>
          <small>Notification automatique — ${new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' })}</small>
        </p>
      </div>
    </div>
  </body>
  </html>`;
  }
  
  /**
   * Envoie un email de rappel à un utilisateur pour une session
   */
  
  async function sendReminderEmail(userEmail, userName, session, allTodaySessions) {
    try {
      const transporter = createTransporter();
      const cfg = { revision:'📖 Révision', quiz:'🧠 Quiz', lecture:'📚 Lecture' };
      const typeLabel = cfg[session.type] || '📖 Révision';
  
      await transporter.sendMail({
        from: `"StudyAI 🎓" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `⏰ ${typeLabel} — ${session.subject} commence maintenant !`,
        html: buildEmailHTML(userName, session, allTodaySessions),
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../public/logo.png'),
            cid: 'studyai-logo'
          }
        ]
      });
  
      console.log(`📧 Email envoyé à ${userEmail} — Session: ${session.subject} (${session.time})`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur email à ${userEmail}:`, error.message);
      return false;
    }
  }
  
  /**
   * Logique principale — exécutée toutes les minutes par le cron
   * 
   * Pour chaque utilisateur qui a un planning :
   * 1. Trouve les sessions d'aujourd'hui non complétées
   * 2. Vérifie si l'heure actuelle correspond à l'heure de début d'une session
   * 3. Si oui → envoie l'email de rappel personnalisé
   */
  async function checkAndSendReminders() {
    if (!isEmailConfigured()) return;
  
    try {
      getModels();
      const todayFr = getTodayFr();
      const now = new Date();
      const currentHour   = now.getHours();
      const currentMinute = now.getMinutes();
  
      // Récupérer SEULEMENT les plannings avec notifications activées
      const schedules = await Schedule.find({ emailNotifications: true }).populate('user', 'name email');
  
      for (const schedule of schedules) {
        if (!schedule.user || !schedule.user.email) continue;
  
        // Sessions du jour non complétées
        const todaySessions = schedule.plan.filter(s =>
          s.day === todayFr && !s.completed
        );
  
        if (todaySessions.length === 0) continue;
  
        // Vérifier chaque session si elle commence maintenant (à la minute près)
        for (const session of todaySessions) {
          try {
            const { hour, minute } = extractStartTime(session.time);
  
            if (hour === currentHour && minute === currentMinute) {
              await sendReminderEmail(
                schedule.user.email,
                schedule.user.name,
                session,
                todaySessions
              );
            }
          } catch (e) {
            console.error(`Erreur parsing heure session:`, e.message);
          }
        }
      }
    } catch (error) {
      console.error('Erreur vérification rappels:', error.message);
    }
  }
  
  /**
   * Démarre le planificateur
   * S'exécute toutes les minutes : "* * * * *"
   */
  function startEmailScheduler() {
    if (!isEmailConfigured()) {
      console.log('⚠️  Notifications email désactivées — Configure EMAIL_USER et EMAIL_PASS dans .env');
      return;
    }
  
    console.log(`✅ Planificateur email démarré — Vérification toutes les minutes`);
    console.log(`📧 Email expéditeur : ${process.env.EMAIL_USER}`);
  
    // Exécution toutes les minutes
    cron.schedule('* * * * *', () => {
      checkAndSendReminders();
    });
  }
  
  module.exports = { startEmailScheduler };
  