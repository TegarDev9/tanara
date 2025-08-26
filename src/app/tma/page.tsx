"use client";

import React, { useEffect, useState } from 'react';
import './tma.css';

type MiniAppUser = { first_name?: string; last_name?: string };

type TmaShim = {
  ready?: (cb?: (tma?: TmaShim) => void) => void;
  getUser?: () => MiniAppUser | null;
  sendData?: (data: unknown) => void;
  close?: () => void;
};

export default function TmaPage() {
  const [ready, setReady] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/tma/tma.js';
    script.async = true;
    script.onload = () => {
      setLog((l: string[]) => l.concat('tma.js loaded'));
      const win = window as Window & { tma?: TmaShim };
      if (win.tma?.ready) {
        win.tma.ready(() => {
          setLog((l: string[]) => l.concat('tma.ready'));
          try {
            const user = win.tma?.getUser ? win.tma.getUser() : null;
            if (user && user.first_name) setUserName(user.first_name + (user.last_name ? ' ' + user.last_name : ''));
          } catch {
            // ignore
          }
          setReady(true);
        });
      } else {
        setLog((l: string[]) => l.concat('tma not found'));
      }
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  function send() {
    const win = window as Window & { tma?: TmaShim };
    const payload = { action: 'hello', ts: Date.now() };
    if (win.tma && win.tma.sendData) {
      win.tma.sendData(payload);
      setLog((l: string[]) => l.concat('sendData: ' + JSON.stringify(payload)));
    } else {
      setLog((l: string[]) => l.concat('sendData fallback: ' + JSON.stringify(payload)));
    }
  }

  function close() {
    const win = window as Window & { tma?: TmaShim };
    if (win.tma && win.tma.close) win.tma.close();
    setLog((l: string[]) => l.concat('close requested'));
  }

  const initials = userName ? userName.split(' ').map((s: string) => s[0]).join('').slice(0,2).toUpperCase() : 'TA';

  return (
    <div className="tma-root">
      <header className="tma-header">
        <button className="tma-back" onClick={close} aria-label="Close">‹</button>
        <div className="tma-title">
          <div className="tma-title-main">Trading Mini App</div>
          <div className="tma-title-sub">{userName || 'Telegram user'}</div>
        </div>
        <div className="tma-avatar">{initials}</div>
      </header>

      <main className="tma-main">
        <div className="tma-card">
          <h2>Welcome{userName ? (', ' + userName) : ''}!</h2>
          <p>This mini app shows basic Telegram mini app integration and themed UI.</p>

          <div className="tma-actions">
            <button className="tma-btn primary" onClick={send} disabled={!ready}>Send data to host</button>
            <button className="tma-btn" onClick={() => setLog([])}>Clear log</button>
          </div>
        </div>

        <section className="tma-log">
          <div className="tma-log-header">Log</div>
          <ul>
            {log.length === 0 && <li className="tma-log-empty">No events yet.</li>}
            {log.map((l: string, i: number) => (
              <li key={i} className="tma-log-item">{l}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
