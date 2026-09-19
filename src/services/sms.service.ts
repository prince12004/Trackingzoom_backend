import { env } from '../config/env';

interface SendSmsInput {
  mobile: string;
  message: string;
  otp?: string;
}

async function sendViaMsg91({ mobile, otp }: SendSmsInput): Promise<void> {
  if (!env.sms.msg91AuthKey || !env.sms.msg91TemplateId) {
    throw new Error(
      'MSG91 is not configured. Set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID in .env, or set SMS_PROVIDER=console for local dev.'
    );
  }

  const url = `https://control.msg91.com/api/v5/otp?otp=${encodeURIComponent(
    otp || ''
  )}&mobile=${encodeURIComponent(mobile)}&template_id=${encodeURIComponent(env.sms.msg91TemplateId)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authkey: env.sms.msg91AuthKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`MSG91 send failed: ${response.status} ${body}`);
  }
}

async function sendViaConsole({ mobile, message }: SendSmsInput): Promise<void> {
  console.log(`\n[sms:console] To: ${mobile}\n[sms:console] Message: ${message}\n`);
}

export async function sendSms(input: SendSmsInput): Promise<void> {
  switch (env.sms.provider) {
    case 'msg91':
      return sendViaMsg91(input);
    case 'console':
    default:
      return sendViaConsole(input);
  }
}
