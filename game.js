import * as THREE from 'three';

// Game State
const gameState = {
    startTime: null,
    elapsedTime: 0,
    victimsSaved: 0,
    victimsTotal: 0,
    isGameOver: false,
    isGameStarted: false,
    logs: []
};

// Robot State
const robotState = {
    health: 100,
    maxHealth: 100,
    fuel: 100,
    maxFuel: 100,
    position: new THREE.Vector3(0, 1, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: 0,
    currentZone: 'safe',
    damageCooldown: 0
};

// Scene Setup
const scene = new THREE.Scene();
// Sky will be created as a dome, so set background to a darker blue
scene.background = new THREE.Color(0x4a90e2);
scene.fog = new THREE.Fog(0x87CEEB, 50, 150); // Realistic fog

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Camera will follow robot in third-person view
const cameraOffset = new THREE.Vector3(0, 5, 8);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Lighting - More realistic
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

// Add hemisphere light for more natural lighting
const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.4);
scene.add(hemisphereLight);

// Controls - Third person camera controls
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3(0, 0, 0);
const direction = new THREE.Vector3();
const gravity = -9.8; // Gravity constant
const robotHeight = 1.0; // Robot height from ground

// Camera controls (mouse look)
let mouseX = 0;
let mouseY = 0;
let targetCameraRotationX = 0;
let targetCameraRotationY = 0;
let cameraRotationX = 0;
let cameraRotationY = 0;

// Ground - Realistic terrain
const groundSize = 200;
const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x6B8E23, // Olive green/grass color
    roughness: 0.9,
    metalness: 0.1
});

// Add some terrain variation
const positions = groundGeometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    // Add slight height variation for realism
    const height = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
    positions.setY(i, height);
}
groundGeometry.computeVertexNormals();

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.position.y = 0;
scene.add(ground);

// Add a visible grid helper for reference
const gridHelper = new THREE.GridHelper(groundSize, 50, 0x888888, 0x666666);
gridHelper.position.y = 0.02;
scene.add(gridHelper);

// Create sky dome
function createSky() {
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide,
        fog: false
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    
    // Add clouds (more visible, larger clouds)
    for (let i = 0; i < 15; i++) {
        const cloudGroup = new THREE.Group();
        const cloudSize = 8 + Math.random() * 12;
        
        // Create cloud from multiple spheres
        for (let j = 0; j < 5; j++) {
            const cloudGeometry = new THREE.SphereGeometry(cloudSize * (0.6 + Math.random() * 0.4), 16, 16);
            const cloudMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8,
                fog: false
            });
            const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloudPart.position.set(
                (Math.random() - 0.5) * cloudSize * 1.5,
                (Math.random() - 0.5) * cloudSize * 0.8,
                (Math.random() - 0.5) * cloudSize * 1.5
            );
            cloudGroup.add(cloudPart);
        }
        
        cloudGroup.position.set(
            (Math.random() - 0.5) * 400,
            40 + Math.random() * 80,
            (Math.random() - 0.5) * 400
        );
        scene.add(cloudGroup);
    }
}
createSky();

// Add scattered debris and rubble around the environment
function createEnvironmentalDebris() {
    const debrisCount = 30;
    
    for (let i = 0; i < debrisCount; i++) {
        const size = 0.3 + Math.random() * 1.5;
        const geometry = new THREE.BoxGeometry(size, size * 0.8, size);
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0.1, 0.3, 0.2 + Math.random() * 0.2),
            roughness: 0.9,
            metalness: 0.1
        });
        const debris = new THREE.Mesh(geometry, material);
        
        debris.position.set(
            (Math.random() - 0.5) * 80,
            size * 0.5,
            (Math.random() - 0.5) * 80
        );
        debris.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        debris.castShadow = true;
        debris.receiveShadow = true;
        scene.add(debris);
    }
    
    // Add some larger destroyed structures
    for (let i = 0; i < 5; i++) {
        const structureGroup = new THREE.Group();
        const numPieces = 5 + Math.floor(Math.random() * 10);
        
        for (let j = 0; j < numPieces; j++) {
            const pieceSize = 1 + Math.random() * 2;
            const pieceGeometry = new THREE.BoxGeometry(pieceSize, pieceSize, pieceSize);
            const pieceMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(0.05, 0.4, 0.25 + Math.random() * 0.15),
                roughness: 0.8,
                metalness: 0.2
            });
            const piece = new THREE.Mesh(pieceGeometry, pieceMaterial);
            
            piece.position.set(
                (Math.random() - 0.5) * 4,
                j * 0.5,
                (Math.random() - 0.5) * 4
            );
            piece.rotation.set(
                Math.random() * Math.PI * 0.5,
                Math.random() * Math.PI,
                Math.random() * Math.PI * 0.5
            );
            piece.castShadow = true;
            piece.receiveShadow = true;
            structureGroup.add(piece);
        }
        
        structureGroup.position.set(
            (Math.random() - 0.5) * 60,
            0,
            (Math.random() - 0.5) * 60
        );
        scene.add(structureGroup);
    }
}
createEnvironmentalDebris();

