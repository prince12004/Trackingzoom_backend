import { ActivityLog } from '../models/ActivityLog';

interface LogInput {
  adminId: string;
  action: string;
  module: string;
  recordId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string;
}

export async function logActivity(input: LogInput) {
  return ActivityLog.create({
    admin: input.adminId,
    action: input.action,
    module: input.module,
    recordId: input.recordId,
    oldValue: input.oldValue,
    newValue: input.newValue,
    ip: input.ip,
  });
}
