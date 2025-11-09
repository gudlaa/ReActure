import * as THREE from 'three';

// Note: mongoService is loaded as a global from mongoService.js script tag
// We'll reference it as window.mongoService or just mongoService

// ========================================
// USER AUTHENTICATION & DATA MANAGEMENT
// ========================================

class UserManager {
    constructor() {
        this.currentUser = null;
        this.loadCurrentUser();
    }
    
    loadCurrentUser() {
        const userId = localStorage.getItem('reacture_currentUser');
        if (userId) {
            this.currentUser = this.getUser(userId);
        }
    }
    
    async hashPassword(password) {
        // Use Web Crypto API for secure password hashing
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
    
    getUser(username) {
        const users = JSON.parse(localStorage.getItem('reacture_users') || '{}');
        return users[username] || null;
    }
    
    async createUser(username, displayName, password) {
        const users = JSON.parse(localStorage.getItem('reacture_users') || '{}');
        if (users[username]) {
            return { success: false, message: 'Username already exists' };
        }
        
        // Hash the password
        const passwordHash = await this.hashPassword(password);
        
        users[username] = {
            username,
            displayName,
            passwordHash,
            createdAt: Date.now(),
            totalPoints: 0,
            gamesPlayed: 0,
            streak: 0,
            lastPlayed: null,
            friends: [],
            friendRequests: [],
            sentRequests: [],
            history: [],
            dailyChallengeCompleted: null,
            hasSeenReactTimePopup: false  // Track if user has ever seen the popup
        };
        
        localStorage.setItem('reacture_users', JSON.stringify(users));
        return { success: true, user: users[username] };
    }
    
    async signIn(username, password) {
        const user = this.getUser(username);
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        
        // Verify password
        const passwordHash = await this.hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            return { success: false, message: 'Incorrect password' };
        }
        
        this.currentUser = user;
        localStorage.setItem('reacture_currentUser', username);
        this.updateStreak();
        return { success: true, user };
    }
    
    signOut() {
        this.currentUser = null;
        localStorage.removeItem('reacture_currentUser');
    }
    
    updateStreak() {
        if (!this.currentUser) return;
        
        const now = Date.now();
        const lastPlayed = this.currentUser.lastPlayed;
        
        if (!lastPlayed) {
            this.currentUser.streak = 1;
        } else {
            const daysSinceLastPlay = Math.floor((now - lastPlayed) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastPlay === 0) {
                // Same day, keep streak
            } else if (daysSinceLastPlay === 1) {
                // Next day, increment streak
                this.currentUser.streak++;
            } else {
                // Missed days, reset streak
                this.currentUser.streak = 1;
            }
        }
        
        this.currentUser.lastPlayed = now;
        this.saveUser();
    }
    
    addGameResult(result) {
        if (!this.currentUser) return;
        
        this.currentUser.gamesPlayed++;
        this.currentUser.totalPoints += result.score;
        this.currentUser.history.push({
            ...result,
            timestamp: Date.now()
        });
        
        // Keep only last 50 games
        if (this.currentUser.history.length > 50) {
            this.currentUser.history = this.currentUser.history.slice(-50);
        }
        
        this.saveUser();
    }
    
    saveUser() {
        if (!this.currentUser) return;
        
        const users = JSON.parse(localStorage.getItem('reacture_users') || '{}');
        users[this.currentUser.username] = this.currentUser;
        localStorage.setItem('reacture_users', JSON.stringify(users));
    }
    
    getAllUsers() {
        const users = JSON.parse(localStorage.getItem('reacture_users') || '{}');
        return Object.values(users);
    }
    
    getLeaderboard(type = 'global') {
        let users = this.getAllUsers();
        
        if (type === 'friends' && this.currentUser) {
            users = users.filter(u => 
                this.currentUser.friends.includes(u.username) || 
                u.username === this.currentUser.username
            );
        } else if (type === 'today') {
            const today = new Date().setHours(0, 0, 0, 0);
            users = users.filter(u => u.lastPlayed && u.lastPlayed >= today);
        }
        
        return users
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, 20);
    }
    
    // Friends Management
    sendFriendRequest(friendUsername) {
        if (!this.currentUser) return { success: false, message: 'Not logged in' };
        if (friendUsername === this.currentUser.username) {
            return { success: false, message: 'Cannot add yourself' };
        }
        
        const friend = this.getUser(friendUsername);
        if (!friend) {
            return { success: false, message: 'User not found' };
        }
        
        if (this.currentUser.friends.includes(friendUsername)) {
            return { success: false, message: 'Already friends' };
        }
        
        if (this.currentUser.sentRequests && this.currentUser.sentRequests.includes(friendUsername)) {
            return { success: false, message: 'Request already sent' };
        }
        
        // Add to current user's sent requests
        if (!this.currentUser.sentRequests) this.currentUser.sentRequests = [];
        this.currentUser.sentRequests.push(friendUsername);
        this.saveUser();
        
        // Add to friend's received requests
        if (!friend.friendRequests) friend.friendRequests = [];
        friend.friendRequests.push(this.currentUser.username);
        const users = JSON.parse(localStorage.getItem('reacture_users') || '{}');
        users[friendUsername] = friend;
        localStorage.setItem('reacture_users', JSON.stringify(users));
        
        // Send notification to the friend (they'll see it when they login)
        // For now, we're using localStorage - in production this would be a push notification
        console.log(`📨 Friend request sent from ${this.currentUser.username} to ${friendUsername}`);
        
        return { success: true, message: 'Friend request sent!' };
    }
    
    acceptFriendRequest(friendUsername) {
        if (!this.currentUser) return { success: false };
        
        const friend = this.getUser(friendUsername);
        if (!friend) return { success: false };
        
        // Initialize arrays if needed
        if (!this.currentUser.friendRequests) this.currentUser.friendRequests = [];
        if (!this.currentUser.friends) this.currentUser.friends = [];
        if (!friend.sentRequests) friend.sentRequests = [];
        if (!friend.friends) friend.friends = [];
        
        // Remove from requests
        this.currentUser.friendRequests = this.currentUser.friendRequests.filter(u => u !== friendUsername);
        friend.sentRequests = friend.sentRequests.filter(u => u !== this.currentUser.username);
        
        // Add to friends lists
        this.currentUser.friends.push(friendUsername);
        friend.friends.push(this.currentUser.username);
        
        // Save both users
        this.saveUser();
        const users = JSON.parse(localStorage.getItem('reacture_users') || '{}');
        users[friendUsername] = friend;
        localStorage.setItem('reacture_users', JSON.stringify(users));
        
        return { success: true };
    }
    
    declineFriendRequest(friendUsername) {
        if (!this.currentUser) return { success: false };
        
        const friend = this.getUser(friendUsername);
        if (!friend) return { success: false };
        
        // Initialize arrays if needed
        if (!this.currentUser.friendRequests) this.currentUser.friendRequests = [];
        if (!friend.sentRequests) friend.sentRequests = [];
        
        // Remove from requests
        this.currentUser.friendRequests = this.currentUser.friendRequests.filter(u => u !== friendUsername);
        friend.sentRequests = friend.sentRequests.filter(u => u !== this.currentUser.username);
        
        // Save both users
        this.saveUser();
        const users = JSON.parse(localStorage.getItem('reacture_users') || '{}');
        users[friendUsername] = friend;
        localStorage.setItem('reacture_users', JSON.stringify(users));
        
        return { success: true };
    }
    
    removeFriend(friendUsername) {
        if (!this.currentUser) return { success: false };
        
        const friend = this.getUser(friendUsername);
        if (!friend) return { success: false };
        
        // Initialize arrays if needed
        if (!this.currentUser.friends) this.currentUser.friends = [];
        if (!friend.friends) friend.friends = [];
        
        // Remove from friends lists
        this.currentUser.friends = this.currentUser.friends.filter(u => u !== friendUsername);
        friend.friends = friend.friends.filter(u => u !== this.currentUser.username);
        
        // Save both users
        this.saveUser();
        const users = JSON.parse(localStorage.getItem('reacture_users') || '{}');
        users[friendUsername] = friend;
        localStorage.setItem('reacture_users', JSON.stringify(users));
        
        return { success: true };
    }
}

const userManager = new UserManager();

// ========================================
// DAILY CHALLENGE SYSTEM (BeReal-style)
// ========================================

class ChallengeManager {
    constructor() {
        this.dailyChallenges = [
            { title: "REACT TIME: Tokyo Earthquake", description: "2 minutes until aftershock! Rescue now!", icon: "🏚️", env: "earthquake", reactTime: 120 },
            { title: "REACT TIME: Pacific Tsunami", description: "2 minutes until wave hits! Get victims to high ground!", icon: "🌊", env: "tsunami", reactTime: 120 },
            { title: "REACT TIME: California Wildfire", description: "90 seconds until fire spreads! Clear the zone!", icon: "🔥", env: "wildfire", reactTime: 90 },
            { title: "REACT TIME: Volcanic Eruption", description: "2 minutes until volcanic eruption! Evacuate now!", icon: "🌋", env: "wildfire", reactTime: 120 },
            { title: "REACT TIME: Building Collapse", description: "3 minutes before total collapse! Save everyone!", icon: "🏢", env: "earthquake", reactTime: 180 },
            { title: "REACT TIME: Flash Flood", description: "90 seconds until water surge! Rescue trapped victims!", icon: "💧", env: "tsunami", reactTime: 90 }
        ];
        
        this.currentChallenge = this.getDailyChallenge();
        // Always reset popup flag on page load so it shows every time for testing
        this.hasShownPopup = false;
        
        // Store whether popup was shown this session (not persistent)
        this.popupShownThisSession = false;
    }
    
    getDailyChallenge() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('reacture_dailyChallenge');
        
        if (stored) {
            const challenge = JSON.parse(stored);
            if (challenge.date === today) {
                // Check if challenge has expired
                const now = Date.now();
                if (now < challenge.expiresAt) {
                    console.log('📅 Using existing challenge for today');
                    return challenge;
                } else {
                    console.log('⏰ Challenge expired, generating new one');
                    // Challenge expired, generate a new one
                }
            } else {
                console.log('🗓️  New day, generating new challenge');
            }
        } else {
            console.log('🆕 No challenge found, creating first one');
        }
        
        // Generate new daily challenge (starts immediately!)
        const randomTime = this.getRandomDailyTime();
        const randomChallenge = this.dailyChallenges[Math.floor(Math.random() * this.dailyChallenges.length)];
        
        const challenge = {
            ...randomChallenge,
            date: today,
            time: randomTime,
            expiresAt: randomTime + (10 * 60 * 1000) // 10 minute window
        };
        
        localStorage.setItem('reacture_dailyChallenge', JSON.stringify(challenge));
        
        // Reset popup flag so it shows for new challenge
        this.hasShownPopup = false;
        
        console.log('✨ New challenge created:', challenge.title);
        console.log('⏰ Active window:', new Date(challenge.time).toLocaleTimeString(), '-', new Date(challenge.expiresAt).toLocaleTimeString());
        
        return challenge;
    }
    
    getRandomDailyTime() {
        // Set REACT TIME to start NOW (so it appears when app opens)
        // In production, you could randomize this or set to a specific time
        const now = Date.now();
        // Start the challenge now or in the past so it's immediately active
        return now - (1 * 60 * 1000); // Started 1 minute ago (so it's active now)
    }
    
    getChallengeStatus() {
        const now = Date.now();
        const { time, expiresAt } = this.currentChallenge;
        
        // Check if user already completed today's challenge
        const today = new Date().toDateString();
        const hasCompleted = userManager.currentUser && 
                            userManager.currentUser.dailyChallengeCompleted === today;
        
        if (now < time) {
            return { status: 'upcoming', timeUntil: time - now, completed: hasCompleted };
        } else if (now >= time && now < expiresAt) {
            return { status: 'active', timeRemaining: expiresAt - now, completed: hasCompleted };
        } else {
            return { status: 'expired', timeUntil: null, completed: hasCompleted };
        }
    }
    
    canPlayChallenge() {
        const status = this.getChallengeStatus();
        // Can only play if challenge is active and not yet completed
        return status.status === 'active' && !status.completed;
    }
    
    getMissedMessage() {
        const status = this.getChallengeStatus();
        if (status.completed) {
            return "✅ You completed today's REACT TIME!";
        } else if (status.status === 'expired') {
            return "❌ You missed today's REACT TIME window";
        } else if (status.status === 'upcoming') {
            return "⏰ Today's REACT TIME hasn't started yet";
        }
        return "";
    }
    
    formatTimeRemaining(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        
        if (minutes > 60) {
            const hours = Math.floor(minutes / 60);
            return `${hours}h ${minutes % 60}m`;
        }
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    showReactTimePopup() {
        console.log('🔍 Checking REACT TIME popup...');
        console.log('  popupShownThisSession:', this.popupShownThisSession);
        
        // Only show once per page load session
        if (this.popupShownThisSession) {
            console.log('  ⏭️  Already shown this session');
            return;
        }
        
        const status = this.getChallengeStatus();
        console.log('  Challenge status:', status);
        console.log('  - Status:', status.status);
        console.log('  - Completed:', status.completed);
        console.log('  - Time remaining:', status.timeRemaining);
        
        if (status.status === 'active' && !status.completed) {
            console.log('  ⚡ SHOWING REACT TIME POPUP!');
            this.popupShownThisSession = true; // Mark as shown for this session
            
            const popup = document.getElementById('reactTimePopup');
            const challengeTitle = document.getElementById('popupChallengeTitle');
            const challengeDesc = document.getElementById('popupChallengeDescription');
            const countdown = document.getElementById('popupCountdown');
            
            console.log('  Popup element:', popup ? '✅ Found' : '❌ NOT FOUND');
            
            if (popup) {
                challengeTitle.textContent = this.currentChallenge.title;
                challengeDesc.textContent = this.currentChallenge.description;
                popup.classList.remove('hidden');
                popup.style.display = 'flex'; // Force display
                popup.style.zIndex = '9999'; // Force on top
                console.log('  ✅ Popup displayed!');
                console.log('  📍 Popup classList:', Array.from(popup.classList));
                console.log('  📍 Popup display:', window.getComputedStyle(popup).display);
                
                // Update countdown every second
                const updateCountdown = () => {
                    const currentStatus = this.getChallengeStatus();
                    if (currentStatus.status === 'active' && countdown) {
                        countdown.textContent = this.formatTimeRemaining(currentStatus.timeRemaining);
                    } else if (countdown) {
                        countdown.textContent = 'EXPIRED';
                    }
                };
                
                // Initial update
                updateCountdown();
                
                // Update every second while popup is visible
                this.countdownInterval = setInterval(updateCountdown, 1000);
            } else {
                console.error('  ❌ ERROR: Popup element not found in DOM!');
            }
            
            // Send notification
            notificationManager.addNotification('react_time', 
                `⚡ ${this.currentChallenge.title} is LIVE NOW! React within ${Math.floor(status.timeRemaining / 60000)} minutes!`,
                { challenge: this.currentChallenge }
            );
            
            // Play sound notification (if available)
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
                audio.play().catch(() => {});
            } catch (e) {}
        } else {
            console.log('  ⏭️  Not showing popup:');
            console.log('     - Status is:', status.status);
            console.log('     - Completed is:', status.completed);
            if (status.completed) {
                console.log('     - User already completed today\'s challenge');
            }
            if (status.status !== 'active') {
                console.log('     - Challenge is not active (status:', status.status + ')');
            }
        }
    }
}

