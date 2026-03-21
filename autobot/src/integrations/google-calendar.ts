import { google } from 'googleapis';
import { 
  GOOGLE_CLIENT_ID, 
  GOOGLE_CLIENT_SECRET, 
  GOOGLE_REDIRECT_URI,
  BETTER_AUTH_URL,
} from '../config.js';
import { logger } from '../shared/logger.js';
import * as settingsRepo from '../db/settings-repo.js';
import crypto from 'node:crypto';

const OAuth2Client = google.auth.OAuth2;
type OAuth2ClientType = InstanceType<typeof OAuth2Client>;

interface CalendarTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

// Encryption setup
const ENCRYPTION_KEY = process.env.CALENDAR_ENCRYPTION_KEY || '';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('CALENDAR_ENCRYPTION_KEY not configured');
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('CALENDAR_ENCRYPTION_KEY not configured');
  }
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted token format');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Store tokens per tenant (encrypted in database, cached in memory)
const tokenStore = new Map<string, CalendarTokens>();

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
];

function getOAuthClient(): OAuth2ClientType {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google Calendar credentials not configured');
  }

  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `${BETTER_AUTH_URL}/api/calendar/callback`
  );
}

export function getAuthUrl(tenantId: string): string {
  const oauth2Client = getOAuthClient();
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: tenantId,
    prompt: 'consent', // Always show consent to get refresh token
  });

  return url;
}

export async function exchangeCode(tenantId: string, code: string): Promise<void> {
  const oauth2Client = getOAuthClient();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    const tokenData: CalendarTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
    };

    // Store tokens in memory
    tokenStore.set(tenantId, tokenData);
    
    // Encrypt and store in database for persistence
    const encryptedTokens = encrypt(JSON.stringify(tokenData));
    await settingsRepo.setSetting(tenantId, 'google_calendar_tokens', encryptedTokens);
    
    logger.info({ tenantId }, 'Google Calendar connected successfully');
  } catch (error) {
    logger.error({ error, tenantId }, 'Failed to exchange OAuth code');
    throw error;
  }
}

export async function getCalendarClient(tenantId: string): Promise<CalendarClient | null> {
  // Try memory first
  let tokens = tokenStore.get(tenantId);

  // Fallback to database
  if (!tokens) {
    const stored = await settingsRepo.getSetting(tenantId, 'google_calendar_tokens');
    if (stored) {
      try {
        const decrypted = decrypt(stored);
        tokens = JSON.parse(decrypted);
        if (tokens) {
          tokenStore.set(tenantId, tokens);
        }
      } catch (error) {
        logger.error({ error, tenantId }, 'Failed to decrypt calendar tokens');
        return null;
      }
    }
  }

  if (!tokens) {
    return null;
  }

  // Check if token needs refresh
  if (tokens.expiry_date < Date.now() + 60000) {
    try {
      tokens = await refreshTokens(tenantId, tokens);
    } catch {
      return null;
    }
  }

  return new CalendarClient(tokens);
}

async function refreshTokens(tenantId: string, tokens: CalendarTokens): Promise<CalendarTokens> {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    const newTokens: CalendarTokens = {
      access_token: credentials.access_token!,
      refresh_token: credentials.refresh_token || tokens.refresh_token,
      expiry_date: credentials.expiry_date!,
    };

    tokenStore.set(tenantId, newTokens);
    const encryptedTokens = encrypt(JSON.stringify(newTokens));
    await settingsRepo.setSetting(tenantId, 'google_calendar_tokens', encryptedTokens);

    return newTokens;
  } catch (error) {
    logger.error({ error, tenantId }, 'Failed to refresh calendar tokens');
    throw error;
  }
}

export async function disconnectCalendar(tenantId: string): Promise<void> {
  const tokens = tokenStore.get(tenantId);
  
  if (tokens) {
    // Revoke token
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ access_token: tokens.access_token });
    try {
      await oauth2Client.revokeCredentials();
    } catch (error) {
      logger.warn({ error, tenantId }, 'Failed to revoke calendar token');
    }
  }

  tokenStore.delete(tenantId);
  await settingsRepo.deleteSetting(tenantId, 'google_calendar_tokens');
  
  logger.info({ tenantId }, 'Google Calendar disconnected');
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  link: string;
}

export class CalendarClient {
  private calendar;
  private oauth2Client;

  constructor(tokens: CalendarTokens) {
    this.oauth2Client = getOAuthClient();
    this.oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  async getCalendarInfo(): Promise<{ email: string }> {
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    return { email: userInfo.data.email || '' };
  }

  async getUpcomingEvents(days: number = 7, maxResults: number = 50): Promise<CalendarEvent[]> {
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + days);

    const response = await this.calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return (response.data.items || []).map((event) => ({
      id: event.id || '',
      title: event.summary || '(Sin título)',
      start: new Date(event.start?.dateTime || event.start?.date || ''),
      end: new Date(event.end?.dateTime || event.end?.date || ''),
      description: event.description || undefined,
      location: event.location || undefined,
      link: event.htmlLink || '',
    }));
  }

  async createEvent(params: {
    title: string;
    startTime: Date;
    endTime: Date;
    description?: string;
    attendeeEmail?: string;
    location?: string;
  }): Promise<CalendarEvent> {
    const event: any = {
      summary: params.title,
      description: params.description,
      location: params.location,
      start: {
        dateTime: params.startTime.toISOString(),
        timeZone: 'America/Lima',
      },
      end: {
        dateTime: params.endTime.toISOString(),
        timeZone: 'America/Lima',
      },
    };

    if (params.attendeeEmail) {
      event.attendees = [{ email: params.attendeeEmail }];
    }

    const response = await this.calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return {
      id: response.data.id || '',
      title: response.data.summary || '',
      start: new Date(response.data.start?.dateTime || ''),
      end: new Date(response.data.end?.dateTime || ''),
      description: response.data.description || undefined,
      location: response.data.location || undefined,
      link: response.data.htmlLink || '',
    };
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  }
}

// Legacy exports for compatibility
export async function getCalendarEvents(
  _tenantId: string,
  _timeMin: string,
  _timeMax: string,
): Promise<{ id: string; summary: string; start: string; end: string; description?: string }[]> {
  return [];
}
