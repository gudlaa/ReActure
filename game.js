import * as THREE from 'three';

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
    
    getUser(username) {
        const users = JSON.parse(localStorage.getItem('reacture_users') || '{}');
        return users[username] || null;
    }
    
    createUser(username, displayName) {
        const users = JSON.parse(localStorage.getItem('reacture_users') || '{}');
        if (users[username]) {
            return { success: false, message: 'Username already exists' };
        }
        
        users[username] = {
            username,
            displayName,
            createdAt: Date.now(),
            totalPoints: 0,
            gamesPlayed: 0,
            streak: 0,
            lastPlayed: null,
            friends: [],
            history: []
        };
        
        localStorage.setItem('reacture_users', JSON.stringify(users));
        return { success: true, user: users[username] };
    }
    
    signIn(username) {
        const user = this.getUser(username);
        if (!user) {
            return { success: false, message: 'User not found' };
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
        this.hasShownPopup = false;
    }
    
    getDailyChallenge() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('reacture_dailyChallenge');
        
        if (stored) {
            const challenge = JSON.parse(stored);
            if (challenge.date === today) {
                return challenge;
            }
        }
        
        // Generate new daily challenge
        const randomTime = this.getRandomDailyTime();
        const randomChallenge = this.dailyChallenges[Math.floor(Math.random() * this.dailyChallenges.length)];
        
        const challenge = {
            ...randomChallenge,
            date: today,
            time: randomTime,
            expiresAt: randomTime + (10 * 60 * 1000) // 10 minute window
        };
        
        localStorage.setItem('reacture_dailyChallenge', JSON.stringify(challenge));
        return challenge;
    }
    
    getRandomDailyTime() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const randomHour = 9 + Math.floor(Math.random() * 12); // Between 9 AM and 9 PM
        const randomMinute = Math.floor(Math.random() * 60);
        return todayStart.getTime() + (randomHour * 60 * 60 * 1000) + (randomMinute * 60 * 1000);
    }
    
    getChallengeStatus() {
        const now = Date.now();
        const { time, expiresAt } = this.currentChallenge;
        
        if (now < time) {
            return { status: 'upcoming', timeUntil: time - now };
        } else if (now >= time && now < expiresAt) {
            return { status: 'active', timeRemaining: expiresAt - now };
        } else {
            return { status: 'expired', timeUntil: null };
        }
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
        if (this.hasShownPopup) return;
        
        const status = this.getChallengeStatus();
        if (status.status === 'active') {
            this.hasShownPopup = true;
            const popup = document.getElementById('reactTimePopup');
            const challengeTitle = document.getElementById('popupChallengeTitle');
            const challengeDesc = document.getElementById('popupChallengeDescription');
            
            if (popup) {
                challengeTitle.textContent = this.currentChallenge.title;
                challengeDesc.textContent = this.currentChallenge.description;
                popup.classList.remove('hidden');
                
                // Auto-hide after 10 seconds
                setTimeout(() => {
                    popup.classList.add('hidden');
                }, 10000);
            }
            
            // Send notification
            notificationManager.addNotification('react_time', 
                `⚡ ${this.currentChallenge.title} is LIVE NOW!`,
                { challenge: this.currentChallenge }
            );
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
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.updateBadge();
    }
    
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }
    
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        const count = this.getUnreadCount();
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
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
const cameraOffset = new THREE.Vector3(0, 5, 8);

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

