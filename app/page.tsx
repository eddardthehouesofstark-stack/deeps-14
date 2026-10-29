'use client';

import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = { role: "user" | "assistant"; content: string };
type Memory = { id: string; content: string; category: string };

export default function Home() {
  const supabase = createClient();
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authBusy, setAuthBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey you 💗 I'm deeps. I'm here to listen, help you think things through, and make space for whatever kind of day you're having. What's on your mind?" }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [decisionMode, setDecisionMode] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryInput, setMemoryInput] = useState("");
  const [checkins, setCheckins] = useState(true);
  const [checkinTime, setCheckinTime] = useState("09:00");
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [pushConnected, setPushConnected] = useState(false);
  const [telegramLinkUrl, setTelegramLinkUrl] = useState("");
  const [channelBusy, setChannelBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchMemories();
      fetch("/api/preferences").then(r => r.ok ? r.json() : null).then(p => {
        if (p) {
          setCheckins(p.checkins_enabled); setCheckinTime(p.checkin_time || "09:00");
          setTelegramConnected(Boolean(p.telegram_connected)); setPushConnected(Boolean(p.web_push_connected));
        }
      }).catch(() => {});
    }
  }, [session]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function authenticate(e: FormEvent) {
    e.preventDefault(); setAuthBusy(true); setNotice("");
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setAuthBusy(false);
    if (result.error) setNotice(result.error.message);
    else if (authMode === "signup" && !result.data.session) setNotice("Check your email to confirm your account, then sign in.");
  }

  async function fetchMemories() {
    const r = await fetch("/api/memories");
    if (r.ok) setMemories(await r.json());
  }

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setInput(""); setBusy(true); setNotice("");
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-16), decisionMode })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Couldn't get a reply.");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setMessages([...next, { role: "assistant", content: "I'm having trouble connecting right now. Your message is still here—please try again in a moment 💗" }]);
      setNotice(err.message || "Request failed");
    } finally { setBusy(false); }
  }

  async function addMemory(e: FormEvent) {
    e.preventDefault();
    const content = memoryInput.trim();
    if (!content) return;
    const r = await fetch("/api/memories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, category: "user_shared" })
    });
    if (r.ok) { setMemoryInput(""); fetchMemories(); setNotice("Memory saved 💗"); }
    else setNotice("Couldn't save that memory.");
  }

  async function deleteMemory(id: string) {
    const r = await fetch(`/api/memories?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (r.ok) fetchMemories();
  }

  async function savePreferences() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    const r = await fetch("/api/preferences", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkins_enabled: checkins, checkin_time: checkinTime, timezone })
    });
    setNotice(r.ok ? (checkins ? "Daily proactive conversations enabled 💗 Once your channels and server scheduler are configured, Deeps can message you each day." : "Daily proactive messages paused.") : "Couldn't save preferences.");
  }

  async function connectTelegram() {
    setChannelBusy(true); setNotice("");
    try {
      const r = await fetch("/api/telegram/link", { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Telegram isn't configured yet.");
      setTelegramLinkUrl(data.botUrl);
      window.open(data.botUrl, "_blank", "noopener,noreferrer");
      setNotice("Telegram opened. Tap Start in the bot chat to finish connecting it to Deeps.");
    } catch (e: any) { setNotice(e.message || "Couldn't connect Telegram."); }
    finally { setChannelBusy(false); }
  }

  async function disconnectTelegram() {
    const r = await fetch("/api/telegram/link", { method: "DELETE" });
    if (r.ok) { setTelegramConnected(false); setTelegramLinkUrl(""); setNotice("Telegram disconnected."); }
    else setNotice("Couldn't disconnect Telegram.");
  }

  async function refreshChannelStatus() {
    const r = await fetch("/api/preferences");
    if (!r.ok) { setNotice("Couldn't refresh channel status."); return; }
    const p = await r.json();
    setTelegramConnected(Boolean(p.telegram_connected)); setPushConnected(Boolean(p.web_push_connected));
    setNotice("Channel status refreshed.");
  }

  async function disableWebsiteNotifications() {
    setChannelBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
      }
      setPushConnected(false); setNotice("Website notifications disconnected.");
    } catch (e: any) { setNotice(e.message || "Couldn't disconnect website notifications."); }
    finally { setChannelBusy(false); }
  }

  function decodeVapidKey(base64String: string) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
  }

  async function enableWebsiteNotifications() {
    setChannelBusy(true); setNotice("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("This browser doesn't support web push. Try a current version of Chrome or Edge over HTTPS.");
      const keyResponse = await fetch("/api/push/key");
      const keyData = await keyResponse.json();
      if (!keyResponse.ok) throw new Error(keyData.error || "Web Push isn't configured on the server yet.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Please allow notifications in your browser settings to connect website messages.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(keyData.publicKey) });
      const save = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: subscription.toJSON() }) });
      const saved = await save.json();
      if (!save.ok) throw new Error(saved.error || "Couldn't save this browser subscription.");
      setPushConnected(true); setNotice("Website notifications connected 💗");
    } catch (e: any) { setNotice(e.message || "Couldn't enable website notifications."); }
    finally { setChannelBusy(false); }
  }

  function voiceInput() {
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) { setNotice("Voice input isn't supported in this browser. Try a supported Chromium-based browser."); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; recognition.interimResults = false;
    recognition.onresult = (event: any) => setInput(prev => (prev ? prev + " " : "") + event.results[0][0].transcript);
    recognition.onerror = () => setNotice("Voice input was unavailable. Check microphone permissions.");
    recognition.start();
  }

  async function signOut() { await supabase.auth.signOut(); setSession(null); }

  if (!session) return (
    <main className="shell" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <section className="panel" style={{ width: "min(100%,430px)", padding: 30 }}>
        <div className="avatar" style={{ marginBottom: 20 }}>💗</div>
        <div className="eyebrow">A little space just for you</div>
        <h1 style={{ fontSize: 34, marginBottom: 8 }}>Meet deeps</h1>
        <p className="muted" style={{ lineHeight: 1.65 }}>A thoughtful AI companion for chats, personal memories, and life's little decisions.</p>
        <form onSubmit={authenticate} style={{ display: "grid", gap: 12, marginTop: 24 }}>
          <input className="field" type="email" placeholder="Email address" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          <input className="field" type="password" placeholder="Password (8+ characters)" minLength={8} autoComplete={authMode === "signup" ? "new-password" : "current-password"} required value={password} onChange={e => setPassword(e.target.value)} />
          <button className="action" disabled={authBusy}>{authBusy ? "One moment…" : authMode === "signup" ? "Create my private account" : "Sign in"}</button>
        </form>
        <button className="soft" style={{ width: "100%", marginTop: 10 }} onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}>{authMode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}</button>
        {notice && <p role="status" className="muted">{notice}</p>}
        <p className="muted" style={{ fontSize: 12, marginTop: 20 }}>Your memories are personal. Share only what you're comfortable storing.</p>
      </section>
    </main>
  );

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">♡ deeps</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="muted" style={{ fontSize: 13 }}>{session.user.email}</span>
          <button className="pill" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <div className="layout">
        <aside className="panel sidebar">
          <div className="avatar">💗</div>
          <div className="eyebrow" style={{ marginTop: 20 }}>Your companion</div>
          <h2 style={{ margin: "5px 0" }}>deeps</h2>
          <p className="muted" style={{ lineHeight: 1.6, fontSize: 14 }}>A calm place to talk things out, celebrate little wins, and find your next step.</p>
          <button className={decisionMode ? "action" : "soft"} onClick={() => setDecisionMode(!decisionMode)} style={{ width: "100%", marginTop: 10 }}>
            {decisionMode ? "✦ Decision mode on" : "✧ Help me decide"}
          </button>
          <hr style={{ border: 0, borderTop: "1px solid #f3dce8", width: "100%", margin: "22px 0" }} />
          <h3 style={{ margin: "0 0 8px" }}>Little things to remember</h3>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>Only save what you choose to add. These memories are attached to your account.</p>
          <form onSubmit={addMemory} style={{ display: "grid", gap: 8 }}>
            <input className="field" value={memoryInput} onChange={e => setMemoryInput(e.target.value)} placeholder="e.g. I love evening walks" maxLength={500} />
            <button className="soft">＋ Save a memory</button>
          </form>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {memories.map(m => <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "start", fontSize: 13, background: "#fff6fa", borderRadius: 12, padding: 10 }}>
              <span style={{ flex: 1 }}>{m.content}</span><button aria-label="Delete memory" onClick={() => deleteMemory(m.id)} style={{ border: 0, background: "transparent", color: "#a65c83" }}>×</button>
            </div>)}
            {!memories.length && <span className="muted" style={{ fontSize: 12 }}>Your saved memories will appear here.</span>}
          </div>
          <hr style={{ border: 0, borderTop: "1px solid #f3dce8", width: "100%", margin: "22px 0" }} />
          <h3 style={{ margin: "0 0 8px" }}>Daily messages 💌</h3>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>Deeps chooses an original message from your context each day. This is a daily goal, not a fixed script; delivery needs the deployed scheduler.</p>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, marginBottom: 12 }}>
            <input type="checkbox" checked={checkins} onChange={e => setCheckins(e.target.checked)} /> Let Deeps start a conversation daily
          </label>
          <label className="muted" style={{ fontSize: 12 }}>Your local delivery time</label>
          <input className="field" type="time" value={checkinTime} onChange={e => setCheckinTime(e.target.value)} style={{ marginTop: 6 }} />
          <button className="soft" onClick={savePreferences} style={{ width: "100%", marginTop: 8 }}>Save daily preference</button>
          <hr style={{ border: 0, borderTop: "1px solid #f3dce8", width: "100%", margin: "18px 0" }} />
          <h3 style={{ margin: "0 0 8px" }}>Where she can reach you</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "10px 0", fontSize: 13 }}>
            <span>Telegram</span><span className="muted">{telegramConnected ? "Connected ✓" : "Not connected"}</span>
          </div>
          {telegramConnected
            ? <button className="soft" onClick={disconnectTelegram} style={{ width: "100%" }}>Disconnect Telegram</button>
            : <button className="soft" disabled={channelBusy} onClick={connectTelegram} style={{ width: "100%" }}>{channelBusy ? "Connecting…" : "Connect Telegram"}</button>}
          {telegramLinkUrl && !telegramConnected && <a href={telegramLinkUrl} target="_blank" rel="noreferrer" className="muted" style={{ display: "block", fontSize: 11, marginTop: 6 }}>Open your personal Deeps bot link again</a>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "14px 0 8px", fontSize: 13 }}>
            <span>Website notifications</span><span className="muted">{pushConnected ? "Connected ✓" : "Not connected"}</span>
          </div>
          <button className="soft" disabled={channelBusy || pushConnected} onClick={enableWebsiteNotifications} style={{ width: "100%" }}>{pushConnected ? "Website notifications enabled" : channelBusy ? "Connecting…" : "Enable website notifications"}</button>
          {pushConnected && <button className="soft" disabled={channelBusy} onClick={disableWebsiteNotifications} style={{ width: "100%", marginTop: 6 }}>Disconnect website notifications</button>}
          <button className="soft" onClick={refreshChannelStatus} style={{ width: "100%", marginTop: 8 }}>Refresh channel status</button>
          <p className="muted" style={{ fontSize: 11, lineHeight: 1.5, marginTop: 10 }}>Connect both channels for both delivery methods. Telegram requires a configured bot; browser push requires HTTPS and server VAPID keys. See README for one-time deployment setup.</p>
        </aside>

        <section className="panel chatpanel">
          <div className="chathead">
            <div>
              <div className="eyebrow">Your safe space</div>
              <h2 style={{ margin: "5px 0 0", fontSize: 23 }}>Hey, you 💗</h2>
            </div>
            <button className="soft" onClick={voiceInput} title="Speak your message">🎙 Voice</button>
          </div>
          <div className="messages" aria-live="polite">
            {messages.map((m, i) => <div key={i} className={`bubble ${m.role === "user" ? "from-user" : "from-ai"}`}>
              {m.content}
            </div>)}
            {busy && <div className="bubble from-ai">Thinking of a thoughtful reply… 💭</div>}
            <div ref={bottomRef} />
          </div>
          <form className="composer" onSubmit={send}>
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={decisionMode ? "Tell deeps what you're deciding…" : "Tell deeps what's on your mind…"} maxLength={8000} />
            <button className="action" disabled={busy || !input.trim()}>{busy ? "…" : "Send ♥"}</button>
          </form>
          {notice && <p role="status" className="muted" style={{ padding: "0 20px 14px", margin: 0, fontSize: 13 }}>{notice}</p>}
        </section>
      </div>
    </main>
  );
}
