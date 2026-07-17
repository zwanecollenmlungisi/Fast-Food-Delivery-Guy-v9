// ================================================================
//  🗺️ MAP MODULE
//  Handles Leaflet map integration
//  ================================================================

let mapInstance = null;
let mapMarker = null;
let driverMapInstance = null;

// ================================================================
//  HAVERSINE DISTANCE
//  ================================================================
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ================================================================
//  INIT MAP
//  ================================================================
function initMap() {
    const container = document.getElementById('map');
    const placeholder = document.getElementById('mapPlaceholder');

    if (!container) return;

    try {
        if (typeof L !== 'undefined') {
            const center = userLocation || { lat: -26.2041, lng: 28.0473 };

            mapInstance = L.map('map', {
                center: [center.lat, center.lng],
                zoom: 14,
                zoomControl: false,
                attributionControl: false
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: ''
            }).addTo(mapInstance);

            mapMarker = L.marker([center.lat, center.lng], { draggable: false }).addTo(mapInstance);

            if (placeholder) placeholder.style.display = 'none';
            mapInstance.invalidateSize();
            addRestaurantMarkers();

            mapInstance.on('click', function(e) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                userLocation = { lat, lng };
                appData.location.lat = lat;
                appData.location.lng = lng;
                updateMap(lat, lng);
                renderRestaurants();
                showToast('📍 Location updated', 'success');
            });
        } else {
            if (placeholder) placeholder.innerHTML = '<i class="fas fa-map"></i><span>Map unavailable</span>';
        }
    } catch (e) {
        console.warn('Map error:', e);
        if (placeholder) placeholder.innerHTML = '<i class="fas fa-map"></i><span>Map loading failed</span>';
    }
}

// ================================================================
//  UPDATE MAP
//  ================================================================
function updateMap(lat, lng) {
    if (mapInstance) {
        try {
            mapInstance.setView([lat, lng], 14);
            if (mapMarker) {
                mapMarker.setLatLng([lat, lng]);
            } else {
                mapMarker = L.marker([lat, lng], { draggable: false }).addTo(mapInstance);
            }
            addRestaurantMarkers();
            setTimeout(() => mapInstance.invalidateSize(), 300);
        } catch (_) {}
    }
}

// ================================================================
//  ADD RESTAURANT MARKERS
//  ================================================================
function addRestaurantMarkers() {
    if (!mapInstance) return;

    try {
        mapInstance.eachLayer(function(layer) {
            if (layer instanceof L.Marker && layer !== mapMarker) {
                mapInstance.removeLayer(layer);
            }
        });

        const restaurants = window.restaurants || [];

        for (const r of restaurants) {
            if (r.lat && r.lng) {
                const marker = L.marker([r.lat, r.lng], {
                    icon: L.divIcon({
                        html: `<div style="background:#ff6b35;color:white;border-radius:50%;width:28px;height:28px;
                            display:flex;align-items:center;justify-content:center;font-size:14px;
                            box-shadow:0 4px 12px rgba(255,107,53,0.3);border:2px solid white;">
                            ${r.image || '🍔'}
                        </div>`,
                        className: '',
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                    })
                }).addTo(mapInstance);

                marker.bindPopup(`<strong>${r.name}</strong><br>${r.address}<br>⭐ ${r.rating}`);
            }
        }
    } catch (_) {}
}

// ================================================================
//  DRIVER MAP
//  ================================================================
function initDriverMap() {
    const container = document.getElementById('driverMap');

    if (typeof L !== 'undefined' && container) {
        try {
            driverMapInstance = L.map('driverMap', {
                center: [-26.2041, 28.0473],
                zoom: 13,
                zoomControl: false,
                attributionControl: false
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: ''
            }).addTo(driverMapInstance);

            driverMapInstance.invalidateSize();
        } catch (_) {}
    }
}

function updateDriverMapForOrder(order) {
    if (!driverMapInstance) initDriverMap();
    if (!driverMapInstance) return;

    try {
        driverMapInstance.eachLayer(function(layer) {
            if (layer instanceof L.Marker) driverMapInstance.removeLayer(layer);
        });

        const bounds = [];
        const restaurant = window.restaurants?.find(r => r.id === order.restaurant_id);

        if (restaurant && restaurant.lat && restaurant.lng) {
            const rMarker = L.marker([restaurant.lat, restaurant.lng], {
                icon: L.divIcon({
                    html: `<div style="background:#ff6b35;color:white;border-radius:50%;width:28px;height:28px;
                        display:flex;align-items:center;justify-content:center;font-size:14px;
                        border:2px solid white;">🍔</div>`,
                    className: '',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                })
            }).addTo(driverMapInstance);

            rMarker.bindPopup(`<strong>${restaurant.name}</strong><br>${restaurant.address}`);
            bounds.push([restaurant.lat, restaurant.lng]);
        }

        if (order.customer_address) {
            const offsetLat = (restaurant?.lat || -26.2041) + 0.01;
            const offsetLng = (restaurant?.lng || 28.0473) + 0.005;

            const cMarker = L.marker([offsetLat, offsetLng], {
                icon: L.divIcon({
                    html: `<div style="background:#25d366;color:white;border-radius:50%;width:28px;height:28px;
                        display:flex;align-items:center;justify-content:center;font-size:14px;
                        border:2px solid white;">📦</div>`,
                    className: '',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                })
            }).addTo(driverMapInstance);

            cMarker.bindPopup(`<strong>Customer</strong><br>${order.customer_address}`);
            bounds.push([offsetLat, offsetLng]);

            document.getElementById('driverMapOrderInfo').textContent =
                '📍 Customer: ' + order.customer_address;
        }

        if (bounds.length > 0) {
            driverMapInstance.fitBounds(bounds, { padding: [30, 30] });
        }

        setTimeout(() => driverMapInstance.invalidateSize(), 300);
    } catch (_) {}
}

// ================================================================
//  LOCATION
//  ================================================================
let userLocation = null;

function getLocation() {
    const btn = document.getElementById('locBtn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(pos) {
                userLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                appData.location.lat = userLocation.lat;
                appData.location.lng = userLocation.lng;
                updateMap(userLocation.lat, userLocation.lng);
                renderRestaurants();
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-rotate"></i> Locate';
                showToast('📍 Location updated', 'success');
            },
            function(err) {
                console.warn('Geolocation error:', err);
                userLocation = { lat: -26.2041, lng: 28.0473 };
                appData.location.lat = userLocation.lat;
                appData.location.lng = userLocation.lng;
                updateMap(userLocation.lat, userLocation.lng);
                renderRestaurants();
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-rotate"></i> Locate';
                showToast('📍 Using approximate location', 'warning');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    } else {
        userLocation = { lat: -26.2041, lng: 28.0473 };
        appData.location.lat = userLocation.lat;
        appData.location.lng = userLocation.lng;
        updateMap(userLocation.lat, userLocation.lng);
        renderRestaurants();
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-rotate"></i> Locate';
        showToast('📍 Using approximate location', 'warning');
    }
}

// ================================================================
//  EXPOSE FUNCTIONS
//  ================================================================
window.haversineDistance = haversineDistance;
window.initMap = initMap;
window.updateMap = updateMap;
window.addRestaurantMarkers = addRestaurantMarkers;
window.initDriverMap = initDriverMap;
window.updateDriverMapForOrder = updateDriverMapForOrder;
window.getLocation = getLocation;
window.userLocation = userLocation;