// Camera controls
let mouseX = 0;
let mouseY = 0;
let targetCameraRotationX = 0;
let targetCameraRotationY = 0;
let cameraRotationX = 0;
let cameraRotationY = 0;

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
    // Clear existing objects
    rubblePieces.forEach(piece => scene.remove(piece));
    victims.forEach(victim => scene.remove(victim));
    zones.forEach(zone => scene.remove(zone));
    if (fuelStation) scene.remove(fuelStation);
    
    rubblePieces.length = 0;
    victims.length = 0;
    zones.length = 0;
    
    const envConfig = ENVIRONMENTS[env];
    
    // Create rubble piles with victims
    const numPiles = 7 + Math.floor(Math.random() * 5); // 7-11 piles
    gameState.victimsTotal = 0;
    
    for (let i = 0; i < numPiles; i++) {
        const pileX = (Math.random() - 0.5) * 60;
        const pileZ = (Math.random() - 0.5) * 60;
        const pileY = 0;
        
        const numPieces = 15 + Math.floor(Math.random() * 20); // 15-34 pieces
        
        for (let j = 0; j < numPieces; j++) {
            const size = 0.5 + Math.random() * 1.5;
            const geometry = new THREE.BoxGeometry(size, size, size);
            const material = new THREE.MeshStandardMaterial({ 
                color: new THREE.Color(envConfig.rubbleColor).offsetHSL(0, 0, Math.random() * 0.1 - 0.05)
            });
            const piece = new THREE.Mesh(geometry, material);
            
            piece.position.set(
                pileX + (Math.random() - 0.5) * 4,
                pileY + j * 0.25,
                pileZ + (Math.random() - 0.5) * 4
            );
            piece.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
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
    const material = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
    const victim = new THREE.Mesh(geometry, material);
    victim.position.set(x, 0.4, z);
    victim.castShadow = true;
    
    victim.userData = {
        type: 'victim',
        health: 100,
        maxHealth: 100,
        saved: false,
        decayRate: 0.3 + Math.random() * 0.4, // 0.3-0.7 health per second
        pileId: pileId
    };
    
    scene.add(victim);
    return victim;
}

function createZone(x, z, radius, type, env) {
    const envConfig = ENVIRONMENTS[env];
    const geometry = new THREE.CylinderGeometry(radius, radius, 0.1, 32);
    
    let color = type === 'yellow' ? 0xffeb3b : envConfig.hazardColor;
    
    const material = new THREE.MeshStandardMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.3,
        emissive: color,
        emissiveIntensity: type === 'red' ? 0.3 : 0.1
    });
    
    const zone = new THREE.Mesh(geometry, material);
    zone.position.set(x, 0.05, z);
    zone.rotation.x = Math.PI / 2;
    
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
    // ESC works even when paused
    if (event.code === 'Escape') {
        event.preventDefault();
        if (gameState.isGameStarted && !gameState.isGameOver) {
            togglePause();
        }
        return;
    }
    
    if (!gameState.isGameStarted || gameState.isGameOver || gameState.isPaused) return;
    
    switch (event.code) {
        case 'KeyW':
            moveForward = true;
            logPlayerAction('move_forward_start');
            break;
        case 'KeyA':
            moveLeft = true;
            logPlayerAction('move_left_start');
            break;
        case 'KeyS':
            moveBackward = true;
            logPlayerAction('move_backward_start');
            break;
        case 'KeyD':
            moveRight = true;
            logPlayerAction('move_right_start');
            break;
        case 'Space':
            event.preventDefault();
            // Jump if moving, destroy rubble if stationary
            if ((moveForward || moveBackward || moveLeft || moveRight) && !robotState.isJumping) {
                jump();
            } else {
                destroyRubble();
            }
            break;
        case 'KeyR':
            refuel();
            break;
        case 'KeyE':
            // Inspect - briefly reveal nearby victims
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

canvas.addEventListener('mousemove', (event) => {
    const rotationSensitivity = 0.003;
    const cameraSensitivity = 0.005;
    
    const deltaX = event.movementX !== undefined ? event.movementX : (event.clientX - lastMouseX);
    const deltaY = event.movementY !== undefined ? event.movementY : (event.clientY - lastMouseY);
    
    // Rotate camera
    targetCameraRotationY -= deltaX * cameraSensitivity;
    targetCameraRotationX -= deltaY * cameraSensitivity;
    
    // Limit vertical camera rotation
    targetCameraRotationX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetCameraRotationX));
    
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
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
    if (gameState.inspectMode) return; // Already inspecting
    
    gameState.inspectMode = true;
    logPlayerAction('inspect_start');
    
    // Highlight nearby victims
    victims.forEach(victim => {
        if (victim.userData.saved) return;
        
        const distance = robotMesh.position.distanceTo(victim.position);
        if (distance < 15) { // Within range
            // Make victim glow
            victim.material.emissive = new THREE.Color(0xffff00);
            victim.material.emissiveIntensity = 0.8;
            
            // Add pulsing animation
            victim.userData.inspectPulse = 0;
        }
    });
    
    // Clear inspect mode after 2 seconds
    if (gameState.inspectTimeout) clearTimeout(gameState.inspectTimeout);
    gameState.inspectTimeout = setTimeout(() => {
        gameState.inspectMode = false;
        
        // Remove highlights
        victims.forEach(victim => {
            victim.material.emissive = new THREE.Color(0x000000);
            victim.material.emissiveIntensity = 0;
            delete victim.userData.inspectPulse;
        });
        
        logPlayerAction('inspect_end');
    }, 2000);
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
    const robotHeadPosition = robotMesh.position.clone();
    robotHeadPosition.y += 1.5;
    const forwardDirection = new THREE.Vector3(0, 0, -1);
    forwardDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), robotMesh.rotation.y);
    raycaster.set(robotHeadPosition, forwardDirection);
    
    const intersects = raycaster.intersectObjects(rubblePieces.filter(p => !p.userData.destroyed));
    
    if (intersects.length > 0) {
        const piece = intersects[0].object;
        piece.userData.destroyed = true;
        
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
            rubbleId: rubblePieces.indexOf(piece)
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
    victims.forEach(victim => {
        if (victim.userData.saved) return;
        
        // Check if rubble above victim is cleared
        const rubbleAbove = rubblePieces.filter(p => 
            !p.userData.destroyed && 
            p.userData.pileId === victim.userData.pileId
        );
        
        const clearedPercent = 1 - (rubbleAbove.length / rubblePieces.filter(p => p.userData.pileId === victim.userData.pileId).length);
        
        // Need at least 70% rubble cleared
        if (clearedPercent > 0.7) {
            const distance = robotMesh.position.distanceTo(victim.position);
            if (distance < 2.5) {
                rescueVictim(victim);
            }
        }
    });
}

