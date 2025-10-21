
/* -------------------------
🕒 Update Current Time
------------------------- */
function updateTime() {
const now = new Date();
const timeString = now.toLocaleString();
document.getElementById("datetime").textContent = timeString;
}
setInterval(updateTime, 1000);
updateTime();

/* -------------------------
🌦️ Weather Section (OpenWeatherMap API)
------------------------- */
// Get a free key from: https://openweathermap.org/api

const weatherApiKey = "YOUR_API_KEY";
const weatherCity = "New Delhi"; 

async function fetchWeather() {
try {
const res = await fetch();
const data = await res.json();
document.getElementById(
"weather-temp"
).textContent = ${Math.round(data.main.temp)}°C;
document.getElementById("weather-city").textContent = data.name;
} catch (err) {
console.error("Weather fetch error:", err);
document.getElementById("weather-temp").textContent = "--°C";
document.getElementById("weather-city").textContent = "Offline";
}
}
fetchWeather();

/* -------------------------
🔥 Trending / Upcoming Anime (Jikan API)
------------------------- */
async function fetchTrendingAnime() {
try {
const res = await fetch("https://api.jikan.moe/v4/top/anime?limit=8");
const data = await res.json();
const container = document.getElementById("trendingList");
container.innerHTML = "";
data.data.forEach((anime) => {
const item = document.createElement("div");
item.classList.add("trending-item");
container.appendChild(item);
});
} catch (err) {
console.error("Trending anime fetch failed:", err);
document.getElementById("trendingList").innerHTML =
"<p>Failed to load trending anime.</p>";
}
}
fetchTrendingAnime();

/* -------------------------
📊 Anime Charts (Placeholder Data)
------------------------- */
const genreChartCtx = document.getElementById("genreChart").getContext("2d");
const monthlyChartCtx = document.getElementById("monthlyChart").getContext("2d");

// Genre Chart
const genreChart = new Chart(genreChartCtx, {
type: "doughnut",
data: {
labels: ["Action", "Adventure", "Fantasy", "Romance", "Comedy"],
datasets: [
{
label: "Genres Watched",
data: [12, 9, 7, 5, 3],
backgroundColor: [
"#66fcf1",
"#45a29e",
"#c5c6c7",
"#1f2833",
"#0b0c10",
],
borderWidth: 0,
},
],
},
options: {
plugins: {
legend: {
labels: { color: "#fff" },
},
},
},
});

// Monthly Chart
const monthlyChart = new Chart(monthlyChartCtx, {
type: "bar",
data: {
labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
datasets: [
{
label: "Anime Completed per Month",
data: [3, 5, 2, 4, 6, 1],
backgroundColor: "#66fcf1",
borderRadius: 5,
},
],
},
options: {
scales: {
x: { ticks: { color: "#fff" } },
y: { ticks: { color: "#fff" } },
},
plugins: { legend: { labels: { color: "#fff" } } },
},
});

/* -------------------------
📱 Social Media Stats
------------------------- */
// These will later auto-update from APIs (YouTube, Twitter, etc.)
const socialStats = {
youtube: 1200,
twitter: 540,
instagram: 800,
github: 60,
};

document.getElementById("ytFollowers").textContent =
socialStats.youtube.toLocaleString();
document.getElementById("twFollowers").textContent =
socialStats.twitter.toLocaleString();
document.getElementById("igFollowers").textContent =
socialStats.instagram.toLocaleString();
document.getElementById("ghFollowers").textContent =
socialStats.github.toLocaleString();