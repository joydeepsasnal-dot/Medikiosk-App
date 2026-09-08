/* =====================================================
   MEDIKIOSK FRONTEND
   Demo version
   Later this file will communicate with FastAPI backend.
===================================================== */


/* =====================================================
   DEMO HEALTHCARE DATA

   This will eventually come from your Python backend
   and database.
===================================================== */

let facilities = [

    {
        id: 1,
        name: "City Care Hospital",
        type: "Hospital",
        city: "Kolkata",
        lat: 22.5726,
        lng: 88.3639,
        emergency: true,
        address: "Central Kolkata"
    },

    {
        id: 2,
        name: "MediPlus Pharmacy",
        type: "Pharmacy",
        city: "Kolkata",
        lat: 22.5745,
        lng: 88.3680,
        emergency: false,
        address: "Park Street"
    },

    {
        id: 3,
        name: "HealthFirst Clinic",
        type: "Clinic",
        city: "Kolkata",
        lat: 22.5680,
        lng: 88.3620,
        emergency: false,
        address: "Ballygunge"
    },

    {
        id: 4,
        name: "LifeScan Diagnostics",
        type: "Diagnostic",
        city: "Kolkata",
        lat: 22.5790,
        lng: 88.3710,
        emergency: false,
        address: "Salt Lake"
    },

    {
        id: 5,
        name: "Metro Medical Centre",
        type: "Hospital",
        city: "Kolkata",
        lat: 22.5650,
        lng: 88.3550,
        emergency: true,
        address: "Alipore"
    }

];

const API_BASE_URL = window.MEDIKIOSK_API_URL || "";


async function apiRequest(path, options = {}) {

    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        },
        ...options
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();

}


function normalizeFacility(facility) {

    return {
        ...facility,
        lat: facility.latitude ?? facility.lat,
        lng: facility.longitude ?? facility.lng,
        type: facility.type === "Diagnostic Centre"
            ? "Diagnostic"
            : facility.type
    };

}


async function loadFacilities() {

    const data = await apiRequest("/api/healthcare");
    facilities = data.facilities.map(normalizeFacility);
    loadFacilities().catch(() => {
        document.getElementById("facilityList").innerHTML =
            "<p>Healthcare data is temporarily unavailable.</p>";
    });

    const statistics = await apiRequest("/api/statistics");
    const hospitalCount = document.getElementById("hospitalCount");

    if (hospitalCount) {
        hospitalCount.textContent = statistics.total_facilities;
    }

}


/* =====================================================
   MAP
===================================================== */

let map;

let markers = [];

let currentFilter = "All";


function initializeMap() {

    map = L.map("map").setView(
        [22.5726, 88.3639],
        13
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);


    displayFacilities(facilities);
}


/* =====================================================
   DISPLAY FACILITIES
===================================================== */

function displayFacilities(data) {

    clearMarkers();

    const list =
        document.getElementById("facilityList");

    list.innerHTML = "";


    data.forEach(facility => {

        const marker =
            L.marker([
                facility.lat,
                facility.lng
            ]).addTo(map);


        marker.bindPopup(`
            <strong>${facility.name}</strong>
            <br>
            ${facility.type}
            <br>
            ${facility.address}
            <br>
            ${
                facility.emergency
                ? "🚨 Emergency Available"
                : ""
            }
        `);


        markers.push(marker);


        const card =
            document.createElement("div");

        card.className = "facility";


        card.innerHTML = `
            <strong>
                ${getIcon(facility.type)}
                ${facility.name}
            </strong>

            <small>
                ${facility.address}
            </small>

            <div class="facility-type">
                ${facility.type}
                ${
                    facility.emergency
                    ? " • 🚨 Emergency"
                    : ""
                }
            </div>
        `;


        card.onclick = () => {

            map.setView(
                [facility.lat, facility.lng],
                16
            );

            marker.openPopup();

        };


        list.appendChild(card);

    });

}


/* =====================================================
   ICONS
===================================================== */

function getIcon(type) {

    const icons = {

        Hospital: "🏥",

        Pharmacy: "💊",

        Clinic: "🩺",

        Diagnostic: "🧪"

    };

    return icons[type] || "📍";
}


