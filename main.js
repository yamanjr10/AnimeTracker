// Initialize with empty data
let animeData = JSON.parse(localStorage.getItem('animeData')) || [];
let isEditing = false;
let currentEditId = null;

// Chart variables
let monthlyProgressChart, genreDistributionChart, completionChart, scoreDistributionChart;
let statusDistributionChart, typeDistributionChart, genreStatsChart;
let episodesOverTimeChart, watchTimeByMonthChart;

// DOM elements
const addAnimeBtn = document.getElementById('addAnimeBtn');
const importBtn = document.getElementById('importBtn');
const exportBtn = document.getElementById('exportBtn');
const statsBtn = document.getElementById('statsBtn');
const addAnimeModal = document.getElementById('addAnimeModal');
const importModal = document.getElementById('importModal');
const animeForm = document.getElementById('addAnimeForm');
const closeModalBtns = document.querySelectorAll('.close-modal');
const animeTitleInput = document.getElementById('animeTitle');
const searchResults = document.getElementById('searchResults');
const searchLoading = document.getElementById('searchLoading');
const animeCoverInput = document.getElementById('animeCover');
const animeGenresInput = document.getElementById('animeGenres');
const submitBtn = document.getElementById('submitBtn');
const deleteBtn = document.getElementById('deleteBtn');
const animeIdInput = document.getElementById('animeId');
const importFile = document.getElementById('importFile');
const importDataBtn = document.getElementById('importDataBtn');

// Activity log for tracking user actions
let activityLog = JSON.parse(localStorage.getItem('activityLog')) || [];

// Watchlist pagination
const itemsPerPage = 30;
let currentPage = 1;
let currentStatus = 'all';

// Initialize the app
document.addEventListener('DOMContentLoaded', function () {
    updateStats();
    initCharts();
    updateTopRatedAnime();
    updateCurrentMonthAnime();
    updateRecentActivity();
    updateAnimeDisplay();
    updateTotalAnimeCountAllMonths();
    updateSidebarUserInfo();
    updateCurrentDate();
    initializeTheme();

        // === PROFILE SYNC START ===
    const usernameInput = document.getElementById('usernameInput');
    const avatarInput = document.getElementById('avatarInput');
    const resetAvatarBtn = document.getElementById('resetAvatar');

    const profilePreviewName = document.getElementById('profilePreviewName');
    const profilePreviewAvatar = document.getElementById('profilePreviewAvatar');

    const topUserAvatar = document.querySelector('.user-profile .user-avatar');
    const topUserName = document.querySelector('.user-profile span');
    const sidebarAvatar = document.querySelector('.sidebar-avatar');
    const sidebarUsername = document.querySelector('.sidebar-username');

    // Load from localStorage if saved
    const savedProfile = JSON.parse(localStorage.getItem('userProfile')) || {
        name: 'AnimeFan92',
        avatar: 'https://ui-avatars.com/api/?name=Anime+User&background=6a5acd&color=fff'
    };

    function updateUserProfile(name, avatar) {
        if (profilePreviewName) profilePreviewName.textContent = name;
        if (topUserName) topUserName.textContent = name;
        if (sidebarUsername) sidebarUsername.textContent = name;

        if (profilePreviewAvatar) profilePreviewAvatar.src = avatar;
        if (topUserAvatar) topUserAvatar.src = avatar;
        if (sidebarAvatar) sidebarAvatar.src = avatar;

        localStorage.setItem('userProfile', JSON.stringify({ name, avatar }));
    }

    // Initialize
    updateUserProfile(savedProfile.name, savedProfile.avatar);
    if (usernameInput) usernameInput.value = savedProfile.name;

    // When username changes
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            const currentAvatar = JSON.parse(localStorage.getItem('userProfile'))?.avatar ||
                'https://ui-avatars.com/api/?name=Anime+User&background=6a5acd&color=fff';
            updateUserProfile(usernameInput.value || 'Unnamed', currentAvatar);
        });
    }

    // When avatar changes
    if (avatarInput) {
        avatarInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                updateUserProfile(usernameInput?.value || 'Unnamed', event.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    // Reset to default
    if (resetAvatarBtn) {
        resetAvatarBtn.addEventListener('click', () => {
            const defaultAvatar = 'https://ui-avatars.com/api/?name=Anime+User&background=6a5acd&color=fff';
            updateUserProfile(usernameInput?.value || 'Unnamed', defaultAvatar);
        });
    }
    // === PROFILE SYNC END ===


    // Add event listeners
    addAnimeBtn.addEventListener('click', () => {
        isEditing = false;
        currentEditId = null;
        animeForm.reset();
        submitBtn.textContent = 'Add Anime';
        deleteBtn.style.display = 'none';
        animeIdInput.value = '';
        addAnimeModal.style.display = 'flex';
    });

    importBtn.addEventListener('click', () => {
        importModal.style.display = 'flex';
    });

    exportBtn.addEventListener('click', exportData);

    statsBtn.addEventListener('click', () => {
        document.querySelector('.menu-item[data-page="statistics"]').click();
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            addAnimeModal.style.display = 'none';
            importModal.style.display = 'none';
        });
    });

    animeForm.addEventListener('submit', handleAddAnime);

    // Close modal when clicking outside
    addAnimeModal.addEventListener('click', (e) => {
        if (e.target === addAnimeModal) {
            addAnimeModal.style.display = 'none';
        }
    });

    importModal.addEventListener('click', (e) => {
        if (e.target === importModal) {
            importModal.style.display = 'none';
        }
    });

    // Search for anime when typing
    animeTitleInput.addEventListener('input', searchAnime);

    // Delete button handler
    deleteBtn.addEventListener('click', deleteAnime);

    // Set default duration based on type
    document.getElementById('animeType').addEventListener('change', function () {
        const type = this.value;
        const durationInput = document.getElementById('animeDuration');

        if (type === 'Movie') {
            durationInput.value = '120'; // Default movie duration
            durationInput.readOnly = false;
        } else {
            durationInput.value = '20'; // Default episode duration for TV/OVA/ONA/Special
            durationInput.readOnly = true;
        }
    });

    // Import data button
    importDataBtn.addEventListener('click', () => {
        if (importFile.files.length > 0) {
            importData({ target: { files: importFile.files } });
        } else {
            showToast('Please select a file to import', 'error');
        }
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function () {
            const pageId = this.getAttribute('data-page') + '-page';

            // Remove active class from all menu items and pages
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

            // Add active class to current menu item and page
            this.classList.add('active');
            document.getElementById(pageId).classList.add('active');

            // Initialize specific page content
            if (pageId === 'statistics-page') {
                setTimeout(() => {
                    initStatisticsCharts();
                    updateStatisticsTables();
                }, 100);
            } else if (pageId === 'watchlist-page') {
                const activeStatus = document.querySelector('.filter-btn.active')?.getAttribute('data-status') || 'all';
                updateWatchlist(activeStatus, 1);
            } else if (pageId === 'achievements-page') {
                updateAchievements();
            }
        });
    });

    // Status and sort filters
    document.getElementById('statusFilter').addEventListener('change', (e) => {
        localStorage.setItem('animeFilterStatus', e.target.value);
        updateAnimeDisplay();
    });

    document.getElementById('monthFilter').addEventListener('change', (e) => {
        localStorage.setItem('animeFilterMonth', e.target.value);
        updateAnimeDisplay();
    });

    document.getElementById('yearFilter').addEventListener('change', (e) => {
        localStorage.setItem('animeFilterYear', e.target.value);
        updateAnimeDisplay();
    });

    document.getElementById('sortFilter').addEventListener('change', updateAnimeDisplay);

    // Initialize with sample data if empty
    if (animeData.length === 0) {
        initializeSampleData();
    }

    // Initialize user name
    initializeUserName();
    initSettings();
    

    // Mobile menu functionality
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function () {
            sidebar.classList.toggle('mobile-open');
        });
    }

    // Close sidebar when clicking on a menu item on mobile
    if (window.innerWidth <= 768) {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function () {
                sidebar.classList.remove('mobile-open');
            });
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function (event) {
        if (window.innerWidth <= 768 &&
            sidebar.classList.contains('mobile-open') &&
            !sidebar.contains(event.target) &&
            !mobileMenuToggle.contains(event.target)) {
            sidebar.classList.remove('mobile-open');
        }
    });

    // Handle window resize
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('mobile-open');
        }
    });

    // Reset filters AFTER everything loads
    setTimeout(() => {
        const statusEl = document.getElementById('statusFilter');
        const monthEl = document.getElementById('monthFilter');
        const yearEl = document.getElementById('yearFilter');

        if (statusEl) statusEl.value = 'all';
        if (monthEl) monthEl.value = 'all';
        if (yearEl) yearEl.value = 'all';

        updateAnimeDisplay();
    }, 300);
});

