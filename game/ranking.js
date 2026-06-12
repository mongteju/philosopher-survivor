import { sfx } from '../audio.js';

// Mapped lineages to Korean display names and icons
export const LINEAGE_MAP = {
  idealism: { name: '이성주의', icon: '🔥' },
  empiricism: { name: '경험주의', icon: '❄️' },
  confucianism: { name: '유가', icon: '⚡' },
  taoism: { name: '도가', icon: '🌪️' },
  buddhism: { name: '불교', icon: '📿' }
};

const STORAGE_KEY = 'philosopher_rankings';

const MOCK_RANKINGS = [
  { grade: 3, classGroup: 1, name: "이데아", lineage: "idealism", playTime: 240, date: "2026-06-10" },
  { grade: 3, classGroup: 3, name: "베이컨", lineage: "empiricism", playTime: 285, date: "2026-06-11" },
  { grade: 2, classGroup: 5, name: "공자", lineage: "confucianism", playTime: 310, date: "2026-06-12" },
  { grade: 1, classGroup: 2, name: "장자", lineage: "taoism", playTime: 345, date: "2026-06-09" },
  { grade: 2, classGroup: 4, name: "원효", lineage: "buddhism", playTime: 390, date: "2026-06-12" }
];

export function loadRankings() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_RANKINGS));
    return MOCK_RANKINGS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse rankings:", e);
    return MOCK_RANKINGS;
  }
}

export function saveRankings(rankings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rankings));
}

// Add a ranking entry and sort ascending by playtime (clear time)
export function addRanking(entry) {
  const rankings = loadRankings();
  rankings.push(entry);
  rankings.sort((a, b) => a.playTime - b.playTime);
  saveRankings(rankings);
  
  // Return the index of the newly added entry in the sorted list
  return rankings.findIndex(r => 
    r.grade === entry.grade && 
    r.classGroup === entry.classGroup && 
    r.name === entry.name && 
    r.playTime === entry.playTime && 
    r.lineage === entry.lineage &&
    r.date === entry.date
  );
}

// Global active filter state
let activeFilter = 'all';

export function renderRankings(game) {
  const listContainer = document.getElementById('ranking-list');
  if (!listContainer) return;
  
  listContainer.innerHTML = '';
  
  let rankings = loadRankings();
  
  // Filter rankings by lineage if not 'all'
  if (activeFilter !== 'all') {
    rankings = rankings.filter(r => r.lineage === activeFilter);
  }
  
  if (rankings.length === 0) {
    listContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 13px;">등록된 랭킹 기록이 없습니다.</div>';
    return;
  }
  
  rankings.forEach((r, idx) => {
    const item = document.createElement('div');
    
    // Check if this entry matches the newly registered entry in this session
    const isCurrentNewEntry = (game._newRankEntry && 
      r.grade === game._newRankEntry.grade && 
      r.classGroup === game._newRankEntry.classGroup && 
      r.name === game._newRankEntry.name && 
      r.playTime === game._newRankEntry.playTime && 
      r.lineage === game._newRankEntry.lineage && 
      r.date === game._newRankEntry.date
    );

    item.className = `ranking-item${isCurrentNewEntry ? ' highlight-new' : ''}`;
    
    // Rank number
    let badgeClass = 'rank-other';
    let badgeContent = idx + 1;
    if (idx === 0) { badgeClass = 'rank-1'; badgeContent = '🥇'; }
    else if (idx === 1) { badgeClass = 'rank-2'; badgeContent = '🥈'; }
    else if (idx === 2) { badgeClass = 'rank-3'; badgeContent = '🥉'; }
    
    // Convert playtime to MM:SS
    const m = String(Math.floor(r.playTime / 60)).padStart(2, '0');
    const s = String(Math.floor(r.playTime % 60)).padStart(2, '0');
    
    const lineageInfo = LINEAGE_MAP[r.lineage] || { name: '알 수 없음', icon: '❓' };
    
    item.innerHTML = `
      <div class="rank-info-left">
        <div class="rank-badge ${badgeClass}">${badgeContent}</div>
        <div>
          <div class="rank-user-name">${r.grade}학년 ${r.classGroup}반 ${r.name}</div>
          <div class="rank-user-details">${r.date}</div>
        </div>
      </div>
      <div class="rank-info-right">
        <div class="rank-playtime">${m}:${s}</div>
        <div class="rank-lineage-badge">${lineageInfo.icon} ${lineageInfo.name}</div>
      </div>
    `;

    // Append developer individual delete button if debug-panel is active
    const dbgPanel = document.getElementById('debug-panel');
    const isDebugActive = dbgPanel && dbgPanel.style.display !== 'none';
    if (isDebugActive) {
      const rightDiv = item.querySelector('.rank-info-right');
      if (rightDiv) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'dbg-delete-rank-btn';
        deleteBtn.textContent = '❌ 삭제';
        deleteBtn.style.cssText = 'background: #ff4757; border: none; border-radius: 4px; color: white; padding: 4px 8px; font-size: 11px; margin-left: 10px; cursor: pointer; font-weight: bold;';
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`[개발자] 이 랭킹 항목을 삭제하시겠습니까?\n(${r.grade}학년 ${r.classGroup}반 ${r.name})`)) {
            deleteRankingEntry(r);
            renderRankings(game);
          }
        });
        rightDiv.appendChild(deleteBtn);
      }
    }
    
    listContainer.appendChild(item);
    
    // Scroll the new entry into view
    if (isCurrentNewEntry) {
      setTimeout(() => {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  });
}