/* =====================================================
   CLEAR MAP MARKERS
===================================================== */

function clearMarkers() {

    markers.forEach(marker => {

        map.removeLayer(marker);

    });

    markers = [];

}


/* =====================================================
   FILTER FACILITIES
===================================================== */

function filterFacilities(type, button) {

    currentFilter = type;


    document
        .querySelectorAll(".filter")
        .forEach(btn => {

            btn.classList.remove("active");

        });


    button.classList.add("active");


    let filtered = facilities;


    if (type !== "All") {

        filtered =
            facilities.filter(
                facility =>
                    facility.type === type
            );

    }


    displayFacilities(filtered);

}


/* =====================================================
   MAP SEARCH
===================================================== */

function searchMap() {

    const query =
        document
            .getElementById("mapSearch")
            .value
            .trim()
            .toLowerCase();


    if (!query) {

        alert("Please enter a location.");

        return;
    }


    apiRequest(`/api/healthcare/search?q=${encodeURIComponent(query)}`)
        .then(data => {
            const results = data.results.map(normalizeFacility);

            if (!results.length) {
                alert(`No healthcare facilities found for "${query}".`);
                return;
            }

            map.setView([results[0].lat, results[0].lng], 13);
            displayFacilities(results);
        })
        .catch(() => alert("Unable to search healthcare facilities right now."));

}


/* =====================================================
   MAIN SEARCH
===================================================== */

function searchLocation() {

    const query =
        document
            .getElementById("locationSearch")
            .value
            .trim();


    if (!query) {

        alert("Please enter a location.");

        return;
    }


    document
        .getElementById("map-section")
        .scrollIntoView({
            behavior: "smooth"
        });


    document
        .getElementById("mapSearch")
        .value = query;


    searchMap();

}


/* =====================================================
   USE CURRENT LOCATION
===================================================== */

function useMyLocation() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported by your browser."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        position => {

            const lat =
                position.coords.latitude;

            const lng =
                position.coords.longitude;


            map.setView(
                [lat, lng],
                14
            );


            L.marker([lat, lng])
                .addTo(map)
                .bindPopup(
                    "📍 Your current location"
                )
                .openPopup();


            document
                .getElementById("map-section")
                .scrollIntoView({
                    behavior: "smooth"
                });

        },

        () => {

            alert(
                "Unable to access your location. Please allow location permission."
            );

        }

    );

}


/* =====================================================
   SERVICE CARD → MAP
===================================================== */

function scrollToMap(type) {

    document
        .getElementById("map-section")
        .scrollIntoView({
            behavior: "smooth"
        });


    setTimeout(() => {

        const buttons =
            document.querySelectorAll(
                ".filter"
            );


        if (type === "Hospital") {

            buttons[1].click();

        } else if (type === "Pharmacy") {

            buttons[2].click();

        } else if (type === "Clinic") {

            buttons[3].click();

        } else if (type === "Diagnostic") {

            buttons[4].click();

        }

    }, 500);

}


/* =====================================================
   AI CHAT
===================================================== */

function sendMessage() {

    const input =
        document.getElementById(
            "chatInput"
        );


    const message =
        input.value.trim();


    if (!message) return;


    addMessage(
        message,
        "user"
    );


    input.value = "";


    apiRequest("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message })
    })
        .then(data => addMessage(data.message, "bot"))
        .catch(() => addMessage(
            "The health assistant is temporarily unavailable.",
            "bot"
        ));

}


/* =====================================================
   CHAT ENTER KEY
===================================================== */

function handleChatKey(event) {

    if (event.key === "Enter") {

        sendMessage();

    }

}


/* =====================================================
   ADD CHAT MESSAGE
===================================================== */

function addMessage(
    message,
    sender
) {

    const container =
        document.getElementById(
            "chatMessages"
        );


    const messageElement =
        document.createElement("div");


    messageElement.className =
        `message ${sender}`;


    messageElement.textContent =
        message;


    container.appendChild(
        messageElement
    );


    container.scrollTop =
        container.scrollHeight;

}