// Helper function to calculate watch time
function calculateWatchTime(anime) {
    if (anime.type === 'Movie') {
        return anime.duration / 60; // Return hours for movies
    } else {
        return (anime.episodes * 20) / 60; // 20 minutes per episode for TV/OVA/ONA/Special
    }
}

// Search anime using Jikan API
async function searchAnime() {
    const query = animeTitleInput.value.trim();
    if (query.length < 3) {
        searchResults.style.display = 'none';
        return;
    }

    searchLoading.style.display = 'block';
    searchResults.style.display = 'none';

    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();

        searchResults.innerHTML = '';
        if (data.data && data.data.length > 0) {
            data.data.forEach(anime => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <div style="display: flex; align-items: center;">
                        <img src="${anime.images?.jpg?.image_url || 'https://via.placeholder.com/40x60?text=No+Image'}" alt="${anime.title}">
                        <div>
                            <div style="font-weight: 600;">${anime.title}</div>
                            <small>${anime.type} • ${anime.episodes || '?'} eps • Score: ${anime.score || 'N/A'}</small>
                        </div>
                    </div>
                `;
                item.addEventListener('click', () => {
                    selectAnimeFromSearch(anime);
                });
                searchResults.appendChild(item);
            });
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '<div style="padding: 10px; text-align: center;">No results found</div>';
            searchResults.style.display = 'block';
        }
    } catch (error) {
        console.error('Error searching anime:', error);
        searchResults.innerHTML = '<div style="padding: 10px; text-align: center;">Error loading results</div>';
        searchResults.style.display = 'block';
    } finally {
        searchLoading.style.display = 'none';
    }
}

// Select anime from search results
function selectAnimeFromSearch(anime) {
    const englishTitle = anime.title_english || anime.title;
    animeTitleInput.value = englishTitle;
    const typeSelect = document.getElementById('animeType');
    typeSelect.value = anime.type || 'TV';

    // Set duration based on type
    const durationInput = document.getElementById('animeDuration');
    if (typeSelect.value === 'Movie') {
        durationInput.value = anime.duration ? Math.round(anime.duration) : '120';
        durationInput.readOnly = false;
    } else {
        durationInput.value = '20';
        durationInput.readOnly = true;
    }

    document.getElementById('animeEpisodes').value = anime.episodes || 1;
    animeCoverInput.value = anime.images?.jpg?.image_url || '';

    const unwantedGenres = ['Award Winning'];
    const genres = anime.genres
        ? anime.genres
            .filter(g => !unwantedGenres.includes(g.name))
            .map(g => g.name)
            .join(', ')
        : '';

    animeGenresInput.value = genres;
    document.getElementById('animeScore').value = anime.score || '';
    searchResults.style.display = 'none';
}

// Update statistics
function updateStats() {
    // Update current month name
    document.getElementById('current-month').textContent = getCurrentMonth();

    // Calculate and update monthly stats from user data
    const monthlyStats = calculateMonthlyStats();

    // Update DOM elements with actual user data
    document.getElementById('completed-count').textContent = monthlyStats.completed;
    document.getElementById('movies-count').textContent = monthlyStats.movies;
    document.getElementById('episodes-count').textContent = monthlyStats.episodes;
    document.getElementById('total-hours-count').textContent = monthlyStats.hours;

    // Update stat cards with percentage changes based on user data
    updateStatCardsWithChanges();
}

// Initialize charts
function initCharts() {
    // Monthly Progress Chart
    const monthlyProgressCtx = document.getElementById('monthlyProgressChart').getContext('2d');
    monthlyProgressChart = new Chart(monthlyProgressCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Anime Completed',
                data: calculateMonthlyProgress(),
                backgroundColor: 'rgba(106, 90, 205, 0.7)',
                borderColor: 'rgba(106, 90, 205, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-light')
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--gray')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-light')
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // Genre Distribution Chart (Current Month Only)
    const genreDistributionCtx = document.getElementById('genreDistributionChart').getContext('2d');
    genreDistributionChart = new Chart(genreDistributionCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(calculateGenreDistribution()),
            datasets: [{
                data: Object.values(calculateGenreDistribution()),
                backgroundColor: [
                    '#6a5acd', '#9370db', '#20b2aa', '#ff7f50', '#48bb78', '#f56565', '#ed8936', '#4299e1'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: getCurrentMonth() + ' Distribution',
                    color: getComputedStyle(document.body).getPropertyValue('--text')
                }
            }
        }
    });

    // Initialize other charts for statistics page
    initStatisticsCharts();
}

// Calculate monthly progress data
function calculateMonthlyProgress() {
    const monthlyData = Array(12).fill(0);
    const now = new Date();
    const currentYear = now.getFullYear();

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed' && anime.finishDate) {
            const [yearStr, monthStr] = anime.finishDate.split('-');
            const year = parseInt(yearStr, 10);
            const monthIndex = parseInt(monthStr, 10) - 1;

            // Skip invalid months or years in the future
            if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return;

            // Only count anime for the current year
            if (year === currentYear) {
                monthlyData[monthIndex]++;
            }
        }
    });

    return monthlyData;
}

// Calculate genre distribution for current month
function calculateGenreDistribution() {
    const genreCount = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    animeData.forEach(anime => {
        if (anime.genres && anime.finishDate) {
            const finishDate = new Date(anime.finishDate);
            // Check if anime was completed in current month and year
            if (finishDate.getMonth() === currentMonth &&
                finishDate.getFullYear() === currentYear) {

                anime.genres.forEach(genre => {
                    genreCount[genre] = (genreCount[genre] || 0) + 1;
                });
            }
        }
    });

    return genreCount;
}

// Calculate yearly completion
function calculateYearlyCompletion() {
    const yearlyData = [0, 0, 0, 0, 0, 0]; // 2023-2028

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed' && anime.finishDate) {
            const finishDate = new Date(anime.finishDate);
            const year = finishDate.getFullYear();
            const index = year - 2023;

            if (index >= 0 && index < 6) {
                yearlyData[index]++;
            }
        }
    });

    return yearlyData;
}

// Calculate score distribution
function calculateScoreDistribution() {
    const scoreRanges = [0, 0, 0, 0, 0, 0]; // 10, 9, 8, 7, 6, 5 or less

    animeData.forEach(anime => {
        if (anime.score) {
            if (anime.score === 10) scoreRanges[0]++;
            else if (anime.score >= 9) scoreRanges[1]++;
            else if (anime.score >= 8) scoreRanges[2]++;
            else if (anime.score >= 7) scoreRanges[3]++;
            else if (anime.score >= 6) scoreRanges[4]++;
            else scoreRanges[5]++;
        }
    });

    return scoreRanges;
}

// Update all charts with current data
function updateCharts() {
    if (monthlyProgressChart) {
        monthlyProgressChart.data.datasets[0].data = calculateMonthlyProgress();
        monthlyProgressChart.update();
    }

    if (genreDistributionChart) {
        const genreData = calculateGenreDistribution();
        genreDistributionChart.data.labels = Object.keys(genreData);
        genreDistributionChart.data.datasets[0].data = Object.values(genreData);

        // Update chart title with current month
        genreDistributionChart.options.plugins.title.text = getCurrentMonth() + ' Distribution';
        genreDistributionChart.update();
    }

    // Update statistics charts if they exist
    if (completionChart) {
        completionChart.data.datasets[0].data = calculateYearlyCompletion();
        completionChart.update();
    }

    if (scoreDistributionChart) {
        scoreDistributionChart.data.datasets[0].data = calculateScoreDistribution();
        scoreDistributionChart.update();
    }

    if (statusDistributionChart) {
        const statusData = calculateStatusDistribution();
        statusDistributionChart.data.labels = Object.keys(statusData);
        statusDistributionChart.data.datasets[0].data = Object.values(statusData);
        statusDistributionChart.update();
    }

    if (typeDistributionChart) {
        const typeData = calculateTypeDistribution();
        typeDistributionChart.data.labels = Object.keys(typeData);
        typeDistributionChart.data.datasets[0].data = Object.values(typeData);
        typeDistributionChart.update();
    }

    if (genreStatsChart) {
        const genreStats = calculateGenreStats();
        genreStatsChart.data.labels = Object.keys(genreStats);
        genreStatsChart.data.datasets[0].data = Object.values(genreStats);
        genreStatsChart.update();
    }

    // Update new charts
    if (episodesOverTimeChart) {
        episodesOverTimeChart.data.datasets[0].data = calculateEpisodesOverTime();
        episodesOverTimeChart.update();
    }

    if (watchTimeByMonthChart) {
        watchTimeByMonthChart.data.datasets[0].data = calculateWatchTimeByMonth();
        watchTimeByMonthChart.update();
    }
}

// Update top rated anime
function updateTopRatedAnime() {
    const topRatedContainer = document.getElementById('top-rated-anime');

    // Filter anime with ratings and sort by rating (highest first)
    const topRatedAnime = animeData
        .filter(anime => anime.score && anime.score >= 8)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

    if (topRatedAnime.length === 0) {
        topRatedContainer.innerHTML = '<div class="no-anime">No highly rated anime yet. Rate some anime to see them here!</div>';
        return;
    }

    topRatedContainer.innerHTML = topRatedAnime.map(anime => `
                <div class="anime-card">
                    <img src="${anime.cover || 'https://via.placeholder.com/300x400/6a5acd/ffffff?text=No+Image'}" alt="${anime.title}" class="anime-cover">
                    <div class="anime-badge">${anime.score}</div>
                    <div class="anime-info">
                        <div class="anime-title">${anime.title}</div>
                        <div class="anime-meta">
                            <span>${anime.type || 'TV'}</span>
                            <span class="anime-score"> ${anime.score}</span>
                        </div>
                    </div>
                </div>
            `).join('');
}

// Log activity
function logActivity(action, animeTitle, timestamp) {
    const activity = {
        id: Date.now(),
        action,
        animeTitle,
        timestamp: timestamp || new Date().toISOString()
    };

    activityLog.unshift(activity);

    // Keep only the last 50 activities
    if (activityLog.length > 50) {
        activityLog = activityLog.slice(0, 50);
    }

    localStorage.setItem('activityLog', JSON.stringify(activityLog));
    updateRecentActivity();
}

// Update recent activity
function updateRecentActivity() {
    const activityContainer = document.getElementById('recent-activity');

    if (activityLog.length === 0) {
        activityContainer.innerHTML = '<div class="no-activity">No recent activity. Add or update anime to see activity here.</div>';
        return;
    }

    activityContainer.innerHTML = activityLog.slice(0, 6).map(activity => {
        let activityText = '';
        let iconClass = '';

        switch (activity.action) {
            case 'added':
                activityText = `Added ${activity.animeTitle} to your list`;
                iconClass = 'added';
                break;
            case 'completed':
                activityText = `Completed ${activity.animeTitle}`;
                iconClass = 'completed';
                break;
            case 'watching':
                activityText = `Started watching ${activity.animeTitle}`;
                iconClass = 'watching';
                break;
            case 'edited':
                activityText = `Updated ${activity.animeTitle}`;
                iconClass = 'edited';
                break;
            case 'deleted':
                activityText = `Removed ${activity.animeTitle} from your list`;
                iconClass = 'deleted';
                break;
            default:
                activityText = `Updated ${activity.animeTitle}`;
                iconClass = 'edited';
        }

        return `
                    <div class="activity-item">
                        <div class="activity-icon ${iconClass}">
                            <i class="fas fa-${iconClass === 'added' ? 'plus' : iconClass === 'completed' ? 'check' : iconClass === 'watching' ? 'play' : iconClass === 'edited' ? 'edit' : 'trash'}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-anime">${activity.animeTitle}</div>
                            <div class="activity-desc">${activityText}</div>
                        </div>
                        <div class="activity-time">${formatTimeAgo(activity.timestamp)}</div>
                    </div>
                `;
    }).join('');
}

// Update anime display
function updateAnimeDisplay() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const sortFilter = document.getElementById('sortFilter')?.value || 'id';
    const monthFilter = document.getElementById('monthFilter')?.value || 'all';
    const yearFilter = document.getElementById('yearFilter')?.value || 'all';

    let filteredAnime = [...animeData];

    // ✅ Month/year filtering logic (handles "All Status" properly)
    if (monthFilter !== 'all' || yearFilter !== 'all') {
        filteredAnime = filteredAnime.filter(anime => {
            const dateToCheck = anime.finishDate || anime.updatedAt || anime.createdAt;
            if (!dateToCheck) return false;

            const [year, month] = dateToCheck.split('-');

            if (monthFilter !== 'all' && month !== monthFilter) return false;
            if (yearFilter !== 'all' && year !== yearFilter) return false;

            if (statusFilter === 'all') return true;
            return anime.userStatus === statusFilter;
        });
    } else {
        // ✅ Apply only status filter if no month/year filter
        if (statusFilter !== 'all') {
            filteredAnime = filteredAnime.filter(a => a.userStatus === statusFilter);
        }
    }

    // ✅ Sorting logic
    if (sortFilter === 'title') {
        filteredAnime.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortFilter === 'rating') {
        filteredAnime.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortFilter === 'episodes') {
        filteredAnime.sort((a, b) => (b.episodes || 0) - (a.episodes || 0));
    } else if (sortFilter === 'updated') {
        filteredAnime.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    }

    // ✅ Update the anime counter after rendering
    const countEl = document.getElementById('anime-count');
    if (countEl) {
        countEl.textContent = `Total Anime: ${filteredAnime.length}`;
    }
    // ✅ Update the anime table
    updateAnimeTableView(filteredAnime);
}

// Update anime table view
function updateAnimeTableView(animeList) {
    const tableBody = document.getElementById('anime-table-body');

    if (animeList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-anime">No anime found matching your filters. Add some anime to get started!</td></tr>';
        return;
    }

    tableBody.innerHTML = animeList.map(anime => {
        // Handle different status classes
        let statusClass = '';
        let statusText = anime.userStatus || 'Unknown';

        switch (anime.userStatus) {
            case 'Completed':
                statusClass = 'badge-completed';
                break;
            case 'Watching':
                statusClass = 'badge-watching';
                break;
            case 'Plan to Watch':
                statusClass = 'badge-plan';
                break;
            case 'Dropped':
                statusClass = 'badge-dropped';
                break;
            default:
                statusClass = 'badge-plan';
        }

        // Format completion date
        let completionDate = '-';
        if (anime.finishDate) {
            const date = new Date(anime.finishDate);
            completionDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        return `
            <tr data-id="${anime.id}" onclick="event.stopPropagation(); editAnime('${anime.id}')">
        <td><img src="${anime.cover || 'https://via.placeholder.com/50x70/6a5acd/ffffff?text=No+Image'}" alt="${anime.title}"></td>
        <td>
            <div class="anime-title">${anime.title}</div>
            ${anime.genres && anime.genres.length > 0 ?
                `<div class="anime-genres">${anime.genres.slice(0, 3).join(', ')}</div>` :
                ''}
        </td>
        <td>${anime.type || 'TV'}</td>
        <td class="anime-progress">${anime.progress || 0}/${anime.episodes || '?'}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td>${anime.score ? `<span class="anime-score"> ${anime.score}</span>` : '-'}</td>
        <td class="completion-date">${completionDate}</td>
    </tr>
`;
    }).join('');
}

// Edit anime - Fixed version
function editAnime(id) {
    const anime = animeData.find(a => a.id == id);
    if (!anime) return;

    isEditing = true;
    currentEditId = id;

    // Populate form with anime data
    document.getElementById('animeId').value = anime.id;
    document.getElementById('animeTitle').value = anime.title;
    document.getElementById('animeType').value = anime.type;
    document.getElementById('animeEpisodes').value = anime.episodes;
    document.getElementById('animeDuration').value = anime.duration || (anime.type === 'Movie' ? 120 : 20);
    document.getElementById('animeStatus').value = anime.userStatus;
    document.getElementById('animeProgress').value = anime.progress;
    document.getElementById('animeScore').value = anime.score || '';
    document.getElementById('animeCover').value = anime.cover || '';
    document.getElementById('animeGenres').value = anime.genres ? anime.genres.join(', ') : '';

    // Set finish date if exists
    if (anime.finishDate) {
        const finishDate = new Date(anime.finishDate);
        document.getElementById('animeYear').value = finishDate.getFullYear().toString();
        document.getElementById('animeMonth').value = (finishDate.getMonth() + 1).toString().padStart(2, '0');
    } else {
        // Set current date as default
        const now = new Date();
        document.getElementById('animeYear').value = now.getFullYear().toString();
        document.getElementById('animeMonth').value = (now.getMonth() + 1).toString().padStart(2, '0');
    }

    // Set duration input readonly based on type
    const durationInput = document.getElementById('animeDuration');
    if (anime.type === 'Movie') {
        durationInput.readOnly = false;
    } else {
        durationInput.readOnly = true;
    }

    // Update button text and show delete button
    submitBtn.textContent = 'Update Anime';
    deleteBtn.style.display = 'inline-block';

    // Show modal
    addAnimeModal.style.display = 'flex';

    // Close search results if open
    searchResults.style.display = 'none';
}

// Delete anime - Fixed version
function deleteAnime() {
    if (!currentEditId) return;

    if (!confirm('Are you sure you want to delete this anime?')) return;

    const anime = animeData.find(a => a.id == currentEditId);
    if (anime) {
        logActivity("deleted", anime.title);
    }

    animeData = animeData.filter(a => a.id != currentEditId);
    saveData();

    addAnimeModal.style.display = 'none';
    animeForm.reset();
    searchResults.style.display = 'none';
    searchResults.innerHTML = '';

    isEditing = false;
    currentEditId = null;
    submitBtn.textContent = 'Add Anime';
    deleteBtn.style.display = 'none';

    // Reset filters to show all statuses
    document.getElementById('statusFilter').value = 'all';

    // Refresh everything
    updateAllComponents();

    showToast('Anime deleted successfully!', 'success');
}

// Handle adding/updating anime
function handleAddAnime(e) {
    e.preventDefault();

    const title = document.getElementById('animeTitle').value;
    const type = document.getElementById('animeType').value;
    const episodes = parseInt(document.getElementById('animeEpisodes').value);
    let duration = parseInt(document.getElementById('animeDuration').value);
    const status = document.getElementById('animeStatus').value;
    const progress = parseInt(document.getElementById('animeProgress').value);
    const score = document.getElementById('animeScore').value ? parseFloat(document.getElementById('animeScore').value) : null;
    const year = document.getElementById('animeYear').value;
    const month = document.getElementById('animeMonth').value;
    const cover = document.getElementById('animeCover').value || 'https://via.placeholder.com/150x200?text=No+Image';
    const genres = document.getElementById('animeGenres').value.split(',').map(g => g.trim()).filter(g => g);

    // For non-movie types, force duration to 20 minutes
    if (type !== 'Movie') {
        duration = 20;
    }

    let finishDate = null;
    let completedTimestamp = null;

    // Only set finish date if status is Completed
    if (status === 'Completed') {
        finishDate = `${year}-${month}-01`;
        completedTimestamp = Date.now();
    }

    let action = "added";

    if (isEditing && currentEditId) {
        const index = animeData.findIndex(a => a.id == currentEditId);
        if (index !== -1) {
            action = "edited";
            animeData[index] = {
                ...animeData[index],
                title,
                type,
                episodes,
                duration,
                userStatus: status, // Make sure this is set correctly
                progress,
                score,
                genres,
                finishDate,
                completedTimestamp: status === 'Completed' ? completedTimestamp : null,
                cover,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        const newAnime = {
            id: animeData.length > 0 ? Math.max(...animeData.map(a => a.id)) + 1 : 1,
            title,
            type,
            episodes,
            duration,
            userStatus: status, // Make sure this is set correctly
            progress,
            score,
            genres,
            finishDate,
            completedTimestamp,
            cover,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        animeData.push(newAnime);
    }

    saveData();
    // Log the activity
    if (status === 'Completed') {
        logActivity("completed", title);
    } else if (action === "added") {
        logActivity("added", title);
    } else {
        logActivity("edited", title);
    }

    addAnimeModal.style.display = 'none';
    animeForm.reset();
    searchResults.style.display = 'none';
    searchResults.innerHTML = '';

    const wasEditing = isEditing;

    isEditing = false;
    currentEditId = null;
    submitBtn.textContent = 'Add Anime';
    deleteBtn.style.display = 'none';

    // ✅ Refresh everything (table, charts, stats)
    updateAllComponents();

    // ✅ Show correct success message
    showToast(wasEditing ? 'Anime updated successfully!' : 'Anime added successfully!', 'success');
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('animeData', JSON.stringify(animeData));
}

// Update all components
function updateAllComponents() {
    updateStats();
    updateCharts();
    updateTopRatedAnime();
    updateCurrentMonthAnime();
    updateRecentActivity();
    updateAnimeDisplay();
    updateTotalAnimeCountAllMonths();
    updateSidebarUserInfo();

    // Update statistics if on statistics page
    if (document.getElementById('statistics-page').classList.contains('active')) {
        initStatisticsCharts();
        updateStatisticsTables();
    }
}

// JSON + PDF Export
function exportData() {
    if (!animeData.length) {
        showToast("No data to export.", "error");
        return;
    }

    // Export JSON
    const blob = new Blob([JSON.stringify(animeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'My Anime List.json';
    link.click();
    URL.revokeObjectURL(url);

    showToast('Data exported successfully!', 'success');
}

// Import JSON File
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) throw new Error("Invalid file format");

            animeData = imported;
            localStorage.setItem('animeData', JSON.stringify(animeData));

            // Log import activity
            logActivity("imported", "anime collection");

            updateAllComponents();

            importModal.style.display = 'none';
            showToast("Import successful!", "success");
        } catch (err) {
            showToast("Import failed: " + err.message, "error");
        }
    };
    reader.readAsText(file);
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.body.setAttribute('data-theme', newTheme);
    updateThemeToggleIcon(newTheme);

    // Save theme preference
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    settings.theme = newTheme;
    localStorage.setItem('appSettings', JSON.stringify(settings));
}

// Update theme toggle icon
function updateThemeToggleIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : type === 'warning' ? 'exclamation-triangle' : 'info'}-circle"></i>
                <span>${message}</span>
            `;

    toastContainer.appendChild(toast);

    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Utility functions
function formatTimeAgo(dateString) {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
}

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('appSettings') ?
        JSON.parse(localStorage.getItem('appSettings')).theme : 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
}

// Update current date display
function updateCurrentDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const formattedDate = now.toLocaleDateString('en-US', options);
    document.getElementById('currentDate').textContent = formattedDate;
}

// User name management
function getUserName() {
    return localStorage.getItem('userName');
}

function setUserName(name) {
    localStorage.setItem('userName', name);
    updateUserNameDisplay(name);
}

function updateUserNameDisplay(name) {
    const userNameElement = document.querySelector('.user-profile span');
    const userAvatar = document.querySelector('.user-avatar');

    if (userNameElement) {
        userNameElement.textContent = name;
    }

    // Update avatar with user's name
    if (userAvatar) {
        const encodedName = encodeURIComponent(name);
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodedName}&background=6a5acd&color=fff`;
    }
}

function showNameEntryModal() {
    const nameEntryModal = document.getElementById('nameEntryModal');
    nameEntryModal.style.display = 'flex';

    // Focus on input field
    document.getElementById('userNameInput').focus();
}

function hideNameEntryModal() {
    const nameEntryModal = document.getElementById('nameEntryModal');
    nameEntryModal.style.display = 'none';
}

function initializeUserName() {
    const savedName = getUserName();

    if (!savedName) {
        // Show name entry modal if no name is saved
        showNameEntryModal();
    } else {
        // Use saved name
        updateUserNameDisplay(savedName);
    }
}

// Handle name entry form submission
document.getElementById('nameEntryForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const userNameInput = document.getElementById('userNameInput');
    const name = userNameInput.value.trim();

    if (name) {
        setUserName(name);
        hideNameEntryModal();
        showToast(`Welcome, ${name}!`, 'success');
    }
});

// Calculate total watch time in hours
function calculateTotalHours() {
    let totalMinutes = 0;

    animeData.forEach(anime => {
        if (anime.type === 'Movie') {
            // For movies, use the duration directly
            totalMinutes += anime.duration || 0;
        } else {
            // For TV series, calculate based on episodes watched
            const episodesWatched = anime.progress || 0;
            const episodeDuration = anime.duration || 20; // Default 20 minutes per episode
            totalMinutes += episodesWatched * episodeDuration;
        }
    });

    // Convert minutes to hours and round to 1 decimal place
    return (totalMinutes / 60).toFixed(1);
}

// Get current month name
function getCurrentMonth() {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    return months[now.getMonth()];
}

// Calculate monthly stats
function calculateMonthlyStats() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let monthlyHours = 0;
    let monthlyCompleted = 0;
    let monthlyMovies = 0;
    let monthlyEpisodes = 0;

    animeData.forEach(anime => {
        const finishDate = anime.finishDate ? new Date(anime.finishDate) : null;

        // Check if anime was completed this month
        if (finishDate &&
            finishDate.getMonth() === currentMonth &&
            finishDate.getFullYear() === currentYear) {

            // Calculate hours for this anime
            if (anime.type === 'Movie') {
                monthlyHours += (anime.duration || 0) / 60;
                monthlyMovies++;
            } else {
                const episodeDuration = anime.duration || 20;
                monthlyHours += ((anime.episodes || 0) * episodeDuration) / 60;
                monthlyEpisodes += anime.episodes || 0;
            }

            if (anime.userStatus === 'Completed') {
                monthlyCompleted++;
            }
        }
    });

    return {
        hours: monthlyHours.toFixed(1),
        completed: monthlyCompleted,
        movies: monthlyMovies,
        episodes: monthlyEpisodes
    };
}

// Calculate percentage changes for monthly stats based on user data
function calculateStatChanges() {
    const currentStats = calculateMonthlyStats();
    const previousStats = getPreviousMonthlyStatsFromUserData();

    const changes = {};

    // Calculate percentage change for each metric
    changes.completed = calculatePercentageChange(previousStats.completed, currentStats.completed);
    changes.movies = calculatePercentageChange(previousStats.movies, currentStats.movies);
    changes.episodes = calculatePercentageChange(previousStats.episodes, currentStats.episodes);
    changes.hours = calculatePercentageChange(previousStats.hours, currentStats.hours);

    return changes;
}

// Get previous month's stats from actual user data
function getPreviousMonthlyStatsFromUserData() {
    const now = new Date();
    let prevYear = now.getFullYear();
    let prevMonth = now.getMonth() - 1;

    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear--;
    }

    return calculateStatsForMonth(prevYear, prevMonth);
}

// Calculate stats for a specific month and year
function calculateStatsForMonth(year, month) {
    let monthlyHours = 0;
    let monthlyCompleted = 0;
    let monthlyMovies = 0;
    let monthlyEpisodes = 0;

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed' && anime.finishDate) {
            const finishDate = new Date(anime.finishDate);
            const finishYear = finishDate.getFullYear();
            const finishMonth = finishDate.getMonth();

            // Check if anime was completed in the specified month and year
            if (finishYear === year && finishMonth === month) {
                // Calculate hours for this anime
                if (anime.type === 'Movie') {
                    monthlyHours += (anime.duration || 0) / 60;
                    monthlyMovies++;
                } else {
                    const episodeDuration = anime.duration || 20;
                    monthlyHours += ((anime.episodes || 0) * episodeDuration) / 60;
                    monthlyEpisodes += anime.episodes || 0;
                }
                monthlyCompleted++;
            }
        }
    });

    return {
        hours: parseFloat(monthlyHours.toFixed(1)),
        completed: monthlyCompleted,
        movies: monthlyMovies,
        episodes: monthlyEpisodes
    };
}

// Helper function to calculate percentage change
function calculatePercentageChange(previous, current) {
    if (previous === 0 && current === 0) {
        return {
            percentage: 0,
            isPositive: true,
            isNeutral: true,
            text: 'No data'
        };
    }

    if (previous === 0 && current > 0) {
        return {
            percentage: 100,
            isPositive: true,
            isNeutral: false,
            text: 'New activity'
        };
    }

    if (current === 0 && previous > 0) {
        return {
            percentage: -100,
            isPositive: false,
            isNeutral: false,
            text: 'No activity this month'
        };
    }

    const percentage = ((current - previous) / previous) * 100;
    const isPositive = percentage >= 0;
    const absPercentage = Math.abs(percentage).toFixed(1);

    let text = '';
    if (Math.abs(percentage) < 1) {
        text = 'No change';
        return {
            percentage: 0,
            isPositive: true,
            isNeutral: true,
            text: text
        };
    } else {
        const direction = isPositive ? 'more' : 'less';
        text = `${absPercentage}% ${direction}`;
    }

    return {
        percentage: parseFloat(absPercentage),
        isPositive,
        isNeutral: false,
        text: text
    };
}

// Update stat cards with percentage changes
function updateStatCardsWithChanges() {
    const changes = calculateStatChanges();

    // Update each stat card with the change indicator
    updateSingleStatCard('completed', changes.completed);
    updateSingleStatCard('movies', changes.movies);
    updateSingleStatCard('episodes', changes.episodes);
    updateSingleStatCard('hours', changes.hours);
}

// Update a single stat card with change indicator
function updateSingleStatCard(statName, change) {
    const changeElement = document.getElementById(`${statName}-change`);
    if (!changeElement) return;

    // Clear existing content and classes
    changeElement.innerHTML = '';
    changeElement.className = 'stat-change';

    // Add appropriate class based on change type
    if (change.isNeutral) {
        changeElement.classList.add('neutral');
    } else if (change.isPositive) {
        changeElement.classList.add('positive');
    } else {
        changeElement.classList.add('negative');
    }

    // Create icon and text
    let iconClass = 'fas fa-minus';
    if (!change.isNeutral) {
        iconClass = change.isPositive ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
    }

    changeElement.innerHTML = `<i class="${iconClass}"></i> <span>${change.text}</span>`;
}

// Initialize sample data
function initializeSampleData() {
    // Add sample anime data if none exists
    if (animeData.length === 0) {
        const sampleAnime = [
            {
                id: 1,
                title: "Demon Slayer: Kimetsu no Yaiba",
                type: "TV",
                episodes: 26,
                duration: 20,
                userStatus: "Completed",
                progress: 26,
                score: 9.0,
                genres: ["Action", "Fantasy", "Supernatural"],
                finishDate: "2025-10-15",
                cover: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 2,
                title: "Your Name",
                type: "Movie",
                episodes: 1,
                duration: 120,
                userStatus: "Completed",
                progress: 1,
                score: 9.5,
                genres: ["Romance", "Supernatural", "Drama"],
                finishDate: "2025-10-10",
                cover: "https://cdn.myanimelist.net/images/anime/5/87048.jpg",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        animeData = sampleAnime;
        saveData();

        // Log sample activities
        logActivity("added", "Demon Slayer: Kimetsu no Yaiba");
        logActivity("completed", "Demon Slayer: Kimetsu no Yaiba");
        logActivity("added", "Your Name");
        logActivity("completed", "Your Name");
    }
}

// Add these functions to calculate detailed statistics
function calculateStatistics() {
    return {
        totalAnime: animeData.length,
        totalHours: calculateTotalHours(),
        averageScore: calculateAverageScore(),
        completionRate: calculateCompletionRate(),
        statusDistribution: calculateStatusDistribution(),
        typeDistribution: calculateTypeDistribution(),
        genreStats: calculateGenreStats(),
        yearlyBreakdown: calculateYearlyBreakdown(),
        scoreAnalysis: calculateScoreAnalysis()
    };
}

function calculateAverageScore() {
    const ratedAnime = animeData.filter(anime => anime.score && anime.score > 0);
    if (ratedAnime.length === 0) return 0;

    const totalScore = ratedAnime.reduce((sum, anime) => sum + anime.score, 0);
    return (totalScore / ratedAnime.length).toFixed(1);
}

function calculateCompletionRate() {
    if (animeData.length === 0) return 0;
    const completed = animeData.filter(anime => anime.userStatus === 'Completed').length;
    return Math.round((completed / animeData.length) * 100);
}

function calculateStatusDistribution() {
    const distribution = {
        'Completed': 0,
        'Watching': 0,
        'Plan to Watch': 0,
        'Dropped': 0
    };

    animeData.forEach(anime => {
        if (distribution.hasOwnProperty(anime.userStatus)) {
            distribution[anime.userStatus]++;
        }
    });

    return distribution;
}

function calculateTypeDistribution() {
    const distribution = {};

    animeData.forEach(anime => {
        const type = anime.type || 'TV';
        distribution[type] = (distribution[type] || 0) + 1;
    });

    return distribution;
}

function calculateGenreStats() {
    const genreCount = {};

    animeData.forEach(anime => {
        if (anime.genres && Array.isArray(anime.genres)) {
            anime.genres.forEach(genre => {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
        }
    });

    // Sort by count and return top 10
    return Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [genre, count]) => {
            obj[genre] = count;
            return obj;
        }, {});
}

function calculateYearlyBreakdown() {
    const yearlyData = {};
    const currentYear = new Date().getFullYear();

    for (let year = 2020; year <= currentYear; year++) {
        yearlyData[year] = 0;
    }

    animeData.forEach(anime => {
        if (anime.finishDate) {
            const finishYear = new Date(anime.finishDate).getFullYear();
            if (yearlyData.hasOwnProperty(finishYear)) {
                yearlyData[finishYear]++;
            }
        }
    });

    return yearlyData;
}

function calculateScoreAnalysis() {
    const analysis = {
        totalRated: 0,
        average: 0,
        highest: { score: 0, title: '' },
        lowest: { score: 10, title: '' },
        scoreCounts: { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, '5 or less': 0 }
    };

    let totalScore = 0;
    let ratedCount = 0;

    animeData.forEach(anime => {
        if (anime.score && anime.score > 0) {
            ratedCount++;
            totalScore += anime.score;

            // Update highest score
            if (anime.score > analysis.highest.score) {
                analysis.highest = { score: anime.score, title: anime.title };
            }

            // Update lowest score
            if (anime.score < analysis.lowest.score) {
                analysis.lowest = { score: anime.score, title: anime.title };
            }

            // Count scores by range
            if (anime.score === 10) analysis.scoreCounts[10]++;
            else if (anime.score >= 9) analysis.scoreCounts[9]++;
            else if (anime.score >= 8) analysis.scoreCounts[8]++;
            else if (anime.score >= 7) analysis.scoreCounts[7]++;
            else if (anime.score >= 6) analysis.scoreCounts[6]++;
            else analysis.scoreCounts['5 or less']++;
        }
    });

    analysis.totalRated = ratedCount;
    analysis.average = ratedCount > 0 ? (totalScore / ratedCount).toFixed(1) : 0;

    return analysis;
}

// Initialize additional charts
function initStatisticsCharts() {
    // Completion Chart
    const completionCtx = document.getElementById('completionChart')?.getContext('2d');
    if (completionCtx) {
        completionChart = new Chart(completionCtx, {
            type: 'bar',
            data: {
                labels: ['2023', '2024', '2025', '2026', '2027', '2028'],
                datasets: [{
                    label: 'Anime Completed',
                    data: calculateYearlyCompletion(),
                    backgroundColor: '#6a5acd'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Score Distribution Chart
    const scoreDistributionCtx = document.getElementById('scoreDistributionChart')?.getContext('2d');
    if (scoreDistributionCtx) {
        scoreDistributionChart = new Chart(scoreDistributionCtx, {
            type: 'polarArea',
            data: {
                labels: ['10', '9', '8', '7', '6', '5 or less'],
                datasets: [{
                    data: calculateScoreDistribution(),
                    backgroundColor: [
                        '#6a5acd', '#beca1cff', '#20b2aa', '#ff7f50', '#48bb78', '#f56565'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    // Status Distribution Chart
    const statusCtx = document.getElementById('statusDistributionChart')?.getContext('2d');
    if (statusCtx) {
        statusDistributionChart = new Chart(statusCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(calculateStatusDistribution()),
                datasets: [{
                    data: Object.values(calculateStatusDistribution()),
                    backgroundColor: [
                        '#48bb78', // Completed - green
                        '#4299e1', // Watching - blue
                        '#ed8936', // Plan to Watch - orange
                        '#f56565'  // Dropped - red
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    // Type Distribution Chart
    const typeCtx = document.getElementById('typeDistributionChart')?.getContext('2d');
    if (typeCtx) {
        typeDistributionChart = new Chart(typeCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(calculateTypeDistribution()),
                datasets: [{
                    data: Object.values(calculateTypeDistribution()),
                    backgroundColor: [
                        '#6a5acd', '#9370db', '#20b2aa', '#ff7f50', '#48bb78'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    // Genre Stats Chart
    const genreCtx = document.getElementById('genreStatsChart')?.getContext('2d');
    if (genreCtx) {
        const genreStats = calculateGenreStats();
        genreStatsChart = new Chart(genreCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(genreStats),
                datasets: [{
                    label: 'Number of Anime',
                    data: Object.values(genreStats),
                    backgroundColor: 'rgba(106, 90, 205, 0.7)',
                    borderColor: 'rgba(106, 90, 205, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-light')
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--gray')
                        }
                    },
                    y: {
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-light')
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Initialize new charts
    initNewCharts();
}

// Initialize new charts
function initNewCharts() {
    // Episodes Watched Over Time Chart
    const episodesOverTimeCtx = document.getElementById('episodesOverTimeChart')?.getContext('2d');
    if (episodesOverTimeCtx) {
        episodesOverTimeChart = new Chart(episodesOverTimeCtx, {
            type: 'line',
            data: {
                labels: calculateMonthlyLabels(),
                datasets: [{
                    label: 'Episodes Watched',
                    data: calculateEpisodesOverTime(),
                    backgroundColor: 'rgba(106, 90, 205, 0.1)',
                    borderColor: 'rgba(106, 90, 205, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-light')
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--gray')
                        }
                    },
                    x: {
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-light')
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Watch Time by Month Chart
    const watchTimeByMonthCtx = document.getElementById('watchTimeByMonthChart')?.getContext('2d');
    if (watchTimeByMonthCtx) {
        watchTimeByMonthChart = new Chart(watchTimeByMonthCtx, {
            type: 'line',
            data: {
                labels: calculateMonthlyLabels(),
                datasets: [{
                    label: 'Watch Time (Hours)',
                    data: calculateWatchTimeByMonth(),
                    backgroundColor: 'rgba(32, 178, 170, 0.1)',
                    borderColor: 'rgba(32, 178, 170, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-light')
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--gray')
                        }
                    },
                    x: {
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-light')
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Average Score by Genre Chart
    const avgScoreByGenreCtx = document.getElementById('avgScoreByGenreChart')?.getContext('2d');
    if (avgScoreByGenreCtx) {
        const genreScores = {};

        animeData.forEach(anime => {
            if (anime.genres && anime.score) {
                anime.genres.forEach(g => {
                    if (!genreScores[g]) genreScores[g] = { total: 0, count: 0 };
                    genreScores[g].total += anime.score;
                    genreScores[g].count++;
                });
            }
        });

        const avgScores = Object.keys(genreScores).map(g => (genreScores[g].total / genreScores[g].count).toFixed(1));

        new Chart(avgScoreByGenreCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(genreScores),
                datasets: [{
                    label: 'Average Score',
                    data: avgScores,
                    backgroundColor: 'rgba(106, 90, 205, 0.7)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-light')
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--gray')
                        }
                    },
                    y: {
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-light')
                        }
                    }
                }
            }
        });
    }

    // Completion Rate by Year Chart
    const completionRateCtx = document.getElementById('completionRateByYearChart')?.getContext('2d');
    if (completionRateCtx) {
        // Collect data
        const yearStats = {};

        animeData.forEach(anime => {
            if (anime.finishDate) {
                const year = new Date(anime.finishDate).getFullYear();
                if (!yearStats[year]) yearStats[year] = { completed: 0, total: 0 };
                yearStats[year].total++;
                if (anime.userStatus === 'Completed') {
                    yearStats[year].completed++;
                }
            }
        });

        const years = Object.keys(yearStats).sort();
        const completionRates = years.map(y => {
            const { completed, total } = yearStats[y];
            return ((completed / total) * 100).toFixed(1);
        });

        // Create chart
        new Chart(completionRateCtx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: completionRates,
                    backgroundColor: 'rgba(106, 90, 205, 0.7)',
                    borderColor: 'rgba(106, 90, 205, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Completion Rate (%)',
                            color: '#aaa'
                        },
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-light')
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--gray')
                        }
                    },
                    x: {
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-light')
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// Calculate monthly labels for charts
function calculateMonthlyLabels() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Return last 12 months
    const labels = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(`${months[date.getMonth()]} ${date.getFullYear()}`);
    }

    return labels;
}

// Calculate episodes watched over time
function calculateEpisodesOverTime() {
    const now = new Date();
    const data = Array(12).fill(0);

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed' && anime.finishDate) {
            const finishDate = new Date(anime.finishDate);
            const finishYear = finishDate.getFullYear();
            const finishMonth = finishDate.getMonth();

            // Check if anime was completed in the last 12 months
            const monthsAgo = (now.getFullYear() - finishYear) * 12 + (now.getMonth() - finishMonth);
            if (monthsAgo >= 0 && monthsAgo < 12) {
                // For TV series, count episodes; for movies, count as 1
                const episodeCount = anime.type === 'Movie' ? 1 : (anime.episodes || 0);
                data[11 - monthsAgo] += episodeCount;
            }
        }
    });

    return data;
}

// Calculate watch time by month
function calculateWatchTimeByMonth() {
    const now = new Date();
    const data = Array(12).fill(0);

    animeData.forEach(anime => {
        if (anime.userStatus === 'Completed' && anime.finishDate) {
            const finishDate = new Date(anime.finishDate);
            const finishYear = finishDate.getFullYear();
            const finishMonth = finishDate.getMonth();

            // Check if anime was completed in the last 12 months
            const monthsAgo = (now.getFullYear() - finishYear) * 12 + (now.getMonth() - finishMonth);
            if (monthsAgo >= 0 && monthsAgo < 12) {
                let watchTime = 0;
                if (anime.type === 'Movie') {
                    watchTime = (anime.duration || 120) / 60; // Convert minutes to hours
                } else {
                    const episodeDuration = anime.duration || 20;
                    watchTime = ((anime.episodes || 0) * episodeDuration) / 60; // Convert minutes to hours
                }
                data[11 - monthsAgo] += watchTime;
            }
        }
    });

    return data.map(hours => parseFloat(hours.toFixed(1)));
}

// Update statistics tables
function updateStatisticsTables() {
    const stats = calculateStatistics();

    // Update overview cards if they exist
    const totalAnimeStats = document.getElementById('total-anime-stats');
    const totalHoursStats = document.getElementById('total-hours-stats');
    const avgScoreStats = document.getElementById('avg-score-stats');
    const completionRate = document.getElementById('completion-rate');

    if (totalAnimeStats) totalAnimeStats.textContent = stats.totalAnime;
    if (totalHoursStats) totalHoursStats.textContent = stats.totalHours;
    if (avgScoreStats) avgScoreStats.textContent = stats.averageScore;
    if (completionRate) completionRate.textContent = stats.completionRate + '%';

    // Update yearly breakdown
    const yearlyBreakdownEl = document.getElementById('yearlyBreakdown');
    if (yearlyBreakdownEl) {
        yearlyBreakdownEl.innerHTML = Object.entries(stats.yearlyBreakdown)
            .map(([year, count]) => `
                <div class="stat-row">
                    <div class="stat-label-small">${year}</div>
                    <div class="stat-progress">
                        <div class="stat-progress-bar" style="width: ${(count / Math.max(...Object.values(stats.yearlyBreakdown))) * 100}%"></div>
                    </div>
                    <div class="stat-value-small">${count}</div>
                </div>
            `).join('');
    }

    // Update score analysis
    const scoreAnalysisEl = document.getElementById('scoreAnalysis');
    if (scoreAnalysisEl) {
        scoreAnalysisEl.innerHTML = `
            <div class="stat-row">
                <div class="stat-label-small">Rated Anime</div>
                <div class="stat-value-small">${stats.scoreAnalysis.totalRated}</div>
            </div>
            <div class="stat-row">
                <div class="stat-label-small">Average Score</div>
                <div class="stat-value-small">${stats.scoreAnalysis.average}</div>
            </div>
            <div class="stat-row">
                <div class="stat-label-small">Highest Rated</div>
                <div class="stat-value-small">${stats.scoreAnalysis.highest.score} (${stats.scoreAnalysis.highest.title})</div>
            </div>
            <div class="stat-row">
                <div class="stat-label-small">Lowest Rated</div>
                <div class="stat-value-small">${stats.scoreAnalysis.lowest.score} (${stats.scoreAnalysis.lowest.title})</div>
            </div>
        `;
    }
}

// Achievements Section
function updateAchievements() {
    const grid = document.getElementById("achievementsGrid");
    if (!grid) return;

    grid.innerHTML = "";

    // 🏆 Define achievements based on user data
    const achievements = [
        { icon: "fa-check-circle", title: "First Completion", desc: "Complete your first anime.", goal: 1, progress: d => d.filter(a => a.userStatus === "Completed").length },
        { icon: "fa-tv", title: "TV Enthusiast", desc: "Complete 10 TV series.", goal: 10, progress: d => d.filter(a => a.type === "TV" && a.userStatus === "Completed").length },
        { icon: "fa-film", title: "Movie Lover", desc: "Watch 5 anime movies.", goal: 5, progress: d => d.filter(a => a.type === "Movie" && a.userStatus === "Completed").length },
        { icon: "fa-fire", title: "Episode Addict", desc: "Watch 100 total episodes.", goal: 100, progress: d => d.reduce((s, a) => s + (a.episodes || 0), 0) },
        { icon: "fa-bolt", title: "Power Watcher", desc: "Watch 500 total episodes.", goal: 500, progress: d => d.reduce((s, a) => s + (a.episodes || 0), 0) },
        { icon: "fa-trophy", title: "Pro Finisher", desc: "Complete 50 anime.", goal: 50, progress: d => d.filter(a => a.userStatus === "Completed").length },
        { icon: "fa-star", title: "Perfect Score", desc: "Rate an anime 10/10.", goal: 1, progress: d => d.filter(a => a.score === 10).length },
        { icon: "fa-heart", title: "Fan Favorite", desc: "Rate 10 anime 9 or higher.", goal: 10, progress: d => d.filter(a => a.score >= 9).length },
        { icon: "fa-video", title: "Binge Master", desc: "Complete 100 anime.", goal: 100, progress: d => d.filter(a => a.userStatus === "Completed").length },
        { icon: "fa-hourglass-half", title: "Watch Hour Collector", desc: "Watch 100 hours of anime.", goal: 100, progress: d => totalWatchHours(d) },
    ];

    let completed = 0, inProgress = 0;

    achievements.forEach((a) => {
        const current = a.progress(animeData);
        const percent = Math.min((current / a.goal) * 100, 100);
        const done = current >= a.goal;

        let statusClass = "status-locked";
        let statusText = "Locked";
        if (done) {
            statusClass = "status-completed";
            statusText = "Completed";
            completed++;
        } else if (current > 0) {
            statusClass = "status-progress";
            statusText = `In Progress (${Math.floor(percent)}%)`;
            inProgress++;
        }

        const card = document.createElement("div");
        card.className = "achievement-card fade-in";
        card.innerHTML = `
      <div class="achievement-icon"><i class="fas ${a.icon}"></i></div>
      <div class="achievement-title">${a.title}</div>
      <div class="achievement-desc">${a.desc}</div>
      <div class="achievement-status ${statusClass}">${statusText}</div>
      <div class="achievement-progress-bar">
        <div class="achievement-progress" style="width: ${percent}%;"></div>
      </div>
    `;

        grid.appendChild(card);
    });

    document.getElementById("totalAchievements").textContent = achievements.length;
    document.getElementById("completedAchievements").textContent = completed;
    document.getElementById("inProgressAchievements").textContent = inProgress;
}

// --- Helper functions for achievement tracking ---
function totalWatchHours(data) {
    return data.reduce((sum, a) => sum + ((a.episodes || 0) * (a.duration || 20)) / 60, 0);
}

function monthsWithCompletion(data) {
    const months = new Set();
    data.forEach(a => {
        if (a.finishDate && a.userStatus === "Completed") {
            const date = new Date(a.finishDate);
            months.add(`${date.getFullYear()}-${date.getMonth()}`);
        }
    });
    return Array.from(months);
}

function completionsInLastDays(data, days) {
    const now = new Date();
    const cutoff = new Date(now - days * 86400000);
    return data.filter(a => a.finishDate && new Date(a.finishDate) >= cutoff && a.userStatus === "Completed").length;
}

function uniqueGenres(data) {
    const genres = new Set();
    data.forEach(a => a.genres?.forEach(g => genres.add(g)));
    return Array.from(genres);
}

function decadesWatched(data) {
    const decades = new Set();
    data.forEach(a => {
        if (a.startYear) decades.add(Math.floor(a.startYear / 10) * 10);
    });
    return Array.from(decades);
}

// Settings functionality
function initSettings() {
    const usernameInput = document.getElementById("usernameInput");
    const avatarInput = document.getElementById("avatarInput");
    const resetAvatarBtn = document.getElementById("resetAvatar");
    const clearDataBtn = document.getElementById("clearDataBtn");
    const exportDataBtn = document.getElementById("exportDataBtn");
    const manualBackupBtn = document.getElementById("manualBackupBtn");
    const restoreBackupBtn = document.getElementById("restoreBackupBtn");

    // Load saved settings from localStorage
    const savedName = localStorage.getItem("username");
    const savedAvatar = localStorage.getItem("userAvatar");

    if (savedName && usernameInput) {
        usernameInput.value = savedName;
    }

    // --- Handle Name Change ---
    if (usernameInput) {
        usernameInput.addEventListener("input", () => {
            const newName = usernameInput.value.trim() || "AnimeFan";
            localStorage.setItem("username", newName);
            updateSidebarUserInfo();
        });
    }

    // --- Handle Avatar Upload ---
    if (avatarInput) {
        avatarInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                const imgUrl = ev.target.result;
                localStorage.setItem("userAvatar", imgUrl);
                updateSidebarUserInfo();
            };
            reader.readAsDataURL(file);
        });
    }

    // --- Reset Avatar ---
    if (resetAvatarBtn) {
        resetAvatarBtn.addEventListener("click", () => {
            localStorage.removeItem("userAvatar");
            updateSidebarUserInfo();
        });
    }

    // --- Clear Data ---
    if (clearDataBtn) {
        clearDataBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    // --- Export Data ---
    if (exportDataBtn) {
        exportDataBtn.addEventListener("click", exportData);
    }

    // --- Manual Backup ---
    if (manualBackupBtn) {
        manualBackupBtn.addEventListener("click", () => saveBackup(true));
    }

    // --- Restore Backup ---
    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener("click", restoreBackup);
    }

    // Initialize sidebar with current data
    updateSidebarUserInfo();
}

// Update sidebar user info with data from localStorage
function updateSidebarUserInfo() {
    const sidebarAvatar = document.querySelector('.sidebar-avatar');
    const sidebarUsername = document.querySelector('.sidebar-username');
    const sidebarUserStats = document.querySelector('.sidebar-user-stats');

    // Get user data from localStorage
    const savedName = localStorage.getItem('username') || 'AnimeFan';
    const savedAvatar = localStorage.getItem('userAvatar') || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(savedName) + '&background=6a5acd&color=fff';

    // Calculate stats from animeData
    const totalAnime = animeData.length;
    const totalHours = calculateTotalHours();

    // Update sidebar elements
    if (sidebarAvatar) {
        sidebarAvatar.src = savedAvatar;
        sidebarAvatar.alt = savedName;
    }

    if (sidebarUsername) {
        sidebarUsername.textContent = savedName;
    }

    if (sidebarUserStats) {
        sidebarUserStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-number">${totalAnime}</span>
                <span class="stat-label">Anime</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
<span class="stat-number">${formatNumberShort(totalHours)}</span>
                <span class="stat-label">Hrs</span>
            </div>
        `;
    }
}

