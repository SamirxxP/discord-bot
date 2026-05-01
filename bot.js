require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const OpenAI = require('openai');

const CANAL_PERMITIDO = '1499466916228628601';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const memoria = new Map();

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  console.log(`✅ Respondiendo solo en el canal ${CANAL_PERMITIDO}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Solo responde en este canal
  if (message.channel.id !== CANAL_PERMITIDO) return;

  const pregunta = message.content.trim();

  if (!pregunta) return;

  const canalId = message.channel.id;

  if (!memoria.has(canalId)) {
    memoria.set(canalId, [
      {
        role: 'system',
        content: 'Eres un asistente creado por Samir. Responde en español, claro, útil y breve. Recuerda el contexto reciente de la conversación.'
      }
    ]);
  }

  const historial = memoria.get(canalId);

  historial.push({
    role: 'user',
    content: pregunta
  });

  try {
    await message.channel.sendTyping();

    const response = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: historial
    });

    const respuesta = response.choices[0].message.content || 'No pude generar respuesta.';

    historial.push({
      role: 'assistant',
      content: respuesta
    });

    // Mantiene memoria corta
    if (historial.length > 11) {
      historial.splice(1, historial.length - 11);
    }

    await message.reply(respuesta);

  } catch (error) {
    console.error(error.response?.data || error.message || error);
    message.reply('❌ Error con OpenRouter');
  }
});

client.login(process.env.DISCORD_TOKEN);