const challengeManager = new ChallengeManager();

// ========================================
// ENVIRONMENT CONFIGURATIONS
// ========================================

const ENVIRONMENTS = {
    earthquake: {
        name: 'Earthquake Zone',
        skyColor: 0x8B7355,
        fogColor: 0x8B7355,
        groundColor: 0x8B4513,
        rubbleColor: 0x654321,
        hazardColor: 0xA0522D,
        hazardType: 'unstable',
        description: 'Unstable ground. Buildings collapsed.',
        damageMultiplier: 1.5
    },
    tsunami: {
        name: 'Tsunami Zone',
        skyColor: 0x4682B4,
        fogColor: 0x5F9EA0,
        groundColor: 0x4682B4,
        rubbleColor: 0x708090,
        hazardColor: 0x1E90FF,
        hazardType: 'water',
        description: 'Flooded areas. Water hazards.',
        damageMultiplier: 1.2
    },
    wildfire: {
        name: 'Wildfire Zone',
        skyColor: 0xFF4500,
        fogColor: 0xFF6347,
        groundColor: 0x8B0000,
        rubbleColor: 0x2F1F1F,
        hazardColor: 0xFF0000,
        hazardType: 'fire',
        description: 'Spreading flames. High heat.',
        damageMultiplier: 2.0
    }
};

// ========================================
// NOTIFICATIONS SYSTEM
// ========================================

class NotificationManager {
    constructor() {
        this.notifications = this.loadNotifications();
    }
    
    loadNotifications() {
        return JSON.parse(localStorage.getItem('reacture_notifications') || '[]');
    }
    
    saveNotifications() {
        localStorage.setItem('reacture_notifications', JSON.stringify(this.notifications));
        console.log('💾 Notifications saved to localStorage');
    }
    
    addNotification(type, message, data = {}) {
        this.notifications.unshift({
            id: Date.now(),
            type,
            message,
            data,
            read: false,
            timestamp: Date.now()
        });
        
        // Keep only last 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }
        
        this.saveNotifications();
        this.updateBadge();
    }
    
    markAsRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
            notif.read = true;
            this.saveNotifications();
            this.updateBadge();
        }
    }
    
    markAllAsRead() {
        // Clear all notifications instead of just marking as read
        this.notifications = [];
        this.saveNotifications();
        this.updateBadge();
        console.log('🗑️  All notifications cleared');
        console.log('📊 Notifications count now:', this.notifications.length);
    }
    
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }
    
    updateBadge() {
        // Update both badges (nav and any others)
        const badgeNav = document.getElementById('notificationBadgeNav');
        const count = this.getUnreadCount();
        
        if (badgeNav) {
            badgeNav.textContent = count;
            badgeNav.style.display = count > 0 ? 'inline' : 'none';
        }
        
        console.log(`🔔 Notification badge updated: ${count} unread`);
    }
}

const notificationManager = new NotificationManager();

// ========================================
// GAME STATE
// ========================================

const gameState = {
    startTime: null,
    elapsedTime: 0,
    victimsSaved: 0,
    victimsTotal: 0,
    victimsDied: 0,
    isGameOver: false,
    isGameStarted: false,
    isPaused: false,
    score: 0,
    environment: 'earthquake',
    logs: [],
    dataCollectionInterval: null,
    inspectMode: false,
    inspectTimeout: null
};

// ========================================
// ROBOT STATE
// ========================================

const robotState = {
    health: 100,
    maxHealth: 100,
    fuel: 100,
    maxFuel: 100,
    position: new THREE.Vector3(0, 1, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: 0,
    currentZone: 'safe',
    damageCooldown: 0,
    isJumping: false,
    jumpVelocity: 0,
    // Accelerometer data (simulated)
    acceleration: new THREE.Vector3(0, 0, 0),
    angularVelocity: new THREE.Vector3(0, 0, 0)
};

// ========================================
// SCENE SETUP
// ========================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4a90e2);
scene.fog = new THREE.Fog(0x87CEEB, 50, 150);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// First-person camera - no offset needed

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ========================================
// LIGHTING
// ========================================

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(20, 30, 10);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.bias = -0.0001;
scene.add(directionalLight);

const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.4);
scene.add(hemisphereLight);

// ========================================
// CONTROLS
// ========================================

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3(0, 0, 0);
const direction = new THREE.Vector3();
const gravity = -20; // Gravity constant
const robotHeight = 1.0;

// Camera controls - First Person
let mouseX = 0;
let mouseY = 0;
let cameraYaw = 0; // Horizontal rotation
let cameraPitch = 0; // Vertical rotation
const mouseSensitivity = 0.002;

// ========================================
// GROUND
// ========================================

let ground = null;

function createGround(env) {
    if (ground) {
        scene.remove(ground);
        // Also remove old grid helpers
        scene.children.filter(child => child.type === 'GridHelper').forEach(grid => {
            scene.remove(grid);
        });
    }
    
    const envConfig = ENVIRONMENTS[env];
const groundSize = 200;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 100, 100);
    
    // Create grass-like material
const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: env === 'wildfire' ? envConfig.groundColor : 0x4a7c34, // Green grass for most environments
        roughness: 0.95,
        metalness: 0.05
});

    // Add natural terrain variation
const positions = groundGeometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
        // Create rolling hills effect
        const height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.8 + 
                      Math.sin(x * 0.2) * Math.cos(z * 0.15) * 0.3;
    positions.setY(i, height);
}
groundGeometry.computeVertexNormals();

    ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.position.y = 0;
scene.add(ground);

    // NO GRID - just natural ground!
}

// ========================================
// SKY
// ========================================

function createSky(env) {
    const envConfig = ENVIRONMENTS[env];
    
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: envConfig.skyColor,
        side: THREE.BackSide,
        fog: false
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    
    // Update fog
    scene.fog.color.setHex(envConfig.fogColor);
    scene.background.setHex(envConfig.skyColor);
    }
    
// ========================================
// ROBOT
// ========================================

function createRobot() {
    const robotGroup = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(1, 1.2, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4CAF50,
        metalness: 0.7,
        roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    robotGroup.add(body);
    
    // Head
    const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const headMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2196F3,
        metalness: 0.8,
        roughness: 0.2
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = true;
    robotGroup.add(head);
    
    // Eye
    const eyeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    });
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.rotation.x = Math.PI / 2;
    eye.position.set(0, 1.5, 0.35);
    robotGroup.add(eye);
    
    // Arms
    const armGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
    const armMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4CAF50,
        metalness: 0.7,
        roughness: 0.3
    });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.65, 0.8, 0);
    leftArm.castShadow = true;
    robotGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.65, 0.8, 0);
    rightArm.castShadow = true;
    robotGroup.add(rightArm);
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.35, 0.8, 0.35);
    const legMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x388E3C,
        metalness: 0.7,
        roughness: 0.3
    });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, 0.4, 0);
    leftLeg.castShadow = true;
    robotGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, 0.4, 0);
    rightLeg.castShadow = true;
    robotGroup.add(rightLeg);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x212121,
        metalness: 0.9,
        roughness: 0.1
    });
    
    const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    leftWheel.rotation.z = Math.PI / 2;
    leftWheel.position.set(-0.5, 0.2, 0);
    robotGroup.add(leftWheel);
    
    const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rightWheel.rotation.z = Math.PI / 2;
    rightWheel.position.set(0.5, 0.2, 0);
    robotGroup.add(rightWheel);
    
    robotGroup.position.set(0, robotHeight, 0);
    robotGroup.castShadow = true;
    robotGroup.userData = {
        wheels: [leftWheel, rightWheel],
        body: body,
        head: head,
        arms: [leftArm, rightArm],
        legs: [leftLeg, rightLeg]
    };
    
    return robotGroup;
}

const robotMesh = createRobot();
robotMesh.visible = false; // Hide robot in first-person view
scene.add(robotMesh);

// ========================================
// GAME OBJECTS
// ========================================

const rubblePieces = [];
const victims = [];
const zones = [];
let fuelStation = null;

// ========================================
// RANDOM MAP GENERATION
// ========================================

function generateRandomMap(env) {
    console.log('🗺️  Generating map for environment:', env);
    
    // Clear existing objects
    rubblePieces.forEach(piece => scene.remove(piece));
    victims.forEach(victim => scene.remove(victim));
    zones.forEach(zone => scene.remove(zone));
    if (fuelStation) scene.remove(fuelStation);
    
    rubblePieces.length = 0;
    victims.length = 0;
    zones.length = 0;
    
    const envConfig = ENVIRONMENTS[env];
    
    if (!envConfig) {
        console.error('❌ ERROR: No environment config for:', env);
        alert(`Critical Error: Environment "${env}" not found!`);
        return;
    }
    
    console.log('✅ Using environment config:', envConfig.name);
    
    // Create rubble piles with victims - Earthquake style (horizontal spread)
    const numPiles = 7 + Math.floor(Math.random() * 5); // 7-11 piles
    gameState.victimsTotal = 0;
    
    for (let i = 0; i < numPiles; i++) {
        const pileX = (Math.random() - 0.5) * 60;
        const pileZ = (Math.random() - 0.5) * 60;
        const pileY = 0;
        
        // Earthquake-style: more pieces, spread horizontally
        const numPieces = 12 + Math.floor(Math.random() * 15); // 12-26 pieces
        const spreadRadius = 5 + Math.random() * 3; // Wider horizontal spread (5-8m)
        
        for (let j = 0; j < numPieces; j++) {
            // Create more rectangular, flat pieces (collapsed building debris)
            const width = 1 + Math.random() * 2.5;
            const height = 0.3 + Math.random() * 0.8; // Flatter pieces (0.3-1.1m)
            const depth = 1 + Math.random() * 2.5;
            
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshStandardMaterial({ 
                color: new THREE.Color(envConfig.rubbleColor).offsetHSL(0, 0, Math.random() * 0.1 - 0.05),
                transparent: false, // Can be made transparent during inspect
                opacity: 1.0
            });
            const piece = new THREE.Mesh(geometry, material);
            
            // Horizontal earthquake spread pattern (circular distribution)
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * spreadRadius;
            const layer = Math.floor(j / 6); // Loose layers, max 3-4 layers
            
            piece.position.set(
                pileX + Math.cos(angle) * distance,
                pileY + layer * 0.5 + Math.random() * 0.3, // Much lower stacking (0-2m max)
                pileZ + Math.sin(angle) * distance
            );
            
            // Rotations simulate fallen/collapsed state
            piece.rotation.set(
                (Math.random() - 0.5) * Math.PI * 0.4, // Slight X tilt
                Math.random() * Math.PI * 2, // Random Y rotation
                (Math.random() - 0.5) * Math.PI * 0.3 // Slight Z tilt
            );
            
            piece.castShadow = true;
            piece.receiveShadow = true;
            piece.userData = { 
                type: 'rubble',
                destroyed: false,
                pileId: i
            };
            
            scene.add(piece);
            rubblePieces.push(piece);
        }
        
        // Add victim under pile (80% chance)
        if (Math.random() > 0.2) {
            const victim = createVictim(pileX, pileZ, i);
            victims.push(victim);
            gameState.victimsTotal++;
        }
    }
    
    // Create hazard zones
    const numYellowZones = 4 + Math.floor(Math.random() * 3); // 4-6 zones
    for (let i = 0; i < numYellowZones; i++) {
        const zone = createZone(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            3 + Math.random() * 3,
            'yellow',
            env
        );
        zones.push(zone);
    }
    
    const numRedZones = 2 + Math.floor(Math.random() * 2); // 2-3 zones
    for (let i = 0; i < numRedZones; i++) {
        const zone = createZone(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            2 + Math.random() * 2,
            'red',
            env
        );
        zones.push(zone);
    }
    
    // Create fuel station at random location
    createFuelStation(env);
    
    updateVictimCount();
}

function createVictim(x, z, pileId) {
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xff6b6b,
        transparent: false, // Can be made transparent during inspect
        opacity: 1.0
    });
    const victim = new THREE.Mesh(geometry, material);
    victim.position.set(x, 0.4, z);
    victim.castShadow = true;
    victim.renderOrder = 999; // Render last for better visibility
    
    victim.userData = {
        type: 'victim',
        health: 100,
        maxHealth: 100,
        saved: false,
        died: false,
        accessible: false,
        decayRate: 0.3 + Math.random() * 0.4,
        pileId: pileId
    };
    
    scene.add(victim);
    return victim;
}