function rescueVictim(victim) {
    if (victim.userData.saved) return;
    
    victim.userData.saved = true;
    gameState.victimsSaved++;
    
    // Calculate score based on victim's remaining health
    const healthBonus = Math.floor(victim.userData.health * 2);
    const speedBonus = Math.floor(Math.max(0, (180 - gameState.elapsedTime) * 0.5)); // Bonus for speed
    const totalBonus = 100 + healthBonus + speedBonus;
    
    gameState.score += totalBonus;
    updateScore();
    
    // Animate rescue
    victim.material.transparent = true;
    const tween = { scale: 1, opacity: 1, y: victim.position.y };
    
    const animate = () => {
        tween.scale -= 0.02;
        tween.opacity -= 0.02;
        tween.y += 0.05;
        victim.scale.set(tween.scale, tween.scale, tween.scale);
        victim.material.opacity = tween.opacity;
        victim.position.y = tween.y;
        
        if (tween.scale > 0) {
            requestAnimationFrame(animate);
        } else {
            scene.remove(victim);
        }
    };
    animate();
    
    logPlayerAction('rescue_victim', {
        victimId: victims.indexOf(victim),
        victimHealth: victim.userData.health,
        score: totalBonus
    });
    
    updateVictimCount();
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
    const logEntry = {
        timestamp: Date.now() - gameState.startTime,
        type: 'robot_state',
        event: event,
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
            health: robotState.health,
            fuel: robotState.fuel,
            zone: robotState.currentZone,
            velocity: {
                x: velocity.x,
                y: velocity.y,
                z: velocity.z
            },
            acceleration: {
                x: robotState.acceleration.x,
                y: robotState.acceleration.y,
                z: robotState.acceleration.z
            },
            isJumping: robotState.isJumping
        },
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
            }
        },
        sensors: getSensorData(),
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
    const robotHeadPosition = robotMesh.position.clone();
    robotHeadPosition.y += 1.5;
    const forwardDirection = new THREE.Vector3(0, 0, -1);
    forwardDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), robotMesh.rotation.y);
    raycaster.set(robotHeadPosition, forwardDirection);
    
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
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), robotMesh.rotation.y);
        raycaster.set(robotHeadPosition, direction);
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

