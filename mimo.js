/**
 * MiMo TTS Provider for SillyTavern
 * 支持小米 MiMo V2.5 TTS 系列
 * 
 * MiMo TTS 使用 chat/completions 端点（非 OpenAI /v1/audio/speech）
 * 支持：预置音色 + 语音设计（Voice Design）+ 风格标签
 */

import { getRequestHeaders } from '../../../script.js';
import { saveTtsProviderSettings } from './index.js';

export { MiMoTtsProvider };

class MiMoTtsProvider {
    static voices = [
        { name: '冰糖（中文女）', voice_id: '冰糖', lang: 'zh-CN', gender: 'female' },
        { name: '茉莉（中文女）', voice_id: '茉莉', lang: 'zh-CN', gender: 'female' },
        { name: '苏打（中文男）', voice_id: '苏打', lang: 'zh-CN', gender: 'male' },
        { name: '白桦（中文男）', voice_id: '白桦', lang: 'zh-CN', gender: 'male' },
        { name: 'Mia（英文女）', voice_id: 'Mia', lang: 'en-US', gender: 'female' },
        { name: 'Chloe（英文女）', voice_id: 'Chloe', lang: 'en-US', gender: 'female' },
        { name: 'Milo（英文男）', voice_id: 'Milo', lang: 'en-US', gender: 'male' },
        { name: 'Dean（英文男）', voice_id: 'Dean', lang: 'en-US', gender: 'male' },
    ];

    // 语音设计预设
    static voiceDesignPresets = [
        { id: 'default', name: '默认（自然朗读）', prompt: '请用自然的语气朗读以下文本' },
        { id: 'gentle', name: '温柔女声', prompt: '温柔、轻柔的女声，语速稍慢，带着温暖的笑意' },
        { id: 'energetic', name: '活力少年', prompt: '充满活力的少年声音，语速偏快，语气上扬，带着兴奋感' },
        { id: 'calm', name: '沉稳男声', prompt: '低沉、稳重的男声，语速适中，像新闻主播一样专业' },
        { id: 'cute', name: '可爱萝莉', prompt: '软萌可爱的小女孩声音，语速偏快，带着天真的好奇感' },
        { id: 'cold', name: '高冷御姐', prompt: '冰冷、慵懒却极具威压的低音御姐，语速极慢，每个字都像是在舌尖滚过才吐出来' },
        { id: 'storyteller', name: '故事讲述者', prompt: '富有磁性的讲故事声音，语速适中，抑扬顿挫，像在朗读一本引人入胜的小说' },
        { id: 'sing', name: '唱歌模式', prompt: '唱歌' },
        { id: 'custom', name: '自定义...', prompt: '' },
    ];

    settings;
    voices = [];
    separator = ' . ';
    audioElement = document.createElement('audio');

    defaultSettings = {
        voiceMap: {},
        model: 'mimo-v2.5-tts',
        audio_format: 'wav',
        api_endpoint: 'https://api.xiaomimimo.com/v1',
        voice_design: 'default',
        custom_voice_prompt: '',
    };

    get settingsHtml() {
        const voiceOptions = MiMoTtsProvider.voices.map(v =>
            `<option value="${v.voice_id}">${v.name}</option>`
        ).join('');

        const presetOptions = MiMoTtsProvider.voiceDesignPresets.map(p =>
            `<option value="${p.id}">${p.name}</option>`
        ).join('');

        let html = `
        <div class="mimo-tts-settings">
            <div>
                <small>MiMo TTS 使用 chat/completions 端点（非 OpenAI /v1/audio/speech）</small>
            </div>
            
            <label for="mimo-tts-endpoint">API Endpoint:</label>
            <div class="flex-container alignItemsCenter">
                <div class="flex1">
                    <input id="mimo-tts-endpoint" type="text" class="text_pole" maxlength="500" 
                           value="https://api.xiaomimimo.com/v1"/>
                </div>
                <div id="mimo-tts-key" class="menu_button menu_button_icon manage-api-keys" data-key="api_key_custom_openai_tts">
                    <i class="fa-solid fa-key"></i>
                    <span>API Key</span>
                </div>
            </div>
            
            <label for="mimo-tts-model">Model:</label>
            <input id="mimo-tts-model" type="text" class="text_pole" maxlength="500" value="mimo-v2.5-tts"/>
            
            <label for="mimo-tts-format">Audio Format:</label>
            <select id="mimo-tts-format" class="text_pole">
                <option value="wav">WAV (推荐)</option>
                <option value="mp3">MP3</option>
            </select>
            
            <hr>
            <div><b>🎭 语音设计（Voice Design）</b></div>
            <small>选择预设风格或自定义语音设计指令</small>
            
            <label for="mimo-tts-voice-design">语音设计风格:</label>
            <select id="mimo-tts-voice-design" class="text_pole">
                ${presetOptions}
            </select>
            
            <div id="mimo-custom-voice-container" style="display:none;">
                <label for="mimo-custom-voice">自定义语音设计指令:</label>
                <textarea id="mimo-custom-voice" class="text_pole textarea_compact autoSetHeight" rows="3"
                    placeholder="例：冰冷、慵懒却极具威压的低音御姐。语速极慢，每个字都像是在舌尖滚过才吐出来。"></textarea>
                <small>支持导演模式：写清【角色】【场景】【指导】三个维度</small>
            </div>
            
            <hr>
            <div><b>📖 使用说明</b></div>
            <small>
                • 风格标签：在文本中用 (开心) (悲伤) (唱歌) 等标签<br>
                • 方言支持：(东北话) (四川话) (粤语) 等<br>
                • 唱歌模式：(唱歌)歌词内容<br>
            </small>
        </div>`;
        return html;
    }