// Create detailed 3D Robot Model
function createRobot() {
    const robotGroup = new THREE.Group();
    
    // Robot body (main chassis)
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
    
    // Robot head (sensor array)
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
    
    // Sensor "eye" on head
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
    
    // Left arm
    const leftArmGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
    const armMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4CAF50,
        metalness: 0.7,
        roughness: 0.3
    });
    const leftArm = new THREE.Mesh(leftArmGeometry, armMaterial);
    leftArm.position.set(-0.65, 0.8, 0);
    leftArm.castShadow = true;
    robotGroup.add(leftArm);
    
    // Right arm
    const rightArm = new THREE.Mesh(leftArmGeometry, armMaterial);
    rightArm.position.set(0.65, 0.8, 0);
    rightArm.castShadow = true;
    robotGroup.add(rightArm);
    
    // Left leg
    const leftLegGeometry = new THREE.BoxGeometry(0.35, 0.8, 0.35);
    const legMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x388E3C,
        metalness: 0.7,
        roughness: 0.3
    });
    const leftLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
    leftLeg.position.set(-0.3, 0.4, 0);
    leftLeg.castShadow = true;
    robotGroup.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
    rightLeg.position.set(0.3, 0.4, 0);
    rightLeg.castShadow = true;
    robotGroup.add(rightLeg);
    
    // Wheels/Tracks (for movement indication)
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x212121,
        metalness: 0.9,
        roughness: 0.1
    });
    
    // Left wheel
    const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    leftWheel.rotation.z = Math.PI / 2;
    leftWheel.position.set(-0.5, 0.2, 0);
    robotGroup.add(leftWheel);
    
    // Right wheel
    const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rightWheel.rotation.z = Math.PI / 2;
    rightWheel.position.set(0.5, 0.2, 0);
    robotGroup.add(rightWheel);
    
    robotGroup.position.set(0, 0, 0);
    robotGroup.castShadow = true;
    robotGroup.userData = {
        wheels: [leftWheel, rightWheel],
        body: body,
        head: head
    };
    
    return robotGroup;
}

// Create robot
const robotMesh = createRobot();
robotMesh.position.set(0, robotHeight, 0); // Start at proper height in 3D space
robotMesh.visible = true;
scene.add(robotMesh);

// Verify 3D setup on load
console.log('✅ 3D Environment Initialized');
console.log('✅ Robot created at 3D position:', robotMesh.position);
console.log('✅ Camera type: PerspectiveCamera (true 3D)');
console.log('✅ Scene children:', scene.children.length, 'objects');
console.log('✅ Renderer: WebGLRenderer with shadows enabled');

// Robot movement state
const robotMovement = {
    position: new THREE.Vector3(0, 0, 0),
    rotation: 0,
    targetRotation: 0
};

// Game Objects
const rubblePieces = [];
const victims = [];
const zones = [];
let fuelStation = null;

// Initialize Game
function initGame() {
    if (gameState.isGameStarted) return;
    
    gameState.isGameStarted = true;
    
    // Hide start screen and show game UI
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    document.getElementById('gameCanvas').classList.remove('hidden');
    
    // Make body non-scrollable during game
    document.body.style.overflow = 'hidden';
    
    gameState.startTime = Date.now();
    gameState.logs = [];
    
    // Create random rubble piles with victims
    createRubbleEnvironment();
    
    // Create zones
    createZones();
    
    // Create fuel station
    createFuelStation();
    
    // Start victim health decay
    startVictimHealthDecay();
    
    // Log initial state
    logRobotState('game_start');
    
    // Focus canvas after a brief delay (don't auto-lock pointer)
    setTimeout(() => {
        const canvas = document.getElementById('gameCanvas');
        canvas.focus();
        // Don't auto-lock pointer - let user click to lock if they want
        
        // Ensure camera is positioned to see robot in 3D
        camera.position.set(0, 5, 8);
        camera.lookAt(robotMesh.position);
        console.log('Game started! Robot at:', robotMesh.position, 'Camera at:', camera.position);
        console.log('✅ 3D Environment Active - PerspectiveCamera with FOV 75');
        console.log('✅ Scene has', scene.children.length, '3D objects');
        
        // Verify 3D setup
        console.log('3D Setup Verification:');
        console.log('- Camera type:', camera.type);
        console.log('- Camera FOV:', camera.fov);
        console.log('- Renderer:', renderer.constructor.name);
        console.log('- Robot position (3D):', robotMesh.position);
        console.log('- Robot visible:', robotMesh.visible);
    }, 500);
}

