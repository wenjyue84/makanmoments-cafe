"use client";

import { useState, useEffect } from "react";
import type { ChatSettings } from "@/lib/chat/settings";

// Section components
import { HubDashboard } from "./ai-waiter/hub-dashboard";
import { HubLiveChat } from "./ai-waiter/hub-live-chat";
import { HubUnderstanding } from "./ai-waiter/hub-understanding";
import { HubSmartRouting } from "./ai-waiter/hub-smart-routing";
import { HubResponses } from "./ai-waiter/hub-responses";
import { HubChatSimulator } from "./ai-waiter/hub-chat-simulator";
import { HubStaffReview } from "./ai-waiter/hub-staff-review";
import { HubAutomatedTests } from "./ai-waiter/hub-automated-tests";
import { HubPerformance } from "./ai-waiter/hub-performance";
import { HubHelp } from "./ai-waiter/hub-help";
import { ChatSettingsPanel } from "./chat-settings-panel";

export type AiWaiterStatus = {
  model: "groq" | "openrouter";
  temperature: number;
  systemPromptPrefixLength: number;
  systemPromptPreview: string;
  knowledgeFiles: { slug: string; name: string; sizeKb: number; lastModified: string }[];
  groqKeyPresent: boolean;
  openrouterKeyPresent: boolean;
  rateLimitPerMin: number;
  rateLimitPerDay: number;
};

type NavItem = { id: string; label: string; group: string };

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard",      label: "Dashboard",       group: "Overview" },
  { id: "live-chat",      label: "Live Chat",        group: "Overview" },
  { id: "understanding",  label: "Understanding",    group: "Intelligence" },
  { id: "intents",        label: "Smart Routing",    group: "Intelligence" },
  { id: "responses",      label: "Responses",        group: "Intelligence" },
  { id: "chat-simulator", label: "Chat Simulator",   group: "Quality & Tests" },
  { id: "staff-review",   label: "Staff Review",     group: "Quality & Tests" },
  { id: "testing",        label: "Automated Tests",  group: "Quality & Tests" },
  { id: "performance",    label: "Performance",      group: "Management" },
  { id: "settings",       label: "Settings",         group: "Management" },
  { id: "help",           label: "Help & Docs",      group: "System" },
];

const GROUPS = ["Overview", "Intelligence", "Quality & Tests", "Management"];

// --- Icons ---
function NavIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#0ea5e9" : "currentColor";
  const p = { width: 20, height: 20, fill: "none", stroke: c, viewBox: "0 0 24 24", style: { flexShrink: 0, opacity: active ? 1 : 0.8 } as React.CSSProperties };
  const lp = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 2 };
  switch (id) {
    case "dashboard":
      return <svg {...p}><path {...lp} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    case "live-chat":
      return <svg {...p}><path {...lp} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
    case "understanding":
      return <svg {...p}><path {...lp} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case "intents":
      return <svg {...p}><path {...lp} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
    case "responses":
      return <svg {...p}><path {...lp} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
    case "chat-simulator":
      return <svg {...p}><path {...lp} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    case "staff-review":
      return <svg {...p}><path {...lp} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
    case "testing":
      return <svg {...p}><path {...lp} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
    case "performance":
      return <svg {...p}><path {...lp} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>;
    case "settings":
      return <svg {...p}><path {...lp} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path {...lp} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case "help":
      return <svg {...p}><path {...lp} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="4" strokeWidth={2} /></svg>;
  }
}

function NavBtn({ item, isActive, collapsed, onClick }: { item: NavItem; isActive: boolean; collapsed: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? item.label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: collapsed ? "0.75rem 0" : "0.6rem 0.75rem",
        borderRadius: "0.5rem",
        fontSize: "0.9rem",
        fontWeight: 500,
        color: isActive ? "#0369a1" : hovered ? "#0f172a" : "#64748b",
        background: isActive ? "#eff6ff" : hovered ? "#f1f5f9" : "transparent",
        border: "none",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        justifyContent: collapsed ? "center" : "flex-start",
        transition: "background 0.2s ease, color 0.2s ease",
        position: "relative",
      }}
    >
      <NavIcon id={item.id} active={isActive} />
      {!collapsed && (
        <span style={{ whiteSpace: "nowrap", transition: "opacity 0.3s ease" }}>{item.label}</span>
      )}
    </button>
  );
}

function GroupLabel({ label, first, hidden }: { label: string; first?: boolean; hidden: boolean }) {
  return (
    <div style={{
      fontSize: "0.7rem",
      fontWeight: 700,
      color: "#9ca3af",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      padding: "0 0.75rem",
      marginTop: first ? "0.5rem" : "1.5rem",
      marginBottom: "0.35rem",
      whiteSpace: "nowrap",
      overflow: "hidden",
      opacity: hidden ? 0 : 1,
      visibility: hidden ? "hidden" : "visible",
      height: hidden ? 0 : undefined,
      transition: "all 0.3s ease",
    }}>
      {label}
    </div>
  );
}

