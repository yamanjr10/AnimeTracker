// --- Search Debounce ---
let searchTimeout;
const originalSearch = searchAnime;
window.searchAnime = function () {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => originalSearch(), 400);
};

// --- Auto Backup Reminder ---
document.addEventListener('DOMContentLoaded', () => {
  const lastBackup = localStorage.getItem('lastBackup');
  const now = Date.now();
  if (!lastBackup || now - parseInt(lastBackup) > 7 * 24 * 60 * 60 * 1000) {
    showToast('Reminder: Export your AnimeTracker data for backup!', 'info');
  }
  localStorage.setItem('lastBackup', now.toString());
});

// --- Favorite Genres Over Time Chart (based on user animeData) ---
function calculateUserGenreTrends() {
  const genreTrends = {};
  const years = new Set();

  animeData.forEach(anime => {
    if (anime.userStatus === 'Completed' && anime.genres && anime.finishDate) {
      const finishYear = new Date(anime.finishDate).getFullYear();
      if (isNaN(finishYear)) return;
      years.add(finishYear);

      anime.genres.forEach(genre => {
        if (!genreTrends[genre]) genreTrends[genre] = {};
        genreTrends[genre][finishYear] = (genreTrends[genre][finishYear] || 0) + 1;
      });
    }
  });

  return {
    years: Array.from(years).sort((a, b) => a - b),
    data: genreTrends
  };
}

function initFavoriteGenresChart() {
  const ctx = document.getElementById('favoriteGenresChart')?.getContext('2d');
  if (!ctx) return;

  const { years, data } = calculateUserGenreTrends();
  const genreTotals = Object.entries(data)
    .map(([genre, yearly]) => ({
      genre,
      total: Object.values(yearly).reduce((a, b) => a + b, 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  const datasets = genreTotals.map(({ genre }, index) => ({
    label: genre,
    data: years.map(y => data[genre][y] || 0),
    borderWidth: 2,
    tension: 0.3,
    fill: true,
    borderColor: [
      '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'
    ][index % 5],
    pointRadius: 4,
  }));

  if (window.favoriteGenresChartInstance) {
    window.favoriteGenresChartInstance.destroy();
  }

  window.favoriteGenresChartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels: years, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-light') } },
      },
      scales: {
        x: {
          ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-light') },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-light') },
          grid: { color: getComputedStyle(document.body).getPropertyValue('--gray') }
        }
      }
    }
  });
}

// Extend initStatisticsCharts safely
const prevInitStats = window.initStatisticsCharts;
window.initStatisticsCharts = function () {
  prevInitStats();
  setTimeout(initFavoriteGenresChart, 500);
};

// --- Episode Progress Increment ---
function addProgressButtons() {
  document.querySelectorAll('#anime-table-body tr').forEach(tr => {
    const progressCell = tr.children[2];
    if (!progressCell.querySelector('.inc-progress')) {      
        const title = tr.children[0].textContent.trim();
        const anime = animeData.find(a => a.title === title);
        if (anime && anime.progress < anime.episodes) {
          anime.progress++;
          localStorage.setItem('animeData', JSON.stringify(animeData));
          updateAnimeDisplay();
          showToast(`Progress updated: ${anime.title} (${anime.progress}/${anime.episodes})`, 'success');
        }
      };
    });
  }

// Re-run after list updates
const oldUpdateAnimeDisplay = updateAnimeDisplay;
window.updateAnimeDisplay = function () {
  oldUpdateAnimeDisplay();
  setTimeout(addProgressButtons, 300);
};

// --- Toast Queue ---
let toastQueue = [];
let showingToast = false;

const oldShowToast = showToast;
window.showToast = function (msg, type = 'info') {
  toastQueue.push({ msg, type });
  if (!showingToast) processNextToast();
};

function processNextToast() {
  if (toastQueue.length === 0) {
    showingToast = false;
    return;
  }
  showingToast = true;
  const { msg, type } = toastQueue.shift();
  oldShowToast(msg, type);
  setTimeout(processNextToast, 2000);
}

// --- Theme Customizer ---
document.addEventListener('DOMContentLoaded', () => {
  const settingsPage = document.getElementById('settings-page');
  if (!settingsPage) return;

  const container = document.createElement('div');
  container.innerHTML = `
    <div class="form-group">
      <label for="themeColor">Accent Color</label>
      <input type="color" id="themeColor" value="${localStorage.getItem('themeColor') || '#6a5acd'}">
    </div>
  `;
  settingsPage.appendChild(container);

  document.getElementById('themeColor').addEventListener('input', e => {
    const color = e.target.value;
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('themeColor', color);
  });
});