export function deleteRankingEntry(entry) {
  const rankings = loadRankings();
  const updated = rankings.filter(r => !(
    r.grade === entry.grade &&
    r.classGroup === entry.classGroup &&
    r.name === entry.name &&
    r.playTime === entry.playTime &&
    r.lineage === entry.lineage &&
    r.date === entry.date
  ));
  saveRankings(updated);
}

export function initRankingSystem(game) {
  // Expose renderRankings globally for event triggers
  window.renderRankingsGlobal = () => renderRankings(game);

  // 1. Create default rankings in localStorage if not exists
  loadRankings();

  // 2. Tab switching logic
  const tabs = ['all', 'idealism', 'empiricism', 'confucianism', 'taoism', 'buddhism'];
  tabs.forEach(tabId => {
    const tabBtn = document.getElementById(`rank-tab-${tabId}`);
    if (tabBtn) {
      tabBtn.addEventListener('click', () => {
        // Set active class
        tabs.forEach(t => {
          const btn = document.getElementById(`rank-tab-${t}`);
          if (btn) btn.classList.remove('active');
        });
        tabBtn.classList.add('active');
        activeFilter = tabId;
        renderRankings(game);
        if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
      });
    }
  });

  // 3. Main Menu Ranking Button
  const menuRankingBtn = document.getElementById('menu-ranking-btn');
  if (menuRankingBtn) {
    menuRankingBtn.addEventListener('click', () => {
      // Hide menu screen
      document.getElementById('menu-screen').classList.remove('active');
      // Show ranking screen
      document.getElementById('ranking-screen').classList.add('active');
      game.rankingOpenedFrom = 'menu';
      
      // Default to 'all' tab
      document.getElementById('rank-tab-all').click();
      
      if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
    });
  }

  // 4. Pause Screen Ranking Button
  const pauseRankingBtn = document.getElementById('pause-ranking-btn');
  if (pauseRankingBtn) {
    pauseRankingBtn.addEventListener('click', () => {
      // Hide pause screen
      document.getElementById('pause-screen').classList.remove('active');
      // Show ranking screen
      document.getElementById('ranking-screen').classList.add('active');
      game.rankingOpenedFrom = 'pause';
      
      // Default to 'all' tab
      document.getElementById('rank-tab-all').click();
      
      if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
    });
  }

  // 5. Ranking Close Button
  const rankingCloseBtn = document.getElementById('ranking-close-btn');
  if (rankingCloseBtn) {
    rankingCloseBtn.addEventListener('click', () => {
      document.getElementById('ranking-screen').classList.remove('active');
      game.resetFocus();
      
      if (game.rankingOpenedFrom === 'menu') {
        document.getElementById('menu-screen').classList.add('active');
      } else if (game.rankingOpenedFrom === 'pause') {
        document.getElementById('pause-screen').classList.add('active');
      } else if (game.rankingOpenedFrom === 'ending') {
        document.getElementById('true-ending-screen').classList.add('active');
      } else {
        // Fallback return to menu
        document.getElementById('menu-screen').classList.add('active');
      }
      
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
    });
  }

  // 6. Ending Screen - Register Rank Button
  const endRegisterRankBtn = document.getElementById('end-register-rank-btn');
  if (endRegisterRankBtn) {
    endRegisterRankBtn.addEventListener('click', () => {
      // Clear inputs
      document.getElementById('rank-grade').value = '';
      document.getElementById('rank-class').value = '';
      document.getElementById('rank-name').value = '';
      document.getElementById('rank-register-error').style.display = 'none';
      
      // Show registration modal
      document.getElementById('rank-register-modal').classList.add('active');
      
      if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
    });
  }

  // 7. Rank Submission Button
  const rankSubmitBtn = document.getElementById('rank-submit-btn');
  if (rankSubmitBtn) {
    rankSubmitBtn.addEventListener('click', () => {
      const gradeVal = parseInt(document.getElementById('rank-grade').value.trim());
      const classVal = parseInt(document.getElementById('rank-class').value.trim());
      const nameVal = document.getElementById('rank-name').value.trim();
      
      if (isNaN(gradeVal) || isNaN(classVal) || !nameVal) {
        const errEl = document.getElementById('rank-register-error');
        errEl.textContent = '모든 빈칸을 채워주세요!';
        errEl.style.display = 'block';
        if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
        return;
      }
      
      if (gradeVal < 1 || gradeVal > 9 || classVal < 1 || classVal > 99) {
        const errEl = document.getElementById('rank-register-error');
        errEl.textContent = '유효한 학년(1~9)과 반(1~99)을 입력해 주세요!';
        errEl.style.display = 'block';
        if (typeof sfx !== 'undefined' && sfx.playAlert) sfx.playAlert();
        return;
      }

      // Record date
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      const entry = {
        grade: gradeVal,
        classGroup: classVal,
        name: nameVal,
        lineage: game.player ? game.player.lineage : 'idealism',
        playTime: Math.floor(game.realSurvivalTimer),
        date: dateStr
      };
      
      // Add ranking
      game._newRankEntry = entry;
      addRanking(entry);
      
      // Close registration modal
      document.getElementById('rank-register-modal').classList.remove('active');
      
      // Flag to prevent double registration
      game.hasRegisteredRanking = true;
      
      // Hide register button on true ending screen
      const regBtn = document.getElementById('end-register-rank-btn');
      if (regBtn) regBtn.style.display = 'none';
      
      // Hide ending screen active state while ranking screen is active
      document.getElementById('true-ending-screen').classList.remove('active');
      
      // Show ranking screen, default to their character tab
      document.getElementById('ranking-screen').classList.add('active');
      game.rankingOpenedFrom = 'ending'; // When close, go back to true ending
      
      const userLineageTab = document.getElementById(`rank-tab-${entry.lineage}`);
      if (userLineageTab) {
        userLineageTab.click();
      } else {
        document.getElementById('rank-tab-all').click();
      }

      if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
    });
  }

  // 8. Rank Registration Cancel Button
  const rankCancelBtn = document.getElementById('rank-cancel-btn');
  if (rankCancelBtn) {
    rankCancelBtn.addEventListener('click', () => {
      document.getElementById('rank-register-modal').classList.remove('active');
      if (typeof sfx !== 'undefined' && sfx.playTick) sfx.playTick();
    });
  }

  // 9. Debug Panel: Reset Rankings Button
  const dbgResetRank = document.getElementById('dbg-reset-rank');
  if (dbgResetRank) {
    dbgResetRank.addEventListener('click', () => {
      if (confirm("[개발자] 모든 랭킹 데이터를 초기화하고 기본 더미 데이터로 복원하시겠습니까?")) {
        localStorage.removeItem(STORAGE_KEY);
        loadRankings();
        alert("랭킹 데이터가 초기화되었습니다.");
        renderRankings(game);
        if (typeof sfx !== 'undefined' && sfx.playLevelUp) sfx.playLevelUp();
      }
    });
  }
}
