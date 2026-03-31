/**
 * Notification Service
 * 
 * Handles delivery of briefings via email, in-app notifications,
 * and other channels. Manages notification preferences and scheduling.
 */

import {
  BriefingStatus,
  type Briefing,
  type BriefingSettings,
  AlertSeverity,
} from '@/types/briefing'

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/**
 * Generate email template for briefing
 */
export function generateBriefingEmail(briefing: Briefing, userName: string): EmailTemplate {
  const criticalCount = briefing.summary.criticalAlerts
  const highCount = briefing.summary.highAlerts
  const totalAlerts = briefing.summary.totalAlerts

  // Dynamic subject line based on urgency
  let subject = `Your Morning Briefing - ${new Date(briefing.date).toLocaleDateString()}`
  if (criticalCount > 0) {
    subject = `🚨 ${criticalCount} Critical Alert${criticalCount > 1 ? 's' : ''} - Morning Briefing`
  } else if (highCount > 0) {
    subject = `⚠️ ${highCount} Important Update${highCount > 1 ? 's' : ''} - Morning Briefing`
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Morning Briefing</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
    .stats { display: flex; gap: 20px; margin-bottom: 30px; }
    .stat-box { flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .alert { padding: 15px; border-radius: 8px; margin-bottom: 15px; }
    .alert-critical { background: #fee; border-left: 4px solid #dc3545; }
    .alert-high { background: #fff3cd; border-left: 4px solid #ffc107; }
    .alert-medium { background: #d1ecf1; border-left: 4px solid #17a2b8; }
    .alert-low { background: #d4edda; border-left: 4px solid #28a745; }
    .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; padding: 30px; color: #666; font-size: 12px; }
    .trend-up { color: #28a745; }
    .trend-down { color: #dc3545; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>☀️ Good Morning, ${userName}</h1>
      <p>Here's what's happening with your social media today</p>
    </div>
    
    <div class="content">
      <div class="stats">
        <div class="stat-box">
          <div class="stat-number">${totalAlerts}</div>
          <div class="stat-label">New Alerts</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${briefing.summary.trendingHashtags}</div>
          <div class="stat-label">Trending</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${briefing.competitorActivity.length}</div>
          <div class="stat-label">Competitor Posts</div>
        </div>
      </div>

      ${briefing.insights.length > 0 ? `
      <h2 style="margin-top: 0;">💡 Key Insights</h2>
      <ul>
        ${briefing.insights.map(insight => `<li>${insight}</li>`).join('')}
      </ul>
      ` : ''}

      ${briefing.alerts.filter(a => !a.isRead && a.severity !== AlertSeverity.LOW).length > 0 ? `
      <h2>🚨 Priority Alerts</h2>
      ${briefing.alerts
        .filter(a => !a.isRead && a.severity !== AlertSeverity.LOW)
        .slice(0, 5)
        .map(alert => `
          <div class="alert alert-${alert.severity}">
            <strong>${alert.title}</strong>
            <p style="margin: 5px 0 0;">${alert.description}</p>
            ${alert.changePercent > 0 
              ? `<span class="trend-up">↑ ${alert.changePercent.toFixed(1)}%</span>`
              : `<span class="trend-down">↓ ${Math.abs(alert.changePercent).toFixed(1)}%</span>`
            }
          </div>
        `).join('')}
      ` : ''}

      ${briefing.recommendations.length > 0 ? `
      <h2>🎯 Recommendations</h2>
      <ol>
        ${briefing.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ol>
      ` : ''}

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/briefing?id=${briefing.id}" class="btn">
        View Full Briefing
      </a>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you subscribed to Morning Briefings.</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/briefing">Manage preferences</a> •
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()

  // Plain text version
  const text = `
Good Morning, ${userName}!

Your Morning Briefing - ${new Date(briefing.date).toLocaleDateString()}

📊 SUMMARY
- ${totalAlerts} new alerts
- ${briefing.summary.trendingHashtags} trending hashtags
- ${briefing.competitorActivity.length} competitor posts

${briefing.insights.length > 0 ? `
💡 KEY INSIGHTS
${briefing.insights.map(i => `• ${i}`).join('\n')}
` : ''}

${briefing.alerts.filter(a => !a.isRead && a.severity !== AlertSeverity.LOW).length > 0 ? `
🚨 PRIORITY ALERTS
${briefing.alerts
  .filter(a => !a.isRead && a.severity !== AlertSeverity.LOW)
  .slice(0, 5)
  .map(a => `• ${a.title}: ${a.description}`).join('\n')}
` : ''}

View full briefing: ${process.env.NEXT_PUBLIC_APP_URL}/briefing?id=${briefing.id}

---
Manage preferences: ${process.env.NEXT_PUBLIC_APP_URL}/settings/briefing
  `.trim()

  return { subject, html, text }
}

// ============================================================================
// NOTIFICATION DELIVERY
// ============================================================================

interface NotificationResult {
  success: boolean
  channel: 'email' | 'push' | 'in-app'
  error?: string
  sentAt?: Date
}

/**
 * Send briefing via email
 */
export async function sendBriefingEmail(
  briefing: Briefing,
  userEmail: string,
  userName: string
): Promise<NotificationResult> {
  try {
    const template = generateBriefingEmail(briefing, userName)
    
    // In production, integrate with your email service (SendGrid, AWS SES, etc.)
    // Example:
    // await sendgrid.send({
    //   to: userEmail,
    //   from: 'briefings@realbuzzer.com',
    //   subject: template.subject,
    //   html: template.html,
    //   text: template.text,
    // })
    
    console.log(`[EMAIL] Would send briefing ${briefing.id} to ${userEmail}`)
    console.log(`[EMAIL] Subject: ${template.subject}`)
    
    return {
      success: true,
      channel: 'email',
      sentAt: new Date(),
    }
  } catch (error) {
    console.error('Failed to send briefing email:', error)
    return {
      success: false,
      channel: 'email',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send push notification for critical alerts
 */
export async function sendPushNotification(
  briefing: Briefing,
  deviceTokens: string[]
): Promise<NotificationResult> {
  try {
    const criticalAlerts = briefing.alerts.filter(
      a => a.severity === AlertSeverity.CRITICAL && !a.isRead
    )
    
    if (criticalAlerts.length === 0) {
      return {
        success: true,
        channel: 'push',
      }
    }

    // In production, integrate with Firebase Cloud Messaging or similar
    // Example:
    // await admin.messaging().sendMulticast({
    //   tokens: deviceTokens,
    //   notification: {
    //     title: `🚨 ${criticalAlerts.length} Critical Alert(s)`,
    //     body: criticalAlerts[0].title,
    //   },
    // })
    
    console.log(`[PUSH] Would send ${criticalAlerts.length} critical alerts to ${deviceTokens.length} devices`)
    
    return {
      success: true,
      channel: 'push',
      sentAt: new Date(),
    }
  } catch (error) {
    console.error('Failed to send push notification:', error)
    return {
      success: false,
      channel: 'push',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create in-app notifications
 */
export async function createInAppNotifications(
  briefing: Briefing,
  userId: string
): Promise<NotificationResult> {
  try {
    const unreadAlerts = briefing.alerts.filter(a => !a.isRead)
    
    // In production, save to database for in-app notification center
    // Example:
    // await prisma.notification.createMany({
    //   data: unreadAlerts.map(alert => ({
    //     userId,
    //     type: alert.type,
    //     title: alert.title,
    //     message: alert.description,
    //     data: alert.data,
    //     read: false,
    //   })),
    // })
    
    console.log(`[IN-APP] Created ${unreadAlerts.length} notifications for user ${userId}`)
    
    return {
      success: true,
      channel: 'in-app',
      sentAt: new Date(),
    }
  } catch (error) {
    console.error('Failed to create in-app notifications:', error)
    return {
      success: false,
      channel: 'in-app',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// DELIVERY ORCHESTRATION
// ============================================================================

interface DeliveryOptions {
  email?: boolean
  push?: boolean
  inApp?: boolean
}

interface DeliveryResult {
  briefingId: string
  results: NotificationResult[]
  deliveredAt: Date
  channelsUsed: string[]
}

/**
 * Deliver briefing through all configured channels
 */
export async function deliverBriefing(
  briefing: Briefing,
  settings: BriefingSettings,
  userEmail: string,
  userName: string,
  deviceTokens: string[] = [],
  userId: string
): Promise<DeliveryResult> {
  const results: NotificationResult[] = []
  const channelsUsed: string[] = []

  // Email delivery
  if (settings.emailDelivery) {
    const emailResult = await sendBriefingEmail(briefing, userEmail, userName)
    results.push(emailResult)
    if (emailResult.success) {
      channelsUsed.push('email')
    }
  }

  // Push notifications (only for critical alerts)
  if (settings.inAppNotifications && deviceTokens.length > 0) {
    const pushResult = await sendPushNotification(briefing, deviceTokens)
    results.push(pushResult)
    if (pushResult.success) {
      channelsUsed.push('push')
    }
  }

  // In-app notifications
  if (settings.inAppNotifications) {
    const inAppResult = await createInAppNotifications(briefing, userId)
    results.push(inAppResult)
    if (inAppResult.success) {
      channelsUsed.push('in-app')
    }
  }

  const deliveredAt = new Date()

  return {
    briefingId: briefing.id,
    results,
    deliveredAt,
    channelsUsed,
  }
}

// ============================================================================
// SCHEDULING
// ============================================================================

/**
 * Calculate next briefing delivery time based on settings
 */
export function getNextDeliveryTime(settings: BriefingSettings): Date {
  const now = new Date()
  const [hours, minutes] = settings.deliveryTime.split(':').map(Number)
  
  const nextDelivery = new Date(now)
  nextDelivery.setHours(hours, minutes, 0, 0)
  
  // If the time has passed today, schedule for tomorrow
  if (nextDelivery <= now) {
    nextDelivery.setDate(nextDelivery.getDate() + 1)
  }
  
  return nextDelivery
}

/**
 * Check if it's time to deliver briefings
 */
export function shouldDeliverBriefings(settings: BriefingSettings[]): BriefingSettings[] {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  return settings.filter(setting => {
    if (!setting.isEnabled) return false
    
    const [hours, minutes] = setting.deliveryTime.split(':').map(Number)
    
    // Simple check - more sophisticated scheduling would use a job queue
    return currentHour === hours && currentMinute === minutes
  })
}
