import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as settingsRepo from '../../db/settings-repo.js';
import { getTenantId, type YayaToolContext } from './types.js';

const DAY_NAMES: Record<string, string> = {
  '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
  '4': 'Thursday', '5': 'Friday', '6': 'Saturday',
};

export const getBusinessHoursTool = createTool({
  id: 'get_business_hours',
  description: 'Get the business operating hours and check if the business is currently open. Use this when a customer asks about hours, availability, or when you need to set expectations about response times.',
  inputSchema: z.object({}),
  execute: async (_input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);

    const hoursJson = await settingsRepo.getEffectiveSetting(tenantId, 'business_hours', '');
    const timezone = await settingsRepo.getEffectiveSetting(tenantId, 'timezone', 'America/Lima');

    if (!hoursJson) {
      return JSON.stringify({
        configured: false,
        message: 'Business hours not configured. Assume available during standard hours (9am-6pm, Mon-Sat).',
        timezone,
      });
    }

    const hours = JSON.parse(hoursJson);
    const now = new Date();
    const localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const currentDay = String(localNow.getDay());
    const currentTime = `${String(localNow.getHours()).padStart(2, '0')}:${String(localNow.getMinutes()).padStart(2, '0')}`;

    const todaySchedule = hours.schedule?.[currentDay];
    const isOpenNow = todaySchedule
      ? currentTime >= todaySchedule.open && currentTime < todaySchedule.close
      : false;

    const schedule = Object.entries(hours.schedule || {}).map(([day, times]: [string, unknown]) => ({
      day: DAY_NAMES[day] || day,
      open: (times as { open: string }).open,
      close: (times as { close: string }).close,
    }));

    return JSON.stringify({
      configured: true,
      timezone,
      currentTime,
      currentDay: DAY_NAMES[currentDay],
      isOpenNow,
      todayHours: todaySchedule || null,
      weeklySchedule: schedule,
    });
  },
});
