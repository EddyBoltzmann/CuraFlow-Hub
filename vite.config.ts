import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {GoogleGenAI} from '@google/genai';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'gemini-api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/gemini/chat' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });

              req.on('end', async () => {
                try {
                  const { message, history, roleContext } = JSON.parse(body);
                  const apiKey = process.env.GEMINI_API_KEY;
                  if (!apiKey) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'GEMINI_API_KEY environment variable is not configured. Please add it to system secrets.' }));
                    return;
                  }

                  const ai = new GoogleGenAI({
                    apiKey,
                    httpOptions: {
                      headers: {
                        'User-Agent': 'aistudio-build'
                      }
                    }
                  });

                  // Format conversation history for Gemini API
                  const formattedHistory = (history || []).map((msg: any) => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                  }));

                  // Prepend context guidelines
                  const systemText = `You are Cura AI, an intelligent, empathetic, and clinical-grade health dashboard assistant.
Current role of user interacting with you: ${roleContext || 'Patient'}.
Guidelines to follow:
1. Provide accurate, encouraging, and informative feedback.
2. For patients, explain medical concepts (like BMI, blood glucose levels, blood pressure trends) in simple, accessible language. Suggest natural wellness tips (sleep, hydration, light exercises). Always include a humble reminder to consult their healthcare provider for acute medical decisions.
3. For providers/doctors, assist in interpreting patient historical tracking trends, offer relevant formatting, or give administrative navigation tips with a clinical tone.
4. For admins, describe system telemetry, configuration ideas, or analytical metrics (user engagement rate, platform retention).
5. Always respond using standard Markdown with beautiful spacing, elegant lists, and subtle highlights. Avoid overwhelming walls of text. Move step-by-step. Keep responses concise and focused.`;

                  const response = await ai.models.generateContent({
                    model: 'gemini-3.5-flash',
                    contents: [
                      { role: 'user', parts: [{ text: systemText }] },
                      ...formattedHistory,
                      { role: 'user', parts: [{ text: message }] }
                    ]
                  });

                  // Property extraction
                  const textContent = response.text || "I apologize, I could not synthesize a health analysis. Please try rephrasing your wellness question.";

                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ text: textContent }));
                } catch (error: any) {
                  console.error('Gemini SDK Error:', error);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: error.message || 'An error occurred while talking with Cura AI.' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
