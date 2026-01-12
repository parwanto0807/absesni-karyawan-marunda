
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of the earth in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in meters
    return d;
}

const myLat = -6.251270;
const myLon = 107.112873;
const targetLat = -6.251427;
const targetLon = 107.113802;

const distance = calculateDistance(myLat, myLon, targetLat, targetLon);
console.log("Distance:", distance, "meters");
