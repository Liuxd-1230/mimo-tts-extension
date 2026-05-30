/**
 * MiMo TTS Provider for SillyTavern
 * Client-side TTS provider for Xiaomi MiMo TTS API
 *
 * MiMo TTS uses /v1/chat/completions (NOT OpenAI's /v1/audio/speech)
 * This provider calls a server-side proxy at /api/mimo/generate-voice
 */

import { getRequestHeaders } from '../../../script.js';
import { saveTtsProviderSettings } from './index.js';

export { MiMoTtsProvider };

class MiMoTtsProvider {
    static voices = [
        { name: '冰糖', voice_id: '冰糖', lang: 'zh-CN', gender: 'female' },
        { name: '茉莉', voice_id: '茉莉', lang: 'zh-CN', gender: 'female' },
        { name: '知性的姐姐', voice_id: '知性的姐姐', lang: 'zh-CN', gender: 'female' },
        { name: '甜心少女', voice_id: '甜心少女', lang: 'zh-CN', gender: 'female' },
        { name: '阳光青年', voice_id: '阳光青年', lang: 'zh-CN', gender: 'male' },
        { name: '活泼小女', voice_id: '活泼小女', lang: 'zh-CN', gender: 'female' },
        { name: '御姐', voice_id: '御姐', lang: 'zh-CN', gender: 'female' },
        { name: '温柔小姨', voice_id: '温柔小姨', lang: 'zh-CN', gender: 'female' },
        { name: '儿语姐姐', voice_id: '儿语姐姐', lang: 'zh-CN', gender: 'female' },
        { name: '酷拽学姐', voice_id: '酷拽学姐', lang: 'zh-CN', gender: 'female' },
    ];

    static voiceDesignPresets = [
        { id: 'animation', name: '🎬 动画配音', instruction: '用夸张、富有表现力的动画配音风格朗读' },
        { id: 'podcast', name: '🎙️ 播客讲述', instruction: '用自然、轻松的播客讲述风格朗读，语速适中' },
        { id: 'gentle', name: '🌸 温柔安抚', instruction: '用温柔、轻柔、安抚的声音朗读，语速稍慢' },
        { id: 'cheerful', name: '☀️ 阳光开朗', instruction: '用阳光、开朗、充满活力的声音朗读，语速偏快' },
    ];

    settings;
    separator = ' . ';
    audioElement = document.createElement('audio');

    defaultSettings = {
        apiHost: 'https://api.xiaomimimo.com',
        model: 'mimo-tts-01',
        voice: '冰糖',
        voiceDesignMode: 'default',
        voiceDesignInstruction: '',
    };

    get settingsHtml() {
        const voiceOptions = MiMoTtsProvider.voices.map(v =>
            `<option value="${v.voice_id}">${v.name}</option>`
        ).join('');

        const presetOptions = MiMoTtsProvider.voiceDesignPresets.map(p =>
            `<option value="${p.id}">${p.name}</option>`
        ).join('');

        return `
        <div class="mimo-tts-settings">
            <div class="flex-container alignItemsCenter" style="margin-bottom: 10px;">
                <span class="menu_button menu_button_icon" title="MiMo TTS">
                    <i class="fa-solid fa-volume-high"></i>
                    <span>MiMo TTS</span>
                </span>
                <small style="margin-left: 8px; opacity: 0.7;">小米 MiMo 语音合成</small>
            </div>

            <label for="mimo-tts-api-host">API 地址：</label>
            <div class="flex-container alignItemsCenter">
                <div class="flex1">
                    <input id="mimo-tts-api-host" type="text" class="text_pole" maxlength="500"
                           placeholder="https://api.xiaomimimo.com" />
                </div>
                <div id="mimo-tts-key" class="menu_button menu_button_icon manage-api-keys"
                     data-key="api_key_custom_mimo_tts" title="管理 API Key">
                    <i class="fa-solid fa-key"></i>
                    <span>API Key</span>
                </div>
            </div>

            <label for="mimo-tts-model">模型：</label>
            <input id="mimo-tts-model" type="text" class="text_pole" maxlength="200"
                   placeholder="mimo-tts-01" />

            <label for="mimo-tts-voice">音色：</label>
            <select id="mimo-tts-voice" class="text_pole">
                ${voiceOptions}
            </select>

            <hr />
            <div><b>🎭 语音设计（Voice Design）</b></div>
            <small style="opacity: 0.7;">选择预设风格或自定义语音设计指令</small>

            <label for="mimo-tts-voice-design">语音设计风格：</label>
            <select id="mimo-tts-voice-design" class="text_pole">
                <option value="default">默认（自然朗读）</option>
                ${presetOptions}
                <option value="custom">自定义...</option>
            </select>

            <div id="mimo-custom-voice-container" style="display: none;">
                <label for="mimo-custom-voice">自定义语音设计指令：</label>
                <textarea id="mimo-custom-voice" class="text_pole textarea_compact autoSetHeight" rows="3"
                    placeholder="例：用低沉、磁性的声音朗读，语速适中，带有讲故事的感觉"></textarea>
                <small style="opacity: 0.7;">支持导演模式：写清【角色】【场景】【指导】三个维度</small>
            </div>

            <hr />
            <div><b>📖 使用说明</b></div>
            <small style="opacity: 0.7;">
                • 在角色名中写入音色名（如"冰糖"）可按角色分配音色<br />
                • 风格标签：在文本中用 (开心) (悲伤) (唱歌) 等标签<br />
                • 方言支持：(东北话) (四川话) (粤语) 等<br />
                • 唱歌模式：(唱歌)歌词内容<br />
            </small>
        </div>`;
    }