// Format numbers like 1.3k, 2.5M, etc.
function formatNumberShort(num) {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
}

// Enhanced calculateTotalHours function
function calculateTotalHours() {
    let totalMinutes = 0;

    animeData.forEach(anime => {
        if (anime.type === 'Movie') {
            // For movies, use the duration directly
            totalMinutes += anime.duration || 0;
        } else {
            // For TV series, calculate based on episodes watched
            const episodesWatched = anime.progress || 0;
            const episodeDuration = anime.duration || 20; // Default 20 minutes per episode
            totalMinutes += episodesWatched * episodeDuration;
        }
    });

    // Convert minutes to hours and round
    return Math.round(totalMinutes / 60);
}
// Monthly anime counter
function updateTotalAnimeCountAllMonths() {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Count only anime marked as Completed in the current year
    const totalCompleted = animeData.filter(anime => {
        if (!anime.finishDate || anime.userStatus !== 'Completed') return false;
        const [year] = anime.finishDate.split('-').map(Number);
        return year === currentYear;
    }).length;

    const totalAnimeEl = document.getElementById('monthly-total-anime');
    if (totalAnimeEl) {
        totalAnimeEl.textContent = `Total Anime in ${currentYear}: ${totalCompleted}`;
    }
}

// Update current month completed anime with scrolling container
function updateCurrentMonthAnime() {
    const currentMonthContainer = document.getElementById('current-month-anime');
    const currentMonthNameEl = document.getElementById('current-month-name');

    if (!currentMonthContainer || !currentMonthNameEl) return;

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    // Update month name
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    currentMonthNameEl.textContent = monthNames[currentMonth];

    // Filter anime completed in current month
    const currentMonthAnime = animeData.filter(anime => {
        if (anime.userStatus !== 'Completed' || !anime.finishDate) return false;

        const finishDate = new Date(anime.finishDate);
        const finishMonth = finishDate.getMonth();
        const finishYear = finishDate.getFullYear();

        return finishMonth === currentMonth && finishYear === currentYear;
    });

    if (currentMonthAnime.length === 0) {
        currentMonthContainer.innerHTML = `
            <div class="no-anime">
                <i class="fas fa-calendar-times"></i>
                <div>No anime completed this month yet.<br>Keep watching!</div>
            </div>
        `;
        return;
    }

    // Sort by completion date (newest first)
    currentMonthAnime.sort((a, b) => new Date(b.finishDate) - new Date(a.finishDate));

    currentMonthContainer.innerHTML = currentMonthAnime.map(anime => `
        <div class="anime-card" onclick="editAnime('${anime.id}')">
            <img src="${anime.cover || 'https://via.placeholder.com/300x400/6a5acd/ffffff?text=No+Image'}" 
                 alt="${anime.title}" 
                 class="anime-cover"
                 onerror="this.src='https://via.placeholder.com/300x400/6a5acd/ffffff?text=No+Image'">
            <div class="anime-info">
                <div class="anime-title">${anime.title}</div>
                <div class="anime-meta">
                    <span>${anime.type || 'TV'}</span>
                    ${anime.score ? `<span class="anime-score">⭐ ${anime.score}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Initialize drag scrolling after content is loaded
    initializeDragScrolling();
}

// Drag scrolling functionality
function initializeDragScrolling() {
    const container = document.getElementById('current-month-anime');
    if (!container) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    // Mouse events
    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.classList.add('active');
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.classList.remove('active');
    });

    container.addEventListener('mouseup', () => {
        isDown = false;
        container.classList.remove('active');
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2; // Scroll multiplier
        container.scrollLeft = scrollLeft - walk;
    });

    // Touch events for mobile
    container.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    container.addEventListener('touchend', () => {
        isDown = false;
    });

    container.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    });

    // Prevent default drag behavior for images
    container.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });
}