function createRubbleEnvironment() {
    const numPiles = 5 + Math.floor(Math.random() * 5); // 5-9 piles
    gameState.victimsTotal = 0;
    
    for (let i = 0; i < numPiles; i++) {
        const pileX = (Math.random() - 0.5) * 40;
        const pileZ = (Math.random() - 0.5) * 40;
        const pileY = 0;
        
        const numPieces = 10 + Math.floor(Math.random() * 15);
        const pile = [];
        
        for (let j = 0; j < numPieces; j++) {
            const size = 0.5 + Math.random() * 1.5;
            const geometry = new THREE.BoxGeometry(size, size, size);
            const material = new THREE.MeshStandardMaterial({ 
                color: new THREE.Color().setHSL(0.1, 0.3, 0.3 + Math.random() * 0.2)
            });
            const piece = new THREE.Mesh(geometry, material);
            
            piece.position.set(
                pileX + (Math.random() - 0.5) * 3,
                pileY + j * 0.3,
                pileZ + (Math.random() - 0.5) * 3
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
                originalPosition: piece.position.clone()
            };
            
            scene.add(piece);
            rubblePieces.push(piece);
            pile.push(piece);
        }
        
        // Add victim under some piles
        if (Math.random() > 0.3) {
            const victim = createVictim(pileX, pileZ);
            victims.push(victim);
            gameState.victimsTotal++;
        }
    }
    
    updateVictimCount();
}

function createVictim(x, z) {
    // Use cylinder geometry for victim (more compatible)
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
        decayRate: 0.5 + Math.random() * 0.5 // 0.5-1.0 health per second
    };
    
    scene.add(victim);
    return victim;
}

function createZones() {
    // Yellow zones (slow down)
    for (let i = 0; i < 3; i++) {
        const zone = createZone(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40,
            3 + Math.random() * 2,
            'yellow'
        );
        zones.push(zone);
    }
    
    // Red zones (damage)
    for (let i = 0; i < 2; i++) {
        const zone = createZone(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40,
            2 + Math.random() * 1.5,
            'red'
        );
        zones.push(zone);
    }
}

function createZone(x, z, radius, type) {
    const geometry = new THREE.CylinderGeometry(radius, radius, 0.1, 32);
    const color = type === 'yellow' ? 0xffeb3b : 0xf44336;
    const material = new THREE.MeshStandardMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.3
    });
    const zone = new THREE.Mesh(geometry, material);
    zone.position.set(x, 0.05, z);
    zone.rotation.x = Math.PI / 2;
    
    zone.userData = {
        type: type,
        radius: radius
    };
    
    scene.add(zone);
    return zone;
}

function createFuelStation() {
    const stationGeometry = new THREE.BoxGeometry(2, 2, 2);
    const stationMaterial = new THREE.MeshStandardMaterial({ color: 0x2196F3 });
    fuelStation = new THREE.Mesh(stationGeometry, stationMaterial);
    fuelStation.position.set(15, 1, 15);
    fuelStation.castShadow = true;
    
    // Add indicator
    const indicatorGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8);
    const indicatorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4CAF50,
        emissive: 0x4CAF50,
        emissiveIntensity: 0.5
    });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.y = 1.5;
    fuelStation.add(indicator);
    
    scene.add(fuelStation);
}

// Movement and Controls
// Make canvas focusable for keyboard events
const canvas = document.getElementById('gameCanvas');
canvas.setAttribute('tabindex', '0');
canvas.style.outline = 'none';
canvas.style.cursor = 'crosshair'; // Show crosshair cursor