function createZone(x, z, radius, type, env) {
    const envConfig = ENVIRONMENTS[env];
    
    // Flat circle on ground plane
    const geometry = new THREE.CircleGeometry(radius, 32);
    
    // Color based on zone type
    let color;
    if (type === 'yellow') {
        color = 0xffeb3b; // Yellow
    } else if (type === 'red') {
        color = envConfig.hazardColor; // Environment-specific danger color
    } else {
        color = 0x4CAF50; // Green for safe (if ever used)
    }
    
    const material = new THREE.MeshStandardMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.4,
        emissive: color,
        emissiveIntensity: type === 'red' ? 0.5 : 0.2,
        side: THREE.DoubleSide
    });
    
    const zone = new THREE.Mesh(geometry, material);
    zone.position.set(x, 0.02, z); // Flat on ground, slightly raised to prevent z-fighting
    zone.rotation.x = -Math.PI / 2; // Lay flat on ground
    
    zone.userData = {
        type: type,
        radius: radius,
        hazardType: type === 'red' ? envConfig.hazardType : 'caution'
    };
    
    scene.add(zone);
    return zone;
}

function createFuelStation(env) {
    const stationGeometry = new THREE.BoxGeometry(2, 2, 2);
    const stationMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2196F3,
        emissive: 0x2196F3,
        emissiveIntensity: 0.2
    });
    fuelStation = new THREE.Mesh(stationGeometry, stationMaterial);
    
    // Random position
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 20;
    fuelStation.position.set(
        Math.cos(angle) * distance,
        1,
        Math.sin(angle) * distance
    );
    fuelStation.castShadow = true;
    
    // Indicator
    const indicatorGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8);
    const indicatorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4CAF50,
        emissive: 0x4CAF50,
        emissiveIntensity: 0.8
    });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.y = 1.5;
    fuelStation.add(indicator);
    
    scene.add(fuelStation);
}

// ========================================
// KEYBOARD CONTROLS
// ========================================

const canvas = document.getElementById('gameCanvas');
canvas.setAttribute('tabindex', '0');
canvas.style.outline = 'none';
canvas.style.cursor = 'crosshair';

const handleKeyDown = (event) => {
    console.log('🎮 Key pressed:', event.code, 'Game started:', gameState.isGameStarted, 'Paused:', gameState.isPaused);
    
    // ESC works even when paused
    if (event.code === 'Escape') {
        event.preventDefault();
        if (gameState.isGameStarted && !gameState.isGameOver) {
            togglePause();
        }
        return;
    }
    
    if (!gameState.isGameStarted || gameState.isGameOver || gameState.isPaused) {
        console.log('⚠️ Input blocked - Game state:', { started: gameState.isGameStarted, over: gameState.isGameOver, paused: gameState.isPaused });
        return;
    }
    
    switch (event.code) {
        case 'KeyW':
                moveForward = true;
            console.log('✅ W pressed - Move forward =', moveForward);
                    logPlayerAction('move_forward_start');
            break;
        case 'KeyA':
                moveLeft = true;
            console.log('✅ A pressed - Move left =', moveLeft);
                    logPlayerAction('move_left_start');
            break;
        case 'KeyS':
                moveBackward = true;
            console.log('✅ S pressed - Move backward =', moveBackward);
                    logPlayerAction('move_backward_start');
            break;
        case 'KeyD':
                moveRight = true;
            console.log('✅ D pressed - Move right =', moveRight);
                    logPlayerAction('move_right_start');
            break;
        case 'Space':
            event.preventDefault();
            console.log('✅ Space pressed');
            // Jump if moving, destroy rubble if stationary
            if ((moveForward || moveBackward || moveLeft || moveRight) && !robotState.isJumping) {
                jump();
            } else {
                destroyRubble();
            }
            break;
        case 'KeyR':
            console.log('✅ R pressed - Refuel attempt');
                refuel();
            break;
        case 'KeyE':
            console.log('✅ E pressed - Inspect mode (X-ray vision)');
            // Inspect - see through rubble to find victims
            inspectVictims();
            break;
    }
};

const handleKeyUp = (event) => {
    if (!gameState.isGameStarted || gameState.isGameOver) return;
    
    switch (event.code) {
        case 'KeyW':
                moveForward = false;
                    logPlayerAction('move_forward_stop');
            break;
        case 'KeyA':
                moveLeft = false;
                    logPlayerAction('move_left_stop');
            break;
        case 'KeyS':
                moveBackward = false;
                    logPlayerAction('move_backward_stop');
            break;
        case 'KeyD':
                moveRight = false;
                    logPlayerAction('move_right_stop');
            break;
    }
};

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

// ========================================
// MOUSE CONTROLS
// ========================================

let isPointerLocked = false;
let lastMouseX = window.innerWidth / 2;
let lastMouseY = window.innerHeight / 2;
let mouseDown = false;

canvas.addEventListener('mousedown', (e) => {
    canvas.focus();
    mouseDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('mouseup', () => {
    mouseDown = false;
});

// Pointer lock for FPS controls
canvas.addEventListener('click', () => {
    if (gameState.isGameStarted && !gameState.isGameOver && !gameState.isPaused) {
        // If pointer is already locked, treat click as rescue attempt
        if (document.pointerLockElement === canvas) {
            console.log('🖱️ Mouse clicked - Attempting rescue');
            attemptRescue();
        } else {
            // Otherwise, request pointer lock
            canvas.requestPointerLock = canvas.requestPointerLock || 
                                        canvas.mozRequestPointerLock || 
                                        canvas.webkitRequestPointerLock;
            canvas.requestPointerLock();
        }
    }
});

document.addEventListener('pointerlockchange', () => {
    const isLocked = document.pointerLockElement === canvas;
    const prompt = document.getElementById('pointerLockPrompt');
    
    if (isLocked) {
        console.log('✅ Pointer locked - Mouse look enabled');
        if (prompt) prompt.classList.add('hidden');
    } else {
        console.log('❌ Pointer unlocked - Click to enable mouse look');
        if (prompt && gameState.isGameStarted && !gameState.isGameOver && !gameState.isPaused) {
            prompt.classList.remove('hidden');
    }
    }
});

// Also handle for different browsers
document.addEventListener('mozpointerlockchange', () => {
    const isLocked = document.mozPointerLockElement === canvas;
    const prompt = document.getElementById('pointerLockPrompt');
    if (isLocked && prompt) prompt.classList.add('hidden');
    else if (prompt && gameState.isGameStarted) prompt.classList.remove('hidden');
});

document.addEventListener('webkitpointerlockchange', () => {
    const isLocked = document.webkitPointerLockElement === canvas;
    const prompt = document.getElementById('pointerLockPrompt');
    if (isLocked && prompt) prompt.classList.add('hidden');
    else if (prompt && gameState.isGameStarted) prompt.classList.remove('hidden');
});

canvas.addEventListener('mousemove', (event) => {
    if (!gameState.isGameStarted || gameState.isGameOver || gameState.isPaused) return;
    
    // Use movementX/Y for smooth FPS controls (works with pointer lock)
    const deltaX = event.movementX || 0;
    const deltaY = event.movementY || 0;
    
    // First-person camera rotation
    cameraYaw -= deltaX * mouseSensitivity;
    cameraPitch -= deltaY * mouseSensitivity;
    
    // Limit vertical look (prevent flipping)
    cameraPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraPitch));
});

// ========================================
// PAUSE/RESUME
// ========================================

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    
    const pauseMenu = document.getElementById('pauseMenu');
    if (pauseMenu) {
        if (gameState.isPaused) {
            pauseMenu.classList.remove('hidden');
            logPlayerAction('game_paused');
    } else {
            pauseMenu.classList.add('hidden');
            logPlayerAction('game_resumed');
        }
    }
}

// ========================================
// INSPECT VICTIMS
// ========================================

function inspectVictims() {
    if (gameState.inspectMode) {
        console.log('⚠️ Already in inspect mode');
        return;
    }
    
    // Log inspect action
    logRobotState('inspect', { action: 'inspect_activated' });
    
    console.log('👁️ X-RAY VISION ACTIVATED!');
    gameState.inspectMode = true;
    logPlayerAction('inspect_start');
    
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    
    let victimsDetected = 0;
    
    // Make ALL rubble transparent (not just in cone)
    rubblePieces.forEach(piece => {
        if (!piece.userData.destroyed) {
            if (!piece.material.transparent) {
                piece.userData.originalOpacity = piece.material.opacity || 1.0;
                piece.userData.wasTransparent = piece.material.transparent || false;
            }
            piece.material.transparent = true;
            piece.material.opacity = 0.2; // Very transparent
            piece.material.depthWrite = false; // Don't write to depth buffer
            piece.userData.wasInspectTransparent = true;
            
            console.log('🧱 Rubble made transparent');
        }
    });
    
    // Make ALL victims visible with bright glow (within range and in front)
    victims.forEach(victim => {
        if (victim.userData.saved || victim.userData.died) return;
        
        const toVictim = new THREE.Vector3().subVectors(victim.position, camera.position);
        const distance = toVictim.length();
        
        if (distance < 30) { // Extended range
            toVictim.normalize();
            const angle = cameraDirection.angleTo(toVictim);
            
            // Wide cone in front (nearly 180°)
            if (angle < Math.PI * 0.6) {
                // Make victim bright and visible through everything
                if (!victim.material.transparent) {
                    victim.userData.wasTransparent = victim.material.transparent || false;
                }
                
                victim.material.emissive = new THREE.Color(0xff0000);
                victim.material.emissiveIntensity = 2.0; // Very bright
                victim.material.transparent = true;
                victim.material.opacity = 1.0;
                victim.material.depthTest = false; // Render on top of everything!
                victim.material.depthWrite = false;
                victim.userData.inspectPulse = 0;
                
                victimsDetected++;
                console.log('🔴 Victim visible through rubble at', distance.toFixed(1) + 'm, angle:', (angle * 180 / Math.PI).toFixed(1) + '°');
            }
        }
    });
    
    console.log('👁️ X-ray detected', victimsDetected, 'victim(s)');
    if (victimsDetected === 0) {
        console.log('⚠️ No victims in view. Look around or get closer!');
    }
    
    // Clear inspect mode after 3 seconds
    if (gameState.inspectTimeout) clearTimeout(gameState.inspectTimeout);
    gameState.inspectTimeout = setTimeout(() => {
        console.log('👁️ X-ray vision ending...');
        gameState.inspectMode = false;
        
        // Restore rubble to solid
        rubblePieces.forEach(piece => {
            if (piece.userData.wasInspectTransparent) {
                piece.material.opacity = piece.userData.originalOpacity || 1.0;
                piece.material.transparent = piece.userData.wasTransparent || false;
                piece.material.depthWrite = true;
                delete piece.userData.wasInspectTransparent;
                delete piece.userData.originalOpacity;
                delete piece.userData.wasTransparent;
            }
});

        // Restore victims to normal
        victims.forEach(victim => {
            if (!victim.userData.saved && !victim.userData.died) {
                victim.material.emissive = new THREE.Color(0x000000);
                victim.material.emissiveIntensity = 0;
                victim.material.depthTest = true;
                victim.material.depthWrite = true;
                victim.material.transparent = victim.userData.wasTransparent || false;
                victim.material.opacity = 1.0;
                delete victim.userData.inspectPulse;
                delete victim.userData.wasTransparent;
            }
        });
        
        console.log('✅ X-ray vision ended - normal vision restored');
        logPlayerAction('inspect_end');
    }, 3000);
}

// ========================================
// JUMPING
// ========================================

function jump() {
    if (!robotState.isJumping) {
        robotState.isJumping = true;
        robotState.jumpVelocity = 8; // Jump strength
        logPlayerAction('jump');
    }
}

// ========================================
// RUBBLE DESTRUCTION
// ========================================

function destroyRubble() {
    const raycaster = new THREE.Raycaster();
    
    // First-person: raycast from camera position in camera direction
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    raycaster.set(camera.position, cameraDirection);
    raycaster.far = 10; // 10m range for destruction
    
    const intersects = raycaster.intersectObjects(rubblePieces.filter(p => !p.userData.destroyed));
    
    if (intersects.length > 0 && intersects[0].distance < 5) { // Must be within 5m
        const piece = intersects[0].object;
        piece.userData.destroyed = true;
        
        // Log rubble destruction
        logRobotState('destroy_rubble', { 
            action: 'rubble_destroyed',
            success: true,
            position: { x: piece.position.x, y: piece.position.y, z: piece.position.z }
        });
        
        // Add score for destroying rubble
        gameState.score += 5;
        updateScore();
        
        // Animate destruction
        piece.material.transparent = true;
        const tween = { scale: 1, opacity: 1 };
        
        const animate = () => {
            tween.scale -= 0.05;
            tween.opacity -= 0.05;
            piece.scale.set(tween.scale, tween.scale, tween.scale);
            piece.material.opacity = tween.opacity;
            
            if (tween.scale > 0) {
                requestAnimationFrame(animate);
            } else {
                scene.remove(piece);
            }
        };
        animate();
        
        logPlayerAction('destroy_rubble', {
            position: piece.position.clone(),
            rubbleId: rubblePieces.indexOf(piece),
            distance: intersects[0].distance
        });
        
        checkVictimAccessibility();
    }
}

// ========================================
// REFUEL
// ========================================

function refuel() {
    const distance = robotMesh.position.distanceTo(fuelStation.position);
    if (distance < 3) {
        robotState.fuel = robotState.maxFuel;
        logPlayerAction('refuel', { fuelLevel: robotState.fuel });
        updateUI();
    }
}

// ========================================
// VICTIM RESCUE
// ========================================

