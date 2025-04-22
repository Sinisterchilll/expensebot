import axios from 'axios';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

export async function sendMessage(chatId: string, message: string) {
  try {
    console.log('Sending Telegram message:', {
      chatId,
      message
    });

    const response = await axios.post(
      `${TELEGRAM_API_URL}/sendMessage`,
      {
        chat_id: chatId,
        text: message
      }
    );

    console.log('Telegram API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    if (axios.isAxiosError(error)) {
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data
      });
    }
    throw error;
  }
}

export async function setWebhook(url: string) {
  try {
    console.log('Setting Telegram webhook:', url);
    
    // Ensure the URL is HTTPS
    if (!url.startsWith('https://')) {
      throw new Error('Webhook URL must use HTTPS');
    }

    const response = await axios.post(
      `${TELEGRAM_API_URL}/setWebhook`,
      {
        url: url,
        max_connections: 100,
        allowed_updates: ['message', 'callback_query']
      }
    );

    console.log('Webhook set response:', response.data);
    
    if (!response.data.ok) {
      throw new Error(`Failed to set webhook: ${response.data.description}`);
    }

    return response.data;
  } catch (error) {
    console.error('Error setting webhook:', error);
    if (axios.isAxiosError(error)) {
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data
      });
    }
    throw error;
  }
}

export async function getWebhookInfo() {
  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getWebhookInfo`);
    console.log('Webhook info:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting webhook info:', error);
    throw error;
  }
} 