// Keyboard event handlers - WORK REGARDLESS OF GAME STATE FOR TESTING
const handleKeyDown = (event) => {
    // ALWAYS log key presses for debugging
    console.log('KEY PRESSED:', event.code, 'Game started:', gameState.isGameStarted);
    
    // Handle Escape to unlock pointer
    if (event.key === 'Escape' && isPointerLocked) {
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
        return;
    }
    
    // TEMPORARILY: Allow movement even if game not started (for testing)
    // Remove game state check temporarily to test movement
    const allowMovement = true; // Set to false to restore game state check
    
    if (!allowMovement && (!gameState.isGameStarted || gameState.isGameOver)) {
        console.log('Movement blocked - Game not started or game over', gameState.isGameStarted, gameState.isGameOver);
        return;
    }
    
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            if (!moveForward) {
                moveForward = true;
                console.log('✅ Move forward ON - moveForward =', moveForward);
                if (gameState.isGameStarted) {
                    logPlayerAction('move_forward_start');
                }
            }
            break;
        case 'ArrowLeft':
        case 'KeyA':
            if (!moveLeft) {
                moveLeft = true;
                console.log('✅ Move left ON - moveLeft =', moveLeft);
                if (gameState.isGameStarted) {
                    logPlayerAction('move_left_start');
                }
            }
            break;
        case 'ArrowDown':
        case 'KeyS':
            if (!moveBackward) {
                moveBackward = true;
                console.log('✅ Move backward ON - moveBackward =', moveBackward);
                if (gameState.isGameStarted) {
                    logPlayerAction('move_backward_start');
                }
            }
            break;
        case 'ArrowRight':
        case 'KeyD':
            if (!moveRight) {
                moveRight = true;
                console.log('✅ Move right ON - moveRight =', moveRight);
                if (gameState.isGameStarted) {
                    logPlayerAction('move_right_start');
                }
            }
            break;
        case 'Space':
            event.preventDefault();
            if (gameState.isGameStarted) {
                destroyRubble();
            }
            break;
        case 'KeyR':
            if (gameState.isGameStarted) {
                refuel();
            }
            break;
        case 'KeyQ':
            // Rotate robot left
            robotMovement.targetRotation -= 0.1;
            break;
        case 'KeyE':
            // Rotate robot right
            robotMovement.targetRotation += 0.1;
            break;
    }
};

const handleKeyUp = (event) => {
    console.log('KEY RELEASED:', event.code);
    
    // Allow key up even if game not started (for testing)
    const allowMovement = true;
    if (!allowMovement && (!gameState.isGameStarted || gameState.isGameOver)) return;
    
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            if (moveForward) {
                moveForward = false;
                console.log('❌ Move forward OFF');
                if (gameState.isGameStarted) {
                    logPlayerAction('move_forward_stop');
                }
            }
            break;
        case 'ArrowLeft':
        case 'KeyA':
            if (moveLeft) {
                moveLeft = false;
                console.log('❌ Move left OFF');
                if (gameState.isGameStarted) {
                    logPlayerAction('move_left_stop');
                }
            }
            break;
        case 'ArrowDown':
        case 'KeyS':
            if (moveBackward) {
                moveBackward = false;
                console.log('❌ Move backward OFF');
                if (gameState.isGameStarted) {
                    logPlayerAction('move_backward_stop');
                }
            }
            break;
        case 'ArrowRight':
        case 'KeyD':
            if (moveRight) {
                moveRight = false;
                console.log('❌ Move right OFF');
                if (gameState.isGameStarted) {
                    logPlayerAction('move_right_stop');
                }
            }
            break;
    }
};

// Add event listeners to both window and canvas
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('keydown', handleKeyDown);
canvas.addEventListener('keyup', handleKeyUp);

// Also add to document for maximum coverage
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Test that listeners are attached
console.log('✅ Keyboard event listeners attached to window, canvas, and document');
console.log('✅ Canvas element:', canvas);
console.log('✅ Canvas tabindex:', canvas.getAttribute('tabindex'));

// Mouse movement for camera - make it work with or without pointer lock
let isPointerLocked = false;
let lastMouseX = 0;
let lastMouseY = 0;
let mouseDown = false;

// Click on canvas to focus
canvas.addEventListener('mousedown', (e) => {
    canvas.focus();
    mouseDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    console.log('Canvas clicked - focused');
});

canvas.addEventListener('mouseup', () => {
    mouseDown = false;
});

// Handle pointer lock changes - but keep cursor visible always
const handlePointerLockChange = () => {
    isPointerLocked = document.pointerLockElement === canvas || 
                     document.mozPointerLockElement === canvas ||
                     document.webkitPointerLockElement === canvas;
    
    // ALWAYS keep cursor visible - never hide it
    canvas.style.cursor = 'crosshair';
    
    if (isPointerLocked) {
        logPlayerAction('controls_locked');
    } else {
        logPlayerAction('controls_unlocked');
    }
};

document.addEventListener('pointerlockchange', handlePointerLockChange);
document.addEventListener('mozpointerlockchange', handlePointerLockChange);
document.addEventListener('webkitpointerlockchange', handlePointerLockChange);

// Allow Escape to unlock pointer (check in main keydown handler)

// Mouse movement - 360 degree camera rotation (WORKS IMMEDIATELY - no click needed)
// Initialize lastMouseX/Y to center of screen
lastMouseX = window.innerWidth / 2;
lastMouseY = window.innerHeight / 2;

