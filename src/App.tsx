import { invoke } from "@tauri-apps/api/core";
import { Bot, Check, MessageCircle, Play, Settings, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import spritesheetUrl from "./assets/spritesheet.png";

type PetState =
  | "idle"
  | "running-right"
  | "running-left"
  | "waving"
  | "jumping"
  | "failed"
  | "waiting"
  | "running"
  | "review"
  | "look-000-to-157.5"
  | "look-180-to-337.5";

type Provider = "deepseek" | "doubao";

type Message = {
  role: "user" | "assistant";
  text: string;
};

const rows: Record<PetState, number> = {
  idle: 0,
  "running-right": 1,
  "running-left": 2,
  waving: 3,
  jumping: 4,
  failed: 5,
  waiting: 6,
  running: 7,
  review: 8,
  "look-000-to-157.5": 9,
  "look-180-to-337.5": 10
};

const providers: Record<Provider, { name: string; baseUrl: string; model: string; hint: string }> = {
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
    hint: "适合先做默认入口，成本和响应速度更友好。"
  },
  doubao: {
    name: "豆包 / 火山方舟",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    model: "",
    hint: "模型编号来自方舟控制台 Endpoint ID，留空时会提示填写。"
  }
};

const isTauri = "__TAURI_INTERNALS__" in window;

function Sprite({ state }: { state: PetState }) {
  const row = rows[state];

  return (
    <div className="sprite-shell">
      <div
        className="sprite"
        style={{
          backgroundImage: `url(${spritesheetUrl})`,
          backgroundPositionY: `-${row * 208}px`
        }}
        aria-label={`pet animation ${state}`}
      />
    </div>
  );
}

async function sendChat(
  provider: Provider,
  model: string,
  baseUrl: string,
  messages: Message[]
): Promise<string> {
  if (isTauri) {
    return invoke<string>("send_chat", {
      request: {
        provider,
        model,
        base_url: baseUrl,
        messages: messages.map((message) => ({
          role: message.role,
          content: message.text
        }))
      }
    });
  }

  await new Promise((resolve) => window.setTimeout(resolve, 650));
  const last = messages[messages.length - 1]?.text ?? "";
  return `我听到啦：${last}\n\n预览版现在走本地 mock。打包成 EXE 后，Rust Core 会按设置调用 ${providers[provider].name}。`;
}

export function App() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "settings">("chat");
  const [state, setState] = useState<PetState>("idle");
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState<Provider>("deepseek");
  const [baseUrl, setBaseUrl] = useState(providers.deepseek.baseUrl);
  const [model, setModel] = useState(providers.deepseek.model);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "我在。点我以后可以聊天，平时我会安静待机。" }
  ]);

  const providerInfo = useMemo(() => providers[provider], [provider]);

  useEffect(() => {
    setBaseUrl(providerInfo.baseUrl);
    setModel(providerInfo.model);
  }, [providerInfo]);

  useEffect(() => {
    if (open || busy) {
      return;
    }

    const states: PetState[] = ["idle", "waving", "look-000-to-157.5", "look-180-to-337.5"];
    const interval = window.setInterval(() => {
      setState(states[Math.floor(Math.random() * states.length)]);
    }, 3600);

    return () => window.clearInterval(interval);
  }, [busy, open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) {
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, text }];
    setInput("");
    setMessages(nextMessages);
    setBusy(true);
    setState("waiting");

    try {
      const answer = await sendChat(provider, model, baseUrl, nextMessages);
      setMessages([...nextMessages, { role: "assistant", text: answer }]);
      setState("jumping");
      window.setTimeout(() => setState("idle"), 900);
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          text: error instanceof Error ? error.message : "连接失败，请检查密钥、模型或网络。"
        }
      ]);
      setState("failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    setBusy(true);
    setState("review");
    try {
      if (isTauri) {
        await invoke("save_provider_secret", {
          config: {
            provider,
            api_key: apiKey,
            base_url: baseUrl,
            model
          }
        });
      }
      setState("jumping");
      window.setTimeout(() => setState("idle"), 900);
    } catch {
      setState("failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={`pet-app ${open ? "is-open" : ""}`} data-tauri-drag-region>
      <section className="pet-stage">
        <button
          className="pet-button"
          type="button"
          onClick={() => {
            setOpen(true);
            setTab("chat");
            setState("waving");
          }}
          aria-label="打开聊天"
        >
          <Sprite state={state} />
        </button>
        {!open && (
          <button className="idle-tip" type="button" onClick={() => setOpen(true)}>
            <MessageCircle size={15} />
            <span>点我</span>
          </button>
        )}
      </section>

      {open && (
        <aside className="notebook">
          <header className="notebook-header">
            <div className="title">
              <Sparkles size={18} />
              <span>小桌宠</span>
            </div>
            <nav className="tabs" aria-label="功能切换">
              <button className={tab === "chat" ? "active" : ""} type="button" onClick={() => setTab("chat")}>
                <Bot size={16} />
              </button>
              <button
                className={tab === "settings" ? "active" : ""}
                type="button"
                onClick={() => setTab("settings")}
              >
                <Settings size={16} />
              </button>
              <button className="ghost" type="button" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </nav>
          </header>

          {tab === "chat" ? (
            <>
              <div className="messages">
                {messages.map((message, index) => (
                  <p className={`message ${message.role}`} key={`${message.role}-${index}`}>
                    {message.text}
                  </p>
                ))}
              </div>
              <form className="composer" onSubmit={handleSubmit}>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="跟她说点什么..."
                  maxLength={500}
                />
                <button type="submit" disabled={busy || !input.trim()}>
                  <Play size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="settings-panel">
              <label>
                <span>模型服务</span>
                <select value={provider} onChange={(event) => setProvider(event.target.value as Provider)}>
                  <option value="deepseek">DeepSeek</option>
                  <option value="doubao">豆包 / 火山方舟</option>
                </select>
              </label>
              <label>
                <span>API Key</span>
                <input
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="只保存到本机安全存储"
                  type="password"
                />
              </label>
              <label>
                <span>Base URL</span>
                <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
              </label>
              <label>
                <span>模型 / Endpoint ID</span>
                <input value={model} onChange={(event) => setModel(event.target.value)} placeholder="方舟需填写 Endpoint ID" />
              </label>
              <p className="hint">{providerInfo.hint}</p>
              <button className="save" type="button" onClick={saveSettings} disabled={busy || !apiKey.trim()}>
                <Check size={16} />
                <span>保存并测试</span>
              </button>
            </div>
          )}
        </aside>
      )}
    </main>
  );
}