// Start 10Hz data collection
function startDataCollection() {
    if (gameState.dataCollectionInterval) {
        clearInterval(gameState.dataCollectionInterval);
    }
    
    gameState.dataCollectionInterval = setInterval(() => {
        if (gameState.isGameStarted && !gameState.isGameOver) {
            logRobotState('periodic_update_10hz');
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
    document.getElementById('savedCount').textContent = gameState.victimsSaved;
    document.getElementById('remainingCount').textContent = 
        gameState.victimsTotal - gameState.victimsSaved;
}

function updateScore() {
    document.getElementById('scoreValue').textContent = gameState.score;
}

// ========================================
// GAME INITIALIZATION
// ========================================

function initGame(environment) {
    if (gameState.isGameStarted) return;
    
    gameState.isGameStarted = true;
    gameState.environment = environment;
    gameState.score = 0;
    gameState.victimsSaved = 0;
    
    // Update environment visuals
    const envConfig = ENVIRONMENTS[environment];
    scene.background.setHex(envConfig.skyColor);
    scene.fog.color.setHex(envConfig.fogColor);
    
    createGround(environment);
    createSky(environment);
    
    // Hide screens, show game
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    document.getElementById('gameCanvas').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    gameState.startTime = Date.now();
    gameState.logs = [];
    
    // Reset robot
    robotMesh.position.set(0, robotHeight, 0);
    robotState.health = 100;
    robotState.fuel = 100;
    
    // Generate random map
    generateRandomMap(environment);
    
    // Start systems
    startVictimHealthDecay();
    startDataCollection();
    
    logRobotState('game_start');
    
    setTimeout(() => {
        canvas.focus();
        camera.position.set(0, 5, 8);
        camera.lookAt(robotMesh.position);
    }, 500);
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

function endGame() {
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
    
    // Update camera rotation
    cameraRotationY = targetCameraRotationY;
    cameraRotationX = targetCameraRotationX;
    
    // Movement
    let moveSpeed = 10.0;
    const zoneInfo = checkZones();
    if (zoneInfo.inYellowZone) moveSpeed *= 0.5;
    
    // Friction
    velocity.x *= 0.8;
    velocity.z *= 0.8;
    
    // Calculate movement direction
    const moveDirection = new THREE.Vector3();
    if (moveForward) moveDirection.z -= 1;
    if (moveBackward) moveDirection.z += 1;
    if (moveLeft) moveDirection.x -= 1;
    if (moveRight) moveDirection.x += 1;
    
    // Apply movement
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), robotMesh.rotation.y);
        
        const speed = moveSpeed * 20;
        const prevVelocityX = velocity.x;
        const prevVelocityZ = velocity.z;
        
        velocity.x += moveDirection.x * speed * delta;
        velocity.z += moveDirection.z * speed * delta;
        
        // Calculate acceleration (for sensor data)
        robotState.acceleration.x = (velocity.x - prevVelocityX) / delta;
        robotState.acceleration.z = (velocity.z - prevVelocityZ) / delta;
    } else {
        robotState.acceleration.x = 0;
        robotState.acceleration.z = 0;
    }
    
    // Robot rotation
    let angleDiff = robotMovement.targetRotation - robotMovement.rotation;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    robotMovement.rotation += angleDiff * 0.2;
    robotMesh.rotation.y = robotMovement.rotation;
    
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
    
    // Update camera (third-person)
    const cameraDistance = cameraOffset.z;
    const cameraHeight = cameraOffset.y;
    
    const horizontalAngle = cameraRotationY;
    const verticalAngle = cameraRotationX;
    
    const x = Math.sin(horizontalAngle) * Math.cos(verticalAngle) * cameraDistance;
    const y = cameraHeight + Math.sin(verticalAngle) * cameraDistance * 0.5;
    const z = Math.cos(horizontalAngle) * Math.cos(verticalAngle) * cameraDistance;
    
    camera.position.set(
        robotMesh.position.x + x,
        robotMesh.position.y + y,
        robotMesh.position.z + z
    );
    
    const lookAtPosition = robotMesh.position.clone();
    lookAtPosition.y += 1;
    camera.lookAt(lookAtPosition);
    
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
    } else {
        document.querySelector('.signInPrompt').style.display = 'block';
    }
    
    // Update daily challenge
    const challengeStatus = challengeManager.getChallengeStatus();
    const challenge = challengeManager.currentChallenge;
    
    document.getElementById('challengeTitle').textContent = challenge.title;
    document.getElementById('challengeDescription').textContent = challenge.description;
    document.querySelector('.challengeIcon').textContent = challenge.icon;
    
    if (challengeStatus.status === 'active') {
        document.getElementById('timeRemaining').textContent = 
            '⚡ LIVE NOW - ' + challengeManager.formatTimeRemaining(challengeStatus.timeRemaining);
        document.querySelector('.dailyChallenge').style.borderColor = 'rgba(255, 87, 34, 0.8)';
    } else if (challengeStatus.status === 'upcoming') {
        document.getElementById('timeRemaining').textContent = 
            'Starts in ' + challengeManager.formatTimeRemaining(challengeStatus.timeUntil);
        document.querySelector('.dailyChallenge').style.borderColor = 'rgba(255, 193, 7, 0.5)';
    } else {
        document.getElementById('timeRemaining').textContent = 'Challenge Expired';
        document.querySelector('.dailyChallenge').style.borderColor = 'rgba(158, 158, 158, 0.3)';
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
    
    showScreen('environmentScreen');
});

