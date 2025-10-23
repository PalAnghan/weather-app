// My script is running, cool.
console.log("Weather App script.js connected!");

// --- API Key is now IN THE URL ---
// We removed the old `apiKey` variable because the new
// API string has it included.

// --- 1. Grab all the HTML elements I need to work with ---
// (This part stays the same)
const cityInput = document.getElementById('cityInput');
const searchButton = document.getElementById('searchButton');

const initialState = document.getElementById('message-initial');
const loadingState = document.getElementById('message-loading');
const errorState = document.getElementById('message-error');
const weatherDisplay = document.getElementById('weather-display');

const errorMessage = document.getElementById('errorMessage');
const cityName = document.getElementById('cityName');
const weatherDescription = document.getElementById('weatherDescription');
const weatherIcon = document.getElementById('weatherIcon');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');


// --- 2. Make the buttons do stuff ---
// (This part stays the same)
searchButton.addEventListener('click', searchWeather);
cityInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        console.log("Enter key pressed!");
        searchWeather();
    }
});


// --- 3. My Main Function (This does all the work) ---

async function searchWeather() {
    console.log("Starting search...");
    const city = cityInput.value.trim();
    
    // Check 1: Did the user type anything?
    if (!city) {
        showError('Please enter a city name.');
        return;
    }

    // Check 2 (REMOVED): We don't need to check for the
    // apiKey variable anymore.
    // if (!apiKey) { ... }

    // 1. Show the loading spinner.
    showLoading();

    // 2. Now, try to get the REAL data.
    try {
        // --- THIS IS THE BIG CHANGE ---
        // We're not calling fetchMockData anymore.
        // We're calling our new fetchRealData function!
        const data = await fetchRealData(city);
        
        // 3. Success! We got the data. Now display it.
        console.log("Got REAL data:", data);
        displayWeather(data);

    } catch (error) {
        // 4. Oh no! The 'try' block failed.
        // This will now catch REAL errors from the API.
        console.error("An error happened:", error.message);
        showError(error.message);
    }
}


// --- 4. Helper Functions (to keep things clean) ---

// These functions just show/hide the right 'page'.
// (This part stays the same)
function showLoading() {
    console.log("State: Loading...");
    initialState.classList.add('hidden');
    errorState.classList.add('hidden');
    weatherDisplay.classList.add('hidden');
    loadingState.classList.remove('hidden');
}

function showError(message) {
    console.log(`State: Error - ${message}`);
    initialState.classList.add('hidden');
    loadingState.classList.add('hidden');
    weatherDisplay.classList.add('hidden');
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
}

/**
 * Shows *only* the final weather data
 * @param {object} data - The CLEANED data object from mapApiData.
 */
function displayWeather(data) {
    console.log("State: Displaying Weather.");
    initialState.classList.add('hidden');
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');

    // Our `data` object is nice and clean because
    // our `mapApiData` function formatted it for us.
    cityName.textContent = `${data.name}, ${data.country}`;
    weatherDescription.textContent = data.description;
    temperature.textContent = `${Math.round(data.temp)}°`;
    feelsLike.textContent = `${Math.round(data.feels_like)}°`;
    humidity.textContent = `${data.humidity}%`;
    windSpeed.textContent = `${data.wind_speed} mph`;
    
    // Get the icon HTML using the API's icon URL
    // We pass the description for the 'alt' text (good for accessibility)
    weatherIcon.innerHTML = getWeatherIcon(data.icon_url, data.description);
    
    weatherDisplay.classList.remove('hidden');
}


// --- 5. REAL API ---
// This is our new function to talk to WeatherAPI.com
/**
 * Fetches data from the OpenWeatherMap API
 * @param {string} city - The city to search for.
 * @returns {object} - The CLEANED data object from mapApiData.
 */
async function fetchRealData(city) {
    // `units=metric` gives us Celsius.
    // This is the new API URL the user provided.
    const apiUrl = `https://api.weatherapi.com/v1/current.json?key=0a819f8a4f4a4de580781002251502&q=${city}&aqi=yes`;

    console.log(`Fetching from: ${apiUrl}`);
    
    // Use the browser's built-in `fetch` function.
    const response = await fetch(apiUrl);

    // `response.ok` is true if the status is 200-299 (a success).
    if (!response.ok) {
        // If it's a 404 (Not Found) or 401 (Invalid Key),
        // the API sends back a JSON error message.
        const errorData = await response.json();
        console.error("API Error:", errorData);
        // "City not found" or "Invalid API key"
        // This new API nests the message inside 'error'
        throw new Error(errorData.error.message);
    }

    // If we get here, the response was OK!
    // Get the full JSON data from the response.
    const data = await response.json();
    
    // This is a "raw" data object. Let's clean it up
    // before we send it to our display function.
    return mapApiData(data);
}

/**
 * This is a "mapper" function. It takes the ugly, complex
 * data object from the API and "maps" it to the simple,
 * clean object our app wants to use.
 * @param {object} data - The raw data from WeatherAPI.com
 * @returns {object} - A simple, clean data object
 */
function mapApiData(data) {
    // The WeatherAPI 'data' object is different, so we
    // map the new paths to our simple object.
    return {
        name: data.location.name,
        country: data.location.country,
        temp: data.current.temp_c, // It gives Celsius directly
        feels_like: data.current.feelslike_c, // It gives feels-like Celsius
        humidity: data.current.humidity,
        // It gives wind_mph directly, no conversion needed!
        wind_speed: data.current.wind_mph, 
        description: data.current.condition.text,
        icon_url: data.current.condition.icon // e.g., "//cdn.weatherapi.com/..."
    };
}


// --- 6. Icon Helper ---
// We've updated this to just use the icon URL from the new API.
/**
 * Returns an HTML <img> string using the provided URL.
 * @param {string} iconUrl - The partial URL from the API (e.g., "//cdn.weather...").
 * @param {string} altText - The description of the weather for accessibility.
 * @returns {string} - The HTML string for the icon.
 */
function getWeatherIcon(iconUrl, altText) {
    // The API returns a URL starting with //
    // We add "https:" to make it a full, valid URL.
    const fullUrl = 'https:' + iconUrl;
    
    // We're no longer using Lucide for this, just a simple <img> tag.
    // We'll use the description as the alt text for accessibility.
    // The w-20 and h-20 classes match the old icon styling.
    return `<img src="${fullUrl}" alt="${altText}" class="w-20 h-20">`;

    // --- OLD LUCIDE CODE REMOVED ---
    // We don't need the iconMap or the Promise.resolve()
    // because we're not using the Lucide library for this part anymore.
}

// --- 7. Run this when the page first loads ---
// (This part stays the same)
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
} else {
    window.addEventListener('load', () => {
        console.log("Lucide icons initialized on window load.");
        lucide.createIcons();
    });
}


