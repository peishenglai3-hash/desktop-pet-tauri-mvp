use anyhow::{anyhow, Context, Result};
use keyring::Entry;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

const SERVICE_NAME: &str = "ai-desktop-pet";

#[derive(Debug, Deserialize, Serialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct SendChatRequest {
    pub provider: String,
    pub model: String,
    pub base_url: String,
    pub messages: Vec<ChatMessage>,
}

#[derive(Debug, Deserialize)]
pub struct ProviderSecret {
    pub provider: String,
    pub api_key: String,
    pub base_url: String,
    pub model: String,
}

#[derive(Debug, Serialize)]
struct OpenAiRequest<'a> {
    model: &'a str,
    messages: &'a [ChatMessage],
    temperature: f32,
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct OpenAiResponse {
    choices: Vec<OpenAiChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenAiChoice {
    message: OpenAiChoiceMessage,
}

#[derive(Debug, Deserialize)]
struct OpenAiChoiceMessage {
    content: String,
}

pub async fn send_chat(request: SendChatRequest) -> Result<String> {
    validate_request(&request)?;

    let api_key = read_api_key(&request.provider)?;
    let url = format!("{}/chat/completions", request.base_url.trim_end_matches('/'));
    let payload = OpenAiRequest {
        model: &request.model,
        messages: &request.messages,
        temperature: 0.7,
        stream: false,
    };

    let client = Client::builder()
        .timeout(Duration::from_secs(45))
        .build()
        .context("无法初始化网络客户端")?;

    let response = client
        .post(url)
        .bearer_auth(api_key)
        .json(&payload)
        .send()
        .await
        .context("网络连接失败，请检查网络或服务地址")?;

    let status = response.status();
    let body = response.text().await.context("无法读取模型响应")?;

    if !status.is_success() {
        return Err(anyhow!(friendly_api_error(status.as_u16(), &body)));
    }

    let parsed: OpenAiResponse = serde_json::from_str(&body).context("模型响应格式不符合 OpenAI 兼容协议")?;
    parsed
        .choices
        .into_iter()
        .next()
        .map(|choice| choice.message.content)
        .filter(|content| !content.trim().is_empty())
        .ok_or_else(|| anyhow!("模型没有返回有效文本"))
}

pub async fn save_provider_secret(config: ProviderSecret) -> Result<()> {
    validate_secret(&config)?;
    write_api_key(&config.provider, &config.api_key)?;

    let probe = SendChatRequest {
        provider: config.provider.clone(),
        model: config.model,
        base_url: config.base_url,
        messages: vec![ChatMessage {
            role: "user".to_string(),
            content: "请只回复 OK，用于连接测试。".to_string(),
        }],
    };

    match send_chat(probe).await {
        Ok(_) => Ok(()),
        Err(error) => {
            let _ = delete_api_key(&config.provider);
            Err(error)
        }
    }
}

fn validate_request(request: &SendChatRequest) -> Result<()> {
    if request.provider.trim().is_empty() {
        return Err(anyhow!("请选择模型服务"));
    }
    if request.base_url.trim().is_empty() {
        return Err(anyhow!("请填写服务地址"));
    }
    if request.model.trim().is_empty() {
        return Err(anyhow!("请填写模型名或方舟 Endpoint ID"));
    }
    if request.messages.is_empty() {
        return Err(anyhow!("请先输入消息"));
    }
    Ok(())
}

fn validate_secret(config: &ProviderSecret) -> Result<()> {
    if config.api_key.trim().is_empty() {
        return Err(anyhow!("请填写 API Key"));
    }
    let probe = SendChatRequest {
        provider: config.provider.clone(),
        model: config.model.clone(),
        base_url: config.base_url.clone(),
        messages: vec![ChatMessage {
            role: "user".to_string(),
            content: "probe".to_string(),
        }],
    };
    validate_request(&probe)
}

fn credential_entry(provider: &str) -> Result<Entry> {
    Entry::new(SERVICE_NAME, &format!("provider:{provider}:api-key")).context("无法访问本机凭据管理器")
}

fn read_api_key(provider: &str) -> Result<String> {
    credential_entry(provider)?
        .get_password()
        .context("未找到已保存的 API Key，请先在设置页保存并测试")
}

fn write_api_key(provider: &str, api_key: &str) -> Result<()> {
    credential_entry(provider)?
        .set_password(api_key)
        .context("保存 API Key 失败")
}

fn delete_api_key(provider: &str) -> Result<()> {
    credential_entry(provider)?
        .delete_credential()
        .context("清理无效 API Key 失败")
}

fn friendly_api_error(status: u16, body: &str) -> String {
    match status {
        401 | 403 => "API Key 无效或权限不足，请重新检查密钥。".to_string(),
        404 => "模型名或 Endpoint ID 不存在，请检查服务商控制台配置。".to_string(),
        408 | 504 => "模型服务响应超时，请稍后再试。".to_string(),
        429 => "请求过于频繁或余额不足，请稍后重试或检查账户额度。".to_string(),
        500..=599 => "模型服务暂时异常，请稍后再试。".to_string(),
        _ => format!("模型服务返回错误 {status}: {}", compact_body(body)),
    }
}

fn compact_body(body: &str) -> String {
    let cleaned = body.replace(['\r', '\n'], " ");
    cleaned.chars().take(220).collect()
}