function checkVictimAccessibility() {
    // Check which victims are directly visible (line of sight)
    const raycaster = new THREE.Raycaster();
    
    victims.forEach(victim => {
        if (victim.userData.saved || victim.userData.died) return;
        
        const distance = robotMesh.position.distanceTo(victim.position);
        
        // Check if victim is in range
        if (distance < 5) {
            // Raycast from robot to victim to check for blocking rubble
            const direction = new THREE.Vector3()
                .subVectors(victim.position, robotMesh.position)
                .normalize();
            
            raycaster.set(robotMesh.position, direction);
            raycaster.far = distance + 0.5;
            
            // Check if any rubble blocks the path
            const blockers = raycaster.intersectObjects(
            rubblePieces.filter(p => !p.userData.destroyed)
        );
        
            // Victim is accessible if no rubble blocks direct line of sight
            const isBlocked = blockers.length > 0 && blockers[0].distance < distance;
            victim.userData.accessible = !isBlocked && distance < 3;
            
            // Visual feedback - pulse GREEN if accessible
            if (victim.userData.accessible) {
                victim.material.emissive = new THREE.Color(0x00ff00);
                victim.material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
                console.log('✅ Victim accessible at', distance.toFixed(1) + 'm');
            } else if (!victim.userData.died && !gameState.inspectMode) {
                victim.material.emissive = new THREE.Color(0x000000);
                victim.material.emissiveIntensity = 0;
            }
        } else {
            victim.userData.accessible = false;
            if (!victim.userData.died && !gameState.inspectMode) {
                victim.material.emissive = new THREE.Color(0x000000);
                victim.material.emissiveIntensity = 0;
            }
        }
    });
}

// Manual rescue function - called when player clicks
function attemptRescue() {
    console.log('🆘 Click! Attempting rescue...');
    
    // Log rescue attempt
    logRobotState('rescue', { action: 'rescue_attempt' });
    
    // Find closest accessible victim
    let closestVictim = null;
    let closestDistance = Infinity;
    
    victims.forEach(victim => {
        if (victim.userData.saved || victim.userData.died) return;
        
            const distance = robotMesh.position.distanceTo(victim.position);
        if (distance < 3 && victim.userData.accessible) {
            if (distance < closestDistance) {
                closestDistance = distance;
                closestVictim = victim;
            }
        }
    });
    
    if (closestVictim) {
        rescueVictim(closestVictim);
        console.log('✅ VICTIM RESCUED! Disappearing from scene...');
        showRescueMessage('✅ Victim Rescued! +' + (100 + Math.floor(closestVictim.userData.health * 2)));
    } else {
        console.log('❌ No accessible victim nearby. Clear more rubble or get closer!');
        showRescueMessage('❌ No victim in range. Clear rubble first!');
    }
}

// Show temporary rescue feedback message
function showRescueMessage(message) {
    const messageDiv = document.getElementById('rescueMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.classList.remove('hidden');
        messageDiv.classList.add('show');
        
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => {
                messageDiv.classList.add('hidden');
            }, 300);
        }, 2000);
    }
}

function rescueVictim(victim) {
    if (victim.userData.saved) return;
    
    console.log('🎉 RESCUING VICTIM! Health:', victim.userData.health);
    
    // Log successful rescue
    logRobotState('rescue', { 
        action: 'victim_rescued',
        success: true,
        victimHealth: victim.userData.health,
        position: { x: victim.position.x, y: victim.position.y, z: victim.position.z }
    });
    
    victim.userData.saved = true;
    gameState.victimsSaved++;
    
    // Calculate score based on victim's remaining health
    const healthBonus = Math.floor(victim.userData.health * 2);
    const speedBonus = Math.floor(Math.max(0, (180 - gameState.elapsedTime) * 0.5));
    const totalBonus = 100 + healthBonus + speedBonus;
    
    gameState.score += totalBonus;
    updateScore();
    
    console.log('💰 Score +' + totalBonus + ' (Base: 100, Health: ' + healthBonus + ', Speed: ' + speedBonus + ')');
    
    // Immediately hide victim, then animate upward fade
    victim.material.transparent = true;
    victim.material.depthTest = true; // Restore normal depth testing
    
    const tween = {
        scale: 1,
        opacity: 1,
        y: victim.position.y,
        glow: 0
    };
    
    const animateRescue = () => {
        tween.scale -= 0.03;
        tween.opacity -= 0.03;
        tween.y += 0.1; // Rise faster
        tween.glow += 0.05;
        
        victim.scale.set(tween.scale, tween.scale, tween.scale);
        victim.material.opacity = tween.opacity;
        victim.position.y = tween.y;
        
        // Bright white glow during rescue
        victim.material.emissive = new THREE.Color(0xffffff);
        victim.material.emissiveIntensity = Math.min(2.0, tween.glow);
        
        if (tween.scale > 0 && tween.opacity > 0) {
            requestAnimationFrame(animateRescue);
        } else {
            // Completely remove from scene
            scene.remove(victim);
            victim.visible = false;
            console.log('✨ Victim removed from scene');
        }
    };
    animateRescue();
    
    logPlayerAction('rescue_victim', {
        victimId: victims.indexOf(victim),
        victimHealth: victim.userData.health,
        score: totalBonus
    });
    
    // Update UI immediately
    updateVictimCount();
    console.log('📊 Updated counts - Saved:', gameState.victimsSaved, 'Remaining:', gameState.victimsTotal - gameState.victimsSaved);
    
    checkGameOver();
}

// ========================================
// VICTIM HEALTH DECAY
// ========================================

function startVictimHealthDecay() {
    setInterval(() => {
        if (!gameState.isGameStarted || gameState.isGameOver || gameState.isPaused) return;
        
        victims.forEach(victim => {
            if (!victim.userData.saved && !victim.userData.died) {
                const prevHealth = victim.userData.health;
                victim.userData.health = Math.max(0, victim.userData.health - victim.userData.decayRate);
                
                // Check if victim just died
                if (prevHealth > 0 && victim.userData.health === 0) {
                    victim.userData.died = true;
                    gameState.victimsDied++;
                    
                    // Make victim gray to show death
                    victim.material.color.setHex(0x444444);
                    
                    logPlayerAction('victim_died', {
                        victimId: victims.indexOf(victim),
                        cause: 'health_depletion'
                    });
                    
                    // Check if game should end
                    checkGameOver();
                }
                
                // Visual indicator - change color based on health
                if (victim.userData.health > 0) {
                    const healthPercent = victim.userData.health / victim.userData.maxHealth;
                    victim.material.color.setHSL(0, 1, 0.3 + healthPercent * 0.3);
                }
            }
        });
    }, 1000);
}

// ========================================
// ZONE DETECTION
// ========================================

function checkZones() {
    let currentZone = 'safe';
    let inYellowZone = false;
    let inRedZone = false;
    
    zones.forEach(zone => {
        const distance = Math.sqrt(
            Math.pow(robotMesh.position.x - zone.position.x, 2) +
            Math.pow(robotMesh.position.z - zone.position.z, 2)
        );
        
        if (distance < zone.userData.radius) {
            if (zone.userData.type === 'yellow') {
                inYellowZone = true;
                currentZone = 'yellow';
            } else if (zone.userData.type === 'red') {
                inRedZone = true;
                currentZone = 'red';
            }
        }
    });
    
    if (robotState.currentZone !== currentZone) {
        robotState.currentZone = currentZone;
        logRobotState('zone_change', { zone: currentZone });
    }
    
    // Apply zone effects
    const envConfig = ENVIRONMENTS[gameState.environment];
    
    if (inRedZone && robotState.damageCooldown <= 0) {
        const damage = 2 * envConfig.damageMultiplier;
        robotState.health = Math.max(0, robotState.health - damage);
        robotState.damageCooldown = 1;
        logRobotState('damage_from_zone', { zone: 'red', damage: damage });
    }
    
    return { inYellowZone, inRedZone };
}

// ========================================
// COLLISION DETECTION
// ========================================

function checkCollisions() {
    const robotRadius = 0.6; // Robot collision radius
    let hasCollision = false;
    let collisionNormal = new THREE.Vector3();
    
    rubblePieces.forEach(piece => {
        if (piece.userData.destroyed) return;
        
        const distance = robotMesh.position.distanceTo(piece.position);
        const pieceRadius = Math.max(piece.geometry.parameters.width, piece.geometry.parameters.depth) / 2;
        const collisionDistance = robotRadius + pieceRadius;
        
        if (distance < collisionDistance) {
            hasCollision = true;
            
            // Calculate push-back direction
            const pushDirection = new THREE.Vector3()
                .subVectors(robotMesh.position, piece.position)
                .normalize();
            
            collisionNormal.add(pushDirection);
            
            // Apply damage on high-speed collision
            const speed = velocity.length();
            if (speed > 0.1 && robotState.damageCooldown <= 0) {
                const damage = Math.min(10, speed * 5);
                robotState.health = Math.max(0, robotState.health - damage);
                robotState.damageCooldown = 1;
                logRobotState('collision_damage', { 
                    speed: speed, 
                    damage: damage,
                    objectType: 'rubble'
                });
            }
        }
    });
    
    // Apply push-back force to prevent walking through rubble
    if (hasCollision) {
        collisionNormal.normalize();
        const pushForce = 0.3;
        robotMesh.position.add(collisionNormal.multiplyScalar(pushForce));
        
        // Reduce velocity in collision direction
        const velocityDir = velocity.clone().normalize();
        const dot = velocityDir.dot(collisionNormal);
        if (dot < 0) {
            velocity.sub(collisionNormal.multiplyScalar(dot * velocity.length() * 0.5));
        }
    }
    
    return hasCollision;
}

// ========================================
// RUBBLE GRAVITY PHYSICS
// ========================================

function applyRubbleGravity() {
    rubblePieces.forEach(piece => {
        if (piece.userData.destroyed || piece.userData.isGrounded) return;
        
        // Check if piece has support below it
        const hasSupport = checkRubbleSupport(piece);
        
        if (!hasSupport && piece.position.y > 0.5) {
            // Apply gravity
            if (!piece.userData.fallingVelocity) {
                piece.userData.fallingVelocity = 0;
            }
            
            piece.userData.fallingVelocity -= 0.5; // Gravity
            piece.position.y += piece.userData.fallingVelocity * 0.016; // Delta time approximation
            
            // Ground collision
            if (piece.position.y <= 0.5) {
                piece.position.y = 0.5;
                piece.userData.fallingVelocity = 0;
                piece.userData.isGrounded = true;
            }
        } else if (piece.position.y <= 0.5) {
            piece.userData.isGrounded = true;
        }
    });
}

function checkRubbleSupport(piece) {
    // Check if there's rubble or ground below this piece
    if (piece.position.y <= 0.6) return true; // On ground
    
    // Check for rubble below
    for (let other of rubblePieces) {
        if (other === piece || other.userData.destroyed) continue;
        
        const horizontalDist = Math.sqrt(
            Math.pow(piece.position.x - other.position.x, 2) +
            Math.pow(piece.position.z - other.position.z, 2)
        );
        
        const verticalDist = piece.position.y - other.position.y;
        
        // If there's rubble below and close horizontally, it's supported
        if (horizontalDist < 1.5 && verticalDist > 0 && verticalDist < 2) {
            return true;
        }
    }
    
    return false; // No support found
}

// ========================================
// DATA LOGGING (10Hz Collection)
// ========================================

function logRobotState(event, data = {}) {
    const currentTime = Date.now() - gameState.startTime;
    
    // Enhanced log entry with all required ML fields
    const logEntry = {
        timestamp: new Date(gameState.startTime + currentTime).toISOString(),
        timestamp_ms: currentTime,
        time_elapsed_s: currentTime / 1000,
        type: 'robot_state',
        event: event,
        
        // Key presses (current state)
        key_presses: {
            W: moveForward,
            A: moveLeft,
            S: moveBackward,
            D: moveRight,
            Space: false, // Momentary, captured in action logs
            E: gameState.inspectMode,
            R: false, // Momentary
            mouse_dx: mouseX,
            mouse_dy: mouseY,
            inspect: gameState.inspectMode,
            destroy: false // Captured in action logs
        },
        
        // Robot state
        robot: {
            position: {
                x: robotMesh.position.x,
                y: robotMesh.position.y,
                z: robotMesh.position.z
            },
            rotation: {
                x: robotMesh.rotation.x,
                y: robotMesh.rotation.y,
                z: robotMesh.rotation.z
            },
            velocity: {
                x: velocity.x,
                y: velocity.y,
                z: velocity.z
            },
            isJumping: robotState.isJumping
        },
        
        // Accelerometer (simulated IMU)
        accelerometer: {
            x: robotState.acceleration.x,
            y: robotState.acceleration.y || 0,
            z: robotState.acceleration.z
        },
        
        // Battery level
        battery: robotState.fuel, // 0-100
        
        // Damage level (inverted health)
        damage: (100 - robotState.health) / 100, // 0-1 scale
        
        // Health (additional)
        health: robotState.health,
        fuel: robotState.fuel,
        zone: robotState.currentZone,
        
        // Camera (first-person view)
        camera: {
            position: {
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z
            },
            rotation: {
                x: camera.rotation.x,
                y: camera.rotation.y,
                z: camera.rotation.z
            },
            yaw: cameraYaw,
            pitch: cameraPitch
        },
        
        // Sensors
        sensors: getSensorData(),
        
        // Additional data
        ...data
    };
    
    gameState.logs.push(logEntry);
}

function logPlayerAction(action, data = {}) {
    const logEntry = {
        timestamp: Date.now() - gameState.startTime,
        type: 'player_action',
        action: action,
        robot: {
            position: {
                x: robotMesh.position.x,
                y: robotMesh.position.y,
                z: robotMesh.position.z
            },
            rotation: {
                x: robotMesh.rotation.x,
                y: robotMesh.rotation.y,
                z: robotMesh.rotation.z
            }
        },
        sensors: getSensorData(),
        ...data
    };
    
    gameState.logs.push(logEntry);
}