// Mouse movement handler - works immediately when mouse moves
canvas.addEventListener('mousemove', (event) => {
    // MUCH higher sensitivity for visible camera movement
    const rotationSensitivity = 0.003; // Robot rotation sensitivity
    const cameraSensitivity = 0.005; // Camera rotation sensitivity (increased)
    
    // Calculate mouse movement delta
    const deltaX = event.movementX !== undefined ? event.movementX : (event.clientX - lastMouseX);
    const deltaY = event.movementY !== undefined ? event.movementY : (event.clientY - lastMouseY);
    
    // Rotate camera immediately (no threshold check for responsiveness)
    // Rotate robot horizontally (yaw) - full 360 degrees
    robotMovement.targetRotation -= deltaX * rotationSensitivity;
    
    // Rotate camera horizontally and vertically - full 360 degrees
    targetCameraRotationY -= deltaX * cameraSensitivity;
    targetCameraRotationX -= deltaY * cameraSensitivity;
    
    // Limit vertical camera rotation (prevent flipping)
    targetCameraRotationX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetCameraRotationX));
    
    // Update last position
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    
    // Debug every movement
    console.log('🖱️ Mouse moved - Camera updating:', {
        deltaX: deltaX.toFixed(2),
        deltaY: deltaY.toFixed(2),
        targetCameraY: targetCameraRotationY.toFixed(3),
        targetCameraX: targetCameraRotationX.toFixed(3),
        currentCameraY: cameraRotationY.toFixed(3),
        currentCameraX: cameraRotationX.toFixed(3)
    });
});

// Also track mouse enter/leave for debugging
canvas.addEventListener('mouseenter', (e) => {
    console.log('✅ Mouse entered canvas');
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('mouseleave', () => {
    console.log('❌ Mouse left canvas');
});

function destroyRubble() {
    const raycaster = new THREE.Raycaster();
    // Cast ray from robot's head position forward
    const robotHeadPosition = robotMesh.position.clone();
    robotHeadPosition.y += 1.5; // Head height
    const forwardDirection = new THREE.Vector3(0, 0, -1);
    forwardDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), robotMesh.rotation.y);
    raycaster.set(robotHeadPosition, forwardDirection);
    
    const intersects = raycaster.intersectObjects(rubblePieces.filter(p => !p.userData.destroyed));
    
    if (intersects.length > 0) {
        const piece = intersects[0].object;
        piece.userData.destroyed = true;
        
        // Animate destruction
        const tween = {
            scale: 1,
            opacity: 1
        };
        
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
        
        // Check if victim is now accessible
        checkVictimAccessibility();
    }
}

function refuel() {
    const distance = robotMesh.position.distanceTo(fuelStation.position);
    if (distance < 3) {
        robotState.fuel = robotState.maxFuel;
        logPlayerAction('refuel', { fuelLevel: robotState.fuel });
        updateUI();
    }
}

function checkVictimAccessibility() {
    victims.forEach(victim => {
        if (victim.userData.saved) return;
        
        // Check if rubble above victim is cleared
        const raycaster = new THREE.Raycaster();
        raycaster.set(victim.position.clone().add(new THREE.Vector3(0, 0.1, 0)), new THREE.Vector3(0, 1, 0));
        const intersects = raycaster.intersectObjects(
            rubblePieces.filter(p => !p.userData.destroyed)
        );
        
        if (intersects.length === 0) {
            // Check if robot is close enough
            const distance = robotMesh.position.distanceTo(victim.position);
            if (distance < 2) {
                rescueVictim(victim);
            }
        }
    });
}

function rescueVictim(victim) {
    if (victim.userData.saved) return;
    
    victim.userData.saved = true;
    gameState.victimsSaved++;
    
    // Animate rescue
    const tween = {
        scale: 1,
        opacity: 1,
        y: victim.position.y
    };
    
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
        survived: victim.userData.health > 0
    });
    
    updateVictimCount();
    checkGameOver();
}

function startVictimHealthDecay() {
    setInterval(() => {
        victims.forEach(victim => {
            if (!victim.userData.saved) {
                victim.userData.health = Math.max(0, victim.userData.health - victim.userData.decayRate);
                
                // Update visual indicator
                if (victim.userData.healthBar) {
                    const healthPercent = (victim.userData.health / victim.userData.maxHealth) * 100;
                    victim.userData.healthBar.style.width = healthPercent + '%';
                }
            }
        });
    }, 1000);
}