// === WATCHLIST PAGE WITH PAGINATION ===
function updateWatchlist(status = 'all', page = 1) {
    const container = document.getElementById('watchlist-container');
    const pagination = document.getElementById('pagination');
    if (!container || !pagination) return;

    currentStatus = status;
    currentPage = page;

    let filteredAnime = [...animeData];
    if (status !== 'all') filteredAnime = filteredAnime.filter(a => a.userStatus === status);
    filteredAnime.reverse();

    const totalPages = Math.ceil(filteredAnime.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageAnime = filteredAnime.slice(start, end);

    if (filteredAnime.length === 0) {
        container.innerHTML = `<div class="no-anime">No anime found for "${status}".</div>`;
        pagination.innerHTML = '';
        return;
    }

    container.innerHTML = pageAnime.map(anime => `
        <div class="anime-card" data-id="${anime.id}">
            <img src="${anime.cover || 'https://via.placeholder.com/300x400/6a5acd/ffffff?text=No+Image'}" alt="${anime.title}" class="anime-cover">
            <div class="anime-info">
                <div class="anime-title">${anime.title}</div>
                <div class="anime-meta">
                    <span>${anime.type || 'TV'}</span>
                    ${anime.score ? `<span class="anime-score">⭐ ${anime.score}</span>` : ''}
                </div>
                <div class="anime-status">
                    <span class="badge badge-${anime.userStatus.toLowerCase().replace(' ', '-')}">${anime.userStatus}</span>
                </div>
            </div>
        </div>
    `).join('');

    // Pagination UI
    renderPagination(totalPages, page);
}

function renderPagination(totalPages, activePage) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let buttons = '';

    // First and Prev
    buttons += `
        <button class="page-btn" ${activePage === 1 ? 'disabled' : ''} data-page="1">«</button>
        <button class="page-btn" ${activePage === 1 ? 'disabled' : ''} data-page="${activePage - 1}">‹</button>
    `;

    // Determine visible range
    const maxVisible = 3; // number of pages before/after current
    let startPage = Math.max(1, activePage - maxVisible);
    let endPage = Math.min(totalPages, activePage + maxVisible);

    // Add leading ellipsis if needed
    if (startPage > 2) {
        buttons += `<button class="page-btn" data-page="1">1</button>`;
        buttons += `<span class="page-dots">…</span>`;
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        buttons += `<button class="page-btn ${i === activePage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    // Add trailing ellipsis if needed
    if (endPage < totalPages - 1) {
        buttons += `<span class="page-dots">…</span>`;
        buttons += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next and Last
    buttons += `
        <button class="page-btn" ${activePage === totalPages ? 'disabled' : ''} data-page="${activePage + 1}">›</button>
        <button class="page-btn" ${activePage === totalPages ? 'disabled' : ''} data-page="${totalPages}">»</button>
    `;

    pagination.innerHTML = buttons;

    // Attach event listeners
    pagination.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPage = parseInt(btn.dataset.page);
            if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
                updateWatchlist(currentStatus, targetPage);
            }
        });
    });
}

// Watchlist filter initialization
document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.watchlist-filters .filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateWatchlist(btn.getAttribute('data-status'), 1);
        });
    });
});

// 💾 Backup & Restore System
function saveBackup(manual = false) {
    if (!animeData || animeData.length === 0) return;

    const backup = {
        timestamp: new Date().toISOString(),
        data: animeData
    };

    localStorage.setItem('animeBackup', JSON.stringify(backup));

    const statusEl = document.getElementById('lastBackupTime');
    if (statusEl) {
        const time = new Date(backup.timestamp).toLocaleString();
        statusEl.textContent = `Last backup: ${time} ${manual ? '(manual)' : '(auto)'}`;
    }

    console.log(`[Backup] Saved ${animeData.length} anime at ${backup.timestamp}`);
}

function restoreBackup() {
    const raw = localStorage.getItem('animeBackup');
    if (!raw) {
        alert('⚠️ No backup found!');
        return;
    }

    const backup = JSON.parse(raw);
    if (!backup.data || !Array.isArray(backup.data)) {
        alert('❌ Backup file is invalid!');
        return;
    }

    animeData = backup.data;
    localStorage.setItem('animeData', JSON.stringify(animeData));

    updateAllComponents();

    alert(`✅ Backup restored from ${new Date(backup.timestamp).toLocaleString()}`);
}

// Show last backup info
const existingBackup = JSON.parse(localStorage.getItem('animeBackup'));
if (existingBackup && existingBackup.timestamp) {
    const statusEl = document.getElementById('lastBackupTime');
    if (statusEl) {
        statusEl.textContent = `Last backup: ${new Date(existingBackup.timestamp).toLocaleString()}`;
    }
}

// ⏱ Auto backup every 5 minutes
setInterval(() => saveBackup(false), 5 * 60 * 1000);

// Initialize the app with saved theme
initializeTheme();