function getSensorData() {
    const raycaster = new THREE.Raycaster();
    
    // First-person: use camera position and direction
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    raycaster.set(camera.position, cameraDirection);
    
    const frontIntersects = raycaster.intersectObjects(
        [...rubblePieces.filter(p => !p.userData.destroyed), ...victims.filter(v => !v.userData.saved)],
        true
    );
    const proximity = frontIntersects.length > 0 ? frontIntersects[0].distance : 10;
    
    // Multi-directional sensors
    const sensorDirections = [
        { name: 'forward', dir: new THREE.Vector3(0, 0, -1) },
        { name: 'left', dir: new THREE.Vector3(-1, 0, 0) },
        { name: 'right', dir: new THREE.Vector3(1, 0, 0) },
        { name: 'back', dir: new THREE.Vector3(0, 0, 1) }
    ];
    
    const proximitySensors = {};
    sensorDirections.forEach(sensor => {
        const direction = sensor.dir.clone();
        // Rotate based on camera yaw (first-person)
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
        raycaster.set(camera.position, direction);
        const intersects = raycaster.intersectObjects(
            [...rubblePieces.filter(p => !p.userData.destroyed), ...victims.filter(v => !v.userData.saved)],
            true
        );
        proximitySensors[sensor.name] = intersects.length > 0 ? intersects[0].distance : 10;
    });
    
    // Victim detection
    const victimsInRange = victims.filter(v => {
        if (v.userData.saved) return false;
        return robotMesh.position.distanceTo(v.position) < 15;
    }).map(v => {
        const distance = robotMesh.position.distanceTo(v.position);
        const direction = new THREE.Vector3().subVectors(v.position, robotMesh.position).normalize();
        const angle = Math.atan2(direction.x, direction.z);
        return {
            distance: distance,
            angle: angle,
            health: v.userData.health
        };
    });
    
    // Fuel station
    const fuelStationDistance = robotMesh.position.distanceTo(fuelStation.position);
    
    // Zone info
    const zoneInfo = checkZones();
    
    return {
        proximity: proximity,
        proximitySensors: proximitySensors,
        victimsDetected: victimsInRange.length,
        victims: victimsInRange,
        fuelStationDistance: fuelStationDistance,
        zone: robotState.currentZone,
        inYellowZone: zoneInfo.inYellowZone,
        inRedZone: zoneInfo.inRedZone
    };
}

// ========================================
// VISUAL FRAME CAPTURE SYSTEM
// ========================================

let frameCounter = 0;
const visualFrames = []; // Store frame data

function captureVisualFrame() {
    // Capture canvas as ImageData
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;
    const pixels = new Uint8Array(width * height * 4);
    
    const gl = renderer.getContext();
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
    // Downsample for efficiency (optional: 128x128 or 256x256)
    const downsampleWidth = 128;
    const downsampleHeight = 128;
    const downsampled = downsampleImage(pixels, width, height, downsampleWidth, downsampleHeight);
    
    const framePath = `frames/frame_${String(frameCounter).padStart(6, '0')}.npy`;
    frameCounter++;
    
    // Store frame reference and data for export
    visualFrames.push({
        path: framePath,
        data: downsampled,
        width: downsampleWidth,
        height: downsampleHeight,
        timestamp: Date.now() - gameState.startTime
    });
    
    return framePath;
}

function downsampleImage(pixels, srcW, srcH, dstW, dstH) {
    const result = new Uint8Array(dstW * dstH * 3); // RGB only
    const scaleX = srcW / dstW;
    const scaleY = srcH / dstH;
    
    for (let y = 0; y < dstH; y++) {
        for (let x = 0; x < dstW; x++) {
            const srcX = Math.floor(x * scaleX);
            const srcY = Math.floor(y * scaleY);
            const srcIdx = (srcY * srcW + srcX) * 4;
            const dstIdx = (y * dstW + x) * 3;
            
            result[dstIdx] = pixels[srcIdx];     // R
            result[dstIdx + 1] = pixels[srcIdx + 1]; // G
            result[dstIdx + 2] = pixels[srcIdx + 2]; // B
        }
    }
    
    return result;
}

// Start 10Hz data collection with enhanced fields
function startDataCollection() {
    if (gameState.dataCollectionInterval) {
        clearInterval(gameState.dataCollectionInterval);
    }
    
    frameCounter = 0;
    visualFrames.length = 0;
    
    gameState.dataCollectionInterval = setInterval(() => {
        if (gameState.isGameStarted && !gameState.isGameOver && !gameState.isPaused) {
            // Capture visual frame
            const framePath = captureVisualFrame();
            
            // Log enhanced robot state
            logRobotState('periodic_update_10hz', { visual_frame_path: framePath });
        }
    }, 100); // 100ms = 10Hz
}

// ========================================
// UI UPDATES
// ========================================

function updateUI() {
    // Timer
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    gameState.elapsedTime = elapsed;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('timer').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Health
    const healthPercent = (robotState.health / robotState.maxHealth) * 100;
    document.getElementById('robotHealth').style.width = healthPercent + '%';
    document.getElementById('robotHealthText').textContent = Math.round(healthPercent) + '%';
    
    // Fuel
    const fuelPercent = (robotState.fuel / robotState.maxFuel) * 100;
    document.getElementById('robotFuel').style.width = fuelPercent + '%';
    document.getElementById('robotFuelText').textContent = Math.round(fuelPercent) + '%';
    
    // Sensors
    const sensors = getSensorData();
    document.getElementById('proximity').textContent = sensors.proximity.toFixed(1) + 'm';
    
    const zoneTypeElement = document.getElementById('zoneType');
    const zoneName = sensors.zone.charAt(0).toUpperCase() + sensors.zone.slice(1);
    zoneTypeElement.textContent = zoneName;
    zoneTypeElement.className = 'sensorValue zone-' + sensors.zone;
    
    document.getElementById('victimsDetected').textContent = sensors.victimsDetected;
}

function updateVictimCount() {
    const remaining = gameState.victimsTotal - gameState.victimsSaved - gameState.victimsDied;
    
    const savedElement = document.getElementById('savedCount');
    const remainingElement = document.getElementById('remainingCount');
    
    if (savedElement) {
        savedElement.textContent = gameState.victimsSaved;
    }
    
    if (remainingElement) {
        remainingElement.textContent = remaining;
    }
    
    console.log('📊 Victim Count Updated:', {
        saved: gameState.victimsSaved,
        died: gameState.victimsDied,
        total: gameState.victimsTotal,
        remaining: remaining
    });
}

function updateScore() {
    document.getElementById('scoreValue').textContent = gameState.score;
}

// ========================================
// GAME INITIALIZATION
// ========================================

async function initGame(environment) {
    if (gameState.isGameStarted) return;
    
    console.log('🎮 Starting game with environment:', environment);
    
    gameState.isGameStarted = true;
    gameState.environment = environment;
    gameState.score = 0;
    gameState.victimsSaved = 0;
    gameState.victimsDied = 0;
    gameState.isPaused = false;
    
    // Update environment visuals
    const envConfig = ENVIRONMENTS[environment];
    scene.background.setHex(envConfig.skyColor);
    scene.fog.color.setHex(envConfig.fogColor);
    
    console.log('🌍 Creating environment:', envConfig.name);
    createGround(environment);
    createSky(environment);
    
    // Hide screens, show game
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    document.getElementById('gameCanvas').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    gameState.startTime = Date.now();
    gameState.logs = [];
    
    // ✨ Initialize MongoDB session
    console.log('🔍 Checking MongoDB availability...');
    console.log('  - window.mongoService exists:', typeof window.mongoService !== 'undefined');
    console.log('  - mongoService exists:', typeof mongoService !== 'undefined');
    console.log('  - mongoService.enabled:', window.mongoService?.enabled);
    console.log('  - userManager.currentUser:', !!userManager.currentUser);
    
    if (typeof window.mongoService !== 'undefined' && window.mongoService.enabled && userManager.currentUser) {
        const sessionId = 'reacture_' + gameState.startTime;
        console.log('📊 Creating MongoDB session:', sessionId);
        console.log('   Player:', userManager.currentUser.username);
        console.log('   Environment:', environment);
        console.log('   Victims:', victims.length);
        
        try {
            const result = await window.mongoService.createSession({
                playerId: userManager.currentUser.username,
                playerName: userManager.currentUser.displayName,
                sessionId: sessionId,
                environment: environment,
                victimsTotal: victims.length
            });
            console.log('✅ MongoDB session created successfully:', result);
        } catch (error) {
            console.error('❌ MongoDB session creation failed:', error);
        }
    } else {
        console.warn('⚠️  MongoDB not available or not enabled');
        if (typeof window.mongoService === 'undefined') {
            console.error('   ERROR: mongoService not loaded! Check if mongoService.js is included.');
        }
        if (!window.mongoService?.enabled) {
            console.warn('   MongoDB is disabled');
        }
        if (!userManager.currentUser) {
            console.warn('   No user logged in');
        }
    }
    
    // Reset robot position and state
    robotMesh.position.set(0, robotHeight, 0);
    robotState.health = 100;
    robotState.fuel = 100;
    robotState.isJumping = false;
    velocity.set(0, 0, 0);
    
    // Initialize first-person camera BEFORE generating map
    camera.position.set(0, robotHeight + 1.5, 0); // Eye level at start position
    camera.rotation.set(0, 0, 0);
    cameraYaw = 0;
    cameraPitch = 0;
    
    console.log('📹 Camera initialized at:', camera.position);
    
    // Generate random map
    console.log('🗺️ Generating random map...');
    generateRandomMap(environment);
    console.log('✅ Map generated - Victims:', gameState.victimsTotal);
    
    // Start systems
    startVictimHealthDecay();
    startDataCollection();
    
    logRobotState('game_start');
    
    // Focus and setup controls
    setTimeout(() => {
        canvas.focus();
        
        console.log('🎮 GAME READY!');
        console.log('📹 Camera position:', camera.position);
        console.log('🤖 Robot position:', robotMesh.position);
        console.log('🧱 Rubble pieces:', rubblePieces.length);
        console.log('👥 Victims:', victims.length);
        console.log('');
        console.log('HOW TO PLAY:');
        console.log('1. Click canvas to enable mouse look');
        console.log('2. Use WASD to move');
        console.log('3. Press E to inspect (infrared)');
        console.log('4. Press ESC to pause');
        console.log('5. Press Space to destroy rubble');
        
        // Show pointer lock prompt
        const prompt = document.getElementById('pointerLockPrompt');
        if (prompt) prompt.classList.remove('hidden');
    }, 100);
}

// ========================================
// GAME OVER
// ========================================

function checkGameOver() {
    // Game ends when: all victims saved, all victims dead, or robot health reaches 0
    const allAccountedFor = (gameState.victimsSaved + gameState.victimsDied) >= gameState.victimsTotal;
    
    if (allAccountedFor || robotState.health <= 0) {
        endGame();
    }
}

async function endGame() {
    if (gameState.isGameOver) return;
    gameState.isGameOver = true;
    
    // Stop data collection
    if (gameState.dataCollectionInterval) {
        clearInterval(gameState.dataCollectionInterval);
    }
    
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    // Calculate final score
    const timeBonus = Math.floor(Math.max(0, (300 - elapsed) * 2)); // Bonus for completing quickly
    const healthBonus = Math.floor(robotState.health * 5);
    const fuelBonus = Math.floor(robotState.fuel * 2);
    const finalScore = gameState.score + timeBonus + healthBonus + fuelBonus;
    
    gameState.score = finalScore;
    
    // Update title
    const title = robotState.health <= 0 ? 'Mission Failed' : 'Mission Complete!';
    document.getElementById('gameOverTitle').textContent = title;
    
    // Stats
    const stats = `
        <p><strong>Time Elapsed:</strong> ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</p>
        <p><strong>Victims Saved:</strong> ${gameState.victimsSaved} / ${gameState.victimsTotal}</p>
        <p><strong>Robot Health:</strong> ${Math.round(robotState.health)}%</p>
        <p><strong>Robot Fuel:</strong> ${Math.round(robotState.fuel)}%</p>
    `;
    document.getElementById('gameOverStats').innerHTML = stats;
    
    // Score breakdown
    const breakdown = `
        <h3>Score Breakdown</h3>
        <div class="scoreItem">
            <span>Base Score:</span>
            <span>${gameState.score - timeBonus - healthBonus - fuelBonus}</span>
        </div>
        <div class="scoreItem">
            <span>Time Bonus:</span>
            <span>+${timeBonus}</span>
        </div>
        <div class="scoreItem">
            <span>Health Bonus:</span>
            <span>+${healthBonus}</span>
        </div>
        <div class="scoreItem">
            <span>Fuel Bonus:</span>
            <span>+${fuelBonus}</span>
        </div>
        <div class="scoreItem">
            <span>Final Score:</span>
            <span>${finalScore}</span>
        </div>
    `;
    document.getElementById('scoreBreakdown').innerHTML = breakdown;
    
    document.getElementById('gameOverScreen').classList.remove('hidden');
    
    // Save game result
    if (userManager.currentUser) {
        // Check if this was the daily challenge
        const challengeStatus = challengeManager.getChallengeStatus();
        const isChallenge = challengeStatus.status === 'active' && 
                            gameState.environment === challengeManager.currentChallenge.env;
        
        if (isChallenge) {
            // Mark challenge as completed
            userManager.currentUser.dailyChallengeCompleted = new Date().toDateString();
        }
        
        userManager.addGameResult({
            environment: gameState.environment,
            score: finalScore,
            time: elapsed,
            victimsSaved: gameState.victimsSaved,
            victimsTotal: gameState.victimsTotal,
            health: robotState.health,
            fuel: robotState.fuel
        });
        
        userManager.updateStreak();
        
        // ✨ Finalize MongoDB session
        console.log('🔍 Finalizing MongoDB session...');
        console.log('  - mongoService available:', typeof window.mongoService !== 'undefined');
        console.log('  - mongoService.enabled:', window.mongoService?.enabled);
        console.log('  - currentSessionId:', window.mongoService?.currentSessionId);
        console.log('  - Sensor data collected:', gameState.logs.length, 'samples');
        console.log('  - Visual frames collected:', visualFrames.length, 'frames');
        
        if (typeof window.mongoService !== 'undefined' && window.mongoService.enabled) {
            console.log('📊 Finalizing MongoDB session with complete data:');
            
            // Convert sensor data to MongoDB format (10Hz data)
            const sensorData = gameState.logs.map(log => ({
                timestamp: log.timestamp_ms,
                accelerometer: {
                    x: log.accelerometer?.x || 0,
                    y: log.accelerometer?.y || 0,
                    z: log.accelerometer?.z || 0
                },
                battery: log.battery || 100,
                damage: log.damage || 0,
                proximity: log.sensors?.proximity || 0,
                keyPresses: log.key_presses || {}
            }));
            
            // Extract movement path from logs (sample at 1Hz for efficiency)
            const movementPath = gameState.logs
                .filter((log, index) => index % 10 === 0) // Sample every 10th entry (1Hz instead of 10Hz)
                .map(log => ({
                    position: {
                        x: log.robot?.position?.x || 0,
                        y: log.robot?.position?.y || 0,
                        z: log.robot?.position?.z || 0
                    },
                    rotation: {
                        yaw: log.camera?.yaw || 0,
                        pitch: log.camera?.pitch || 0
                    },
                    timestamp: log.timestamp_ms
                }));
            
            // Extract player decisions (inspect, rescue, destroy actions)
            const decisions = gameState.logs
                .filter(log => ['inspect', 'rescue', 'destroy_rubble', 'refuel'].includes(log.event))
                .map(log => ({
                    type: log.event,
                    position: {
                        x: log.robot?.position?.x || 0,
                        y: log.robot?.position?.y || 0,
                        z: log.robot?.position?.z || 0
                    },
                    timestamp: log.timestamp_ms,
                    success: log.data?.success !== false, // Assume success unless explicitly false
                    metadata: log.data || {}
                }));
            
            const sessionData = {
                score: finalScore,
                victimsSaved: gameState.victimsSaved,
                victimsDied: gameState.victimsDied,
                victimsTotal: gameState.victimsTotal,
                rubbleDestroyed: gameState.rubbleDestroyed || 0,
                finalHealth: robotState.health,
                finalFuel: robotState.fuel,
                duration: elapsed,
                completedChallenge: isChallenge,
                challengeType: isChallenge ? challengeManager.currentChallenge.title : null,
                damageEvents: [],
                sensorData: sensorData,      // ✨ 10Hz sensor readings
                movementPath: movementPath,  // ✨ 1Hz movement path (sampled)
                decisions: decisions         // ✨ All player decisions
            };
            
            console.log('   📊 Data Summary:');
            console.log('      - Sensor samples:', sensorData.length, '('+(sensorData.length / elapsed).toFixed(1)+ ' Hz)');
            console.log('      - Movement points:', movementPath.length);
            console.log('      - Player decisions:', decisions.length);
            console.log('      - Visual frames:', visualFrames.length);
            
            try {
                const result = await window.mongoService.finalizeSession(sessionData);
                console.log('✅ MongoDB session uploaded!');
                console.log('   📈 Uploaded data:');
                console.log('      - ', sensorData.length, 'sensor readings (10Hz)');
                console.log('      - ', movementPath.length, 'movement points (1Hz)');
                console.log('      - ', decisions.length, 'player decisions');
                console.log('   🍃 Check MongoDB Atlas → reacture → playersessions');
            } catch (error) {
                console.error('❌ MongoDB finalization failed:', error);
                console.error('   Error details:', error.message);
            }
        } else {
            console.warn('⚠️  MongoDB not available for finalization');
        }
    }
    
    logRobotState('game_end', {
        finalStats: {
            timeElapsed: elapsed,
            victimsSaved: gameState.victimsSaved,
            victimsTotal: gameState.victimsTotal,
            robotHealth: robotState.health,
            robotFuel: robotState.fuel,
            finalScore: finalScore
        }
    });
}