// Zone Detection and Effects
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
    if (inRedZone && robotState.damageCooldown <= 0) {
        robotState.health = Math.max(0, robotState.health - 2);
        robotState.damageCooldown = 1; // 1 second cooldown
        logRobotState('damage_from_zone', { zone: 'red', damage: 2 });
    }
    
    return { inYellowZone, inRedZone };
}

// Collision Detection
function checkCollisions() {
    // Check collision with rubble
    rubblePieces.forEach(piece => {
        if (piece.userData.destroyed) return;
        
        const distance = robotMesh.position.distanceTo(piece.position);
        if (distance < 1) {
            // Collision detected
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
}

// Data Logging
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
    // Proximity sensor (forward) - from robot's head
    const raycaster = new THREE.Raycaster();
    const robotHeadPosition = robotMesh.position.clone();
    robotHeadPosition.y += 1.5; // Head height
    const forwardDirection = new THREE.Vector3(0, 0, -1);
    forwardDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), robotMesh.rotation.y);
    raycaster.set(robotHeadPosition, forwardDirection);
    const frontIntersects = raycaster.intersectObjects(
        [...rubblePieces.filter(p => !p.userData.destroyed), ...victims.filter(v => !v.userData.saved)],
        true
    );
    const proximity = frontIntersects.length > 0 ? frontIntersects[0].distance : 10;
    
    // Multi-directional proximity sensors from robot
    const sensorDirections = [
        { name: 'forward', dir: new THREE.Vector3(0, 0, -1) },
        { name: 'left', dir: new THREE.Vector3(-1, 0, 0) },
        { name: 'right', dir: new THREE.Vector3(1, 0, 0) },
        { name: 'up', dir: new THREE.Vector3(0, 1, 0) },
        { name: 'down', dir: new THREE.Vector3(0, -1, 0) }
    ];
    
    const proximitySensors = {};
    sensorDirections.forEach(sensor => {
        const direction = sensor.dir.clone();
        // Rotate direction based on robot's rotation (except up/down)
        if (sensor.name !== 'up' && sensor.name !== 'down') {
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), robotMesh.rotation.y);
        }
        raycaster.set(robotHeadPosition, direction);
        const intersects = raycaster.intersectObjects(
            [...rubblePieces.filter(p => !p.userData.destroyed), ...victims.filter(v => !v.userData.saved)],
            true
        );
        proximitySensors[sensor.name] = intersects.length > 0 ? intersects[0].distance : 10;
    });
    
    // Victim detection with details
    const victimsInRange = victims.filter(v => {
        if (v.userData.saved) return false;
        const distance = robotMesh.position.distanceTo(v.position);
        return distance < 15;
    }).map(v => {
        const distance = robotMesh.position.distanceTo(v.position);
        const direction = new THREE.Vector3().subVectors(v.position, robotMesh.position).normalize();
        const angle = Math.atan2(direction.x, direction.z);
        return {
            distance: distance,
            angle: angle,
            health: v.userData.health,
            position: { x: v.position.x, y: v.position.y, z: v.position.z }
        };
    });
    
    // Rubble in view
    const rubbleInView = rubblePieces
        .filter(p => !p.userData.destroyed)
        .filter(p => {
            const distance = robotMesh.position.distanceTo(p.position);
            return distance < 20;
        })
        .map(p => {
            const distance = robotMesh.position.distanceTo(p.position);
            const direction = new THREE.Vector3().subVectors(p.position, robotMesh.position).normalize();
            const angle = Math.atan2(direction.x, direction.z);
            return {
                distance: distance,
                angle: angle,
                position: { x: p.position.x, y: p.position.y, z: p.position.z }
            };
        })
        .slice(0, 10); // Limit to 10 closest pieces
    
    // Fuel station detection
    const fuelStationDistance = robotMesh.position.distanceTo(fuelStation.position);
    const fuelStationDirection = new THREE.Vector3().subVectors(fuelStation.position, robotMesh.position).normalize();
    const fuelStationAngle = Math.atan2(fuelStationDirection.x, fuelStationDirection.z);
    
    // Zone detection
    const zoneInfo = checkZones();
    
    return {
        proximity: proximity,
        proximitySensors: proximitySensors,
        victimsDetected: victimsInRange.length,
        victims: victimsInRange,
        rubbleInView: rubbleInRange.length,
        rubble: rubbleInView,
        fuelStation: {
            distance: fuelStationDistance,
            angle: fuelStationAngle,
            inRange: fuelStationDistance < 5
        },
        zone: robotState.currentZone,
        inYellowZone: zoneInfo.inYellowZone,
        inRedZone: zoneInfo.inRedZone
    };
}

