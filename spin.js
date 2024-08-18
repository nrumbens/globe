import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';

// Create scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene-container').appendChild(renderer.domElement);

// Create a textured sphere (representing the Earth)
const geometry = new THREE.SphereGeometry(1, 64, 64);
const texture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg');
const material = new THREE.MeshPhongMaterial({
  map: texture,
  shininess: 50,
  specular: new THREE.Color('white')
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 3.5);
scene.add(ambientLight);

// Set up camera position
camera.position.set(0, 0, 2.5);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
controls.minDistance = 1.5;
controls.maxDistance = 4;

// Load galaxy texture and create a skybox
const galaxyTexture = new THREE.TextureLoader().load('images/galaxy3.png');
const skyboxGeometry = new THREE.SphereGeometry(50, 64, 64); // Large sphere surrounding the scene
const skyboxMaterial = new THREE.MeshBasicMaterial({
  map: galaxyTexture,
  side: THREE.BackSide // Render inside of the sphere
});
const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
scene.add(skybox);

// Load the pin texture
const pinTexture = new THREE.TextureLoader().load('images/placeholder.png'); // Replace 'images/pin.png' with your pin image path

// Raycaster for hover detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Create a div for the popup
const popup = document.createElement('div');
popup.style.position = 'absolute';
popup.style.backgroundColor = 'white';
popup.style.padding = '10px';
popup.style.border = '2px solid lightblue'; // Light blue border around the entire popup
popup.style.borderRadius = '5px'; // Optional: rounded corners for the entire popup
popup.style.display = 'none';
popup.style.fontFamily = 'Roboto, sans-serif'; // Change to your preferred font
popup.style.boxSizing = 'border-box'; // Ensure padding and border are included in width/height
popup.style.zIndex = '1000'; // Ensure the popup appears above other content
document.body.appendChild(popup);

// Sample location data (update with your image paths)
const locations = [
  { lat: 40.7128, lon: -74.0060, name: "New York", image: "images/newyork.jpg"},
  { lat: 51.5074, lon: -0.1278, name: "London", image: "images/london.jpeg"},
  { lat: 35.6762, lon: 139.6503, name: "Tokyo", image: "images/tokyo.jpeg"},
  { lat: 43.2965, lon: 5.3698, name: "Marseille", image: "images/marseille.jpeg"},
  { lat: -28.0167, lon: 153.4000, name: "Gold Coast", image: "images/goldcoast.jpeg"}
];

// Convert lat/lon to 3D coordinates
function latLonToVector3(lat, lon, radius) {
   const phi = (90 - lat) * (Math.PI / 180);
   const theta = (lon + 180) * (Math.PI / 180);
   const x = -radius * Math.sin(phi) * Math.cos(theta);
   const z = radius * Math.sin(phi) * Math.sin(theta);
   const y = radius * Math.cos(phi);
   return new THREE.Vector3(x, y, z);
}

// Add markers for locations
const markers = [];
locations.forEach(loc => {
    const pinGeometry = new THREE.PlaneGeometry(0.05, 0.1);
    const pinMaterial = new THREE.MeshBasicMaterial({ map: pinTexture, transparent: true, side: THREE.DoubleSide });
    const pin = new THREE.Mesh(pinGeometry, pinMaterial);
    const position = latLonToVector3(loc.lat, loc.lon, 1.03); // Use 1.03 as the radius to place pins slightly above the sphere surface
    pin.position.copy(position);
    pin.lookAt(sphere.position);
    sphere.add(pin);
    markers.push({ marker: pin, location: loc });
});

// Handle mouse move events
function onMouseMove(event) {
   const rect = renderer.domElement.getBoundingClientRect();
   mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
   mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

   raycaster.setFromCamera(mouse, camera);

   const intersects = raycaster.intersectObjects(markers.map(m => m.marker));

   if (intersects.length > 0) {
       const intersectedMarker = intersects[0].object;
       const hoveredLocation = markers.find(m => m.marker === intersectedMarker).location;
       showPopup(hoveredLocation, event.clientX, event.clientY);
   } else {
       hidePopup();
   }
}

// Handle mouse click events (modified to do nothing)
function onMouseClick(event) {
   const rect = renderer.domElement.getBoundingClientRect();
   mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
   mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

   raycaster.setFromCamera(mouse, camera);

   const intersects = raycaster.intersectObjects(markers.map(m => m.marker));

   if (intersects.length > 0) {
       // Do nothing on click
       console.log("Location clicked, but no action performed.");
   }
}

function showPopup(location, x, y) {
  popup.innerHTML = `
      <div style="position: relative; border: 1px solid lightblue; padding: 5px; display: inline-block;">
          <img src="${location.image}" alt="${location.name}" style="width: 180px; height: auto; border: 2px solid lightblue;">
          <h3>${location.name}</h3>
      </div>
  `;
  popup.style.left = `${x + 10}px`; // Adjust positioning to avoid overlap
  popup.style.top = `${y + 10}px`; // Adjust positioning to avoid overlap
  popup.style.display = 'block';
}

function hidePopup() {
  popup.style.display = 'none';
}

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onMouseClick); // Click event listener remains, but does nothing

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
   camera.aspect = window.innerWidth / window.innerHeight;
   camera.updateProjectionMatrix();
   renderer.setSize(window.innerWidth, window.innerHeight);
}

// Update pin orientation to always face the camera
function updatePinOrientation() {
  markers.forEach(({ marker }) => {
      marker.lookAt(camera.position);
  });
}

// Animation loop
function animate() {
   requestAnimationFrame(animate);
   controls.update();
   updatePinOrientation();
   renderer.render(scene, camera);
}

animate();