    async loadSettings(settings) {
        if (Object.keys(settings).length == 0) {
            console.info('Using default MiMo TTS Provider settings');
        }

        this.settings = this.defaultSettings;

        for (const key in settings) {
            if (key in this.settings) {
                this.settings[key] = settings[key];
            }
        }

        $('#mimo-tts-endpoint').val(this.settings.api_endpoint);
        $('#mimo-tts-endpoint').on('input', () => { this.onSettingsChange(); });

        $('#mimo-tts-model').val(this.settings.model);
        $('#mimo-tts-model').on('input', () => { this.onSettingsChange(); });

        $('#mimo-tts-format').val(this.settings.audio_format);
        $('#mimo-tts-format').on('change', () => { this.onSettingsChange(); });

        $('#mimo-tts-voice-design').val(this.settings.voice_design);
        $('#mimo-tts-voice-design').on('change', () => {
            this.onSettingsChange();
            this.toggleCustomVoice();
        });

        $('#mimo-custom-voice').val(this.settings.custom_voice_prompt);
        $('#mimo-custom-voice').on('input', () => { this.onSettingsChange(); });

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
        this.settings.api_endpoint = $('#mimo-tts-endpoint').val();
        this.settings.model = $('#mimo-tts-model').val();
        this.settings.audio_format = $('#mimo-tts-format').val();
        this.settings.voice_design = $('#mimo-tts-voice-design').val();
        this.settings.custom_voice_prompt = $('#mimo-custom-voice').val();
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

        const voice = MiMoTtsProvider.voices.find(v => v.voice_id === voiceName || v.name === voiceName);
        if (!voice) {
            throw `TTS Voice not found: ${voiceName}`;
        }

        return voice;
    }

    async generateTts(text, voiceId, characterName = null) {
        const response = await this.fetchTtsGeneration(text, voiceId, characterName);
        return response;
    }

    async fetchTtsVoiceObjects() {
        return MiMoTtsProvider.voices;
    }

    async previewTtsVoice(_) {
        return;
    }

    /**
     * 获取当前的语音设计提示词
     */
    getVoiceDesignPrompt() {
        const preset = MiMoTtsProvider.voiceDesignPresets.find(p => p.id === this.settings.voice_design);
        if (!preset) return '请用自然的语气朗读以下文本';
        if (preset.id === 'custom') {
            return this.settings.custom_voice_prompt || '请用自然的语气朗读以下文本';
        }
        return preset.prompt;
    }

    async fetchTtsGeneration(inputText, voiceId, characterName = null) {
        console.info(`MiMo TTS: Generating voice for voice_id ${voiceId}`);

        const voiceDesign = this.getVoiceDesignPrompt();

        const requestBody = {
            input: inputText,
            voice: voiceId,
            model: this.settings.model,
            audio_format: this.settings.audio_format,
            api_endpoint: this.settings.api_endpoint,
            voice_design: voiceDesign,
        };

        const response = await fetch('/api/mimo/generate-voice', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            toastr.error(errorText || response.statusText, 'MiMo TTS Generation Failed');
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return response;
    }
}