// ========================================
// GAME LOOP
// ========================================

const robotMovement = {
    rotation: 0,
    targetRotation: 0
};

function animate() {
    requestAnimationFrame(animate);
    
    // Always render (shows scene even on menu screens)
    if (!gameState.isGameStarted) {
        renderer.render(scene, camera);
        return;
    }
    
    if (gameState.isGameOver) {
        renderer.render(scene, camera);
        return;
    }
    
    if (gameState.isPaused) {
        renderer.render(scene, camera);
        return;
    }
    
    const time = performance.now();
    let delta = (time - prevTime) / 1000;
    if (delta > 0.1) delta = 0.1;
    if (delta <= 0) delta = 0.016;
    
    // Movement speed
    let moveSpeed = 10.0;
        const zoneInfo = checkZones();
    if (zoneInfo.inYellowZone) moveSpeed *= 0.5;
    
    // Friction
    velocity.x *= 0.8;
    velocity.z *= 0.8;
    
    // Calculate movement direction (relative to camera view - first person)
    const moveDirection = new THREE.Vector3();
    if (moveForward) moveDirection.z -= 1;
    if (moveBackward) moveDirection.z += 1;
    if (moveLeft) moveDirection.x -= 1;
    if (moveRight) moveDirection.x += 1;
    
    // Apply movement
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        // Rotate based on camera yaw (first-person movement)
        moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
        
        const speed = moveSpeed * 20;
        const prevVelocityX = velocity.x;
        const prevVelocityZ = velocity.z;
        
        velocity.x += moveDirection.x * speed * delta;
        velocity.z += moveDirection.z * speed * delta;
        
        // Calculate acceleration (for sensor data)
        robotState.acceleration.x = (velocity.x - prevVelocityX) / delta;
        robotState.acceleration.z = (velocity.z - prevVelocityZ) / delta;
        
        // Debug movement occasionally
        if (Math.random() < 0.02) {
            console.log('🏃 Moving:', {
                keys: { W: moveForward, A: moveLeft, S: moveBackward, D: moveRight },
                position: { x: robotMesh.position.x.toFixed(1), z: robotMesh.position.z.toFixed(1) },
                velocity: { x: velocity.x.toFixed(1), z: velocity.z.toFixed(1) }
        });
    }
    } else {
        robotState.acceleration.x = 0;
        robotState.acceleration.z = 0;
    }
    
    // Robot rotation matches camera yaw (handled in camera update section)
    
    // Jumping
    if (robotState.isJumping) {
        robotState.jumpVelocity += gravity * delta;
        velocity.y = robotState.jumpVelocity;
    } else {
    velocity.y += gravity * delta;
    }
    
    // Update position
    robotMesh.position.x += velocity.x * delta;
    robotMesh.position.z += velocity.z * delta;
    robotMesh.position.y += velocity.y * delta;
    
    // Ground collision
    const groundY = 0;
    if (robotMesh.position.y <= groundY + robotHeight) {
        robotMesh.position.y = groundY + robotHeight;
        velocity.y = 0;
        robotState.jumpVelocity = 0;
        robotState.isJumping = false;
    }
    
    // Animate wheels
    if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.z) > 0.1) {
        const wheelSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z) * 3;
        robotMesh.userData.wheels.forEach(wheel => {
            wheel.rotation.x += wheelSpeed * delta;
        });
    }
    
    // Update camera (FIRST-PERSON - robot's eye view)
    const eyeHeight = 1.5; // Robot eye height
    camera.position.set(
        robotMesh.position.x,
        robotMesh.position.y + eyeHeight,
        robotMesh.position.z
    );
    
    // Apply first-person rotation based on mouse input
    camera.rotation.order = 'YXZ'; // Yaw then pitch
    camera.rotation.y = cameraYaw;
    camera.rotation.x = cameraPitch;
    camera.rotation.z = 0;
    
    // Update robot's body rotation to match camera yaw (robot faces where you look)
    robotMesh.rotation.y = cameraYaw;
    
    // Fuel consumption
    if (moveForward || moveBackward || moveLeft || moveRight) {
        robotState.fuel = Math.max(0, robotState.fuel - delta * 2);
        if (robotState.fuel <= 0) {
            velocity.x *= 0.95;
            velocity.z *= 0.95;
        }
    }
    
    // Damage cooldown
    if (robotState.damageCooldown > 0) {
        robotState.damageCooldown -= delta;
    }
    
    checkCollisions();
    checkVictimAccessibility();
    applyRubbleGravity(); // Apply gravity to unsupported rubble
    
    // Update inspect pulse animation
    if (gameState.inspectMode) {
        victims.forEach(victim => {
            if (victim.userData.inspectPulse !== undefined) {
                victim.userData.inspectPulse += delta * 5;
                victim.material.emissiveIntensity = 0.5 + Math.sin(victim.userData.inspectPulse) * 0.3;
            }
        });
    }
    
    prevTime = time;
    updateUI();
    
    if (robotState.health <= 0) {
        endGame();
    }
    
    renderer.render(scene, camera);
}

// ========================================
// UI EVENT HANDLERS
// ========================================

// Homepage
function updateHomepage() {
    if (userManager.currentUser) {
        // Initialize arrays if needed for legacy users
        if (!userManager.currentUser.friends) userManager.currentUser.friends = [];
        if (!userManager.currentUser.friendRequests) userManager.currentUser.friendRequests = [];
        
        document.getElementById('streakValue').textContent = userManager.currentUser.streak + ' days';
        document.getElementById('totalPoints').textContent = userManager.currentUser.totalPoints;
        document.getElementById('friendsCount').textContent = userManager.currentUser.friends.length;
        
        // Calculate average time
        if (userManager.currentUser.history.length > 0) {
            const avgTime = userManager.currentUser.history.reduce((sum, game) => sum + game.time, 0) / userManager.currentUser.history.length;
            const avgMinutes = Math.floor(avgTime / 60);
            const avgSeconds = Math.floor(avgTime % 60);
            document.getElementById('avgTime').textContent = `${avgMinutes}:${String(avgSeconds).padStart(2, '0')}`;
        }
        
        document.querySelector('.signInPrompt').style.display = 'none';
        document.getElementById('topNav').classList.remove('hidden');
        
        // Update notification badges
        const friendRequestsCount = userManager.currentUser.friendRequests?.length || 0;
        const unreadNotifications = notificationManager.getUnreadCount();
        const totalBadgeCount = friendRequestsCount + unreadNotifications;
        
        const badgeNav = document.getElementById('notificationBadgeNav');
        if (badgeNav) {
            badgeNav.textContent = totalBadgeCount;
            badgeNav.style.display = totalBadgeCount > 0 ? 'inline' : 'none';
        }
        
        // Update friend requests badge in friends tab
        const requestsBadge = document.getElementById('requestsBadge');
        if (requestsBadge) {
            requestsBadge.textContent = friendRequestsCount;
            requestsBadge.style.display = friendRequestsCount > 0 ? 'inline' : 'none';
        }
        
        console.log(`🔔 Badge counts - Friend requests: ${friendRequestsCount}, Notifications: ${unreadNotifications}`);
        
        // Show/hide Aftermath button
        const challengeStatus = challengeManager.getChallengeStatus();
        const aftermathBtn = document.getElementById('viewAftermathBtn');
        if (challengeStatus.status === 'expired' || challengeStatus.completed) {
            aftermathBtn.classList.remove('hidden');
        } else {
            aftermathBtn.classList.add('hidden');
        }
    } else {
        document.querySelector('.signInPrompt').style.display = 'block';
        document.getElementById('topNav').classList.add('hidden');
    }
}

// Update homepage every second and check for REACT TIME popup
setInterval(() => {
    updateHomepage();
    challengeManager.showReactTimePopup();
}, 1000);
updateHomepage();
notificationManager.updateBadge();

document.getElementById('playNowBtn').addEventListener('click', () => {
    if (!userManager.currentUser) {
        alert('Please sign in first!');
        showScreen('authScreen');
        return;
    }
    
    // Check if REACT TIME is active
    const challengeStatus = challengeManager.getChallengeStatus();
    
    if (challengeStatus.status === 'active' && !challengeStatus.completed) {
        // During REACT TIME, force user to play the challenge environment
        const challengeEnv = challengeManager.currentChallenge.env;
        
        if (confirm(`⚡ REACT TIME IS LIVE!\n\nYou must complete the daily challenge:\n${challengeManager.currentChallenge.title}\n\nTime remaining: ${challengeManager.formatTimeRemaining(challengeStatus.timeRemaining)}\n\nPlay now?`)) {
            // Skip environment selection, go straight to challenge
            gameState.environment = challengeEnv;
            showScreen('startScreen');
        }
    } else if (challengeStatus.status === 'active' && challengeStatus.completed) {
        // Already completed today's challenge, can play normally
        alert('✅ You already completed today\'s REACT TIME!\n\nYou can play other environments for practice.');
        showScreen('environmentScreen');
    } else if (challengeStatus.status === 'expired' && !challengeStatus.completed) {
        // Missed the window
        alert('❌ You missed today\'s REACT TIME window!\n\nThe daily challenge has expired. Come back tomorrow!\n\nYou can still play for practice.');
        showScreen('environmentScreen');
    } else {
        // Normal play (before REACT TIME starts)
        showScreen('environmentScreen');
    }
});

// Top Navigation Buttons
document.getElementById('friendsNavBtn')?.addEventListener('click', () => {
    if (!userManager.currentUser) {
        alert('Please sign in first!');
        showScreen('authScreen');
        return;
    }
    showFriendsScreen();
});

document.getElementById('leaderboardNavBtn')?.addEventListener('click', () => {
    updateLeaderboard('global');
    showScreen('leaderboardScreen');
});

document.getElementById('notificationsNavBtn')?.addEventListener('click', () => {
    showNotifications();
});

document.getElementById('logoutNavBtn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        userManager.signOut();
        location.reload();
    }
});

document.getElementById('signInLink').addEventListener('click', (e) => {
    e.preventDefault();
    showScreen('authScreen');
});

// Auth Screen
document.getElementById('switchToSignUp').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signInForm').classList.add('hidden');
    document.getElementById('signUpForm').classList.remove('hidden');
});

document.getElementById('switchToSignIn').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signUpForm').classList.add('hidden');
    document.getElementById('signInForm').classList.remove('hidden');
});

document.getElementById('signInBtn').addEventListener('click', async () => {
    const username = document.getElementById('signInUsername').value.trim();
    const password = document.getElementById('signInPassword').value;
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    const result = await userManager.signIn(username, password);
    if (result.success) {
        showScreen('homepage');
        updateHomepage();
    } else {
        alert(result.message);
    }
});

document.getElementById('signUpBtn').addEventListener('click', async () => {
    const username = document.getElementById('signUpUsername').value.trim();
    const displayName = document.getElementById('signUpDisplayName').value.trim();
    const password = document.getElementById('signUpPassword').value;
    const passwordConfirm = document.getElementById('signUpPasswordConfirm').value;
    
    if (!username || !displayName || !password || !passwordConfirm) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    if (password !== passwordConfirm) {
        alert('Passwords do not match');
        return;
    }
    
    const createResult = await userManager.createUser(username, displayName, password);
    if (createResult.success) {
        const signInResult = await userManager.signIn(username, password);
        if (signInResult.success) {
            showScreen('homepage');
            updateHomepage();
        }
    } else {
        alert(createResult.message);
    }
});

