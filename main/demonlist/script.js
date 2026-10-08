/**
 * GDIPS Demon List - application logic
 * ---------------------------------------------------------------------------
 * Single shared script for the demon list, pemon list and impossible list
 * pages.  It is the feature-complete implementation that used to live inline
 * in demonlist/index.html and demonlist/pemonlist.html, extracted verbatim so
 * every list page runs exactly the same code.
 *
 * Preserved behaviour: CSV loading through Papa Parse, localStorage cache and
 * offline fallback, search + suggestions, difficulty/sort menus, advanced
 * filters, pagination and infinite scroll, grid/list view, favourites,
 * recently viewed, completions and progress tracking, achievements, ratings
 * and community reviews, statistics, comparison, recommendations, export,
 * keyboard shortcuts, toasts and the service worker registration.
 *
 * Theming is handled by ../assets/m3/color.js, so no theme code lives here.
 */
        /**
         * GDIPS Demon List - Enhanced JavaScript
         * A comprehensive demon list viewer with filtering, sorting, and user profiles
         */

        // Module pattern for better organization
        const DemonListApp = (() => {
            // Private variables
            let demonData = [];
            let pemonData = [];
            let impossibleData = [];
            let filteredData = [];
            let favorites = [];
            let recentlyViewed = [];
            let completedLevels = [];
            let userAchievements = [];
            let userRatings = {};
            let levelProgress = {};
            let searchHistory = [];
            let communityReviews = {};
            let currentPage = 1;
            let ITEMS_PER_PAGE = parseInt(localStorage.getItem('pageSize')) || 12;
            let currentSort = 'rank';
            let currentFilter = 'all';
            let viewMode = 'grid';
            let selectedForCompare = [];
            let userProfile = {
                username: 'gravatar',
                avatar: 'gravatar',
                completedCount: 0,
                favoriteCount: 0,
                level: 1,
                experience: 0,
                joinDate: new Date().toISOString()
            };
            
            // Data sources configuration
            const DATA_SOURCES = {
                demonlist: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDN7HUdFLEi7P5CkSFXFz_b16Os_8hdEItayViA0TfNze8nudO6sxlJgL9h2K8gkYMQah6RS1KXvL2/pub?gid=1550981254&single=true&output=csv',
                pemonlist: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRULqi0QRDR6gfQo8P2bfqpcqnnZJSkD1ZT-D2XiF7urmzvLwcf10L85KSVp20q65AkMjsha6Lg2LIQ/pub?output=csv',
                impossiblelist: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4iVSl1wTRfOZwLAoyZF-ej_Be2LCgtpXnHgswXbZJczu1EXvrWsGvffpPtAtWxx6-XlOcGsgaHDLo/pub?output=csv'
            };
            
            // Achievement definitions
            const ACHIEVEMENTS = {
                firstLevel: {
                    id: 'firstLevel',
                    title: 'First Steps',
                    description: 'View your first level',
                    icon: 'fa-shoe-prints',
                    condition: () => recentlyViewed.length >= 1
                },
                explorer: {
                    id: 'explorer',
                    title: 'Explorer',
                    description: 'View 10 different levels',
                    icon: 'fa-compass',
                    condition: () => recentlyViewed.length >= 10
                },
                collector: {
                    id: 'collector',
                    title: 'Collector',
                    description: 'Add 5 levels to favorites',
                    icon: 'fa-heart',
                    condition: () => favorites.length >= 5
                },
                completer: {
                    id: 'completer',
                    title: 'Demon Slayer',
                    description: 'Complete 3 levels',
                    icon: 'fa-skull',
                    condition: () => completedLevels.length >= 3
                },
                master: {
                    id: 'master',
                    title: 'Demon Master',
                    description: 'Complete 10 levels',
                    icon: 'fa-crown',
                    condition: () => completedLevels.length >= 10
                },
                reviewer: {
                    id: 'reviewer',
                    title: 'Critic',
                    description: 'Rate 5 levels',
                    icon: 'fa-star',
                    condition: () => Object.keys(userRatings).length >= 5
                },
                progressTracker: {
                    id: 'progressTracker',
                    title: 'Progress Tracker',
                    description: 'Track progress on 5 levels',
                    icon: 'fa-chart-line',
                    condition: () => Object.keys(levelProgress).length >= 5
                },
                communityMember: {
                    id: 'communityMember',
                    title: 'Community Member',
                    description: 'Write 3 reviews',
                    icon: 'fa-comments',
                    condition: () => Object.values(communityReviews).flat().length >= 3
                }
            };
            
            // DOM element references
            const elements = {};
            
            // Initialize app
            function init() {
                cacheElements();
                loadUserData();
                initializeEventListeners();
                loadData();
                updateUserProfile();
                checkAchievements();
                updateYear();
                setupServiceWorker();
                setupSearchSuggestions();
                setupRecommendationEngine();
            }
            
            // Cache DOM elements for better performance
            function cacheElements() {
                elements.cardGrid = document.getElementById('demonCardGrid');
                elements.loadingMsg = document.getElementById('loadingMsg');
                elements.searchInput = document.getElementById('searchInput');
                elements.difficultyMenu = document.getElementById('difficultyMenu');
                elements.sortMenu = document.getElementById('sortMenu');
                elements.pagination = document.getElementById('pagination');
                elements.sidebar = document.getElementById('sidebarNav');
                elements.toastContainer = document.getElementById('toastContainer');
                elements.videoModal = document.getElementById('videoModal');
                elements.detailsModal = document.getElementById('detailsModal');
                elements.compareModal = document.getElementById('compareModal');
                elements.advancedFilterSection = document.getElementById('advancedFilterSection');
                elements.ratingModal = document.getElementById('ratingModal');
                elements.statisticsModal = document.getElementById('statisticsModal');
                elements.reviewsModal = document.getElementById('reviewsModal');
                elements.progressModal = document.getElementById('progressModal');
                elements.searchSuggestions = document.getElementById('searchSuggestions');
            }
            
            // Load user data from localStorage
            function loadUserData() {
                favorites = JSON.parse(localStorage.getItem('favorites')) || [];
                recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
                completedLevels = JSON.parse(localStorage.getItem('completedLevels')) || [];
                userAchievements = JSON.parse(localStorage.getItem('achievements')) || [];
                userProfile = JSON.parse(localStorage.getItem('userProfile')) || userProfile;
                viewMode = localStorage.getItem('viewMode') || 'grid';
                userRatings = JSON.parse(localStorage.getItem('userRatings')) || {};
                levelProgress = JSON.parse(localStorage.getItem('levelProgress')) || {};
                searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
                communityReviews = JSON.parse(localStorage.getItem('communityReviews')) || {};
            }
            
            // Initialize event listeners
            function initializeEventListeners() {
                // Sidebar navigation
                setupSidebarListeners();
                
                // Search functionality
                if (elements.searchInput) {
                    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
                    elements.searchInput.addEventListener('focus', showSearchSuggestions);
                    elements.searchInput.addEventListener('blur', hideSearchSuggestions);
                }
                
                // Filter menus
                setupFilterListeners();
                
                // View controls
                setupViewControls();
                
                // Action buttons
                setupActionButtons();
                
                // Modal controls
                setupModalControls();
                
                // Keyboard shortcuts
                setupKeyboardShortcuts();
                
                // Advanced filters
                setupAdvancedFilters();
                
                // Infinite scroll
                window.addEventListener('scroll', throttle(handleInfiniteScroll, 9999999));
                
                // Print functionality
                setupPrintFunctionality();
            }
            
            // Setup sidebar listeners
            function setupSidebarListeners() {
                const openSidebarBtn = document.getElementById('openSidebar');
                const closeSidebarBtn = document.getElementById('closeSidebar');
                
                if (openSidebarBtn && closeSidebarBtn) {
                    openSidebarBtn.onclick = () => elements.sidebar.classList.add('active');
                    closeSidebarBtn.onclick = () => elements.sidebar.classList.remove('active');
                    
                    // Close sidebar on click outside
                    document.addEventListener('click', (e) => {
                        if (
                            elements.sidebar.classList.contains('active') &&
                            !elements.sidebar.contains(e.target) &&
                            e.target !== openSidebarBtn && !openSidebarBtn.contains(e.target)
                        ) elements.sidebar.classList.remove('active');
                    });
                }
                
                // Sidebar links
                const favoritesLink = document.getElementById('favoritesLink');
                const recentLink = document.getElementById('recentLink');
                const achievementsLink = document.getElementById('achievementsLink');
                const progressLink = document.getElementById('progressLink');
                
                if (favoritesLink) {
                    favoritesLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        showFavorites();
                    });
                }
                
                if (recentLink) {
                    recentLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        showRecentlyViewed();
                    });
                }
                
                if (achievementsLink) {
                    achievementsLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        showAchievements();
                    });
                }
                
                if (progressLink) {
                    progressLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        showProgress();
                    });
                }
            }
            
            // Setup filter listeners
            function setupFilterListeners() {
                const difficultyFilter = document.getElementById('difficultyFilter');
                const sortFilter = document.getElementById('sortFilter');
                
                if (difficultyFilter) {
                    difficultyFilter.addEventListener('click', toggleDifficultyMenu);
                }
                
                if (sortFilter) {
                    sortFilter.addEventListener('click', toggleSortMenu);
                }
                
                // Filter options
                const difficultyOptions = document.querySelectorAll('#difficultyMenu .filter-option');
                difficultyOptions.forEach(option => {
                    option.addEventListener('click', () => handleDifficultyFilter(option));
                });
                
                const sortOptions = document.querySelectorAll('#sortMenu .filter-option');
                sortOptions.forEach(option => {
                    option.addEventListener('click', () => handleSortFilter(option));
                });
            }
            
            // Setup view controls
            function setupViewControls() {
                const gridView = document.getElementById('gridView');
                const listView = document.getElementById('listView');
                
                if (gridView) {
                    gridView.addEventListener('click', () => setViewMode('grid'));
                }
                
                if (listView) {
                    listView.addEventListener('click', () => setViewMode('list'));
                }
            }
            
            // Setup action buttons
            function setupActionButtons() {
                const randomBtn = document.getElementById('randomBtn');
                const compareBtn = document.getElementById('compareBtn');
                const advancedFilterBtn = document.getElementById('advancedFilterBtn');
                const exportBtn = document.getElementById('exportBtn');
                const recommendationsBtn = document.getElementById('recommendationsBtn');
                
                if (randomBtn) {
                    randomBtn.addEventListener('click', showRandomDemon);
                }
                
                if (compareBtn) {
                    compareBtn.addEventListener('click', toggleCompareMode);
                }
                
                if (advancedFilterBtn) {
                    advancedFilterBtn.addEventListener('click', toggleAdvancedFilters);
                }
                
                if (exportBtn) {
                    exportBtn.addEventListener('click', exportData);
                }
                
                if (recommendationsBtn) {
                    recommendationsBtn.addEventListener('click', showRecommendations);
                }
            }
            
            // Setup modal controls
            function setupModalControls() {
                const closeVideoModal = document.getElementById('closeVideoModal');
                const closeDetailsModal = document.getElementById('closeDetailsModal');
                const closeDetails = document.getElementById('closeDetails');
                const watchVideo = document.getElementById('watchVideo');
                const closeRatingModal = document.getElementById('closeRatingModal');
                const closeStatisticsModal = document.getElementById('closeStatisticsModal');
                const closeReviewsModal = document.getElementById('closeReviewsModal');
                const closeProgressModal = document.getElementById('closeProgressModal');
                
                if (closeVideoModal) {
                    closeVideoModal.addEventListener('click', closeVideoModalFn);
                }
                
                if (closeDetailsModal) {
                    closeDetailsModal.addEventListener('click', closeDetailsModalFn);
                }
                
                if (closeDetails) {
                    closeDetails.addEventListener('click', closeDetailsModalFn);
                }
                
                if (watchVideo) {
                    watchVideo.addEventListener('click', () => {
                        const videoId = watchVideo.dataset.videoId;
                        if (videoId) {
                            closeDetailsModalFn();
                            openModal(videoId);
                        }
                    });
                }
                
                if (closeRatingModal) {
                    closeRatingModal.addEventListener('click', closeRatingModalFn);
                }
                
                if (closeStatisticsModal) {
                    closeStatisticsModal.addEventListener('click', closeStatisticsModalFn);
                }
                
                if (closeReviewsModal) {
                    closeReviewsModal.addEventListener('click', closeReviewsModalFn);
                }
                
                if (closeProgressModal) {
                    closeProgressModal.addEventListener('click', closeProgressModalFn);
                }
                
                // Close modals on background click
                if (elements.videoModal) {
                    elements.videoModal.addEventListener('click', (e) => {
                        if (e.target === e.currentTarget) closeVideoModalFn();
                    });
                }
                
                if (elements.detailsModal) {
                    elements.detailsModal.addEventListener('click', (e) => {
                        if (e.target === e.currentTarget) closeDetailsModalFn();
                    });
                }
                
                if (elements.ratingModal) {
                    elements.ratingModal.addEventListener('click', (e) => {
                        if (e.target === e.currentTarget) closeRatingModalFn();
                    });
                }
                
                if (elements.statisticsModal) {
                    elements.statisticsModal.addEventListener('click', (e) => {
                        if (e.target === e.currentTarget) closeStatisticsModalFn();
                    });
                }
                
                if (elements.reviewsModal) {
                    elements.reviewsModal.addEventListener('click', (e) => {
                        if (e.target === e.currentTarget) closeReviewsModalFn();
                    });
                }
                
                if (elements.progressModal) {
                    elements.progressModal.addEventListener('click', (e) => {
                        if (e.target === e.currentTarget) closeProgressModalFn();
                    });
                }
            }
            
            // Setup keyboard shortcuts
            function setupKeyboardShortcuts() {
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        closeVideoModalFn();
                        closeDetailsModalFn();
                        closeRatingModalFn();
                        closeStatisticsModalFn();
                        closeReviewsModalFn();
                        closeProgressModalFn();
                    }
                    
                    // Ctrl/Cmd + K for search
                    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                        e.preventDefault();
                        if (elements.searchInput) elements.searchInput.focus();
                    }
                    
                    // Ctrl/Cmd + F for favorites
                    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                        e.preventDefault();
                        showFavorites();
                    }
                    
                    // Ctrl/Cmd + R for recommendations
                    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                        e.preventDefault();
                        showRecommendations();
                    }
                    
                    // Number keys for quick page navigation
                    if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey) {
                        const pageNum = parseInt(e.key);
                        const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
                        
                        if (pageNum <= totalPages) {
                            currentPage = pageNum;
                            renderCards();
                            renderPagination();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }
                    
                    // Arrow keys for card navigation
                    if (e.key === 'ArrowLeft' && currentPage > 1) {
                        currentPage--;
                        renderCards();
                        renderPagination();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    
                    if (e.key === 'ArrowRight') {
                        const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
                        if (currentPage < totalPages) {
                            currentPage++;
                            renderCards();
                            renderPagination();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }
                });
            }
            
            // Setup advanced filters
            function setupAdvancedFilters() {
                const applyFiltersBtn = document.getElementById('applyFilters');
                const resetFiltersBtn = document.getElementById('resetFilters');
                
                if (applyFiltersBtn) {
                    applyFiltersBtn.addEventListener('click', applyAdvancedFilters);
                }
                
                if (resetFiltersBtn) {
                    resetFiltersBtn.addEventListener('click', resetAdvancedFilters);
                }
                
                // Range inputs
                const rangeInputs = document.querySelectorAll('input[type="range"]');
                rangeInputs.forEach(input => {
                    input.addEventListener('input', updateRangeValue);
                });
            }
            
            // Setup print functionality
            function setupPrintFunctionality() {
                const printBtn = document.createElement('button');
                printBtn.className = 'action-btn';
                printBtn.innerHTML = '<i class="fas fa-print"></i>';
                printBtn.addEventListener('click', () => window.print());
                
                const controlsSection = document.querySelector('.controls-section .action-buttons');
                if (controlsSection) {
                    controlsSection.appendChild(printBtn);
                }
            }
            
            // Setup search suggestions
            function setupSearchSuggestions() {
                if (!elements.searchSuggestions) {
                    elements.searchSuggestions = document.createElement('div');
                    elements.searchSuggestions.className = 'search-suggestions';
                    elements.searchSuggestions.style.display = 'none';
                    
                    if (elements.searchInput && elements.searchInput.parentElement) {
                        elements.searchInput.parentElement.appendChild(elements.searchSuggestions);
                    }
                }
            }
            
            // Setup recommendation engine
            function setupRecommendationEngine() {
                // Initialize recommendation engine based on user preferences
                // This would analyze user behavior and suggest relevant levels
            }
            
            // Update current year in footer
            function updateYear() {
                const currentYear = new Date().getFullYear();
                const yearElements = document.querySelectorAll('#year, #footerYear');
                yearElements.forEach(el => {
                    if (el) el.textContent = currentYear;
                });
            }
            
            // Setup service worker for offline support
            function setupServiceWorker() {
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/sw.js').catch(err => {
                        console.log('Service worker registration failed:', err);
                    });
                }
            }
            
            // Data loading with enhanced error handling
            async function loadData() {
                if (!elements.cardGrid) return;
                
                // Show skeleton loading
                elements.cardGrid.innerHTML = '';
                for (let i = 0; i < 6; i++) {
                    elements.cardGrid.appendChild(createSkeletonCard());
                }
                
                try {
                    // Check if Papa Parse is available
                    if (typeof Papa === 'undefined') {
                        throw new Error('Papa Parse library is not loaded');
                    }
                    
                    // Determine which data source to use based on current page
                    let dataSource;
                    let dataVariable;
                    
                    if (window.location.pathname.includes('pemonlist.html')) {
                        dataSource = DATA_SOURCES.pemonlist;
                        dataVariable = 'pemonData';
                    } else if (window.location.pathname.includes('impossiblelist.html')) {
                        dataSource = DATA_SOURCES.impossiblelist;
                        dataVariable = 'impossibleData';
                    } else {
                        dataSource = DATA_SOURCES.demonlist;
                        dataVariable = 'demonData';
                    }
                    
                    // Load data with timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);
                    
                    const response = await fetch(dataSource, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) throw new Error('Network response was not ok');
                    
                    const csvText = await response.text();
                    const sanitized = preprocessCSVText(csvText);
                    const parsedData = await parseCSV(sanitized);
                    
                    const validData = parsedData.filter(r => {
                        const levelName = r.Level || r.Name || '';
                        return levelName.trim() !== '';
                    });
                    
                    if (validData.length === 0) {
                        throw new Error('No valid data found');
                    }
                    
                    // Store data in appropriate variable
                    if (dataVariable === 'pemonData') {
                        pemonData = validData;
                        filteredData = [...validData];
                    } else if (dataVariable === 'impossibleData') {
                        impossibleData = validData;
                        filteredData = [...validData];
                    } else {
                        demonData = validData;
                        filteredData = [...validData];
                    }
                    
                    // Cache data for offline use
                    localStorage.setItem('cachedDemonData', JSON.stringify(validData));
                    localStorage.setItem('lastDataUpdate', new Date().toISOString());
                    
                    // Apply filters and render
                    applyFiltersAndSort();
                    updateStats();
                    
                    if (elements.loadingMsg) elements.loadingMsg.style.display = 'none';
                    
                    // Show success message
                    const listType = dataVariable === 'pemonData' ? 'Pemon' : 
                                    dataVariable === 'impossibleData' ? 'Impossible' : 'Demon';
                    showToast(`Loaded ${validData.length} ${listType} levels`, 'success');
                    
                    // Start real-time updates check
                    startRealTimeUpdates();
                } catch (error) {
                    handleDataError(error);
                }
            }
            
            // Parse CSV data
            function parseCSV(csvText) {
                return new Promise((resolve, reject) => {
                    Papa.parse(csvText, {
                        header: true,
                        skipEmptyLines: true,
                        dynamicTyping: true,
                        transformHeader: h => (h || '').replace(/^\uFEFF/, '').trim(),
                        complete: results => resolve(results.data),
                        error: reject
                    });
                });
            }

            function preprocessCSVText(text) {
                if (!text) return '';
                let t = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                t = t.replace(/`([^`]*)`/g, (m, p1) => {
                    const cleaned = p1.replace(/,\s*$/,'').trim();
                    const escaped = cleaned.replace(/"/g, '""');
                    return '"' + escaped + '"';
                });
                return t;
            }
            
            // Handle data loading errors
            function handleDataError(error) {
                console.error('Data loading error:', error);
                
                if (!elements.cardGrid) return;
                
                // Create a more informative error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-container';
                errorDiv.innerHTML = `
                    <div class="error-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Unable to Load Data</h3>
                        <p>We're having trouble loading level data from Google Sheets.</p>
                        <p>This might be due to:</p>
                        <ul>
                            <li>Network connectivity issues</li>
                            <li>Google Sheets being temporarily unavailable</li>
                            <li>Changes in data structure</li>
                            <li>CORS restrictions</li>
                            <li>Missing Papa Parse library</li>
                        </ul>
                        <div class="error-actions">
                            <button class="action-btn" onclick="DemonListApp.retryLoading()">
                                <i class="fas fa-redo"></i> Retry
                            </button>
                            <button class="action-btn" onclick="DemonListApp.loadCachedData()">
                                <i class="fas fa-database"></i> Use Cached Data
                            </button>
                            <button class="action-btn" onclick="DemonListApp.loadSampleData()">
                                <i class="fas fa-flask"></i> Load Sample Data
                            </button>
                        </div>
                    </div>
                `;
                
                elements.cardGrid.innerHTML = '';
                elements.cardGrid.appendChild(errorDiv);
                
                // Hide loading message
                if (elements.loadingMsg) elements.loadingMsg.style.display = 'none';
                
                showToast('Failed to load data from Google Sheets', 'error');
            }
            
            // Retry loading data
            function retryLoading() {
                location.reload();
            }
            
            // Load cached data
            function loadCachedData() {
                const cachedData = localStorage.getItem('cachedDemonData');
                
                if (cachedData) {
                    try {
                        const data = JSON.parse(cachedData);
                        
                        // Determine which data to use based on current page
                        if (window.location.pathname.includes('pemonlist.html')) {
                            pemonData = data;
                            filteredData = [...data];
                        } else if (window.location.pathname.includes('impossiblelist.html')) {
                            impossibleData = data;
                            filteredData = [...data];
                        } else {
                            demonData = data;
                            filteredData = [...data];
                        }
                        
                        applyFiltersAndSort();
                        updateStats();
                        
                        const lastUpdate = localStorage.getItem('lastDataUpdate');
                        if (lastUpdate) {
                            const date = new Date(lastUpdate);
                            showToast(`Loaded cached data from ${formatDate(date)}`, 'info');
                        } else {
                            showToast('Loaded cached data. Information may be outdated.', 'info');
                        }
                    } catch (e) {
                        console.error('Error parsing cached data:', e);
                        showToast('No cached data available', 'error');
                        retryLoading();
                    }
                } else {
                    showToast('No cached data available', 'error');
                    retryLoading();
                }
            }
            
            // Load sample data for testing
            function loadSampleData() {
                // Sample data for testing
                const sampleData = [
                    {
                        Level: 'Sample Demon',
                        'ID Level': '123456',
                        Creators: 'SampleCreator',
                        'Display Nickname': 'SampleVerifier',
                        'Level Placement Opinion': 'Extreme',
                        'Video Link': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        Rating: 4.5,
                        Tags: 'Sample,Test,Demo',
                        Description: 'This is a sample demon level for testing purposes.',
                        Length: '2m 30s',
                        Objects: '15000',
                        Downloads: '5000'
                    },
                    {
                        Level: 'Another Sample',
                        'ID Level': '789012',
                        Creators: 'AnotherCreator',
                        'Display Nickname': 'AnotherVerifier',
                        'Level Placement Opinion': 'Insane',
                        'Video Link': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        Rating: 3.5,
                        Tags: 'Sample,Test,Another',
                        Description: 'Another sample demon level for testing purposes.',
                        Length: '1m 45s',
                        Objects: '12000',
                        Downloads: '3000'
                    }
                ];
                
                // Determine which data to use based on current page
                if (window.location.pathname.includes('pemonlist.html')) {
                    pemonData = sampleData;
                    filteredData = [...sampleData];
                } else if (window.location.pathname.includes('impossiblelist.html')) {
                    impossibleData = sampleData;
                    filteredData = [...sampleData];
                } else {
                    demonData = sampleData;
                    filteredData = [...sampleData];
                }
                
                applyFiltersAndSort();
                updateStats();
                showToast('Loaded sample data for testing', 'info');
            }
            
            // Create skeleton loading card
            function createSkeletonCard() {
                const card = document.createElement('div');
                card.className = 'skeleton-card';
                
                const thumb = document.createElement('div');
                thumb.className = 'skeleton skeleton-thumb';
                
                const content = document.createElement('div');
                content.className = 'skeleton-content';
                
                const title = document.createElement('div');
                title.className = 'skeleton skeleton-title';
                
                const info = document.createElement('div');
                info.className = 'skeleton skeleton-info';
                
                const creator = document.createElement('div');
                creator.className = 'skeleton skeleton-creator';
                
                content.appendChild(title);
                content.appendChild(info);
                content.appendChild(creator);
                
                card.appendChild(thumb);
                card.appendChild(content);
                
                return card;
            }
            
            // Update statistics
            function updateStats() {
                const totalDemons = document.getElementById('totalDemons');
                const extremeDemons = document.getElementById('extremeDemons');
                const lastUpdated = document.getElementById('lastUpdated');
                
                // Determine which data to use based on current page
                let currentData;
                let listType;
                
                if (window.location.pathname.includes('pemonlist.html')) {
                    currentData = pemonData;
                    listType = 'Pemons';
                } else if (window.location.pathname.includes('impossiblelist.html')) {
                    currentData = impossibleData;
                    listType = 'Impossible';
                } else {
                    currentData = demonData;
                    listType = 'Demons';
                }
                
                if (totalDemons) {
                    animateNumber(totalDemons, currentData.length);
                }
                
                if (extremeDemons) {
                    // Count extreme levels based on difficulty column
                    const extremeCount = currentData.filter(r => {
                        const difficulty = (r['Level Placement Opinion'] || r['Difficulty'] || '').toLowerCase();
                        return difficulty === 'extreme demon' || difficulty === 'impossible';
                    }).length;
                    animateNumber(extremeDemons, extremeCount);
                }
                
                if (lastUpdated) {
                    lastUpdated.textContent = formatDate(new Date());
                }
            }
            
            // Animate number counting
            function animateNumber(element, target) {
                const start = parseInt(element.textContent) || 0;
                const duration = 1000;
                const startTime = performance.now();
                
                function update(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const current = Math.floor(start + (target - start) * progress);
                    element.textContent = current;
                    
                    if (progress < 1) {
                        requestAnimationFrame(update);
                    }
                }
                
                requestAnimationFrame(update);
            }
            
            // Format date
            function formatDate(d) {
                return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            }
            
            // Search functionality
            function handleSearch() {
                if (!elements.searchInput) return;
                
                const term = elements.searchInput.value.trim().toLowerCase();
                currentPage = 1;
                
                // Add search to history
                addToSearchHistory(term);
                
                applyFiltersAndSort();
            }
            
            // Add search term to history
            function addToSearchHistory(term) {
                if (!term) return;
                
                searchHistory = searchHistory.filter(h => h !== term);
                searchHistory.unshift(term);
                searchHistory = searchHistory.slice(0, 10); // Keep only last 10 searches
                localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
            }
            
            // Show search suggestions
            function showSearchSuggestions() {
                if (!elements.searchSuggestions) return;
                
                elements.searchSuggestions.innerHTML = '';
                
                if (searchHistory.length > 0) {
                    const historyTitle = document.createElement('div');
                    historyTitle.className = 'suggestion-title';
                    historyTitle.textContent = 'Recent Searches';
                    elements.searchSuggestions.appendChild(historyTitle);
                    
                    searchHistory.slice(0, 5).forEach(term => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.className = 'suggestion-item';
                        suggestionItem.textContent = term;
                        suggestionItem.addEventListener('click', () => {
                            elements.searchInput.value = term;
                            handleSearch();
                            hideSearchSuggestions();
                        });
                        elements.searchSuggestions.appendChild(suggestionItem);
                    });
                }
                
                elements.searchSuggestions.style.display = 'block';
            }
            
            // Hide search suggestions
            function hideSearchSuggestions() {
                if (elements.searchSuggestions) {
                    setTimeout(() => {
                        elements.searchSuggestions.style.display = 'none';
                    }, 200);
                }
            }
            
            // Toggle difficulty menu
            function toggleDifficultyMenu() {
                if (!elements.difficultyMenu) return;
                
                elements.difficultyMenu.classList.toggle('active');
                
                // Close sort menu if open
                if (elements.sortMenu) elements.sortMenu.classList.remove('active');
            }
            
            // Toggle sort menu
            function toggleSortMenu() {
                if (!elements.sortMenu) return;
                
                elements.sortMenu.classList.toggle('active');
                
                // Close difficulty menu if open
                if (elements.difficultyMenu) elements.difficultyMenu.classList.remove('active');
            }
            
            // Handle difficulty filter
            function handleDifficultyFilter(option) {
                // Update active state
                document.querySelectorAll('#difficultyMenu .filter-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
                
                // Update filter
                currentFilter = option.dataset.value;
                currentPage = 1;
                
                // Update button text
                const difficultyFilter = document.getElementById('difficultyFilter');
                if (difficultyFilter) {
                    const span = difficultyFilter.querySelector('span');
                    if (span) {
                        span.textContent = option.dataset.value === 'all' ? 'Difficulty' : option.textContent;
                    }
                }
                
                // Close menu
                if (elements.difficultyMenu) elements.difficultyMenu.classList.remove('active');
                
                // Apply filter
                applyFiltersAndSort();
            }
            
            // Handle sort filter
            function handleSortFilter(option) {
                // Update active state
                document.querySelectorAll('#sortMenu .filter-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
                
                // Update sort
                currentSort = option.dataset.value;
                currentPage = 1;
                
                // Update button text
                const sortFilter = document.getElementById('sortFilter');
                if (sortFilter) {
                    const span = sortFilter.querySelector('span');
                    if (span) {
                        span.textContent = option.textContent;
                    }
                }
                
                // Close menu
                if (elements.sortMenu) elements.sortMenu.classList.remove('active');
                
                // Apply sort
                applyFiltersAndSort();
            }
            
            // Apply filters and sort
            function applyFiltersAndSort() {
                const searchTerm = elements.searchInput ? elements.searchInput.value.trim().toLowerCase() : '';
                
                // Determine which data to use based on current page
                let currentData;
                
                if (window.location.pathname.includes('pemonlist.html')) {
                    currentData = pemonData;
                } else if (window.location.pathname.includes('impossiblelist.html')) {
                    currentData = impossibleData;
                } else {
                    currentData = demonData;
                }
                
                // Apply search filter
                filteredData = currentData.filter(row => {
                    if (searchTerm && !Object.values(row).join(' ').toLowerCase().includes(searchTerm)) {
                        return false;
                    }
                    
                    if (currentFilter !== 'all') {
                        // Handle different column names for different lists
                        const difficultyColumn = row['Level Placement Opinion'] || row['Difficulty'] || '';
                        const difficulty = difficultyColumn.toLowerCase();
                        if (difficulty !== currentFilter) {
                            return false;
                        }
                    }
                    
                    return true;
                });
                
                // Apply sort
                filteredData.sort((a, b) => {
                    switch (currentSort) {
                        case 'name':
                            return (a.Level || a.Name || '').localeCompare(b.Level || b.Name || '');
                        case 'difficulty':
                            const difficultyOrder = { easy: 1, medium: 2, hard: 3, insane: 4, extreme: 5, impossible: 6 };
                            const aDiffColumn = a['Level Placement Opinion'] || a['Difficulty'] || '';
                            const bDiffColumn = b['Level Placement Opinion'] || b['Difficulty'] || '';
                            const aDiff = aDiffColumn.toLowerCase();
                            const bDiff = bDiffColumn.toLowerCase();
                            return difficultyOrder[aDiff] - difficultyOrder[bDiff];
                        case 'creator':
                            return (a.Creators || a['Creator'] || '').localeCompare(b.Creators || b['Creator'] || '');
                        case 'rating':
                            const aRating = parseFloat(a.Rating) || 0;
                            const bRating = parseFloat(b.Rating) || 0;
                            return bRating - aRating;
                        case 'rank':
                        default:
                            // Keep original order (rank)
                            return 0;
                    }
                });
                
                // Render
                renderCards();
                renderPagination();
            }
            
            // Set view mode
            function setViewMode(mode) {
                viewMode = mode;
                const grid = elements.cardGrid;
                const gridBtn = document.getElementById('gridView');
                const listBtn = document.getElementById('listView');
                
                if (!grid) return;
                
                if (mode === 'grid') {
                    grid.classList.remove('list-view');
                    if (gridBtn) gridBtn.classList.add('active');
                    if (listBtn) listBtn.classList.remove('active');
                } else {
                    grid.classList.add('list-view');
                    if (gridBtn) gridBtn.classList.remove('active');
                    if (listBtn) listBtn.classList.add('active');
                }
                
                // Save preference
                localStorage.setItem('viewMode', mode);
                
                // Re-render with new view mode
                renderCards();
            }
            
            // Render cards
            function renderCards() {
                if (!elements.cardGrid) return;
                
                elements.cardGrid.innerHTML = '';
                
                if (!filteredData.length) {
                    elements.cardGrid.innerHTML = `
                        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); margin-top: 2rem; padding: 2rem;">
                            <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                            <h3>No levels found</h3>
                            <p>Try adjusting your search or filters</p>
                            <button class="action-btn" onclick="DemonListApp.resetFilters()" style="margin-top: 1rem;">
                                <i class="fas fa-redo"></i> Reset Filters
                            </button>
                        </div>
                    `;
                    return;
                }
                
                // Calculate pagination
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                const endIndex = startIndex + ITEMS_PER_PAGE;
                const pageData = filteredData.slice(startIndex, endIndex);
                
                // Render cards for current page
                pageData.forEach((row, index) => {
                    const globalIndex = startIndex + index + 1;
                    const card = createDemonCard(row, globalIndex);
                    elements.cardGrid.appendChild(card);
                });
                
                // Add intersection observer for lazy loading
                setupLazyLoading();
            }
            
            // Create demon card
            function createDemonCard(row, rank) {
                // Handle different column names for different lists
                const name = row['Level'] || row['Name'] || '-';
                const id = row['ID Level'] || row['ID'] || '-';
                const creator = row['Creators'] || row['Creator'] || '-';
                const verifier = row['Display Nickname'] || row['Verifier'] || creator;
                const videoUrl = row['Video Link'] || row['Video'] || '';
                const difficultyColumn = row['Level Placement Opinion'] || row['Difficulty'] || 'Extreme';
                const difficulty = difficultyColumn.toLowerCase();
                const rating = row['Rating'] || 0;
                const tags = row['Tags'] ? row['Tags'].split(',').map(tag => tag.trim()) : [];
                const description = row['Description'] || '';
                
                const videoId = getYouTubeId(videoUrl);
                const isFavorite = favorites.includes(id);
                const isCompleted = completedLevels.includes(id);
                const userRating = userRatings[id] || 0;
                const progress = levelProgress[id] || 0;
                
                // Create card element
                const card = document.createElement('div');
                card.className = 'demon-card';
                card.dataset.id = id;
                
                // Rank badge
                const rankDiv = document.createElement('div');
                rankDiv.className = 'card-rank';
                rankDiv.textContent = rank;
                card.appendChild(rankDiv);
                
                // Favorite button
                const favoriteBtn = document.createElement('div');
                favoriteBtn.className = `card-favorite ${isFavorite ? 'active' : ''}`;
                favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
                favoriteBtn.addEventListener('click', () => toggleFavorite(id));
                card.appendChild(favoriteBtn);
                
                // Completion badge
                if (isCompleted) {
                    const completionBadge = document.createElement('div');
                    completionBadge.className = 'completion-badge';
                    completionBadge.innerHTML = '<i class="fas fa-check"></i> Completed';
                    card.appendChild(completionBadge);
                }
                
                // Progress bar
                if (progress > 0 && !isCompleted) {
                    const progressBar = document.createElement('div');
                    progressBar.className = 'card-progress';
                    progressBar.innerHTML = `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${progress}%</span>
                    `;
                    card.appendChild(progressBar);
                }
                
                // Thumbnail
                if (videoId) {
                    const thumbWrap = document.createElement('div');
                    thumbWrap.style.position = 'relative';
                    
                    const thumb = document.createElement('img');
                    thumb.className = 'card-thumb';
                    thumb.src = getYouTubeThumbnail(videoId);
                    thumb.alt = `Preview for ${name}`;
                    thumb.title = "Play video";
                    thumb.loading = 'lazy';
                    thumb.addEventListener('click', () => {
                        openModal(videoId);
                        addToRecentlyViewed(row);
                    });
                    thumbWrap.appendChild(thumb);
                    
                    // Play overlay
                    const playBtn = document.createElement('div');
                    playBtn.className = 'play-btn-overlay';
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                    thumbWrap.appendChild(playBtn);
                    
                    card.appendChild(thumbWrap);
                } else {
                    const noVid = document.createElement('div');
                    noVid.className = 'no-video-thumb';
                    noVid.textContent = "No Video";
                    card.appendChild(noVid);
                }
                
                // Content
                const content = document.createElement('div');
                content.className = 'card-content';
                
                // Title
                const title = document.createElement('div');
                title.className = 'level-title';
                title.textContent = name;
                title.addEventListener('click', () => {
                    showLevelDetails(row);
                    addToRecentlyViewed(row);
                });
                content.appendChild(title);
                
                // Description (if available)
                if (description) {
                    const desc = document.createElement('div');
                    desc.className = 'level-description';
                    desc.textContent = description.length > 100 ? description.substring(0, 100) + '...' : description;
                    desc.style.fontSize = '0.9rem';
                    desc.style.color = 'var(--text-muted)';
                    desc.style.marginBottom = '0.5rem';
                    content.appendChild(desc);
                }
                
                // Diff/ID Row
                const infoRow = document.createElement('div');
                infoRow.className = 'level-info-row';
                
                const diffSpan = document.createElement('span');
                diffSpan.className = `diff-pill ${difficulty}`;
                diffSpan.textContent = difficulty;
                infoRow.appendChild(diffSpan);
                
                const idSpan = document.createElement('span');
                idSpan.className = 'lvl-id-badge';
                idSpan.textContent = `ID: ${id}`;
                infoRow.appendChild(idSpan);
                
                content.appendChild(infoRow);
                
                // Creator/Verifier
                const creatorRow = document.createElement('div');
                creatorRow.className = 'creator-row';
                creatorRow.innerHTML =
                    `<span title="Creator"><i class="fas fa-user-edit"></i> ${creator}</span>` +
                    `<span title="Verifier"><i class="fas fa-check-circle"></i> ${verifier}</span>`;
                content.appendChild(creatorRow);
                
                // Rating
                if (rating > 0 || userRating > 0) {
                    const ratingContainer = document.createElement('div');
                    ratingContainer.className = 'rating-container';
                    
                    const ratingStars = document.createElement('div');
                    ratingStars.className = 'rating-stars';
                    
                    // Use user rating if available, otherwise use default rating
                    const displayRating = userRating > 0 ? userRating : rating;
                    
                    for (let i = 1; i <= 5; i++) {
                        const star = document.createElement('i');
                        star.className = i <= displayRating ? 'fas fa-star' : 'far fa-star';
                        ratingStars.appendChild(star);
                    }
                    
                    const ratingValue = document.createElement('div');
                    ratingValue.className = 'rating-value';
                    ratingValue.textContent = `${displayRating}/5`;
                    
                    ratingContainer.appendChild(ratingStars);
                    ratingContainer.appendChild(ratingValue);
                    content.appendChild(ratingContainer);
                }
                
                // Tags
                if (tags.length > 0) {
                    const filterTags = document.createElement('div');
                    filterTags.className = 'filter-tags';
                    
                    tags.slice(0, 3).forEach(tag => {
                        const filterTag = document.createElement('div');
                        filterTag.className = 'filter-tag';
                        filterTag.textContent = tag;
                        filterTag.addEventListener('click', () => {
                            filterByTag(tag);
                        });
                        filterTags.appendChild(filterTag);
                    });
                    
                    content.appendChild(filterTags);
                }
                
                // Actions
                const actions = document.createElement('div');
                actions.className = 'card-actions';
                
                const detailsBtn = document.createElement('button');
                detailsBtn.className = 'card-action-btn';
                detailsBtn.innerHTML = '<i class="fas fa-info-circle"></i> Details';
                detailsBtn.addEventListener('click', () => {
                    showLevelDetails(row);
                    addToRecentlyViewed(row);
                });
                actions.appendChild(detailsBtn);
                
                const rateBtn = document.createElement('button');
                rateBtn.className = 'card-action-btn';
                rateBtn.innerHTML = '<i class="fas fa-star"></i> Rate';
                rateBtn.addEventListener('click', () => {
                    showRatingModal(row);
                });
                actions.appendChild(rateBtn);
                
                const progressBtn = document.createElement('button');
                progressBtn.className = 'card-action-btn';
                progressBtn.innerHTML = '<i class="fas fa-chart-line"></i> Progress';
                progressBtn.addEventListener('click', () => {
                    showProgressModal(row);
                });
                actions.appendChild(progressBtn);
                
                const compareBtn = document.createElement('button');
                compareBtn.className = 'card-action-btn';
                compareBtn.innerHTML = '<i class="fas fa-balance-scale"></i> Compare';
                compareBtn.addEventListener('click', () => addToCompare(row));
                actions.appendChild(compareBtn);
                
                if (!isCompleted) {
                    const completeBtn = document.createElement('button');
                    completeBtn.className = 'card-action-btn';
                    completeBtn.innerHTML = '<i class="fas fa-check"></i> Mark Complete';
                    completeBtn.addEventListener('click', () => markAsCompleted(id));
                    actions.appendChild(completeBtn);
                }
                
                // Share button
                const shareBtn = document.createElement('button');
                shareBtn.className = 'card-action-btn';
                shareBtn.innerHTML = '<i class="fas fa-share"></i> Share';
                shareBtn.addEventListener('click', () => shareLevel(row));
                actions.appendChild(shareBtn);
                
                content.appendChild(actions);
                
                card.appendChild(content);
                
                return card;
            }
            
            // Render pagination
            function renderPagination() {
                if (!elements.pagination) return;
                
                elements.pagination.innerHTML = '';
                
                const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
                
                if (totalPages <= 1) return;
                
                // First button
                const firstBtn = document.createElement('button');
                firstBtn.className = 'page-btn';
                firstBtn.innerHTML = '<i class="fas fa-angle-double-left"></i>';
                firstBtn.disabled = currentPage === 1;
                firstBtn.addEventListener('click', () => {
                    currentPage = 1;
                    renderCards();
                    renderPagination();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                elements.pagination.appendChild(firstBtn);
                
                // Previous button
                const prevBtn = document.createElement('button');
                prevBtn.className = 'page-btn';
                prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
                prevBtn.disabled = currentPage === 1;
                prevBtn.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        renderCards();
                        renderPagination();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
                elements.pagination.appendChild(prevBtn);
                
                // Page numbers
                const startPage = Math.max(1, currentPage - 2);
                const endPage = Math.min(totalPages, currentPage + 2);
                
                for (let i = startPage; i <= endPage; i++) {
                    const pageBtn = document.createElement('button');
                    pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
                    pageBtn.textContent = i;
                    pageBtn.addEventListener('click', () => {
                        currentPage = i;
                        renderCards();
                        renderPagination();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    });
                    elements.pagination.appendChild(pageBtn);
                }
                
                // Page info
                const pageInfo = document.createElement('div');
                pageInfo.className = 'page-info';
                pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
                elements.pagination.appendChild(pageInfo);
                
                // Next button
                const nextBtn = document.createElement('button');
                nextBtn.className = 'page-btn';
                nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
                nextBtn.disabled = currentPage === totalPages;
                nextBtn.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        renderCards();
                        renderPagination();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
                elements.pagination.appendChild(nextBtn);
                
                // Last button
                const lastBtn = document.createElement('button');
                lastBtn.className = 'page-btn';
                lastBtn.innerHTML = '<i class="fas fa-angle-double-right"></i>';
                lastBtn.disabled = currentPage === totalPages;
                lastBtn.addEventListener('click', () => {
                    currentPage = totalPages;
                    renderCards();
                    renderPagination();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                elements.pagination.appendChild(lastBtn);
            }
            
            // Open video modal
            function openModal(videoId) {
                const youtubeFrame = document.getElementById('youtubeFrame');
                
                if (!elements.videoModal || !youtubeFrame) return;
                
                youtubeFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
                elements.videoModal.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Add to viewing history
                const viewingHistory = JSON.parse(localStorage.getItem('viewingHistory')) || [];
                viewingHistory.unshift({ videoId, timestamp: Date.now() });
                localStorage.setItem('viewingHistory', JSON.stringify(viewingHistory.slice(0, 50)));
            }
            
            // Close video modal
            function closeVideoModalFn() {
                const youtubeFrame = document.getElementById('youtubeFrame');
                
                if (!elements.videoModal || !youtubeFrame) return;
                
                elements.videoModal.classList.remove('active');
                youtubeFrame.src = '';
                document.body.style.overflow = '';
            }
            
            // Show level details
            function showLevelDetails(level) {
                const modalTitle = document.getElementById('detailsModalTitle');
                const levelDetails = document.getElementById('levelDetails');
                const watchVideoBtn = document.getElementById('watchVideo');
                const statisticsBtn = document.getElementById('statisticsBtn');
                const reviewsBtn = document.getElementById('reviewsBtn');
                
                if (!elements.detailsModal || !modalTitle || !levelDetails) return;
                
                // Handle different column names for different lists
                const name = level['Level'] || level['Name'] || '-';
                const id = level['ID Level'] || level['ID'] || '-';
                const creator = level['Creators'] || level['Creator'] || '-';
                const verifier = level['Display Nickname'] || level['Verifier'] || creator;
                const videoUrl = level['Video Link'] || level['Video'] || '';
                const difficultyColumn = level['Level Placement Opinion'] || level['Difficulty'] || 'Unknown';
                const difficulty = difficultyColumn.toLowerCase();
                const rating = level['Rating'] || 0;
                const tags = level['Tags'] ? level['Tags'].split(',').map(tag => tag.trim()) : [];
                const description = level['Description'] || 'No description available';
                const length = level['Length'] || 'Unknown';
                const objects = level['Objects'] || 'Unknown';
                const downloads = level['Downloads'] || '0';
                
                modalTitle.textContent = name;
                
                const videoId = getYouTubeId(videoUrl);
                if (watchVideoBtn) {
                    watchVideoBtn.dataset.videoId = videoId || '';
                    watchVideoBtn.disabled = !videoId;
                }
                
                const isCompleted = completedLevels.includes(id);
                const isFavorite = favorites.includes(id);
                const userRating = userRatings[id] || 0;
                const progress = levelProgress[id] || 0;
                const reviews = communityReviews[id] || [];
                
                levelDetails.innerHTML = `
                    <div class="detail-group">
                        <div class="detail-label">Rank</div>
                        <div class="detail-value">#${getCurrentRank(level)}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Level ID</div>
                        <div class="detail-value">${id}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Creator</div>
                        <div class="detail-value">${creator}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Verifier</div>
                        <div class="detail-value">${verifier}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Difficulty</div>
                        <div class="detail-value">
                            <span class="diff-pill ${difficulty}">${difficultyColumn}</span>
                        </div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Rating</div>
                        <div class="detail-value">
                            ${userRating > 0 ? 
                                `<div>${generateStarRating(userRating)} <span class="rating-note">(Your rating)</span></div>` : 
                                generateStarRating(rating)
                            }
                        </div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Progress</div>
                        <div class="detail-value">
                            ${isCompleted ? 
                                '<span style="color: var(--success);"><i class="fas fa-check-circle"></i> Completed</span>' : 
                                progress > 0 ? 
                                    `<div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
                                    <span class="progress-text">${progress}%</span>` : 
                                    '<span style="color: var(--text-muted);"><i class="far fa-circle"></i> Not Started</span>'
                            }
                        </div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Length</div>
                        <div class="detail-value">${length}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Objects</div>
                        <div class="detail-value">${objects}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Downloads</div>
                        <div class="detail-value">${downloads}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Status</div>
                        <div class="detail-value">
                            ${isFavorite ? 
                                '<span style="color: var(--primary);"><i class="fas fa-heart"></i> Favorited</span>' : 
                                '<span style="color: var(--text-muted);"><i class="far fa-heart"></i> Not Favorited</span>'
                            }
                        </div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Community Reviews</div>
                        <div class="detail-value">
                            ${reviews.length > 0 ? 
                                `<span>${reviews.length} review(s)</span>` : 
                                '<span style="color: var(--text-muted);">No reviews yet</span>'
                            }
                        </div>
                    </div>
                    <div class="detail-group" style="grid-column: 1 / -1;">
                        <div class="detail-label">Description</div>
                        <div class="detail-value">${description}</div>
                    </div>
                    <div class="detail-group" style="grid-column: 1 / -1;">
                        <div class="detail-label">Tags</div>
                        <div class="detail-value">
                            ${tags.map(tag => `<span class="filter-tag">${tag}</span>`).join(' ')}
                        </div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Video</div>
                        <div class="detail-value">
                            ${videoId ? 
                                `<a href="${videoUrl}" target="_blank">Watch on YouTube</a>` : 
                                'No video available'
                            }
                        </div>
                    </div>
                `;
                
                // Add action buttons to modal footer if they don't exist
                let modalFooter = document.querySelector('#detailsModal .modal-footer');
                if (!modalFooter) {
                    modalFooter = document.createElement('div');
                    modalFooter.className = 'modal-footer';
                    elements.detailsModal.appendChild(modalFooter);
                }
                
                modalFooter.innerHTML = '';
                
                // Rate button
                const rateBtn = document.createElement('button');
                rateBtn.className = 'modal-btn modal-btn-primary';
                rateBtn.innerHTML = '<i class="fas fa-star"></i> Rate Level';
                rateBtn.addEventListener('click', () => {
                    closeDetailsModalFn();
                    showRatingModal(level);
                });
                modalFooter.appendChild(rateBtn);
                
                // Progress button
                const progressBtn = document.createElement('button');
                progressBtn.className = 'modal-btn modal-btn-primary';
                progressBtn.innerHTML = '<i class="fas fa-chart-line"></i> Update Progress';
                progressBtn.addEventListener('click', () => {
                    closeDetailsModalFn();
                    showProgressModal(level);
                });
                modalFooter.appendChild(progressBtn);
                
                // Statistics button
                if (statisticsBtn) {
                    const statsBtn = document.createElement('button');
                    statsBtn.className = 'modal-btn modal-btn-secondary';
                    statsBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Statistics';
                    statsBtn.addEventListener('click', () => {
                        closeDetailsModalFn();
                        showStatisticsModal(level);
                    });
                    modalFooter.appendChild(statsBtn);
                }
                
                // Reviews button
                if (reviewsBtn) {
                    const reviewBtn = document.createElement('button');
                    reviewBtn.className = 'modal-btn modal-btn-secondary';
                    reviewBtn.innerHTML = '<i class="fas fa-comments"></i> Reviews';
                    reviewBtn.addEventListener('click', () => {
                        closeDetailsModalFn();
                        showReviewsModal(level);
                    });
                    modalFooter.appendChild(reviewBtn);
                }
                
                // Close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'modal-btn modal-btn-secondary';
                closeBtn.innerHTML = '<i class="fas fa-times"></i> Close';
                closeBtn.addEventListener('click', closeDetailsModalFn);
                modalFooter.appendChild(closeBtn);
                
                elements.detailsModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            // Show rating modal
            function showRatingModal(level) {
                const modalTitle = document.getElementById('ratingModalTitle');
                const ratingContent = document.getElementById('ratingContent');
                const submitRatingBtn = document.getElementById('submitRating');
                
                if (!elements.ratingModal || !modalTitle || !ratingContent) return;
                
                const name = level['Level'] || level['Name'] || '-';
                const id = level['ID Level'] || level['ID'] || '';
                const currentRating = userRatings[id] || 0;
                
                modalTitle.textContent = `Rate: ${name}`;
                
                ratingContent.innerHTML = `
                    <div class="rating-input-container">
                        <p>Your rating for this level:</p>
                        <div class="rating-input-stars" data-level-id="${id}">
                            ${[1, 2, 3, 4, 5].map(i => 
                                `<i class="${i <= currentRating ? 'fas' : 'far'} fa-star" data-rating="${i}"></i>`
                            ).join('')}
                        </div>
                        <div class="rating-note">Click on a star to rate</div>
                    </div>
                    <div class="rating-comment-container">
                        <label for="ratingComment">Leave a comment (optional):</label>
                        <textarea id="ratingComment" rows="4" placeholder="Share your thoughts on this level..."></textarea>
                    </div>
                `;
                
                // Add event listeners to stars
                const stars = document.querySelectorAll('.rating-input-stars i');
                stars.forEach(star => {
                    star.addEventListener('click', function() {
                        const rating = parseInt(this.dataset.rating);
                        const levelId = this.parentElement.dataset.levelId;
                        
                        // Update star display
                        stars.forEach((s, index) => {
                            s.className = index < rating ? 'fas fa-star' : 'far fa-star';
                        });
                        
                        // Store rating temporarily
                        this.parentElement.dataset.currentRating = rating;
                    });
                    
                    star.addEventListener('mouseenter', function() {
                        const rating = parseInt(this.dataset.rating);
                        
                        // Preview rating on hover
                        stars.forEach((s, index) => {
                            s.classList.add(index < rating ? 'fas' : 'far');
                            s.classList.remove(index < rating ? 'far' : 'fas');
                        });
                    });
                });
                
                // Reset on mouse leave
                document.querySelector('.rating-input-stars').addEventListener('mouseleave', function() {
                    const currentRating = parseInt(this.dataset.currentRating) || 0;
                    
                    stars.forEach((s, index) => {
                        s.className = index < currentRating ? 'fas fa-star' : 'far fa-star';
                    });
                });
                
                // Set initial rating
                document.querySelector('.rating-input-stars').dataset.currentRating = currentRating;
                
                // Submit rating
                if (submitRatingBtn) {
                    submitRatingBtn.onclick = function() {
                        const ratingContainer = document.querySelector('.rating-input-stars');
                        const rating = parseInt(ratingContainer.dataset.currentRating) || 0;
                        const comment = document.getElementById('ratingComment').value.trim();
                        
                        if (rating === 0) {
                            showToast('Please select a rating', 'warning');
                            return;
                        }
                        
                        // Save rating
                        userRatings[id] = rating;
                        localStorage.setItem('userRatings', JSON.stringify(userRatings));
                        
                        // Save comment if provided
                        if (comment) {
                            if (!communityReviews[id]) {
                                communityReviews[id] = [];
                            }
                            
                            communityReviews[id].push({
                                username: userProfile.username,
                                rating: rating,
                                comment: comment,
                                date: new Date().toISOString()
                            });
                            
                            localStorage.setItem('communityReviews', JSON.stringify(communityReviews));
                        }
                        
                        // Award experience points
                        userProfile.experience += 5;
                        localStorage.setItem('userProfile', JSON.stringify(userProfile));
                        updateUserProfile();
                        
                        // Check for achievements
                        checkAchievements();
                        
                        showToast(`You rated this level ${rating} star${rating > 1 ? 's' : ''}`, 'success');
                        closeRatingModalFn();
                        
                        // Update UI if level is currently displayed
                        renderCards();
                    };
                }
                
                elements.ratingModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            // Show progress modal
            function showProgressModal(level) {
                const modalTitle = document.getElementById('progressModalTitle');
                const progressContent = document.getElementById('progressContent');
                const updateProgressBtn = document.getElementById('updateProgress');
                
                if (!elements.progressModal || !modalTitle || !progressContent) return;
                
                const name = level['Level'] || level['Name'] || '-';
                const id = level['ID Level'] || level['ID'] || '';
                const currentProgress = levelProgress[id] || 0;
                const isCompleted = completedLevels.includes(id);
                
                modalTitle.textContent = `Progress: ${name}`;
                
                progressContent.innerHTML = `
                    <div class="progress-input-container">
                        <p>Your progress on this level:</p>
                        <div class="progress-bar-container">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${currentProgress}%"></div>
                            </div>
                            <span class="progress-text">${currentProgress}%</span>
                        </div>
                        <div class="progress-slider-container">
                            <label for="progressSlider">Adjust Progress:</label>
                            <input type="range" id="progressSlider" min="0" max="100" value="${currentProgress}" class="progress-slider">
                            <div class="progress-value">${currentProgress}%</div>
                        </div>
                        <div class="progress-notes-container">
                            <label for="progressNotes">Notes (optional):</label>
                            <textarea id="progressNotes" rows="4" placeholder="Add notes about your progress..."></textarea>
                        </div>
                    </div>
                `;
                
                // Update progress when slider changes
                const progressSlider = document.getElementById('progressSlider');
                const progressValue = document.querySelector('.progress-value');
                const progressFill = document.querySelector('.progress-fill');
                const progressText = document.querySelector('.progress-text');
                
                if (progressSlider) {
                    progressSlider.addEventListener('input', function() {
                        const value = this.value;
                        progressValue.textContent = `${value}%`;
                        progressFill.style.width = `${value}%`;
                        progressText.textContent = `${value}%`;
                    });
                }
                
                // Update progress
                if (updateProgressBtn) {
                    updateProgressBtn.onclick = function() {
                        const newProgress = parseInt(progressSlider.value);
                        const notes = document.getElementById('progressNotes').value.trim();
                        
                        // Save progress
                        levelProgress[id] = newProgress;
                        localStorage.setItem('levelProgress', JSON.stringify(levelProgress));
                        
                        // Check if level is now completed
                        if (newProgress === 100 && !isCompleted) {
                            completedLevels.push(id);
                            localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
                            
                            // Award experience points for completion
                            userProfile.experience += 10;
                            localStorage.setItem('userProfile', JSON.stringify(userProfile));
                            
                            showToast('Congratulations! You completed this level!', 'success');
                        } else if (newProgress < 100 && isCompleted) {
                            // Remove from completed if progress is less than 100
                            const index = completedLevels.indexOf(id);
                            if (index > -1) {
                                completedLevels.splice(index, 1);
                                localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
                            }
                            
                            showToast('Progress updated', 'info');
                        } else {
                            showToast('Progress updated', 'info');
                        }
                        
                        // Save notes if provided
                        if (notes) {
                            if (!levelProgress[id]) {
                                levelProgress[id] = {};
                            }
                            
                            levelProgress[id].notes = notes;
                            localStorage.setItem('levelProgress', JSON.stringify(levelProgress));
                        }
                        
                        updateUserProfile();
                        checkAchievements();
                        closeProgressModalFn();
                        
                        // Update UI if level is currently displayed
                        renderCards();
                    };
                }
                
                elements.progressModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            // Show statistics modal
            function showStatisticsModal(level) {
                const modalTitle = document.getElementById('statisticsModalTitle');
                const statisticsContent = document.getElementById('statisticsContent');
                
                if (!elements.statisticsModal || !modalTitle || !statisticsContent) return;
                
                const name = level['Level'] || level['Name'] || '-';
                const id = level['ID Level'] || level['ID'] || '';
                const difficultyColumn = level['Level Placement Opinion'] || level['Difficulty'] || 'Unknown';
                const rating = level['Rating'] || 0;
                const downloads = parseInt(level['Downloads']) || 0;
                const reviews = communityReviews[id] || [];
                
                // Calculate average rating from community reviews
                let avgRating = rating;
                if (reviews.length > 0) {
                    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
                    avgRating = (sum / reviews.length).toFixed(1);
                }
                
                modalTitle.textContent = `Statistics: ${name}`;
                
                statisticsContent.innerHTML = `
                    <div class="statistics-container">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-star"></i>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${avgRating}/5</div>
                                <div class="stat-label">Average Rating</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-download"></i>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${downloads.toLocaleString()}</div>
                                <div class="stat-label">Downloads</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-comments"></i>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${reviews.length}</div>
                                <div class="stat-label">Reviews</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-heart"></i>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${favorites.includes(id) ? 'Favorited' : 'Not Favorited'}</div>
                                <div class="stat-label">Your Status</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${levelProgress[id] || 0}%</div>
                                <div class="stat-label">Your Progress</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-trophy"></i>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${difficultyColumn}</div>
                                <div class="stat-label">Difficulty</div>
                            </div>
                        </div>
                    </div>
                    <div class="rating-distribution">
                        <h4>Rating Distribution</h4>
                        <div class="rating-bars">
                            ${[5, 4, 3, 2, 1].map(star => {
                                const count = reviews.filter(r => r.rating === star).length;
                                const percentage = reviews.length > 0 ? (count / reviews.length * 100).toFixed(0) : 0;
                                return `
                                    <div class="rating-bar">
                                        <div class="rating-stars">${'<i class="fas fa-star"></i>'.repeat(star)}</div>
                                        <div class="rating-bar-container">
                                            <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                                        </div>
                                        <div class="rating-count">${count}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
                
                elements.statisticsModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            // Show reviews modal
            function showReviewsModal(level) {
                const modalTitle = document.getElementById('reviewsModalTitle');
                const reviewsContent = document.getElementById('reviewsContent');
                const addReviewBtn = document.getElementById('addReview');
                
                if (!elements.reviewsModal || !modalTitle || !reviewsContent) return;
                
                const name = level['Level'] || level['Name'] || '-';
                const id = level['ID Level'] || level['ID'] || '';
                const reviews = communityReviews[id] || [];
                
                modalTitle.textContent = `Reviews: ${name}`;
                
                reviewsContent.innerHTML = `
                    <div class="reviews-container">
                        ${reviews.length > 0 ? 
                            reviews.map(review => `
                                <div class="review-card">
                                    <div class="review-header">
                                        <div class="reviewer-info">
                                            <div class="reviewer-avatar">
                                                <i class="fas fa-user-circle"></i>
                                            </div>
                                            <div class="reviewer-details">
                                                <div class="reviewer-name">${review.username}</div>
                                                <div class="review-date">${formatDate(new Date(review.date))}</div>
                                            </div>
                                        </div>
                                        <div class="review-rating">
                                            ${generateStarRating(review.rating)}
                                        </div>
                                    </div>
                                    <div class="review-comment">${review.comment}</div>
                                </div>
                            `).join('') : 
                            '<div class="no-reviews">No reviews yet. Be the first to review this level!</div>'
                        }
                    </div>
                `;
                
                // Add review button
                if (addReviewBtn) {
                    addReviewBtn.onclick = function() {
                        closeReviewsModalFn();
                        showRatingModal(level);
                    };
                }
                
                elements.reviewsModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            // Show achievements
            function showAchievements() {
                // Create achievements modal if it doesn't exist
                let modal = document.getElementById('achievementsModal');
                
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'achievementsModal';
                    modal.className = 'modal';
                    
                    const modalContent = document.createElement('div');
                    modalContent.className = 'modal-content';
                    
                    const modalHeader = document.createElement('div');
                    modalHeader.className = 'modal-header';
                    
                    const modalTitle = document.createElement('h3');
                    modalTitle.className = 'modal-title';
                    modalTitle.textContent = 'Achievements';
                    
                    const modalClose = document.createElement('button');
                    modalClose.className = 'modal-close';
                    modalClose.innerHTML = '<i class="fas fa-times"></i>';
                    modalClose.addEventListener('click', () => {
                        modal.classList.remove('active');
                        document.body.style.overflow = '';
                    });
                    
                    modalHeader.appendChild(modalTitle);
                    modalHeader.appendChild(modalClose);
                    
                    const modalBody = document.createElement('div');
                    modalBody.className = 'modal-body';
                    modalBody.id = 'achievementsContent';
                    
                    modalContent.appendChild(modalHeader);
                    modalContent.appendChild(modalBody);
                    
                    modal.appendChild(modalContent);
                    document.body.appendChild(modal);
                    
                    // Close modal on background click
                    modal.addEventListener('click', (e) => {
                        if (e.target === e.currentTarget) {
                            modal.classList.remove('active');
                            document.body.style.overflow = '';
                        }
                    });
                }
                
                const achievementsContent = document.getElementById('achievementsContent');
                if (!achievementsContent) return;
                
                achievementsContent.innerHTML = `
                    <div class="achievements-container">
                        <div class="achievement-stats">
                            <div class="achievement-stat">
                                <div class="stat-value">${userAchievements.length}</div>
                                <div class="stat-label">Unlocked</div>
                            </div>
                            <div class="achievement-stat">
                                <div class="stat-value">${Object.keys(ACHIEVEMENTS).length}</div>
                                <div class="stat-label">Total</div>
                            </div>
                            <div class="achievement-stat">
                                <div class="stat-value">${Math.round(userAchievements.length / Object.keys(ACHIEVEMENTS).length * 100)}%</div>
                                <div class="stat-label">Progress</div>
                            </div>
                        </div>
                        <div class="achievements-grid">
                            ${Object.values(ACHIEVEMENTS).map(achievement => {
                                const isUnlocked = userAchievements.includes(achievement.id);
                                return `
                                    <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                                        <div class="achievement-icon">
                                            <i class="fas ${achievement.icon}"></i>
                                        </div>
                                        <div class="achievement-info">
                                            <div class="achievement-title">${achievement.title}</div>
                                            <div class="achievement-description">${achievement.description}</div>
                                        </div>
                                        <div class="achievement-status">
                                            ${isUnlocked ? 
                                                '<i class="fas fa-check-circle"></i> Unlocked' : 
                                                '<i class="fas fa-lock"></i> Locked'
                                            }
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
                
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Close sidebar
                if (elements.sidebar) elements.sidebar.classList.remove('active');
            }
            
            // Show progress
            function showProgress() {
                // Create progress modal if it doesn't exist
                let modal = document.getElementById('allProgressModal');
                
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'allProgressModal';
                    modal.className = 'modal';
                    
                    const modalContent = document.createElement('div');
                    modalContent.className = 'modal-content';
                    
                    const modalHeader = document.createElement('div');
                    modalHeader.className = 'modal-header';
                    
                    const modalTitle = document.createElement('h3');
                    modalTitle.className = 'modal-title';
                    modalTitle.textContent = 'Your Progress';
                    
                    const modalClose = document.createElement('button');
                    modalClose.className = 'modal-close';
                    modalClose.innerHTML = '<i class="fas fa-times"></i>';
                    modalClose.addEventListener('click', () => {
                        modal.classList.remove('active');
                        document.body.style.overflow = '';
                    });
                    
                    modalHeader.appendChild(modalTitle);
                    modalHeader.appendChild(modalClose);
                    
                    const modalBody = document.createElement('div');
                    modalBody.className = 'modal-body';
                    modalBody.id = 'allProgressContent';
                    
                    modalContent.appendChild(modalHeader);
                    modalContent.appendChild(modalBody);
                    
                    modal.appendChild(modalContent);
                    document.body.appendChild(modal);
                    
                    // Close modal on background click
                    modal.addEventListener('click', (e) => {
                        if (e.target === e.currentTarget) {
                            modal.classList.remove('active');
                            document.body.style.overflow = '';
                        }
                    });
                }
                
                const allProgressContent = document.getElementById('allProgressContent');
                if (!allProgressContent) return;
                
                // Get all levels with progress
                let levelsWithProgress = [];
                
                // Determine which data to use based on current page
                let currentData;
                
                if (window.location.pathname.includes('pemonlist.html')) {
                    currentData = pemonData;
                } else if (window.location.pathname.includes('impossiblelist.html')) {
                    currentData = impossibleData;
                } else {
                    currentData = demonData;
                }
                
                // Filter levels with progress
                levelsWithProgress = currentData.filter(level => {
                    const id = level['ID Level'] || level['ID'] || '';
                    return levelProgress[id] !== undefined || completedLevels.includes(id);
                }).map(level => {
                    const id = level['ID Level'] || level['ID'] || '';
                    const name = level['Level'] || level['Name'] || '';
                    const difficulty = level['Level Placement Opinion'] || level['Difficulty'] || '';
                    const progress = levelProgress[id] || 0;
                    const isCompleted = completedLevels.includes(id);
                    
                    return {
                        id,
                        name,
                        difficulty,
                        progress,
                        isCompleted
                    };
                });
                
                // Sort by progress (highest first)
                levelsWithProgress.sort((a, b) => b.progress - a.progress);
                
                allProgressContent.innerHTML = `
                    <div class="progress-overview">
                        <div class="progress-stat">
                            <div class="stat-value">${completedLevels.length}</div>
                            <div class="stat-label">Completed</div>
                        </div>
                        <div class="progress-stat">
                            <div class="stat-value">${Object.keys(levelProgress).length}</div>
                            <div class="stat-label">In Progress</div>
                        </div>
                        <div class="progress-stat">
                            <div class="stat-value">${levelsWithProgress.length > 0 ? 
                                Math.round(levelsWithProgress.reduce((acc, level) => acc + level.progress, 0) / levelsWithProgress.length) : 0}%</div>
                            <div class="stat-label">Average Progress</div>
                        </div>
                    </div>
                    <div class="progress-list">
                        ${levelsWithProgress.length > 0 ? 
                            levelsWithProgress.map(level => `
                                <div class="progress-item ${level.isCompleted ? 'completed' : ''}">
                                    <div class="progress-info">
                                        <div class="progress-name">${level.name}</div>
                                        <div class="progress-difficulty">
                                            <span class="diff-pill ${level.difficulty.toLowerCase()}">${level.difficulty}</span>
                                        </div>
                                    </div>
                                    <div class="progress-bar-container">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${level.progress}%"></div>
                                        </div>
                                        <span class="progress-text">${level.progress}%</span>
                                    </div>
                                </div>
                            `).join('') : 
                            '<div class="no-progress">No progress yet. Start playing some levels!</div>'
                        }
                    </div>
                `;
                
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Close sidebar
                if (elements.sidebar) elements.sidebar.classList.remove('active');
            }
            
            // Show recommendations
            function showRecommendations() {
                // Create recommendations modal if it doesn't exist
                let modal = document.getElementById('recommendationsModal');
                
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'recommendationsModal';
                    modal.className = 'modal';
                    
                    const modalContent = document.createElement('div');
                    modalContent.className = 'modal-content';
                    
                    const modalHeader = document.createElement('div');
                    modalHeader.className = 'modal-header';
                    
                    const modalTitle = document.createElement('h3');
                    modalTitle.className = 'modal-title';
                    modalTitle.textContent = 'Recommended For You';
                    
                    const modalClose = document.createElement('button');
                    modalClose.className = 'modal-close';
                    modalClose.innerHTML = '<i class="fas fa-times"></i>';
                    modalClose.addEventListener('click', () => {
                        modal.classList.remove('active');
                        document.body.style.overflow = '';
                    });
                    
                    modalHeader.appendChild(modalTitle);
                    modalHeader.appendChild(modalClose);
                    
                    const modalBody = document.createElement('div');
                    modalBody.className = 'modal-body';
                    modalBody.id = 'recommendationsContent';
                    
                    modalContent.appendChild(modalHeader);
                    modalContent.appendChild(modalBody);
                    
                    modal.appendChild(modalContent);
                    document.body.appendChild(modal);
                    
                    // Close modal on background click
                    modal.addEventListener('click', (e) => {
                        if (e.target === e.currentTarget) {
                            modal.classList.remove('active');
                            document.body.style.overflow = '';
                        }
                    });
                }
                
                const recommendationsContent = document.getElementById('recommendationsContent');
                if (!recommendationsContent) return;
                
                // Generate recommendations based on user preferences
                const recommendations = generateRecommendations();
                
                recommendationsContent.innerHTML = `
                    <div class="recommendations-container">
                        <div class="recommendations-intro">
                            <p>Based on your play history and preferences, we think you'll enjoy these levels:</p>
                        </div>
                        <div class="recommendations-grid">
                            ${recommendations.map(level => {
                                const name = level['Level'] || level['Name'] || '';
                                const id = level['ID Level'] || level['ID'] || '';
                                const difficulty = level['Level Placement Opinion'] || level['Difficulty'] || '';
                                const videoUrl = level['Video Link'] || level['Video'] || '';
                                const videoId = getYouTubeId(videoUrl);
                                
                                return `
                                    <div class="recommendation-card" data-id="${id}">
                                        <div class="recommendation-rank">#${getCurrentRank(level)}</div>
                                        ${videoId ? 
                                            `<img src="${getYouTubeThumbnail(videoId)}" alt="${name}" class="recommendation-thumb">` : 
                                            '<div class="recommendation-thumb no-thumb">No Video</div>'
                                        }
                                        <div class="recommendation-content">
                                            <div class="recommendation-title">${name}</div>
                                            <div class="recommendation-info">
                                                <span class="diff-pill ${difficulty.toLowerCase()}">${difficulty}</span>
                                            </div>
                                            <div class="recommendation-actions">
                                                <button class="recommendation-btn" onclick="DemonListApp.viewLevelDetails('${id}')">
                                                    <i class="fas fa-info-circle"></i> Details
                                                </button>
                                                <button class="recommendation-btn" onclick="DemonListApp.playVideo('${videoId}')">
                                                    <i class="fas fa-play"></i> Play
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
                
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            // Generate recommendations based on user preferences
            function generateRecommendations() {
                // Determine which data to use based on current page
                let currentData;
                
                if (window.location.pathname.includes('pemonlist.html')) {
                    currentData = pemonData;
                } else if (window.location.pathname.includes('impossiblelist.html')) {
                    currentData = impossibleData;
                } else {
                    currentData = demonData;
                }
                
                // Filter out already completed levels
                const uncompletedLevels = currentData.filter(level => {
                    const id = level['ID Level'] || level['ID'] || '';
                    return !completedLevels.includes(id);
                });
                
                // If user has no history, return random levels
                if (recentlyViewed.length === 0 && Object.keys(userRatings).length === 0) {
                    return uncompletedLevels
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 6);
                }
                
                // Get user's preferred difficulties
                const preferredDifficulties = {};
                
                // Analyze recently viewed levels
                recentlyViewed.forEach(level => {
                    const difficulty = (level['Level Placement Opinion'] || level['Difficulty'] || '').toLowerCase();
                    if (difficulty) {
                        preferredDifficulties[difficulty] = (preferredDifficulties[difficulty] || 0) + 1;
                    }
                });
                
                // Analyze rated levels
                Object.keys(userRatings).forEach(id => {
                    const level = currentData.find(l => (l['ID Level'] || l['ID'] || '') === id);
                    if (level) {
                        const difficulty = (level['Level Placement Opinion'] || level['Difficulty'] || '').toLowerCase();
                        if (difficulty) {
                            // Give more weight to highly rated levels
                            const weight = userRatings[id] / 5;
                            preferredDifficulties[difficulty] = (preferredDifficulties[difficulty] || 0) + weight;
                        }
                    }
                });
                
                // Sort difficulties by preference
                const sortedDifficulties = Object.keys(preferredDifficulties)
                    .sort((a, b) => preferredDifficulties[b] - preferredDifficulties[a]);
                
                // Filter levels by preferred difficulties
                let recommendedLevels = uncompletedLevels.filter(level => {
                    const difficulty = (level['Level Placement Opinion'] || level['Difficulty'] || '').toLowerCase();
                    return sortedDifficulties.includes(difficulty);
                });
                
                // If not enough levels with preferred difficulties, add random ones
                if (recommendedLevels.length < 6) {
                    const additionalLevels = uncompletedLevels
                        .filter(level => !recommendedLevels.includes(level))
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 6 - recommendedLevels.length);
                    
                    recommendedLevels = [...recommendedLevels, ...additionalLevels];
                }
                
                // Sort by preferred difficulty first, then by rating
                recommendedLevels.sort((a, b) => {
                    const aDifficulty = (a['Level Placement Opinion'] || a['Difficulty'] || '').toLowerCase();
                    const bDifficulty = (b['Level Placement Opinion'] || b['Difficulty'] || '').toLowerCase();
                    
                    const aPrefIndex = sortedDifficulties.indexOf(aDifficulty);
                    const bPrefIndex = sortedDifficulties.indexOf(bDifficulty);
                    
                    if (aPrefIndex !== bPrefIndex) {
                        return aPrefIndex - bPrefIndex;
                    }
                    
                    // If same preference, sort by rating
                    const aRating = parseFloat(a.Rating) || 0;
                    const bRating = parseFloat(b.Rating) || 0;
                    
                    return bRating - aRating;
                });
                
                return recommendedLevels.slice(0, 6);
            }
            
            // View level details from recommendation
            function viewLevelDetails(id) {
                // Determine which data to use based on current page
                let currentData;
                
                if (window.location.pathname.includes('pemonlist.html')) {
                    currentData = pemonData;
                } else if (window.location.pathname.includes('impossiblelist.html')) {
                    currentData = impossibleData;
                } else {
                    currentData = demonData;
                }
                
                const level = currentData.find(l => (l['ID Level'] || l['ID'] || '') === id);
                if (level) {
                    // Close recommendations modal
                    const modal = document.getElementById('recommendationsModal');
                    if (modal) {
                        modal.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                    
                    // Show level details
                    showLevelDetails(level);
                    addToRecentlyViewed(level);
                }
            }
            
            // Play video from recommendation
            function playVideo(videoUrl) {
                const videoId = getYouTubeId(videoUrl);
                if (videoId) {
                    // Close recommendations modal
                    const modal = document.getElementById('recommendationsModal');
                    if (modal) {
                        modal.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                    
                    // Open video modal
                    openModal(videoId);
                }
            }
            
            // Get current rank of a level
            function getCurrentRank(level) {
                // Determine which data to use based on current page
                let currentData;
                
                if (window.location.pathname.includes('pemonlist.html')) {
                    currentData = pemonData;
                } else if (window.location.pathname.includes('impossiblelist.html')) {
                    currentData = impossibleData;
                } else {
                    currentData = demonData;
                }
                
                return currentData.indexOf(level) + 1;
            }
            
            // Close details modal
            function closeDetailsModalFn() {
                if (!elements.detailsModal) return;
                
                elements.detailsModal.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            // Close rating modal
            function closeRatingModalFn() {
                if (!elements.ratingModal) return;
                
                elements.ratingModal.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            // Close statistics modal
            function closeStatisticsModalFn() {
                if (!elements.statisticsModal) return;
                
                elements.statisticsModal.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            // Close reviews modal
            function closeReviewsModalFn() {
                if (!elements.reviewsModal) return;
                
                elements.reviewsModal.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            // Close progress modal
            function closeProgressModalFn() {
                if (!elements.progressModal) return;
                
                elements.progressModal.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            // Get YouTube video ID from URL
            function getYouTubeId(url) {
                if (!url) return null;
                const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/;
                const match = url.match(regExp);
                return (match && match[1]) ? match[1] : null;
            }
            
            // Get YouTube thumbnail URL
            function getYouTubeThumbnail(videoId) {
                return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            }
            
            // Toggle favorite status
            function toggleFavorite(id) {
                const index = favorites.indexOf(id);
                
                if (index > -1) {
                    favorites.splice(index, 1);
                    showToast('Removed from favorites', 'info');
                } else {
                    favorites.push(id);
                    showToast('Added to favorites', 'success');
                }
                
                localStorage.setItem('favorites', JSON.stringify(favorites));
                
                // Update user profile
                updateUserProfile();
                
                // Update UI
                const card = document.querySelector(`.demon-card[data-id="${id}"]`);
                if (card) {
                    const favoriteBtn = card.querySelector('.card-favorite');
                    favoriteBtn.classList.toggle('active');
                }
                
                // Check for collector achievement
                checkAchievements();
            }
            
            // Show favorites
            function showFavorites() {
                if (!favorites.length) {
                    showToast('No favorites yet', 'info');
                    return;
                }
                
                // Determine which data to use based on current page
                let currentData;
                
                if (window.location.pathname.includes('pemonlist.html')) {
                    currentData = pemonData;
                } else if (window.location.pathname.includes('impossiblelist.html')) {
                    currentData = impossibleData;
                } else {
                    currentData = demonData;
                }
                
                const favoritesData = currentData.filter(demon => {
                    const id = demon['ID Level'] || demon['ID'] || '';
                    return favorites.includes(id);
                });
                
                filteredData = favoritesData;
                currentPage = 1;
                
                // Update UI
                if (elements.searchInput) elements.searchInput.value = '';
                
                document.querySelectorAll('#difficultyMenu .filter-option').forEach(opt => {
                    opt.classList.remove('active');
                    if (opt.dataset.value === 'all') opt.classList.add('active');
                });
                
                const difficultyFilter = document.getElementById('difficultyFilter');
                if (difficultyFilter) {
                    const span = difficultyFilter.querySelector('span');
                    if (span) span.textContent = 'Difficulty';
                }
                
                currentFilter = 'all';
                
                renderCards();
                renderPagination();
                
                // Close sidebar
                if (elements.sidebar) elements.sidebar.classList.remove('active');
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                showToast(`Showing ${favoritesData.length} favorite(s)`, 'success');
            }
            
            // Add to recently viewed
            function addToRecentlyViewed(level) {
                const id = level['ID Level'] || level['ID'] || '';
                
                // Remove if already exists
                const index = recentlyViewed.findIndex(item => {
                    const itemId = item['ID Level'] || item['ID'] || '';
                    return itemId === id;
                });
                
                if (index > -1) {
                    recentlyViewed.splice(index, 1);
                }
                
                // Add to beginning
                recentlyViewed.unshift(level);
                
                // Keep only last 10
                if (recentlyViewed.length > 10) {
                    recentlyViewed = recentlyViewed.slice(0, 10);
                }
                
                localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
                
                // Check for achievements
                checkAchievements();
            }
            
            // Show recently viewed
            function showRecentlyViewed() {
                if (!recentlyViewed.length) {
                    showToast('No recently viewed levels', 'info');
                    return;
                }
                
                filteredData = recentlyViewed;
                currentPage = 1;
                
                // Update UI
                if (elements.searchInput) elements.searchInput.value = '';
                
                document.querySelectorAll('#difficultyMenu .filter-option').forEach(opt => {
                    opt.classList.remove('active');
                    if (opt.dataset.value === 'all') opt.classList.add('active');
                });
                
                const difficultyFilter = document.getElementById('difficultyFilter');
                if (difficultyFilter) {
                    const span = difficultyFilter.querySelector('span');
                    if (span) span.textContent = 'Difficulty';
                }
                
                currentFilter = 'all';
                
                renderCards();
                renderPagination();
                
                // Close sidebar
                if (elements.sidebar) elements.sidebar.classList.remove('active');
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                showToast(`Showing ${recentlyViewed.length} recently viewed level(s)`, 'success');
            }
            
            // Mark level as completed
            function markAsCompleted(id) {
                const index = completedLevels.indexOf(id);
                
                if (index > -1) {
                    completedLevels.splice(index, 1);
                    showToast('Removed from completed levels', 'info');
                } else {
                    completedLevels.push(id);
                    showToast('Marked as completed', 'success');
                    
                    // Award experience points
                    userProfile.experience += 10;
                    localStorage.setItem('userProfile', JSON.stringify(userProfile));
                    updateUserProfile();
                }
                
                localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
                
                // Update user profile
                updateUserProfile();
                
                // Check for achievements
                checkAchievements();
                
                // Update UI
                renderCards();
            }
            
            // Show random demon
            function showRandomDemon() {
                // Determine which data to use based on current page
                let currentData;
                let listType;
                
                if (window.location.pathname.includes('pemonlist.html')) {
                    currentData = pemonData;
                    listType = 'pemon';
                } else if (window.location.pathname.includes('impossiblelist.html')) {
                    currentData = impossibleData;
                    listType = 'impossible';
                } else {
                    currentData = demonData;
                    listType = 'demon';
                }
                
                if (!currentData.length) return;
                
                const randomIndex = Math.floor(Math.random() * currentData.length);
                const randomDemon = currentData[randomIndex];
                
                showLevelDetails(randomDemon);
                addToRecentlyViewed(randomDemon);
                
                const name = randomDemon['Level'] || randomDemon['Name'] || 'Unknown';
                showToast(`Showing random ${listType}: ${name}`, 'info');
            }
            
            // Toggle compare mode
            function toggleCompareMode() {
                if (selectedForCompare.length < 2) {
                    showToast('Select at least 2 levels to compare', 'info');
                    return;
                }
                
                // Create comparison modal
                createComparisonModal();
            }
            
            // Add to comparison
            function addToCompare(level) {
                const id = level['ID Level'] || level['ID'] || '';
                const index = selectedForCompare.findIndex(item => {
                    const itemId = item['ID Level'] || item['ID'] || '';
                    return itemId === id;
                });
                
                if (index > -1) {
                    selectedForCompare.splice(index, 1);
                    showToast('Removed from comparison', 'info');
                } else {
                    if (selectedForCompare.length >= 4) {
                        showToast('You can compare up to 4 levels at a time', 'error');
                        return;
                    }
                    selectedForCompare.push(level);
                    showToast('Added to comparison', 'success');
                }
            }
            
            // Create comparison modal
            function createComparisonModal() {
                // Create modal if it doesn't exist
                let modal = elements.compareModal;
                
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'compareModal';
                    modal.className = 'modal';
                    
                    const modalContent = document.createElement('div');
                    modalContent.className = 'modal-content';
                    
                    const modalHeader = document.createElement('div');
                    modalHeader.className = 'modal-header';
                    
                    const modalTitle = document.createElement('h3');
                    modalTitle.className = 'modal-title';
                    modalTitle.textContent = 'Compare Levels';
                    
                    const modalClose = document.createElement('button');
                    modalClose.className = 'modal-close';
                    modalClose.innerHTML = '<i class="fas fa-times"></i>';
                    modalClose.addEventListener('click', () => {
                        modal.classList.remove('active');
                        document.body.style.overflow = '';
                    });
                    
                    modalHeader.appendChild(modalTitle);
                    modalHeader.appendChild(modalClose);
                    
                    const modalBody = document.createElement('div');
                    modalBody.className = 'modal-body';
                    
                    const comparisonContainer = document.createElement('div');
                    comparisonContainer.className = 'comparison-container';
                    comparisonContainer.id = 'comparisonContainer';
                    
                    modalBody.appendChild(comparisonContainer);
                    
                    const modalFooter = document.createElement('div');
                    modalFooter.className = 'modal-footer';
                    
                    const closeModalBtn = document.createElement('button');
                    closeModalBtn.className = 'modal-btn modal-btn-secondary';
                    closeModalBtn.textContent = 'Close';
                    closeModalBtn.addEventListener('click', () => {
                        modal.classList.remove('active');
                        document.body.style.overflow = '';
                    });
                    
                    const exportBtn = document.createElement('button');
                    exportBtn.className = 'modal-btn modal-btn-primary';
                    exportBtn.textContent = 'Export Comparison';
                    exportBtn.addEventListener('click', exportComparison);
                    
                    modalFooter.appendChild(exportBtn);
                    modalFooter.appendChild(closeModalBtn);
                    
                    modalContent.appendChild(modalHeader);
                    modalContent.appendChild(modalBody);
                    modalContent.appendChild(modalFooter);
                    
                    modal.appendChild(modalContent);
                    document.body.appendChild(modal);
                    
                    // Close modal on background click
                    modal.addEventListener('click', (e) => {
                        if (e.target === e.currentTarget) {
                            modal.classList.remove('active');
                            document.body.style.overflow = '';
                        }
                    });
                    
                    elements.compareModal = modal;
                }
                
                // Populate comparison container
                const comparisonContainer = document.getElementById('comparisonContainer');
                if (!comparisonContainer) return;
                
                comparisonContainer.innerHTML = '';
                
                // Determine which data to use based on current page
                let currentData;
                
                if (window.location.pathname.includes('pemonlist.html')) {
                    currentData = pemonData;
                } else if (window.location.pathname.includes('impossiblelist.html')) {
                    currentData = impossibleData;
                } else {
                    currentData = demonData;
                }
                
                selectedForCompare.forEach((level, index) => {
                    const rank = currentData.indexOf(level) + 1;
                    const name = level['Level'] || level['Name'] || 'Unknown';
                    const id = level['ID Level'] || level['ID'] || '';
                    const creator = level['Creators'] || level['Creator'] || 'Unknown';
                    const verifier = level['Display Nickname'] || level['Verifier'] || creator;
                    const difficultyColumn = level['Level Placement Opinion'] || level['Difficulty'] || 'Unknown';
                    const difficulty = difficultyColumn.toLowerCase();
                    const videoUrl = level['Video Link'] || level['Video'] || '';
                    const videoId = getYouTubeId(videoUrl);
                    const rating = level['Rating'] || 0;
                    const userRating = userRatings[id] || 0;
                    const progress = levelProgress[id] || 0;
                    const isCompleted = completedLevels.includes(id);
                    
                    const comparisonCard = document.createElement('div');
                    comparisonCard.className = 'comparison-card';
                    
                    comparisonCard.innerHTML = `
                        <div class="comparison-header">
                            <div class="comparison-rank">#${rank}</div>
                            <div class="comparison-title">${name}</div>
                        </div>
                        <div class="comparison-details">
                            <div class="comparison-detail">
                                <div class="comparison-detail-label">Level ID</div>
                                <div class="comparison-detail-value">${id}</div>
                            </div>
                            <div class="comparison-detail">
                                <div class="comparison-detail-label">Creator</div>
                                <div class="comparison-detail-value">${creator}</div>
                            </div>
                            <div class="comparison-detail">
                                <div class="comparison-detail-label">Verifier</div>
                                <div class="comparison-detail-value">${verifier}</div>
                            </div>
                            <div class="comparison-detail">
                                <div class="comparison-detail-label">Difficulty</div>
                                <div class="comparison-detail-value">
                                    <span class="diff-pill ${difficulty}">${difficultyColumn}</span>
                                </div>
                            </div>
                            <div class="comparison-detail">
                                <div class="comparison-detail-label">Rating</div>
                                <div class="comparison-detail-value">
                                    ${userRating > 0 ? 
                                        `<div>${generateStarRating(userRating)} <span class="rating-note">(Your rating)</span></div>` : 
                                        generateStarRating(rating)
                                    }
                                </div>
                            </div>
                            <div class="comparison-detail">
                                <div class="comparison-detail-label">Progress</div>
                                <div class="comparison-detail-value">
                                    ${isCompleted ? 
                                        '<span style="color: var(--success);"><i class="fas fa-check-circle"></i> Completed</span>' : 
                                        progress > 0 ? 
                                            `<div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
                                            <span class="progress-text">${progress}%</span>` : 
                                            '<span style="color: var(--text-muted);">Not Started</span>'
                                    }
                                </div>
                            </div>
                            <div class="comparison-detail">
                                <div class="comparison-detail-label">Video</div>
                                <div class="comparison-detail-value">
                                    ${videoId ? 
                                        `<a href="${videoUrl}" target="_blank">Watch</a>` : 
                                        'No video'
                                    }
                                </div>
                            </div>
                        </div>
                    `;
                    
                    comparisonContainer.appendChild(comparisonCard);
                });
                
                // Show modal
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            // Export comparison data
            function exportComparison() {
                const data = selectedForCompare.map(level => ({
                    name: level['Level'] || level['Name'],
                    id: level['ID Level'] || level['ID'],
                    creator: level['Creators'] || level['Creator'],
                    verifier: level['Display Nickname'] || level['Verifier'],
                    difficulty: level['Level Placement Opinion'] || level['Difficulty'],
                    rating: level['Rating'],
                    userRating: userRatings[level['ID Level'] || level['ID']] || 0,
                    progress: levelProgress[level['ID Level'] || level['ID']] || 0,
                    completed: completedLevels.includes(level['ID Level'] || level['ID'])
                }));
                
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'level-comparison.json';
                a.click();
                
                URL.revokeObjectURL(url);
                showToast('Comparison exported successfully', 'success');
            }
            
            // Export data
            function exportData() {
                // Determine which data to use based on current page
                let currentData;
                let listType;
                
                if (window.location.pathname.includes('pemonlist.html')) {
                    currentData = pemonData;
                    listType = 'pemon';
                } else if (window.location.pathname.includes('impossiblelist.html')) {
                    currentData = impossibleData;
                    listType = 'impossible';
                } else {
                    currentData = demonData;
                    listType = 'demon';
                }
                
                const data = currentData.map(level => ({
                    name: level['Level'] || level['Name'],
                    id: level['ID Level'] || level['ID'],
                    creator: level['Creators'] || level['Creator'],
                    verifier: level['Display Nickname'] || level['Verifier'],
                    difficulty: level['Level Placement Opinion'] || level['Difficulty'],
                    rating: level['Rating'],
                    tags: level['Tags'],
                    video: level['Video Link'] || level['Video'],
                    description: level['Description'],
                    length: level['Length'],
                    objects: level['Objects'],
                    downloads: level['Downloads']
                }));
                
                const csv = convertToCSV(data);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `${listType}-levels.csv`;
                a.click();
                
                URL.revokeObjectURL(url);
                showToast('Data exported successfully', 'success');
            }
            
            // Convert data to CSV
            function convertToCSV(data) {
                if (!data || data.length === 0) return '';
                
                const headers = Object.keys(data[0]);
                const csvHeaders = headers.join(',');
                
                const csvRows = data.map(row => 
                    headers.map(header => {
                        const value = row[header] || '';
                        // Escape quotes and wrap in quotes if contains comma or quote
                        return value.includes(',') || value.includes('"') ? 
                            `"${value.replace(/"/g, '""')}"` : value;
                    }).join(',')
                );
                
                return csvHeaders + '\n' + csvRows.join('\n');
            }
            
            // Toggle advanced filters
            function toggleAdvancedFilters() {
                if (!elements.advancedFilterSection) return;
                
                elements.advancedFilterSection.classList.toggle('active');
            }
            
            // Apply advanced filters
            function applyAdvancedFilters() {
                const minRating = document.getElementById('minRating')?.value || 0;
                const maxRating = document.getElementById('maxRating')?.value || 5;
                const creatorFilter = document.getElementById('creatorFilter')?.value || '';
                const verifierFilter = document.getElementById('verifierFilter')?.value || '';
                const hasVideo = document.getElementById('hasVideo')?.checked || false;
                const completedFilter = document.getElementById('completedFilter')?.value || 'all';
                const tagFilter = document.getElementById('tagFilter')?.value || '';
                const minLength = document.getElementById('minLength')?.value || '';
                const maxLength = document.getElementById('maxLength')?.value || '';
                const minObjects = document.getElementById('minObjects')?.value || '';
                const maxObjects = document.getElementById('maxObjects')?.value || '';
                
                // Determine which data to use based on current page
                let currentData;
                
                if (window.location.pathname.includes('pemonlist.html')) {
                    currentData = pemonData;
                } else if (window.location.pathname.includes('impossiblelist.html')) {
                    currentData = impossibleData;
                } else {
                    currentData = demonData;
                }
                
                // Apply filters
                filteredData = currentData.filter(row => {
                    const rating = parseFloat(row['Rating']) || 0;
                    const creator = row['Creators'] || row['Creator'] || '';
                    const verifier = row['Display Nickname'] || row['Verifier'] || '';
                    const videoUrl = row['Video Link'] || row['Video'] || '';
                    const id = row['ID Level'] || row['ID'] || '';
                    const isCompleted = completedLevels.includes(id);
                    const tags = row['Tags'] ? row['Tags'].split(',').map(tag => tag.trim()) : [];
                    const length = row['Length'] || '';
                    const objects = parseInt(row['Objects']) || 0;
                    
                    // Rating filter
                    if (rating < minRating || rating > maxRating) return false;
                    
                    // Creator filter
                    if (creatorFilter && !creator.toLowerCase().includes(creatorFilter.toLowerCase())) return false;
                    
                    // Verifier filter
                    if (verifierFilter && !verifier.toLowerCase().includes(verifierFilter.toLowerCase())) return false;
                    
                    // Video filter
                    if (hasVideo && !videoUrl) return false;
                    
                    // Completion filter
                    if (completedFilter === 'completed' && !isCompleted) return false;
                    if (completedFilter === 'not-completed' && isCompleted) return false;
                    
                    // Tag filter
                    if (tagFilter && !tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()))) return false;
                    
                    // Length filter
                    if (minLength && length < minLength) return false;
                    if (maxLength && length > maxLength) return false;
                    
                    // Objects filter
                    if (minObjects && objects < minObjects) return false;
                    if (maxObjects && objects > maxObjects) return false;
                    
                    return true;
                });
                
                currentPage = 1;
                renderCards();
                renderPagination();
                
                // Close advanced filters
                if (elements.advancedFilterSection) elements.advancedFilterSection.classList.remove('active');
                
                showToast(`Applied advanced filters. Found ${filteredData.length} levels.`, 'success');
            }
            
            // Reset advanced filters
            function resetAdvancedFilters() {
                const minRating = document.getElementById('minRating');
                const maxRating = document.getElementById('maxRating');
                const creatorFilter = document.getElementById('creatorFilter');
                const verifierFilter = document.getElementById('verifierFilter');
                const hasVideo = document.getElementById('hasVideo');
                const completedFilter = document.getElementById('completedFilter');
                const tagFilter = document.getElementById('tagFilter');
                const minLength = document.getElementById('minLength');
                const maxLength = document.getElementById('maxLength');
                const minObjects = document.getElementById('minObjects');
                const maxObjects = document.getElementById('maxObjects');
                
                if (minRating) minRating.value = 0;
                if (maxRating) maxRating.value = 5;
                if (creatorFilter) creatorFilter.value = '';
                if (verifierFilter) verifierFilter.value = '';
                if (hasVideo) hasVideo.checked = false;
                if (completedFilter) completedFilter.value = 'all';
                if (tagFilter) tagFilter.value = '';
                if (minLength) minLength.value = '';
                if (maxLength) maxLength.value = '';
                if (minObjects) minObjects.value = '';
                if (maxObjects) maxObjects.value = '';
                
                // Reset to default filters
                // Determine which data to use based on current page
                let currentData;
                
                if (window.location.pathname.includes('pemonlist.html')) {
                    currentData = pemonData;
                } else if (window.location.pathname.includes('impossiblelist.html')) {
                    currentData = impossibleData;
                } else {
                    currentData = demonData;
                }
                
                filteredData = [...currentData];
                currentPage = 1;
                renderCards();
                renderPagination();
                
                // Close advanced filters
                if (elements.advancedFilterSection) elements.advancedFilterSection.classList.remove('active');
                
                showToast('Filters reset', 'info');
            }
            
            // Update range value display
            function updateRangeValue(e) {
                const rangeInput = e.target;
                const rangeValue = rangeInput.parentElement.querySelector('.range-value');
                if (rangeValue) {
                    rangeValue.textContent = rangeInput.value;
                }
            }
            
            // Update user profile
            function updateUserProfile() {
                const completedCount = completedLevels.length;
                const favoriteCount = favorites.length;
                
                userProfile.completedCount = completedCount;
                userProfile.favoriteCount = favoriteCount;
                
                // Calculate level based on experience
                userProfile.level = Math.floor(userProfile.experience / 100) + 1;
                
                localStorage.setItem('userProfile', JSON.stringify(userProfile));
                
                // Update UI if profile section exists
                const profileSection = document.getElementById('userProfileSection');
                if (profileSection) {
                    const completedCountEl = profileSection.querySelector('.user-stat:nth-child(1) span');
                    const favoriteCountEl = profileSection.querySelector('.user-stat:nth-child(2) span');
                    const levelEl = profileSection.querySelector('.user-level');
                    const expEl = profileSection.querySelector('.user-experience');
                    
                    if (completedCountEl) completedCountEl.textContent = completedCount;
                    if (favoriteCountEl) favoriteCountEl.textContent = favoriteCount;
                    if (levelEl) levelEl.textContent = `Level ${userProfile.level}`;
                    if (expEl) expEl.textContent = `${userProfile.experience} XP`;
                }
            }
            
            // Check for achievements
            function checkAchievements() {
                Object.values(ACHIEVEMENTS).forEach(achievement => {
                    if (!userAchievements.includes(achievement.id) && achievement.condition()) {
                        unlockAchievement(achievement);
                    }
                });
            }
            
            // Unlock achievement
            function unlockAchievement(achievement) {
                userAchievements.push(achievement.id);
                localStorage.setItem('achievements', JSON.stringify(userAchievements));
                
                showAchievementPopup(achievement);
                showToast(`Achievement Unlocked: ${achievement.title}!`, 'success');
            }
            
            // Show achievement popup
            function showAchievementPopup(achievement) {
                const popup = document.createElement('div');
                popup.className = 'achievement-popup';
                popup.innerHTML = `
                    <div class="achievement-icon">
                        <i class="fas ${achievement.icon}"></i>
                    </div>
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <button class="achievement-close" onclick="this.parentElement.remove()">
                        <i class="fas fa-times"></i> Close
                    </button>
                `;
                
                document.body.appendChild(popup);
                
                // Auto-close after 5 seconds
                setTimeout(() => {
                    if (popup.parentElement) {
                        popup.remove();
                    }
                }, 5000);
            }
            
            // Filter by tag
            function filterByTag(tag) {
                if (elements.searchInput) {
                    elements.searchInput.value = tag;
                    handleSearch();
                }
            }
            
            // Share level
            function shareLevel(level) {
                const name = level['Level'] || level['Name'] || 'Unknown Level';
                const id = level['ID Level'] || level['ID'] || '';
                const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
                
                if (navigator.share) {
                    navigator.share({
                        title: name,
                        text: `Check out this level: ${name}`,
                        url: url
                    }).then(() => {
                        showToast('Level shared successfully', 'success');
                    }).catch(err => {
                        console.error('Error sharing:', err);
                        copyToClipboard(url);
                    });
                } else {
                    copyToClipboard(url);
                }
            }
            
            // Copy to clipboard
            function copyToClipboard(text) {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                
                try {
                    document.execCommand('copy');
                    showToast('Link copied to clipboard', 'success');
                } catch (err) {
                    console.error('Failed to copy:', err);
                    showToast('Failed to copy link', 'error');
                }
                
                document.body.removeChild(textarea);
            }
            
            // Handle infinite scroll
            function handleInfiniteScroll() {
                if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
                    loadMoreItems();
                }
            }
            
            // Load more items for infinite scroll
            function loadMoreItems() {
                const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderCards();
                    renderPagination();
                }
            }
            
            // Start real-time updates check
            function startRealTimeUpdates() {
                // Check for updates every 5 minutes
                setInterval(checkForUpdates, 5 * 60 * 1000);
            }
            
            // Check for updates
            function checkForUpdates() {
                const lastUpdate = localStorage.getItem('lastDataUpdate');
                if (!lastUpdate) return;
                
                const timeSinceUpdate = Date.now() - new Date(lastUpdate).getTime();
                const hoursSinceUpdate = timeSinceUpdate / (1000 * 60 * 60);
                
                if (hoursSinceUpdate > 1) {
                    showUpdateNotification();
                }
            }
            
            // Show update notification
            function showUpdateNotification() {
                const notification = document.createElement('div');
                notification.className = 'update-notification';
                notification.innerHTML = `
                    <div class="update-content">
                        <i class="fas fa-sync-alt"></i>
                        <span>New data available!</span>
                        <button id="refreshBtn">Refresh</button>
                    </div>
                `;
                
                document.body.appendChild(notification);
                
                // Add animation
                setTimeout(() => notification.classList.add('show'), 10);
                
                // Add event listener to refresh button
                document.getElementById('refreshBtn').addEventListener('click', () => {
                    localStorage.removeItem('cachedDemonData');
                    location.reload();
                });
                
                // Auto-hide after 10 seconds
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }, 10000);
            }
            
            // Generate star rating HTML
            function generateStarRating(rating) {
                let stars = '<div class="rating-stars">';
                
                for (let i = 1; i <= 5; i++) {
                    if (i <= rating) {
                        stars += '<i class="fas fa-star"></i>';
                    } else {
                        stars += '<i class="far fa-star"></i>';
                    }
                }
                
                stars += '</div>';
                stars += `<span class="rating-value">${rating}/5</span>`;
                
                return stars;
            }
            
            // Toggle theme
            // Reset filters
            function resetFilters() {
                currentFilter = 'all';
                currentSort = 'rank';
                currentPage = 1;
                
                // Reset UI
                if (elements.searchInput) elements.searchInput.value = '';
                
                document.querySelectorAll('#difficultyMenu .filter-option').forEach(opt => {
                    opt.classList.remove('active');
                    if (opt.dataset.value === 'all') opt.classList.add('active');
                });
                
                document.querySelectorAll('#sortMenu .filter-option').forEach(opt => {
                    opt.classList.remove('active');
                    if (opt.dataset.value === 'rank') opt.classList.add('active');
                });
                
                const difficultyFilter = document.getElementById('difficultyFilter');
                const sortFilter = document.getElementById('sortFilter');
                
                if (difficultyFilter) {
                    const span = difficultyFilter.querySelector('span');
                    if (span) span.textContent = 'Difficulty';
                }
                
                if (sortFilter) {
                    const span = sortFilter.querySelector('span');
                    if (span) span.textContent = 'Rank';
                }
                
                // Reset advanced filters
                resetAdvancedFilters();
                
                // Re-apply filters
                applyFiltersAndSort();
            }
            
            // Setup lazy loading for images
            function setupLazyLoading() {
                const images = document.querySelectorAll('.card-thumb');
                
                if ('IntersectionObserver' in window) {
                    const imageObserver = new IntersectionObserver((entries, observer) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const img = entry.target;
                                img.src = img.dataset.src || img.src;
                                img.classList.remove('lazy');
                                observer.unobserve(img);
                            }
                        });
                    });
                    
                    images.forEach(img => imageObserver.observe(img));
                }
            }
            
            // Show toast notification
            function showToast(message, type = 'info') {
                if (!elements.toastContainer) return;
                
                const toast = document.createElement('div');
                toast.className = `toast ${type}`;
                
                let icon = '';
                switch (type) {
                    case 'success':
                        icon = 'fa-check-circle';
                        break;
                    case 'error':
                        icon = 'fa-exclamation-circle';
                        break;
                    case 'warning':
                        icon = 'fa-exclamation-triangle';
                        break;
                    case 'info':
                    default:
                        icon = 'fa-info-circle';
                        break;
                }
                
                toast.innerHTML = `
                    <i class="fas ${icon}"></i>
                    <span>${message}</span>
                `;
                
                elements.toastContainer.appendChild(toast);
                
                // Trigger animation
                setTimeout(() => toast.classList.add('show'), 10);
                
                // Remove after 3 seconds
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            }
            
            // Utility functions
            function debounce(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            }
            
            function throttle(func, limit) {
                let inThrottle;
                return function() {
                    const args = arguments;
                    const context = this;
                    if (!inThrottle) {
                        func.apply(context, args);
                        inThrottle = true;
                        setTimeout(() => inThrottle = false, limit);
                    }
                };
            }
            
            function showSettingsModal() {
                let modal = document.getElementById('settingsModal');
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'settingsModal';
                    modal.className = 'modal';
                    modal.innerHTML = `
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3 class="modal-title">Settings</h3>
                                <button class="modal-close" id="closeSettings"><i class="fas fa-times"></i></button>
                            </div>
                            <div class="modal-body">
                                <div class="filter-group">
                                    <label for="settingsPageSize">Items Per Page</label>
                                    <select id="settingsPageSize">
                                        <option value="6">6</option>
                                        <option value="12">12</option>
                                        <option value="24">24</option>
                                        <option value="48">48</option>
                                    </select>
                                </div>
                                <div class="filter-group">
                                    <label>Theme</label>
                                    <div style="display:flex;gap:.5rem;">
                                        <button id="themeLight" class="modal-btn">Light</button>
                                        <button id="themeDark" class="modal-btn">Dark</button>
                                    </div>
                                </div>
                                <div class="filter-group">
                                    <button id="clearData" class="modal-btn modal-btn-secondary">Clear Saved Data</button>
                                </div>
                            </div>
                        </div>`;
                    document.body.appendChild(modal);
                    const pageSizeSel = modal.querySelector('#settingsPageSize');
                    pageSizeSel.value = String(ITEMS_PER_PAGE);
                    pageSizeSel.addEventListener('change', e => setPageSize(e.target.value));
                    modal.querySelector('#themeLight').addEventListener('click', () => { document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('theme', 'light'); });
                    modal.querySelector('#themeDark').addEventListener('click', () => { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); });
                    modal.querySelector('#clearData').addEventListener('click', () => { localStorage.clear(); showToast('Saved data cleared', 'success'); });
                    modal.querySelector('#closeSettings').addEventListener('click', () => hideModal(modal));
                }
                showModal(modal);
            }
            function setPageSize(size) {
                ITEMS_PER_PAGE = parseInt(size) || 12;
                localStorage.setItem('pageSize', ITEMS_PER_PAGE);
                currentPage = 1;
                renderCards();
                renderPagination();
            }
            return {
                init,
                retryLoading,
                loadCachedData,
                loadSampleData,
                resetFilters,
                viewLevelDetails,
                playVideo,
                exportData,
                exportComparison,
                showSettingsModal,
                setPageSize
            };
        })();

        // Initialize the app when DOM is ready
        // Initialize the app when DOM is ready.
        // Component styling lives in styles.css (Material You 3) — nothing is
        // injected at runtime any more.
        document.addEventListener('DOMContentLoaded', () => {
            DemonListApp.init();
        });