/* =====================================================
   AI SUGGESTIONS
===================================================== */

function askSuggestion(question) {

    document
        .getElementById("chatInput")
        .value = question;


    sendMessage();

}


/* =====================================================
   TEMPORARY AI RESPONSE

   IMPORTANT:
   This is NOT a medical diagnosis engine.

   It will be replaced with a real,
   safety-focused backend AI service.
===================================================== */

function generateDemoAIResponse(message) {

    const text =
        message.toLowerCase();


    if (
        text.includes("diabetes")
    ) {

        return `
Diabetes is a condition in which blood glucose levels become too high because the body does not produce enough insulin or does not use insulin effectively.

For personal medical advice or diagnosis, please consult a qualified healthcare professional.
        `;

    }


    if (
        text.includes("hospital")
    ) {

        return `
I can help you find healthcare facilities. Use the Smart Healthcare Map above and search your city or area to locate nearby hospitals and other facilities.
        `;

    }


    if (
        text.includes("first aid")
    ) {

        return `
First aid is immediate basic care provided until professional medical help is available. For serious injuries or emergencies, contact emergency services immediately.
        `;

    }


    return `
I can provide general health information, but I cannot diagnose medical conditions.

For personal symptoms or urgent concerns, please consult a qualified healthcare professional.
    `;

}


/* =====================================================
   EMERGENCY MODAL
===================================================== */

function openEmergency() {

    document
        .getElementById(
            "emergencyModal"
        )
        .classList.add("show");

}


function closeEmergency() {

    document
        .getElementById(
            "emergencyModal"
        )
        .classList.remove("show");

}


/* =====================================================
   MEDICINE MODAL
===================================================== */

function openMedicine() {

    document
        .getElementById(
            "medicineModal"
        )
        .classList.add("show");

}


function closeMedicine() {

    document
        .getElementById(
            "medicineModal"
        )
        .classList.remove("show");

}


/* =====================================================
   MEDICINE SEARCH

   Temporary demo database.
   Later this will come from your backend.
===================================================== */

const medicines = {

    paracetamol: {

        name: "Paracetamol",

        information:
            "Paracetamol is commonly used to relieve pain and reduce fever.",

        safety:
            "Use only according to the product label or advice from a qualified healthcare professional."

    },

    cetirizine: {

        name: "Cetirizine",

        information:
            "Cetirizine is an antihistamine commonly used for allergy symptoms.",

        safety:
            "Follow the product instructions and ask a healthcare professional if you are unsure whether it is appropriate for you."

    }

};


function searchMedicine() {

    const query =
        document
            .getElementById(
                "medicineSearch"
            )
            .value
            .trim()
            .toLowerCase();


    const result =
        document.getElementById(
            "medicineResult"
        );


    if (!query) {

        result.innerHTML =
            "<p>Please enter a medicine name.</p>";

        return;

    }


    apiRequest(`/api/medicine/search?name=${encodeURIComponent(query)}`)
        .then(data => {
            if (!data.results.length) {
                result.innerHTML = "<p>Medicine not found.</p>";
                return;
            }

            result.innerHTML = data.results.map(medicine => `
                <div class="facility">
                    <strong>💊 ${medicine.name}</strong>
                    <p>${medicine.description}</p>
                    <small>⚠️ ${medicine.precautions.join(" ")}</small>
                </div>
            `).join("");
        })
        .catch(() => {
            result.innerHTML =
                "<p>Medicine information is temporarily unavailable.</p>";
        });

}


/* =====================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
===================================================== */

window.addEventListener(
    "click",
    event => {

        const emergencyModal =
            document.getElementById(
                "emergencyModal"
            );

        const medicineModal =
            document.getElementById(
                "medicineModal"
            );


        if (
            event.target ===
            emergencyModal
        ) {

            closeEmergency();

        }


        if (
            event.target ===
            medicineModal
        ) {

            closeMedicine();

        }

    }
);


/* =====================================================
   AI SCROLL
===================================================== */

function scrollToAI() {

    document
        .getElementById("ai")
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* =====================================================
   START APPLICATION
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeMap();

    }
);