document.getElementById('backToHomeBtn').addEventListener('click', () => {
    showScreen('homepage');
});

// Enter key support for auth forms
document.getElementById('signInPassword')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('signInBtn').click();
    }
});

document.getElementById('signUpPasswordConfirm')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('signUpBtn').click();
    }
});

// Environment Selection
document.querySelectorAll('.envCard').forEach(card => {
    card.addEventListener('click', () => {
        const env = card.dataset.env;
        console.log('🌍 Environment selected:', env);
        
        gameState.environment = env;
        
        // Check if environment exists
        const envConfig = ENVIRONMENTS[env];
        if (!envConfig) {
            console.error('❌ ERROR: Environment config not found for:', env);
            alert(`Error: Environment "${env}" not configured!`);
            return;
        }
        
        console.log('✅ Environment config found:', envConfig.name);
        
        // Update mission briefing
        document.getElementById('environmentName').textContent = envConfig.name;
        document.getElementById('missionDescription').textContent = envConfig.description;
        
        console.log('📋 Mission briefing updated');
        console.log('🎯 Navigating to start screen...');
        
        showScreen('startScreen');
    });
});

document.getElementById('backToMenuBtn').addEventListener('click', () => {
    showScreen('homepage');
});

// Leaderboard
document.querySelectorAll('.tabBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tabBtn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateLeaderboard(btn.dataset.tab);
    });
});

function updateLeaderboard(type) {
    const leaderboard = userManager.getLeaderboard(type);
    const listElement = document.getElementById('leaderboardList');
    
    if (leaderboard.length === 0) {
        listElement.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 40px;">No data available</p>';
        return;
    }
    
    listElement.innerHTML = leaderboard.map((user, index) => `
        <div class="leaderboardItem">
            <div class="leaderboardRank">#${index + 1}</div>
            <div class="leaderboardName">${user.displayName || user.username}</div>
            <div class="leaderboardScore">${user.totalPoints} pts</div>
        </div>
    `).join('');
}

document.getElementById('backFromLeaderboardBtn').addEventListener('click', () => {
    showScreen('homepage');
});

// Start Game
document.getElementById('startBtn').addEventListener('click', async () => {
    await initGame(gameState.environment);
});

// Game Over
document.getElementById('restartBtn').addEventListener('click', () => {
    location.reload();
});

// Generate session metadata
function generateSessionMetadata() {
    const sessionId = 'reacture_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const duration = (Date.now() - gameState.startTime) / 1000;
    
    return {
        session_id: sessionId,
        start_time: new Date(gameState.startTime).toISOString(),
        end_time: new Date().toISOString(),
        duration_s: duration,
        sampling_rate_hz: 10,
        player_id: userManager.currentUser ? userManager.currentUser.username : 'anonymous',
        player_name: userManager.currentUser ? userManager.currentUser.displayName : 'Anonymous',
        robot_model: 'ReActure_v1',
        environment: gameState.environment,
        environment_name: ENVIRONMENTS[gameState.environment].name,
        game_result: {
            victims_total: gameState.victimsTotal,
            victims_saved: gameState.victimsSaved,
            victims_died: gameState.victimsDied,
            final_score: gameState.score,
            final_health: robotState.health,
            final_fuel: robotState.fuel,
            completion_status: robotState.health > 0 ? 'success' : 'failed'
        },
        data_stats: {
            total_samples: gameState.logs.length,
            total_frames: visualFrames.length,
            actions_logged: gameState.logs.filter(l => l.type === 'player_action').length
        }
    };
}

// Convert logs to JSONL format
function generateJSONL() {
    return gameState.logs.map(log => JSON.stringify(log)).join('\n');
}

// Generate NumPy-compatible frame data file (simplified JSON array format)
function generateFramesManifest() {
    return visualFrames.map(frame => ({
        path: frame.path,
        timestamp_ms: frame.timestamp,
        width: frame.width,
        height: frame.height,
        shape: [frame.height, frame.width, 3],
        dtype: 'uint8',
        data_base64: arrayToBase64(frame.data)
    }));
}

function arrayToBase64(array) {
    let binary = '';
    const bytes = new Uint8Array(array);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Download complete dataset with NumPy files
document.getElementById('downloadLogsBtn').addEventListener('click', () => {
    console.log('📥 Generating ML-ready dataset with NumPy files...');
    
    const sessionId = 'reacture_' + Date.now();
    
    // 1. Generate metadata
    const metadata = generateSessionMetadata();
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    
    // 2. Generate JSONL data
    const jsonlData = generateJSONL();
    const jsonlBlob = new Blob([jsonlData], { type: 'application/x-ndjson' });
    
    // 3. Create NumPy files
    console.log(`🎨 Creating frames.npy with shape: [${visualFrames.length}, 128, 128, 3]`);
    const framesNpy = NumpyWriter.createFramesNpy(visualFrames);
    
    const timestamps = visualFrames.map(f => f.timestamp);
    console.log(`⏱️ Creating timestamps.npy with ${timestamps.length} timestamps`);
    const timestampsNpy = NumpyWriter.createTimestampsNpy(timestamps);
    
    // 4. Create README
    const readme = generateDatasetReadme(metadata);
    const readmeBlob = new Blob([readme], { type: 'text/markdown' });
    
    // Download all files
    console.log('📥 Downloading files...');
    
    downloadFile(metadataBlob, `${sessionId}_metadata.json`);
    
    setTimeout(() => {
        downloadFile(jsonlBlob, `${sessionId}_data.jsonl`);
        console.log('✅ Downloaded data.jsonl');
    }, 100);
    
    if (framesNpy) {
        setTimeout(() => {
            downloadFile(framesNpy, `${sessionId}_frames.npy`);
            console.log('✅ Downloaded frames.npy');
        }, 200);
    }
    
    if (timestampsNpy) {
        setTimeout(() => {
            downloadFile(timestampsNpy, `${sessionId}_timestamps.npy`);
            console.log('✅ Downloaded timestamps.npy');
        }, 300);
    }
    
    setTimeout(() => {
        downloadFile(readmeBlob, `${sessionId}_README.md`);
        console.log('✅ Downloaded README.md');
    }, 400);
    
    console.log('✅ Dataset generation complete!');
    console.log('📊 Samples:', gameState.logs.length);
    console.log('📷 Frames:', visualFrames.length);
    console.log('⏱️ Duration:', (metadata.duration_s).toFixed(1) + 's');
    
    const filesCount = 5;
    alert(`Dataset exported!\n\n${gameState.logs.length} samples\n${visualFrames.length} frames\n${metadata.duration_s.toFixed(1)}s duration\n\n${filesCount} files downloaded:\n• metadata.json\n• data.jsonl\n• frames.npy (shape: ${visualFrames.length}, 128, 128, 3)\n• timestamps.npy\n• README.md`);
});

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function generateDatasetReadme(metadata) {
    const numFrames = visualFrames.length;
    const sessionIdShort = metadata.session_id.split('_')[1]; // Just timestamp part
    
    return `# ReActure Dataset - ${metadata.session_id}

## Session Information

- **Session ID**: ${metadata.session_id}
- **Start Time**: ${metadata.start_time}
- **Duration**: ${metadata.duration_s.toFixed(2)}s
- **Sampling Rate**: ${metadata.sampling_rate_hz} Hz (every 0.1s)
- **Player**: ${metadata.player_name}
- **Environment**: ${metadata.environment_name}

## Game Results

- **Victims Saved**: ${metadata.game_result.victims_saved}/${metadata.game_result.victims_total}
- **Victims Died**: ${metadata.game_result.victims_died}
- **Final Score**: ${metadata.game_result.final_score}
- **Final Health**: ${metadata.game_result.final_health.toFixed(1)}%
- **Final Fuel**: ${metadata.game_result.final_fuel.toFixed(1)}%
- **Status**: ${metadata.game_result.completion_status}

## Dataset Statistics

- **Total Samples**: ${metadata.data_stats.total_samples} (10 Hz)
- **Visual Frames**: ${metadata.data_stats.total_frames} frames
- **Player Actions**: ${metadata.data_stats.actions_logged}
- **Frame Resolution**: 128x128 RGB
- **Frame Format**: NumPy .npy files

## Files Included

1. **\`${metadata.session_id}_metadata.json\`** - Session metadata and statistics
2. **\`${metadata.session_id}_data.jsonl\`** - Time-series data (one JSON per line, 10 Hz)
3. **\`${metadata.session_id}_frames.npy\`** - All visual frames as NumPy array (shape: [${numFrames}, 128, 128, 3])
4. **\`${metadata.session_id}_timestamps.npy\`** - Frame timestamps in milliseconds (shape: [${numFrames}])
5. **\`${metadata.session_id}_README.md\`** - This file

Total: **5 files**

## NumPy Files

### frames.npy
- **Shape**: (${numFrames}, 128, 128, 3)
- **Dtype**: uint8 (0-255)
- **Format**: RGB images
- **Frequency**: 10 Hz (one frame every 100ms)

### timestamps.npy
- **Shape**: (${numFrames},)
- **Dtype**: float32
- **Units**: Milliseconds since game start
- **Frequency**: 10 Hz (100ms intervals)

## Data Format

### JSONL Data (10 Hz Sampling)

Each line is a complete JSON object sampled every 0.1 seconds:

\`\`\`json
{
  "timestamp": "2025-11-09T14:22:13.200Z",
  "timestamp_ms": 200,
  "time_elapsed_s": 0.2,
  "key_presses": {
    "W": true, "A": false, "S": false, "D": false,
    "mouse_dx": 3.2, "mouse_dy": -1.4,
    "inspect": false, "destroy": false
  },
  "accelerometer": {"x": 0.14, "y": 0.0, "z": 0.05},
  "battery": 87.3,
  "damage": 0.12,
  "robot": {"position": {"x": 0.45, "y": 1.5, "z": -0.23}, ...},
  "camera": {"yaw": 0.15, "pitch": -0.05, ...},
  "sensors": {"proximity": 5.2, "victimsDetected": 2, ...},
  "visual_frame_path": "${metadata.session_id}_frame_000002.png"
}
\`\`\`

### PNG Frames

- **Format**: Standard PNG (lossless)
- **Resolution**: 128x128 pixels
- **Channels**: RGB (3 channels)
- **Bit depth**: 8-bit per channel
- **Compression**: PNG default
- **Viewable**: Any image viewer or browser

### Loading in Python

\`\`\`python
import numpy as np
import json
from PIL import Image
import glob

# Load all PNG frames
frame_files = sorted(glob.glob('${metadata.session_id}_frame_*.png'))
frames = []

for frame_file in frame_files:
    img = Image.open(frame_file)
    frame = np.array(img)  # (128, 128, 3) RGB
    frames.append(frame)

frames = np.stack(frames, axis=0)  # (N, 128, 128, 3)
print(f"Loaded {len(frames)} frames")

# Or use OpenCV
import cv2

frames_cv = []
for frame_file in frame_files:
    img = cv2.imread(frame_file)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    frames_cv.append(img_rgb)

frames_cv = np.stack(frames_cv, axis=0)
\`\`\`

Or use the provided loader:

\`\`\`python
from load_reacture_dataset import ReActureDataset

dataset = ReActureDataset('${metadata.session_id}_metadata.json')

# Frames loaded automatically from PNG files
for sample in dataset:
    frame = sample['frame']  # NumPy array (128, 128, 3) from PNG
    battery = sample['battery']
    timestamp = sample['timestamp_ms']
\`\`\`

## Usage

See \`load_reacture_dataset.py\` for complete loader with PyTorch/TensorFlow integration.

## File Organization

Suggested directory structure:
\`\`\`
reacture_datasets/
  ${metadata.session_id}/
    ├── ${metadata.session_id}_metadata.json
    ├── ${metadata.session_id}_data.jsonl
    ├── ${metadata.session_id}_README.md
    └── frames/
        ├── frame_000000.png
        ├── frame_000001.png
        ├── frame_000002.png
        └── ...
\`\`\`

## Generated by

ReActure v1.0 - Disaster Response Simulation  
https://github.com/gudlaa/ReActure  
Generated: ${new Date().toISOString()}
`;
}

document.getElementById('backToMenuFromGame').addEventListener('click', () => {
    location.reload();
});

// Pause Menu
document.getElementById('resumeBtn')?.addEventListener('click', () => {
    togglePause();
});

document.getElementById('quitToMenuBtn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to quit? Progress will be lost.')) {
        location.reload();
    }
});

// REACT TIME Popup - Attach event listener
const dismissReactBtn = document.getElementById('dismissReactPopup');
if (dismissReactBtn) {
    console.log('✅ "React Now!" button found, attaching listener');
    dismissReactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('⚡ "React Now!" button clicked');
        
        const popup = document.getElementById('reactTimePopup');
        if (popup) {
            popup.classList.add('hidden');
            popup.style.display = 'none';
            console.log('✅ Popup hidden');
        }
        
        // Clear countdown interval
        if (challengeManager.countdownInterval) {
            clearInterval(challengeManager.countdownInterval);
            console.log('⏱️  Countdown cleared');
        }
        
        // Auto-start the challenge
        if (userManager.currentUser) {
            const challengeStatus = challengeManager.getChallengeStatus();
            console.log('📊 Challenge status:', challengeStatus);
            
            if (challengeStatus.status === 'active' && !challengeStatus.completed) {
                const challengeEnv = challengeManager.currentChallenge.env;
                console.log('🎯 Starting challenge environment:', challengeEnv);
                
                // Set environment
                gameState.environment = challengeEnv;
                
                // Show start screen (mission briefing)
                showScreen('startScreen');
                console.log('✅ Navigated to start screen');
            } else {
                console.warn('⚠️  Cannot start challenge:', challengeStatus);
                alert('Challenge is not active or already completed!');
            }
        } else {
            console.error('❌ No user logged in!');
            alert('Please sign in first!');
        }
    });
} else {
    console.error('❌ "React Now!" button NOT FOUND in DOM!');
}