export function AiWaiterHub() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [hubStatus, setHubStatus] = useState<AiWaiterStatus | null>(null);
  const [hubSettings, setHubSettings] = useState<ChatSettings | null>(null);

  useEffect(() => {
    fetch("/api/admin/ai-waiter/status").then(r => r.json()).then(setHubStatus).catch(() => {});
    fetch("/api/admin/chat-settings").then(r => r.json()).then(setHubSettings).catch(() => {});
  }, []);

  const sidebarW = collapsed ? 72 : 260;
  const activeLabel = NAV_ITEMS.find(n => n.id === activeTab)?.label ?? "Dashboard";

  const handleNavClick = (tabId: string) => setActiveTab(tabId);
  const toggleCollapse = () => setCollapsed(c => !c);

  function renderContent(tab: string) {
    switch (tab) {
      case "dashboard":
        return <HubDashboard hubStatus={hubStatus} setActiveTab={setActiveTab} />;
      case "live-chat":
        return <HubLiveChat />;
      case "understanding":
        return <HubUnderstanding />;
      case "intents":
        return <HubSmartRouting hubStatus={hubStatus} />;
      case "responses":
        return <HubResponses hubStatus={hubStatus} hubSettings={hubSettings} />;
      case "chat-simulator":
        return <HubChatSimulator />;
      case "staff-review":
        return <HubStaffReview hubStatus={hubStatus} />;
      case "testing":
        return <HubAutomatedTests />;
      case "performance":
        return <HubPerformance hubStatus={hubStatus} />;
      case "settings":
        return (
          <div>
            <div style={{ marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.25rem 0" }}>Settings</h2>
              <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>Configure the AI model, temperature, and system prompt.</p>
            </div>
            {hubSettings
              ? <ChatSettingsPanel initialSettings={hubSettings} />
              : <div style={{ color: "#94a3b8", padding: "2rem", textAlign: "center" }}>Loading settings…</div>
            }
          </div>
        );
      case "help":
        return <HubHelp />;
      default:
        return <HubDashboard hubStatus={hubStatus} setActiveTab={setActiveTab} />;
    }
  }

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      background: "#f8fafc",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: sidebarW,
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        zIndex: 50,
        fontWeight: 500,
        color: "#64748b",
      }}>

        {/* Sidebar Header */}
        <div style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: "0 1.25rem",
          borderBottom: "1px solid #f3f4f6",
          flexShrink: 0,
          transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, overflow: "hidden" }}>
            <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>🌈</span>
            {!collapsed && (
              <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1f2937", margin: 0, whiteSpace: "nowrap" }}>
                Rainbow
              </h1>
            )}
          </div>
          <button
            onClick={toggleCollapse}
            style={{
              marginLeft: "auto",
              padding: "0.375rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#9ca3af",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#4b5563")}
            onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {collapsed
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              }
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem 1rem 2rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
        }}>
          {GROUPS.map((group, gi) => (
            <div key={group}>
              <GroupLabel label={group} first={gi === 0} hidden={collapsed} />
              {collapsed && gi > 0 && <div style={{ height: "0.5rem" }} />}
              {NAV_ITEMS.filter(item => item.group === group).map(item => (
                <NavBtn
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  collapsed={collapsed}
                  onClick={() => handleNavClick(item.id)}
                />
              ))}
            </div>
          ))}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* System group */}
          <GroupLabel label="System" hidden={collapsed} />
          {collapsed && <div style={{ height: "0.5rem" }} />}
          {NAV_ITEMS.filter(item => item.group === "System").map(item => (
            <NavBtn
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              collapsed={collapsed}
              onClick={() => handleNavClick(item.id)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: "1rem",
          borderTop: "1px solid #f3f4f6",
          background: "#f9fafb",
          textAlign: "center",
          fontSize: "0.75rem",
          color: "#9ca3af",
          overflow: "hidden",
          whiteSpace: "nowrap",
          flexShrink: 0,
          transition: "all 0.3s ease",
          opacity: collapsed ? 0 : 1,
          visibility: collapsed ? "hidden" : "visible",
          height: collapsed ? 0 : undefined,
        }}>
          v2.1.0
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div style={{
        marginLeft: sidebarW,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
        transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)",
        flex: 1,
      }}>

        {/* ── Topbar ── */}
        <header style={{
          height: 64,
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "0 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "#94a3b8" }}>
            <span>Admin</span>
            <span>›</span>
            <span>AI Waiter Hub</span>
            <span>›</span>
            <span style={{ color: "#1e293b", fontWeight: 500 }}>{activeLabel}</span>
          </div>

          {/* Status badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            {hubStatus && (
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "0.2rem 0.625rem",
                borderRadius: "9999px",
                background: "#f0fdf4",
                color: "#166534",
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                {hubStatus.model === "groq" ? "Groq" : "OpenRouter"} Active
              </span>
            )}
            {!hubStatus && (
              <span style={{
                fontSize: "0.75rem",
                padding: "0.2rem 0.625rem",
                borderRadius: "9999px",
                background: "#f1f5f9",
                color: "#64748b",
                border: "1px solid #e2e8f0",
              }}>
                Connecting…
              </span>
            )}
          </div>
        </header>

        {/* ── Tab Content ── */}
        <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
          {renderContent(activeTab)}
        </main>
      </div>

    </div>
  );
}
