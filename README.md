# MiMo TTS Extension for SillyTavern

小米 MiMo TTS 语音合成插件，支持 10 种预置音色和语音设计（Voice Design）功能。

## 功能特性

- 🎭 **10 种预置音色**：冰糖、茉莉、知性的姐姐、甜心少女、阳光青年、活泼小女、御姐、温柔小姨、儿语姐姐、酷拽学姐
- 🎬 **语音设计**：预设风格（动画配音、播客讲述、温柔安抚、阳光开朗）+ 自定义指令
- 🎯 **导演模式**：写清【角色】【场景】【指导】三个维度
- 🎵 **风格标签**：在文本中用 (开心)(悲伤)(唱歌) 等标签
- 🗣️ **方言支持**：(东北话)(四川话)(粤语) 等
- 🎤 **唱歌模式**：(唱歌)歌词内容

## 安装方法

### 前提条件

- 已安装 SillyTavern（最新版本）
- 拥有小米 MiMo API Key（在 [MiMo 开放平台](https://platform.xiaomimimo.com) 获取）

### 步骤 1：复制客户端文件

将本仓库中的 `mimo.js` 复制到 SillyTavern 的 TTS 扩展目录：

```
cp mimo.js /path/to/SillyTavern/public/scripts/extensions/tts/mimo.js
```

### 步骤 2：复制服务端文件

将本仓库中的 `mimo-server.js` 复制到 SillyTavern 的服务端端点目录：

```
cp mimo-server.js /path/to/SillyTavern/src/endpoints/mimo.js
```

### 步骤 3：注册 Provider（客户端）

打开 `SillyTavern/public/scripts/extensions/tts/index.js`，在文件顶部的 import 区域添加：

```javascript
import { MiMoTtsProvider } from './mimo.js';
```

然后找到 `ttsProviders` 对象，添加一行：

```javascript
const ttsProviders = {
    // ... 其他 providers
    'MiMo': MiMoTtsProvider,
};
```

### 步骤 4：注册服务端路由

打开 SillyTavern 主服务文件（如 `src/server.js` 或 `src/endpoints/openai.js`），添加：

```javascript
import { router as mimoRouter } from './endpoints/mimo.js';
app.use('/api/mimo', mimoRouter);
```

> **注意**：具体注册方式取决于你的 SillyTavern 版本。请参考已有路由的注册方式。

### 步骤 5：重启 SillyTavern

重启 SillyTavern 服务使更改生效。

## 使用方法

1. 打开 SillyTavern → **TTS 设置**
2. Provider 选择 **MiMo**
3. 填入 API 地址（默认 `https://api.xiaomimimo.com`）
4. 点击 🔑 按钮填入 API Key
5. 选择音色和语音设计风格
6. 点击测试按钮验证

### 按角色分配音色

在角色定义（Character）的 `first_mes` 或 `mes_example` 中，可以写入音色名来自动分配：

例如在角色描述中写 `（冰糖）` 即可使用冰糖音色。

## API Key 获取

1. 访问 [MiMo 开放平台](https://platform.xiaomimimo.com)
2. 注册/登录账号
3. 在控制台中获取 API Key

## 技术说明

- MiMo TTS 使用 `/v1/chat/completions` 端点（与 OpenAI 的 `/v1/audio/speech` 不同）
- 客户端通过 SillyTavern 服务器代理调用，确保 API Key 安全
- 默认模型：`mimo-tts-01`

## 许可证

MIT License