// Notifications
document.getElementById('notificationsBtn')?.addEventListener('click', () => {
    showNotifications();
});

document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
    console.log('🗑️  Clearing all notifications...');
    console.log('Before - Count:', notificationManager.notifications.length);
    
    notificationManager.markAllAsRead(); // This now clears all notifications
    
    console.log('After - Count:', notificationManager.notifications.length);
    
    // Force update badge immediately
    setTimeout(() => {
        updateHomepage();
        showNotifications();
        console.log('✅ All notifications cleared - badge updated');
    }, 100);
});

document.getElementById('backFromNotifications')?.addEventListener('click', () => {
    showScreen('homepage');
});

// Friends Screen Event Handlers
document.getElementById('addFriendBtn')?.addEventListener('click', () => {
    const friendUsername = document.getElementById('friendUsernameInput').value.trim();
    if (!friendUsername) {
        alert('Please enter a username');
        return;
    }
    
    const result = userManager.sendFriendRequest(friendUsername);
    if (result.success) {
        alert(result.message);
        document.getElementById('friendUsernameInput').value = '';
    } else {
        alert(result.message);
    }
});

document.getElementById('friendsListTab')?.addEventListener('click', () => {
    document.getElementById('friendsListTab').classList.add('active');
    document.getElementById('friendRequestsTab').classList.remove('active');
    document.getElementById('friendsListSection').classList.remove('hidden');
    document.getElementById('friendRequestsSection').classList.add('hidden');
});

document.getElementById('friendRequestsTab')?.addEventListener('click', () => {
    document.getElementById('friendRequestsTab').classList.add('active');
    document.getElementById('friendsListTab').classList.remove('active');
    document.getElementById('friendRequestsSection').classList.remove('hidden');
    document.getElementById('friendsListSection').classList.add('hidden');
});

document.getElementById('backFromFriends')?.addEventListener('click', () => {
    showScreen('homepage');
});

// Aftermath Screen
document.getElementById('viewAftermathBtn')?.addEventListener('click', () => {
    showAftermathScreen();
});

// Debug button to manually trigger REACT TIME
document.getElementById('debugReactTimeBtn')?.addEventListener('click', () => {
    console.log('🐛 DEBUG: Manually triggering REACT TIME...');
    
    // Reset everything
    localStorage.removeItem('reacture_dailyChallenge');
    if (userManager.currentUser) {
        delete userManager.currentUser.dailyChallengeCompleted;
        userManager.saveUser();
    }
    challengeManager.popupShownThisSession = false;
    
    // Reload to generate new challenge
    location.reload();
});

document.getElementById('backFromAftermath')?.addEventListener('click', () => {
    showScreen('homepage');
});

async function showAftermathScreen() {
    showScreen('aftermathScreen');
    
    const resultsElement = document.getElementById('aftermathResults');
    resultsElement.innerHTML = '<div class="aftermathEmptyState">Loading today\'s results...</div>';
    
    // Try to fetch from MongoDB first
    let todayResults = [];
    
    if (mongoService && mongoService.enabled) {
        try {
            todayResults = await mongoService.getTodayLeaderboard();
        } catch (error) {
            console.error('Failed to fetch MongoDB results:', error);
        }
    }
    
    // Fallback to local storage
    if (todayResults.length === 0) {
        const allUsers = userManager.getAllUsers();
        const today = new Date().toDateString();
        
        todayResults = allUsers
            .filter(user => {
                // Filter users who completed today's challenge
                return user.dailyChallengeCompleted === today;
            })
            .map(user => ({
                playerName: user.displayName || user.username,
                score: user.totalPoints,
                victimsSaved: user.history.length > 0 ? user.history[user.history.length - 1].victimsSaved : 0,
                environment: user.history.length > 0 ? user.history[user.history.length - 1].environment : 'unknown',
                duration: user.history.length > 0 ? user.history[user.history.length - 1].time : 0
            }))
            .sort((a, b) => b.score - a.score);
    }
    
    if (todayResults.length === 0) {
        resultsElement.innerHTML = '<div class="aftermathEmptyState">No one has completed today\'s REACT TIME yet.<br>Be the first!</div>';
        return;
    }
    
    // Display results
    resultsElement.innerHTML = todayResults.map((result, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        const minutes = Math.floor((result.duration || 0) / 60);
        const seconds = (result.duration || 0) % 60;
        const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;
        
        return `
            <div class="aftermathCard">
                <div class="aftermathPlayer">
                    <span class="aftermathRank">${medal}</span>
                    <span>${result.playerName || result.playerId}</span>
                </div>
                <div class="aftermathStats">
                    <div class="aftermathStat">
                        <span class="aftermathStatLabel">Score:</span>
                        <span class="aftermathStatValue">${result.score || 0} pts</span>
                    </div>
                    <div class="aftermathStat">
                        <span class="aftermathStatLabel">Victims Saved:</span>
                        <span class="aftermathStatValue">${result.victimsSaved || 0}</span>
                    </div>
                    <div class="aftermathStat">
                        <span class="aftermathStatLabel">Time:</span>
                        <span class="aftermathStatValue">${timeStr}</span>
                    </div>
                    <div class="aftermathStat">
                        <span class="aftermathStatLabel">Environment:</span>
                        <span class="aftermathStatValue">${result.environment || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showNotifications() {
    const notifications = notificationManager.notifications;
    const friendRequests = userManager.currentUser?.friendRequests || [];
    const listElement = document.getElementById('notificationsList');
    
    let html = '';
    
    // Show friend requests first
    if (friendRequests.length > 0) {
        html += '<h3 style="color: #667eea; font-size: 18px; margin-bottom: 15px;">👥 Friend Requests</h3>';
        friendRequests.forEach(username => {
            const user = userManager.getUser(username);
            if (user) {
                html += `
                    <div class="notificationItem unread">
                        <div class="notifTime">Friend Request</div>
                        <div class="notifMessage">
                            <strong>${user.displayName || username}</strong> sent you a friend request
                            <div style="margin-top: 10px; display: flex; gap: 10px;">
                                <button class="friendActionBtn acceptBtn" onclick="acceptFriendAction('${username}')">✓ Accept</button>
                                <button class="friendActionBtn declineBtn" onclick="declineFriendAction('${username}')">✗ Decline</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
    }
    
    // Show other notifications
    if (notifications.length > 0) {
        if (friendRequests.length > 0) {
            html += '<h3 style="color: #667eea; font-size: 18px; margin: 30px 0 15px;">🔔 Other Notifications</h3>';
        }
        
        html += notifications.map(notif => {
            const timeAgo = getTimeAgo(notif.timestamp);
            return `
                <div class="notificationItem ${notif.read ? '' : 'unread'}">
                    <div class="notifTime">${timeAgo}</div>
                    <div class="notifMessage">${notif.message}</div>
                </div>
            `;
        }).join('');
    }
    
    if (friendRequests.length === 0 && notifications.length === 0) {
        html = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 40px;">No notifications yet</p>';
    }
    
    listElement.innerHTML = html;
    showScreen('notificationsScreen');
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// Social Sharing
document.getElementById('shareTwitterBtn')?.addEventListener('click', () => {
    const text = generateShareText();
    const url = encodeURIComponent(window.location.href);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
    window.open(twitterUrl, '_blank');
});

document.getElementById('shareInstagramBtn')?.addEventListener('click', () => {
    const text = generateShareText();
    // Instagram doesn't have a direct web share API, so copy text and prompt user
    navigator.clipboard.writeText(text).then(() => {
        alert('📸 Results copied! Open Instagram and paste your results into a post or story.');
    });
});

document.getElementById('copyResultsBtn')?.addEventListener('click', () => {
    const text = generateShareText();
    navigator.clipboard.writeText(text).then(() => {
        alert('Results copied to clipboard!');
    });
});

function generateShareText() {
    const envName = ENVIRONMENTS[gameState.environment].name;
    const minutes = Math.floor(gameState.elapsedTime / 60);
    const seconds = gameState.elapsedTime % 60;
    const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;
    
    return `🚁 I just completed a ${envName} rescue mission in ReActure!
    
⏱️ Time: ${timeStr}
✅ Victims Saved: ${gameState.victimsSaved}/${gameState.victimsTotal}
🏆 Score: ${gameState.score}
💚 Health: ${Math.round(robotState.health)}%

Can you beat my REACT time? #ReActure #DisasterResponse`;
}

// Friends Screen Management
function showFriendsScreen() {
    if (!userManager.currentUser) return;
    
    // Initialize arrays if needed
    if (!userManager.currentUser.friendRequests) userManager.currentUser.friendRequests = [];
    if (!userManager.currentUser.friends) userManager.currentUser.friends = [];
    
    updateFriendsList();
    updateFriendRequests();
    showScreen('friendsScreen');
}

function updateFriendsList() {
    const listElement = document.getElementById('friendsList');
    const friends = userManager.currentUser.friends || [];
    
    if (friends.length === 0) {
        listElement.innerHTML = '<div class="emptyState">No friends yet. Add some!</div>';
        return;
    }
    
    listElement.innerHTML = friends.map(username => {
        const friend = userManager.getUser(username);
        if (!friend) return '';
        
        return `
            <div class="friendItem">
                <div class="friendInfo">
                    <div class="friendName">${friend.displayName || friend.username}</div>
                    <div class="friendStats">
                        ${friend.totalPoints} pts • ${friend.gamesPlayed} games
                    </div>
                </div>
                <div class="friendActions">
                    <button class="friendActionBtn removeFriendBtn" onclick="removeFriendAction('${username}')">
                        🗑️ Remove
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateFriendRequests() {
    const listElement = document.getElementById('friendRequestsList');
    const requests = userManager.currentUser.friendRequests || [];
    
    // Update badge
    document.getElementById('requestsBadge').textContent = requests.length;
    document.getElementById('requestsBadge').style.display = requests.length > 0 ? 'inline' : 'none';
    
    if (requests.length === 0) {
        listElement.innerHTML = '<div class="emptyState">No friend requests</div>';
        return;
    }
    
    listElement.innerHTML = requests.map(username => {
        const user = userManager.getUser(username);
        if (!user) return '';
        
        return `
            <div class="friendRequestItem">
                <div class="friendInfo">
                    <div class="friendName">${user.displayName || user.username}</div>
                    <div class="friendStats">
                        ${user.totalPoints} pts • ${user.gamesPlayed} games
                    </div>
                </div>
                <div class="friendActions">
                    <button class="friendActionBtn acceptBtn" onclick="acceptFriendAction('${username}')">
                        ✓ Accept
                    </button>
                    <button class="friendActionBtn declineBtn" onclick="declineFriendAction('${username}')">
                        ✗ Decline
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Global functions for onclick handlers
window.removeFriendAction = function(username) {
    if (confirm(`Remove ${username} from friends?`)) {
        userManager.removeFriend(username);
        updateFriendsList();
    }
};

window.acceptFriendAction = function(username) {
    userManager.acceptFriendRequest(username);
    updateFriendsList();
    updateFriendRequests();
    updateHomepage(); // Update badge counts
    alert(`You are now friends with ${username}!`);
};

window.declineFriendAction = function(username) {
    userManager.declineFriendRequest(username);
    updateFriendRequests();
    updateHomepage(); // Update badge counts
};

// Screen Navigation Helper
function showScreen(screenId) {
    const screens = ['homepage', 'authScreen', 'environmentScreen', 'leaderboardScreen', 'startScreen', 'notificationsScreen', 'friendsScreen', 'aftermathScreen'];
    screens.forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
    
    // Show/hide top nav based on screen and login status
    const screensWithTopNav = ['homepage', 'friendsScreen', 'leaderboardScreen', 'notificationsScreen', 'aftermathScreen'];
    if (screensWithTopNav.includes(screenId) && userManager.currentUser) {
        document.getElementById('topNav').classList.remove('hidden');
    } else {
        document.getElementById('topNav').classList.add('hidden');
    }
}

// Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize - Show correct screen on page load
if (userManager.currentUser) {
    showScreen('homepage');
    console.log('👤 User logged in:', userManager.currentUser.username);
    
    // Initialize hasSeenReactTimePopup for legacy users
    if (userManager.currentUser.hasSeenReactTimePopup === undefined) {
        userManager.currentUser.hasSeenReactTimePopup = false;
        userManager.saveUser();
    }
    
    // Show REACT TIME popup 5 seconds after opening app (only first time for each user)
    if (!userManager.currentUser.hasSeenReactTimePopup) {
        console.log('⏰ First time user - will show REACT TIME in 5 seconds...');
        setTimeout(() => {
            console.log('⚡ 5 seconds passed - checking for REACT TIME popup...');
            const status = challengeManager.getChallengeStatus();
            console.log('📊 Challenge status:', status);
            
            if (status.status === 'active' && !status.completed) {
                console.log('🎯 Showing first-time REACT TIME popup!');
                challengeManager.showReactTimePopup();
                
                // Mark as seen so it doesn't show again
                userManager.currentUser.hasSeenReactTimePopup = true;
                userManager.saveUser();
                console.log('✅ Marked popup as seen for this user');
            } else {
                console.log('⏭️  Not showing popup:', status);
            }
        }, 5000); // Show after 5 seconds
    } else {
        console.log('👁️  User has already seen REACT TIME popup before');
        // For returning users, show popup immediately if challenge is active and not completed
        setTimeout(() => {
            const status = challengeManager.getChallengeStatus();
            if (status.status === 'active' && !status.completed) {
                console.log('🔄 Showing REACT TIME popup for returning user');
                challengeManager.showReactTimePopup();
            }
        }, 500);
    }
} else {
    console.log('🔒 No user logged in - showing auth screen');
    showScreen('authScreen');
}

// Start Animation Loop
animate();

console.log('✅ ReActure initialized - React for the Future');
console.log('✅ User System Active');
console.log('✅ Friends System Active');
console.log('✅ Daily Challenge System Active');
console.log('✅ 10Hz Data Collection Ready');
