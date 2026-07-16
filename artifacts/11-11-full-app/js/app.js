/* ═══════════════════════════════════════════════════════════════════════════
   11.11 — ARG Interface (Pure State Reflection)
   Everything from GAME_STATE. NO static content. NO explanations.
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ─── WRAPPERS للدوال في engine.js ───────────────────────────────────────
  const ENG = () => window; // engine functions are on window
  
  function snap() { return ENG().getStateSnapshot ? ENG().getStateSnapshot() : {}; }
  function curPuz() { return ENG().getCurrentPuzzle ? ENG().getCurrentPuzzle() : null; }
  function solve(p, a) { return ENG().solvePuzzle ? ENG().solvePuzzle(p, a) : { error: 'no_engine' }; }
  function chat() { return ENG().chatWithEcho ? ENG().chatWithEcho() : { dialogue: '[...]', trust: 0, fear: 0 }; }
  function tick() { if (ENG().advanceTime) ENG().advanceTime(); }

  // ─── UI HELPERS ─────────────────────────────────────────────────────────
  function bar(label, value, max, color) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    return `<div class="progress-group">
      <div class="progress-label"><span>${label}</span><span>${Math.round(value)}/${Math.round(max)}</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${color||'#c8785a'};"></div></div>
    </div>`;
  }

  function ring(label, value, color) {
    const c = 2 * Math.PI * 30;
    const off = c - (Math.min(100, value) / 100) * c;
    return `<div class="emotion-ring">
      <div class="emotion-ring-circle">
        <svg viewBox="0 0 70 70" width="70" height="70">
          <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(180,120,80,0.08)" stroke-width="4" />
          <circle cx="35" cy="35" r="30" fill="none" stroke="${color}" stroke-width="4" stroke-dasharray="${c}" stroke-dashoffset="${off}" stroke-linecap="round" />
        </svg>
        <span class="emotion-ring-value" style="color:${color}">${Math.round(value)}%</span>
      </div>
      <span class="emotion-ring-label">${label}</span>
    </div>`;
  }

  function glow(lvl) {
    if (lvl > 70) return `style="border-color:rgba(200,50,50,0.3);animation:glitch 0.5s step-end infinite;"`;
    if (lvl > 40) return `style="border-color:rgba(200,50,50,0.15);"`;
    return '';
  }

  function fIcon(stage) {
    const m = { seed:'🌱', sprout:'🌿', bloom:'🌷', flourish:'🌸', completed:'🌺', corrupted:'💀' };
    return m[stage] || '🌱';
  }

  // ─── MAIN UI (100% from GAME_STATE) ────────────────────────────────────
  function buildUI() {
    const S = snap();
    const P = curPuz();
    const isN = S.isNight || false;
    const ph = S.phaseIndex || 0;
    
    return `
      <div class="section-header-custom" ${S.world && S.world.glitchLevel > 50 ? 'style="animation:glitch 0.3s step-end infinite;"' : ''}>
        <h1><span class="accent">11.11</span> <span style="font-size:0.7rem;opacity:0.4;">${isN ? '🌙' : '☀️'} ${isN ? 'ليل' : 'نهار'}</span></h1>
        <p class="subtitle" style="font-family:monospace;">${S.echo ? S.echo.personality || '—' : '—'} | ${S.progress||0}%</p>
        <p class="sub-desc" style="font-family:monospace;font-size:0.5rem;opacity:0.3;">
          ${isN ? '⚠ SYSTEM INSTABILITY' : '● NOMINAL'} · L${S.layer||0} · ${S.world ? S.world.anomalyCount||0 : 0}ev
        </p>
      </div>

      <!-- ECHO STATUS -->
      <div class="card" ${S.world ? glow(S.world.glitchLevel) : ''}>
        <div class="card-header">
          <h3 class="card-title"><span class="icon">${S.echo && S.echo.corruption > 50 ? '⚠' : '🧠'}</span> Echo</h3>
          <span style="font-size:0.5rem;font-family:monospace;opacity:0.4;">${S.echo ? S.echo.personality||'' : ''}</span>
        </div>
        <div class="card-body">
          <div class="emotion-rings" style="grid-template-columns:repeat(3,1fr);">
            ${ring('ثقة', S.echo ? S.echo.trust||0 : 0, '#c8785a')}
            ${ring('خوف', S.echo ? S.echo.fear||0 : 0, '#cc6644')}
            ${ring('ذاكرة', S.echo ? S.echo.memoryStability||0 : 0, '#5A8AAA')}
            ${ring('فساد', S.echo ? S.echo.corruption||0 : 0, (S.echo && S.echo.corruption > 60) ? '#f44336' : '#AA8B40')}
            ${ring('فضول', S.player ? S.player.curiosity||0 : 0, '#4CAF50')}
            ${ring('استقرار', S.world ? S.world.stability||0 : 0, (S.world && S.world.stability < 40) ? '#f44336' : '#2196F3')}
          </div>
        </div>
      </div>

      <!-- ACTIVE PUZZLE -->
      <div class="card" ${S.world ? glow(S.world.glitchLevel) : ''}>
        <div class="card-header">
          <h3 class="card-title"><span class="icon">🧩</span> اللغز #${P ? P.index : '—'}</h3>
          <span style="font-size:0.5rem;font-family:monospace;opacity:0.4;">${P ? P.type||'' : ''} ${P ? '· '+P.difficulty+'/4' : ''}</span>
        </div>
        <div class="card-body">
          ${P ? `
            <p id="pq" style="font-size:0.75rem;color:rgba(224,220,212,0.7);line-height:1.7;margin-bottom:0.75rem;font-family:monospace;">
              ${P.question || ''}
            </p>
            <div style="display:flex;gap:0.5rem;">
              <input type="text" id="pa" placeholder="..." style="flex:1;padding:0.5rem;background:rgba(10,8,12,0.8);border:1px solid ${S.world && S.world.glitchLevel > 50 ? 'rgba(200,50,50,0.4)' : 'var(--accent-border)'};color:var(--text-primary);font-family:monospace;font-size:0.7rem;outline:none;">
              <button id="ps" class="continue-btn" style="padding:0.5rem 1rem;width:auto;">↵</button>
            </div>
            <p id="pf" style="font-size:0.55rem;margin-top:0.5rem;font-family:monospace;"></p>
          ` : `<p style="font-size:0.6rem;color:rgba(224,220,212,0.3);text-align:center;font-family:monospace;">[ ALL PUZZLES SOLVED ]</p>`}
        </div>
      </div>

      <!-- WORLD + FLOWER -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h3 class="card-title"><span class="icon">🌍</span> العالم</h3></div>
          <div class="card-body">
            ${bar('استقرار', (S.world ? S.world.stability||0 : 0), 100, (S.world && S.world.stability < 40) ? '#f44336' : '#4CAF50')}
            ${bar('تشويش', (S.world ? S.world.glitchLevel||0 : 0), 100, '#FF9800')}
            ${bar('فساد', (S.world ? S.world.corruptionLevel||0 : 0), 100, '#f44336')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title"><span class="icon">🌸</span> الزهرة</h3></div>
          <div class="card-body">
            <div style="text-align:center;padding:0.5rem 0;">
              <span style="font-size:2rem;${S.flower && S.flower.stage === 'corrupted' ? 'filter:grayscale(1);opacity:0.5;' : ''}">${S.flower ? fIcon(S.flower.stage) : '🌱'}</span>
              <p style="font-size:0.55rem;font-family:monospace;opacity:0.5;">${(S.flower && S.flower.stage)||'seed'} · ${S.flower ? S.flower.growth||0 : 0}%${S.flower && S.flower.hiddenUnlocked ? ' 🔓' : ''}</p>
            </div>
            ${bar('نمو', (S.flower ? S.flower.growth||0 : 0), 100, (S.flower && S.flower.growth > 75) ? '#4CAF50' : '#c8785a')}
          </div>
        </div>
      </div>

      <!-- PROGRESS + CHAT -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h3 class="card-title"><span class="icon">📊</span> التقدم</h3></div>
          <div class="card-body">
            ${bar('ألغاز', (S.puzzles ? S.puzzles.solved||0 : 0), (S.puzzles ? S.puzzles.total||220 : 220), '#c8785a')}
            ${bar('ذاكرة', (S.memory ? S.memory.collected||0 : 0), (S.memory ? S.memory.total||220 : 220), '#5A8AAA')}
            <p style="font-size:0.5rem;font-family:monospace;opacity:0.3;margin-top:0.3rem;">
              ${S.achievements||0} 🏆 · ${S.player ? S.player.interactions||0 : 0} تفاعل
            </p>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><span class="icon">💬</span> Echo</h3>
            <button id="ceb" class="card-link">💬 تحدث</button>
          </div>
          <div class="card-body">
            <p id="ed" style="font-size:0.65rem;color:rgba(224,220,212,0.5);font-family:monospace;line-height:1.7;min-height:2rem;">[...]</p>
          </div>
        </div>
      </div>

      <!-- NIGHT WARNING -->
      ${ph >= 1 ? `
        <div class="card" style="border-color:rgba(200,50,50,0.4);background:rgba(200,30,30,0.05);">
          <div class="card-body text-center">
            <p style="font-size:0.6rem;color:rgba(200,80,60,0.6);font-family:monospace;">
              ${ph === 1 ? '⚠ 11:00 PM' : ph === 2 ? '🔴 11:05 PM' : '🔥 11:11 PM'}
            </p>
          </div>
        </div>
      ` : ''}

      <div class="quote-block" style="font-family:monospace;font-size:0.55rem;opacity:0.25;">
        [ ${S.puzzles ? S.puzzles.solved||0 : 0}/220 · ${S.progress||0}% · L${S.layer||0}/12 ]
      </div>
    `;
  }

  // ─── GLITCH EFFECT ON PUZZLE TEXT ──────────────────────────────────────
  function applyGlitch() {
    const S = snap();
    if (S.world && S.world.glitchLevel > 40) {
      const el = document.getElementById('pq');
      if (el) {
        const txt = el.textContent;
        el.innerHTML = txt.split('').map((c,i) => 
          Math.random() > 0.85 ? `<span style="opacity:0.3;animation:blink 0.3s infinite;text-decoration:line-through;">${c}</span>` : c
        ).join('');
      }
    }
  }

  // ─── BIND EVENTS ───────────────────────────────────────────────────────
  function bind() {
    // Puzzle
    const input = document.getElementById('pa');
    const btn = document.getElementById('ps');
    const fb = document.getElementById('pf');
    if (input && btn) {
      const sub = () => {
        const p = curPuz();
        if (!p) return;
        const r = solve(p.id, input.value);
        if (fb) {
          if (r.error === 'wrong_answer') { fb.textContent = '✕ خطأ'; fb.style.color = 'rgba(200,50,50,0.6)'; }
          else if (r.success) {
            fb.textContent = `✓ ${r.achievement ? '🏆 ' + r.achievement.map(a => a.name).join(', ') : 'صحيح!'}`;
            fb.style.color = 'rgba(76,175,80,0.6)';
            input.value = '';
            setTimeout(render, 500);
          } else if (r.error === 'already_solved') { fb.textContent = 'تم سابقاً'; fb.style.color = 'rgba(255,152,0,0.6)'; }
          else { fb.textContent = '✕'; fb.style.color = 'rgba(200,50,50,0.6)'; }
        }
      };
      btn.onclick = sub;
      input.onkeypress = (e) => { if (e.key === 'Enter') sub(); };
    }

    // Chat
    const cb = document.getElementById('ceb');
    const ed = document.getElementById('ed');
    if (cb && ed) {
      cb.onclick = () => {
        const r = chat();
        ed.textContent = `"${r.dialogue || '[...]'}"`;
        ed.style.color = (r.trust||0) > 50 ? 'rgba(76,175,80,0.6)' : 'rgba(224,220,212,0.5)';
        setTimeout(render, 100);
      };
    }
  }

  // ─── RENDER ────────────────────────────────────────────────────────────
  function render() {
    document.getElementById('content-area').innerHTML = buildUI();
    applyGlitch();
    bind();
    updateTopbar();
  }

  // ─── TOPBAR ────────────────────────────────────────────────────────────
  function updateTopbar() {
    const S = snap();
    const m = document.querySelector('.topbar-mood');
    const b = document.querySelector('.discovery-badge');
    const x = document.querySelector('.user-xp-fill');
    if (m) {
      const e = (S.echo && S.echo.corruption > 70) ? '😰' : (S.echo && S.echo.fear > 70) ? '😨' : (S.echo && S.echo.trust > 60) ? '😊' : '😐';
      m.textContent = `${e} ${((S.echo && S.echo.personality) || '').split('،')[0] || '?'}`;
    }
    if (b) b.textContent = `🧩 ${(S.puzzles && S.puzzles.solved) || 0}/220`;
    if (x) x.style.width = `${S.progress || 0}%`;
  }

  function updateTime() {
    const n = new Date();
    document.getElementById('live-time').textContent = n.toLocaleTimeString('ar-SA', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  }

  // ─── ENTRY ──────────────────────────────────────────────────────────────
  const warningText = '[SYSTEM] تجربة تفاعلية تستخدم الوقت الحقيقي. المحتوى خيالي. الاستمرار موافقة.';
  let ci = 0;
  const et = document.getElementById('entry-text');
  const eb = document.getElementById('entry-buttons');

  function typeEntry() {
    if (ci < warningText.length) {
      et.textContent = warningText.slice(0, ci + 2);
      ci += 2;
      requestAnimationFrame(typeEntry);
    } else {
      et.textContent = warningText;
      eb.style.display = 'flex';
      requestAnimationFrame(() => { eb.style.opacity = '1'; });
    }
  }
  setTimeout(typeEntry, 500);

  function enter() {
    document.getElementById('entry-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('app').classList.add('visible');
    startLoop();
  }
  document.getElementById('enter-btn').onclick = enter;
  document.getElementById('skip-btn').onclick = enter;

  // ─── GAME LOOP ─────────────────────────────────────────────────────────
  function startLoop() {
    render();
    setInterval(() => { tick(); render(); }, 1000);
    setInterval(updateTime, 1000);
    updateTime();
    
    // Night toggle
    document.getElementById('night-toggle').onclick = function() {
      const a = document.getElementById('app');
      const n = !a.classList.contains('night-active');
      a.classList.toggle('night-active', n);
      this.innerHTML = n ? '<span>☀️</span><span>النهار</span>' : '<span>🌙</span><span>الليل</span>';
      if (n) {
        const al = document.getElementById('night-alert');
        al.style.display = 'flex';
        al.querySelector('.night-alert-fill').style.animation = 'progressFill 3s ease forwards';
        setTimeout(() => { al.style.opacity = '0'; setTimeout(() => { al.style.display = 'none'; al.style.opacity = '1'; }, 800); }, 3200);
      }
    };
    
    // Settings
    document.getElementById('settings-btn').onclick = () => { document.getElementById('settings-modal').style.display = 'flex'; };
    document.getElementById('settings-close').onclick = () => { document.getElementById('settings-modal').style.display = 'none'; };
    document.getElementById('settings-modal').onclick = (e) => { if (e.target.id === 'settings-modal') e.target.style.display = 'none'; };
  }

  console.log('✦ 11.11 ARG v2.0 Active ✦');
  console.log('✦ 220 puzzles · Dynamic Echo · Real-time World ✦');
})();