    async loadSettings(settings) {
        if (Object.keys(settings).length === 0) {
            console.info('Using default MiMo TTS Provider settings');
        }

        this.settings = { ...this.defaultSettings };

        for (const key in settings) {
            if (key in this.settings) {
                this.settings[key] = settings[key];
            }
        }

        $('#mimo-tts-api-host').val(this.settings.apiHost);
        $('#mimo-tts-api-host').on('input', () => this.onSettingsChange());

        $('#mimo-tts-model').val(this.settings.model);
        $('#mimo-tts-model').on('input', () => this.onSettingsChange());

        $('#mimo-tts-voice').val(this.settings.voice);
        $('#mimo-tts-voice').on('change', () => this.onSettingsChange());

        $('#mimo-tts-voice-design').val(this.settings.voiceDesignMode);
        $('#mimo-tts-voice-design').on('change', () => {
            this.onSettingsChange();
            this.toggleCustomVoice();
        });

        $('#mimo-custom-voice').val(this.settings.voiceDesignInstruction);
        $('#mimo-custom-voice').on('input', () => this.onSettingsChange());

        this.toggleCustomVoice();

        await this.checkReady();
        console.debug('MiMo TTS: Settings loaded');
    }

    toggleCustomVoice() {
        if ($('#mimo-tts-voice-design').val() === 'custom') {
            $('#mimo-custom-voice-container').show();
        } else {
            $('#mimo-custom-voice-container').hide();
        }
    }

    onSettingsChange() {
        this.settings.apiHost = $('#mimo-tts-api-host').val();
        this.settings.model = $('#mimo-tts-model').val();
        this.settings.voice = $('#mimo-tts-voice').val();
        this.settings.voiceDesignMode = $('#mimo-tts-voice-design').val();
        this.settings.voiceDesignInstruction = $('#mimo-custom-voice').val();
        saveTtsProviderSettings();
    }

    async checkReady() {
        return;
    }

    async onRefreshClick() {
        return;
    }

    async getVoice(voiceName) {
        if (!voiceName) {
            throw 'TTS Voice name not provided';
        }

        const voice = MiMoTtsProvider.voices.find(
            v => v.voice_id === voiceName || v.name === voiceName
        );
        if (!voice) {
            throw `MiMo TTS voice not found: ${voiceName}`;
        }

        return voice;
    }

    async fetchTtsVoiceObjects() {
        return MiMoTtsProvider.voices;
    }

    async generateTts(text, voiceId, characterName = null) {
        const voice = voiceId || this.settings.voice;
        const apiHost = this.settings.apiHost || 'https://api.xiaomimimo.com';
        const model = this.settings.model || 'mimo-tts-01';

        let voiceDesignMode = this.settings.voiceDesignMode || 'default';
        let voiceDesignInstruction = this.settings.voiceDesignInstruction || '';

        if (voiceDesignMode === 'custom') {
            voiceDesignInstruction = voiceDesignInstruction || '请用自然的语气朗读以下文本';
        }

        console.info(`MiMo TTS: Generating voice="${voice}" model="${model}"`);

        const requestBody = {
            apiHost: apiHost,
            model: model,
            input: text,
            voice: voice,
            voice_design_mode: voiceDesignMode,
            voice_design_instruction: voiceDesignInstruction,
        };

        const response = await fetch('/api/mimo/generate-voice', {
            method: 'POST',
            headers: {
                ...getRequestHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            toastr.error(errorText || response.statusText, 'MiMo TTS 生成失败');
            throw new Error(`MiMo TTS HTTP ${response.status}: ${errorText}`);
        }

        return response;
    }

    async previewTtsVoice(voiceId) {
        const voice = voiceId || this.settings.voice;
        const previewText = '你好！我是小米MiMo语音合成，很高兴为你服务。';
        return await this.generateTts(previewText, voice);
    }

    dispose() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.removeAttribute('src');
            this.audioElement.load();
        }
    }
}