// UI Updates
function updateUI() {
    // Timer
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('timer').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Robot health
    const healthPercent = (robotState.health / robotState.maxHealth) * 100;
    document.getElementById('robotHealth').style.width = healthPercent + '%';
    document.getElementById('robotHealthText').textContent = Math.round(healthPercent) + '%';
    
    // Robot fuel
    const fuelPercent = (robotState.fuel / robotState.maxFuel) * 100;
    document.getElementById('robotFuel').style.width = fuelPercent + '%';
    document.getElementById('robotFuelText').textContent = Math.round(fuelPercent) + '%';
    
    // Sensor data
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

function checkGameOver() {
    if (gameState.victimsSaved >= gameState.victimsTotal || robotState.health <= 0) {
        endGame();
    }
}

function endGame() {
    if (gameState.isGameOver) return;
    gameState.isGameOver = true;
    if (document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement) {
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }
    
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    const stats = `
        <p><strong>Time Elapsed:</strong> ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</p>
        <p><strong>Victims Saved:</strong> ${gameState.victimsSaved} / ${gameState.victimsTotal}</p>
        <p><strong>Robot Health:</strong> ${Math.round(robotState.health)}%</p>
        <p><strong>Robot Fuel:</strong> ${Math.round(robotState.fuel)}%</p>
    `;
    
    document.getElementById('gameOverStats').innerHTML = stats;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    
    // Final log
    logRobotState('game_end', {
        finalStats: {
            timeElapsed: elapsed,
            victimsSaved: gameState.victimsSaved,
            victimsTotal: gameState.victimsTotal,
            robotHealth: robotState.health,
            robotFuel: robotState.fuel
        }
    });
}

// Download logs
document.getElementById('downloadLogsBtn').addEventListener('click', () => {
    const dataStr = JSON.stringify(gameState.logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reacture_logs_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
});

// Restart game
document.getElementById('restartBtn').addEventListener('click', () => {
    location.reload();
});

// Game Loop
function animate() {
    requestAnimationFrame(animate);
    
    // Only render if game hasn't started (show empty scene)
    if (!gameState.isGameStarted) {
        renderer.render(scene, camera);
        return;
    }
    
    if (gameState.isGameOver) {
        renderer.render(scene, camera);
        return;
    }
    
    const time = performance.now();
    let delta = (time - prevTime) / 1000;
    
    // Clamp delta to prevent huge jumps
    if (delta > 0.1) delta = 0.1;
    if (delta <= 0) delta = 0.016; // Default to ~60fps if delta is invalid
    
    // Smooth camera rotation - INSTANT response (no interpolation for testing)
    // Use direct assignment for immediate response
    cameraRotationY = targetCameraRotationY;
    cameraRotationX = targetCameraRotationX;
    
    // Debug camera rotation occasionally
    if (Math.random() < 0.02) {
        console.log('📹 Camera:', {
            targetY: targetCameraRotationY.toFixed(2),
            currentY: cameraRotationY.toFixed(2),
            targetX: targetCameraRotationX.toFixed(2),
            currentX: cameraRotationX.toFixed(2)
        });
    }
    
    // Robot movement - SIMPLIFIED AND GUARANTEED TO WORK
    // WORK EVEN IF GAME NOT STARTED (for testing)
    let moveSpeed = 10.0; // Faster movement
    
    // Only check zones if game started
    if (gameState.isGameStarted) {
        const zoneInfo = checkZones();
        if (zoneInfo.inYellowZone) {
            moveSpeed *= 0.5;
        }
    }
    
    // Apply friction
    velocity.x *= 0.8;
    velocity.z *= 0.8;
    velocity.y *= 0.9;
    
    // Calculate movement direction relative to robot's rotation
    const moveDirection = new THREE.Vector3();
    
    if (moveForward) moveDirection.z -= 1;
    if (moveBackward) moveDirection.z += 1;
    if (moveLeft) moveDirection.x -= 1;
    if (moveRight) moveDirection.x += 1;
    
    // Apply movement - IMMEDIATE response (works even if game not started)
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        // Rotate based on robot's current rotation
        moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), robotMesh.rotation.y);
        
        // Direct velocity application for immediate response
        const speed = moveSpeed * 20; // Very responsive
        velocity.x += moveDirection.x * speed * delta;
        velocity.z += moveDirection.z * speed * delta;
        
        // Rotate robot to face movement direction
        if (moveForward || moveBackward) {
            const targetAngle = Math.atan2(moveDirection.x, moveDirection.z);
            robotMovement.targetRotation = targetAngle;
        }
    }
    
    // Debug movement every frame when keys are pressed (for testing)
    if (moveForward || moveBackward || moveLeft || moveRight) {
        console.log('🤖 MOVING!', {
            keys: { W: moveForward, S: moveBackward, A: moveLeft, D: moveRight },
            velocity: { x: velocity.x.toFixed(2), z: velocity.z.toFixed(2) },
            position: { x: robotMesh.position.x.toFixed(2), z: robotMesh.position.z.toFixed(2), y: robotMesh.position.y.toFixed(2) },
            rotation: robotMesh.rotation.y.toFixed(2),
            delta: delta.toFixed(4)
        });
    }
    
    // Smooth robot rotation
    let angleDiff = robotMovement.targetRotation - robotMovement.rotation;
    // Normalize angle difference
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    robotMovement.rotation += angleDiff * 0.2; // Faster rotation
    
    // Update robot rotation
    robotMesh.rotation.y = robotMovement.rotation;
    
    // Apply gravity
    velocity.y += gravity * delta;
    
    // Update robot position
    robotMesh.position.x += velocity.x * delta;
    robotMesh.position.z += velocity.z * delta;
    robotMesh.position.y += velocity.y * delta;
    
    // Ground collision - keep robot on ground with proper height
    const groundY = 0; // Ground is at y=0
    if (robotMesh.position.y < groundY + robotHeight) {
        robotMesh.position.y = groundY + robotHeight;
        velocity.y = 0; // Stop falling
    }
    
    // Animate wheels when moving
    if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.z) > 0.1) {
        const wheelSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z) * 3;
        robotMesh.userData.wheels.forEach(wheel => {
            wheel.rotation.x += wheelSpeed * delta;
        });
    }
    
    // Update camera to follow robot (third-person 3D view using spherical coordinates)
    // Use spherical coordinates for true 3D camera positioning
    const cameraDistance = cameraOffset.z; // Distance from robot
    const cameraHeight = cameraOffset.y; // Height above robot
    
    // Calculate camera position using spherical coordinates (full 3D)
    const horizontalAngle = cameraRotationY; // Yaw (horizontal rotation)
    const verticalAngle = cameraRotationX; // Pitch (vertical rotation)
    
    // Convert spherical to cartesian coordinates
    const x = Math.sin(horizontalAngle) * Math.cos(verticalAngle) * cameraDistance;
    const y = cameraHeight + Math.sin(verticalAngle) * cameraDistance * 0.5; // Vertical offset based on pitch
    const z = Math.cos(horizontalAngle) * Math.cos(verticalAngle) * cameraDistance;
    
    // Set camera position relative to robot
    camera.position.set(
        robotMesh.position.x + x,
        robotMesh.position.y + y,
        robotMesh.position.z + z
    );
    
    // Camera always looks at robot (third-person view)
    // The view changes because camera position orbits around robot based on mouse input
    const lookAtPosition = robotMesh.position.clone();
    lookAtPosition.y += 1; // Look at robot's head level
    camera.lookAt(lookAtPosition);
    
    // Debug camera position occasionally
    if (Math.random() < 0.01) {
        console.log('📹 3D Camera:', {
            position: { x: camera.position.x.toFixed(2), y: camera.position.y.toFixed(2), z: camera.position.z.toFixed(2) },
            rotation: { x: camera.rotation.x.toFixed(2), y: camera.rotation.y.toFixed(2), z: camera.rotation.z.toFixed(2) },
            lookingAt: { x: lookAtPosition.x.toFixed(2), y: lookAtPosition.y.toFixed(2), z: lookAtPosition.z.toFixed(2) }
        });
    }
    
    // Fuel consumption
    if (moveForward || moveBackward || moveLeft || moveRight) {
        robotState.fuel = Math.max(0, robotState.fuel - delta * 2);
        if (robotState.fuel <= 0) {
            velocity.x *= 0.95;
            velocity.z *= 0.95; // Slow down without fuel
        }
    }
    
    // Damage cooldown
    if (robotState.damageCooldown > 0) {
        robotState.damageCooldown -= delta;
    }
    
    // Check collisions
    checkCollisions();
    
    // Check victim accessibility
    checkVictimAccessibility();
    
    // Periodic logging
    if (Math.random() < 0.1) { // Log ~10% of frames
        logRobotState('periodic_update');
    }
    
    prevTime = time;
    
    // Update UI
    updateUI();
    
    // Check game over conditions
    if (robotState.health <= 0) {
        endGame();
    }
    
    renderer.render(scene, camera);
}

// Start screen button
document.getElementById('startBtn').addEventListener('click', () => {
    initGame();
});

// Initialize scene (but don't start game yet)
function initScene() {
    // Scene is already set up, just wait for start button
}

// Start animation loop (will be visible once game starts)
initScene();
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

