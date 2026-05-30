# MiMo TTS Extension for SillyTavern

小米 MiMo V2.5 TTS 语音合成插件

## 安装方法

### 方法一：手动安装（推荐）

1. **复制服务端文件**
   将 `src-endpoint.js` 重命名为 `mimo.js`，复制到：
   ```
   SillyTavern/src/endpoints/mimo.js
   ```

2. **复制客户端文件**
   将 `mimo.js` 复制到：
   ```
   SillyTavern/public/scripts/extensions/tts/mimo.js
   ```

3. **注册 Provider**
   打开 `SillyTavern/public/scripts/extensions/tts/index.js`，找到 `ttsProviders` 对象（约第124行），添加：
   ```javascript
   import { MiMoTtsProvider } from './mimo.js';
   // ...
   const ttsProviders = {
       // ... 其他 providers
       'MiMo': MiMoTtsProvider,
   };
   ```

4. **注册服务端路由**
   打开 `SillyTavern/src/endpoints/openai.js`（或其他主路由文件），添加：
   ```javascript
   import { router as mimoRouter } from './mimo.js';
   app.use('/api/mimo', mimoRouter);
   ```

5. **重启 SillyTavern**

### 方法二：直接修改

如果你不想修改源码，可以直接编辑 SillyTavern 的文件：

1. 在 `SillyTavern/public/scripts/extensions/tts/` 目录下创建 `mimo.js`
2. 在 `SillyTavern/src/endpoints/` 目录下创建 `mimo.js`
3. 按照上述步骤注册

## 使用方法

1. 打开 SillyTavern → TTS 设置
2. Provider 选择 **MiMo**
3. 填入 API Key（在 MiMo 开放平台获取）
4. 选择音色和语音设计风格
5. 点击测试

## 功能特性

- ✅ 8种预置音色（冰糖/茉莉/苏打/白桦 + 英文4种）
- ✅ 语音设计（Voice Design）— 自然语言控制语音风格
- ✅ 导演模式 — 写清角色/场景/指导三个维度
- ✅ 风格标签 — (开心)(悲伤)(唱歌)(东北话)等
- ✅ 唱歌模式 — (唱歌)歌词

## API Key 获取

1. 访问 https://platform.xiaomimimo.com
2. 注册/登录
3. 在控制台获取 API Key

## 注意事项

- MiMo TTS 使用 `/v1/chat/completions` 端点，不是 OpenAI 的 `/v1/audio/speech`
- 需要能访问 `api.xiaomimimo.com`
- 支持 WAV 和 MP3 格式
