/**
 * MiMo TTS Server-Side Endpoint for SillyTavern
 *
 * Proxies TTS requests to MiMo's /v1/chat/completions endpoint
 * MiMo uses chat completions with audio output, NOT OpenAI's /v1/audio/speech
 */

import express from 'express';
import { readSecret, SECRET_KEYS } from './secrets.js';

export const router = express.Router();

const VOICE_DESIGN_PRESETS = {
    default: '请用自然的语气朗读以下文本',
    animation: '用夸张、富有表现力的动画配音风格朗读',
    podcast: '用自然、轻松的播客讲述风格朗读，语速适中',
    gentle: '用温柔、轻柔、安抚的声音朗读，语速稍慢',
    cheerful: '用阳光、开朗、充满活力的声音朗读，语速偏快',
};

/**
 * POST /generate-voice
 *
 * Body:
 *   apiHost - MiMo API base URL (e.g. https://api.xiaomimimo.com)
 *   model   - Model name (e.g. mimo-tts-01)
 *   input   - Text to synthesize
 *   voice   - Voice name (e.g. 冰糖)
 *   voice_design_mode    - "default", "animation", "podcast", "gentle", "cheerful", or "custom"
 *   voice_design_instruction - Custom instruction text (used when mode is "custom")
 */
router.post('/generate-voice', async (request, response) => {
    try {
        const {
            apiHost = 'https://api.xiaomimimo.com',
            model = 'mimo-tts-01',
            input,
            voice = '冰糖',
            voice_design_mode = 'default',
            voice_design_instruction = '',
        } = request.body;

        if (!input) {
            return response.status(400).json({ error: 'Missing required field: input' });
        }

        // Determine the voice design instruction
        let instruction = '';
        if (voice_design_mode === 'custom') {
            instruction = voice_design_instruction || VOICE_DESIGN_PRESETS.default;
        } else {
            instruction = VOICE_DESIGN_PRESETS[voice_design_mode] || VOICE_DESIGN_PRESETS.default;
        }

        // Build the messages array for MiMo's chat completions API
        const messages = [
            {
                role: 'system',
                content: `Voice Name: ${voice}\n${instruction}`,
            },
            {
                role: 'user',
                content: input,
            },
        ];

        // Read API key from secrets or request body
        let apiKey = '';
        try {
            apiKey = readSecret(request.user.directories, SECRET_KEYS.CUSTOM) || '';
        } catch {
            // Fallback to request body
        }
        if (!apiKey && request.body.apiKey) {
            apiKey = request.body.apiKey;
        }

        if (!apiKey) {
            return response.status(400).json({
                error: 'No API key configured. Set it in SillyTavern secrets or pass it in the request.',
            });
        }

        // Clean up the apiHost (remove trailing slash)
        const cleanHost = apiHost.replace(/\/+$/, '');

        // Call MiMo's chat completions endpoint
        const mimoResponse = await fetch(`${cleanHost}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'api-key': apiKey,
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
            }),
        });

        if (!mimoResponse.ok) {
            const errorBody = await mimoResponse.text().catch(() => '');
            console.error(`MiMo API error ${mimoResponse.status}:`, errorBody);
            return response.status(mimoResponse.status).json({
                error: `MiMo API returned ${mimoResponse.status}`,
                details: errorBody,
            });
        }

        const mimoData = await mimoResponse.json();

        // Extract base64 audio from the response
        const audioData = mimoData?.choices?.[0]?.message?.audio?.data;

        if (!audioData) {
            console.error('MiMo response missing audio data:', JSON.stringify(mimoData).slice(0, 500));
            return response.status(500).json({
                error: 'MiMo API response did not contain audio data',
            });
        }

        // Decode base64 audio and return as binary
        const audioBuffer = Buffer.from(audioData, 'base64');

        response.set({
            'Content-Type': 'audio/wav',
            'Content-Length': audioBuffer.length.toString(),
            'Cache-Control': 'no-cache',
        });

        return response.send(audioBuffer);
    } catch (error) {
        console.error('MiMo TTS error:', error);
        return response.status(500).json({
            error: error.message || 'Internal server error in MiMo TTS',
        });
    }
});