document.getElementById('viewLeaderboardBtn').addEventListener('click', () => {
    updateLeaderboard('global');
    showScreen('leaderboardScreen');
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

document.getElementById('signInBtn').addEventListener('click', () => {
    const username = document.getElementById('signInUsername').value.trim();
    if (!username) {
        alert('Please enter a username');
        return;
    }
    
    const result = userManager.signIn(username);
    if (result.success) {
        showScreen('homepage');
        updateHomepage();
    } else {
        alert(result.message);
    }
});

document.getElementById('signUpBtn').addEventListener('click', () => {
    const username = document.getElementById('signUpUsername').value.trim();
    const displayName = document.getElementById('signUpDisplayName').value.trim();
    
    if (!username || !displayName) {
        alert('Please fill in all fields');
        return;
    }
    
    const createResult = userManager.createUser(username, displayName);
    if (createResult.success) {
        userManager.signIn(username);
        showScreen('homepage');
        updateHomepage();
    } else {
        alert(createResult.message);
    }
});

document.getElementById('backToHomeBtn').addEventListener('click', () => {
    showScreen('homepage');
});

// Environment Selection
document.querySelectorAll('.envCard').forEach(card => {
    card.addEventListener('click', () => {
        const env = card.dataset.env;
        gameState.environment = env;
        
        // Update mission briefing
        const envConfig = ENVIRONMENTS[env];
        document.getElementById('environmentName').textContent = envConfig.name;
        document.getElementById('missionDescription').textContent = envConfig.description;
        
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
document.getElementById('startBtn').addEventListener('click', () => {
    initGame(gameState.environment);
});

// Game Over
document.getElementById('restartBtn').addEventListener('click', () => {
    location.reload();
});

document.getElementById('downloadLogsBtn').addEventListener('click', () => {
    const dataStr = JSON.stringify(gameState.logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reacture_data_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
});

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

// REACT TIME Popup
document.getElementById('dismissReactPopup')?.addEventListener('click', () => {
    document.getElementById('reactTimePopup').classList.add('hidden');
});

// Notifications
document.getElementById('notificationsBtn')?.addEventListener('click', () => {
    showNotifications();
});

document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
    notificationManager.markAllAsRead();
    showNotifications();
});

document.getElementById('backFromNotifications')?.addEventListener('click', () => {
    showScreen('homepage');
});

function showNotifications() {
    const notifications = notificationManager.notifications;
    const listElement = document.getElementById('notificationsList');
    
    if (notifications.length === 0) {
        listElement.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 40px;">No notifications yet</p>';
    } else {
        listElement.innerHTML = notifications.map(notif => {
            const timeAgo = getTimeAgo(notif.timestamp);
            return `
                <div class="notificationItem ${notif.read ? '' : 'unread'}">
                    <div class="notifTime">${timeAgo}</div>
                    <div class="notifMessage">${notif.message}</div>
                </div>
            `;
        }).join('');
    }
    
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

document.getElementById('shareFacebookBtn')?.addEventListener('click', () => {
    const url = encodeURIComponent(window.location.href);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(facebookUrl, '_blank');
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

// Screen Navigation Helper
function showScreen(screenId) {
    const screens = ['homepage', 'authScreen', 'environmentScreen', 'leaderboardScreen', 'startScreen', 'notificationsScreen'];
    screens.forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

// Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start Animation Loop
animate();

console.log('✅ ReActure initialized - BeReal for the Future');
console.log('✅ User System Active');
console.log('✅ Daily Challenge System Active');
console.log('✅ 10Hz Data Collection Ready');
