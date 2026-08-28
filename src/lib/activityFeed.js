import { supabase } from '@/lib/supabase';

export const logActivityEvent = async ({ event_type, summary, payload = {}, user_id = null }) => {
  try {
    const { error } = await supabase.from('admin_activity_feed').insert({
      event_type,
      summary,
      payload,
      user_id,
    });
    if (error) throw error;
  } catch (error) {
    console.warn('Activity feed logging failed:', error?.message || error);
  }
};
