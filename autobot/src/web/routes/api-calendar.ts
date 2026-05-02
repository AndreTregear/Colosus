import { Router } from 'express';
import { requireTenantAuth } from '../middleware/tenant-auth.js';
import { requireMobileOrDeviceAuth } from '../middleware/mobile-auth.js';
import { getTenantId } from '../../shared/validate.js';
import {
  getAuthUrl,
  exchangeCode,
  getCalendarClient,
  disconnectCalendar,
} from '../../integrations/google-calendar.js';
import { GOOGLE_CLIENT_ID } from '../../config.js';
import { logger } from '../../shared/logger.js';

const router = Router();

/**
 * GET /api/calendar/connect
 * Generate OAuth2 authorization URL for the tenant to connect Google Calendar.
 * Web API endpoint.
 */
router.get('/connect', requireTenantAuth, (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    res.status(400).json({ error: 'Google Calendar integration is not configured.' });
    return;
  }
  const url = getAuthUrl(req.tenantId!);
  res.json({ url });
});

/**
 * GET /api/calendar/callback
 * OAuth2 callback — exchanges the authorization code for tokens.
 */
router.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  const tenantId = req.query.state as string;

  if (!code || !tenantId) {
    res.status(400).json({ error: 'Missing code or state parameter.' });
    return;
  }

  try {
    await exchangeCode(tenantId, code);
    res.send('<html><body><h2>Google Calendar connected successfully!</h2><p>You can close this window.</p></body></html>');
  } catch (err) {
    logger.error({ tenantId, err }, 'Google Calendar OAuth callback failed');
    res.status(500).send('<html><body><h2>Failed to connect Google Calendar</h2><p>Please try again.</p></body></html>');
  }
});

// ══════════════════════════════════════════════
// Mobile API Routes (under /api/v1/mobile/calendar)
// ══════════════════════════════════════════════

const mobileRouter = Router();
mobileRouter.use(requireMobileOrDeviceAuth);

/**
 * GET /api/v1/mobile/calendar/auth-url
 */
mobileRouter.get('/auth-url', async (req, res) => {
  const tenantId = getTenantId(req);
  
  if (!GOOGLE_CLIENT_ID) {
    res.status(400).json({ error: 'Google Calendar not configured' });
    return;
  }

  try {
    const url = getAuthUrl(tenantId);
    res.json({ authUrl: url });
  } catch (error) {
    logger.error({ error, tenantId }, 'Failed to generate calendar auth URL');
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

/**
 * POST /api/v1/mobile/calendar/callback
 */
mobileRouter.post('/callback', async (req, res) => {
  const tenantId = getTenantId(req);
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Authorization code is required' });
    return;
  }

  try {
    await exchangeCode(tenantId, code);
    res.json({ success: true, connected: true });
  } catch (error) {
    logger.error({ error, tenantId }, 'Failed to exchange calendar auth code');
    res.status(400).json({ success: false, error: 'Failed to connect calendar' });
  }
});

/**
 * GET /api/v1/mobile/calendar/status
 */
mobileRouter.get('/status', async (req, res) => {
  const tenantId = getTenantId(req);

  try {
    const client = await getCalendarClient(tenantId);
    if (!client) {
      res.json({ connected: false });
      return;
    }

    const info = await client.getCalendarInfo();
    res.json({ connected: true, email: info.email });
  } catch {
    res.json({ connected: false });
  }
});

/**
 * POST /api/v1/mobile/calendar/disconnect
 */
mobileRouter.post('/disconnect', async (req, res) => {
  const tenantId = getTenantId(req);

  try {
    await disconnectCalendar(tenantId);
    res.json({ success: true });
  } catch (error) {
    logger.error({ error, tenantId }, 'Failed to disconnect calendar');
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

/**
 * GET /api/v1/mobile/calendar/events
 */
mobileRouter.get('/events', async (req, res) => {
  const tenantId = getTenantId(req);
  const days = Math.min(Number(req.query.days) || 7, 30);
  const maxResults = Math.min(Number(req.query.maxResults) || 50, 100);

  try {
    const client = await getCalendarClient(tenantId);
    if (!client) {
      res.status(400).json({ error: 'Calendar not connected' });
      return;
    }

    const events = await client.getUpcomingEvents(days, maxResults);
    res.json({ events });
  } catch (error) {
    logger.error({ error, tenantId }, 'Failed to fetch calendar events');
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * POST /api/v1/mobile/calendar/sync-appointment
 */
mobileRouter.post('/sync-appointment', async (req, res) => {
  const tenantId = getTenantId(req);
  const { title, startTime, endTime, description, customerEmail, location } = req.body;

  if (!title || !startTime || !endTime) {
    res.status(400).json({ error: 'title, startTime, and endTime are required' });
    return;
  }

  try {
    const client = await getCalendarClient(tenantId);
    if (!client) {
      res.status(400).json({ error: 'Calendar not connected' });
      return;
    }

    const event = await client.createEvent({
      title,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      description,
      attendeeEmail: customerEmail,
      location,
    });

    res.json({ success: true, eventId: event.id, eventLink: event.link });
  } catch (error) {
    logger.error({ error, tenantId }, 'Failed to sync appointment');
    res.status(500).json({ error: 'Failed to sync appointment' });
  }
});

/**
 * DELETE /api/v1/mobile/calendar/events/:eventId
 */
mobileRouter.delete('/events/:eventId', async (req, res) => {
  const tenantId = getTenantId(req);
  const { eventId } = req.params;

  try {
    const client = await getCalendarClient(tenantId);
    if (!client) {
      res.status(400).json({ error: 'Calendar not connected' });
      return;
    }

    await client.deleteEvent(eventId);
    res.json({ success: true });
  } catch (error) {
    logger.error({ error, tenantId, eventId }, 'Failed to delete calendar event');
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export { router as calendarRouter, mobileRouter as calendarMobileRouter };
