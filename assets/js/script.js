// Free key from https://openweathermap.org/
const key = "67ce8748337fe54c0e9102ce6f8ff78e";
// https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&appid={API key}
// http://api.openweathermap.org/geo/1.0/direct?q={city name}&appid={API key}

const findCityRequest = "http://api.openweathermap.org/geo/1.0/direct";
const getCityWeatherRequest = "https://api.openweathermap.org/data/2.5/onecall";

const cityHistory = $("#cityHistory");
const dayContainer = $("#dayContainer");
const cityInput = $("#citySearch");


var cityDict = {};
var selectedCity = "";
var curWeather = {};
var curForecast = [];

// General Functions
function setup() {
    loadStorage();
    checkDisplayWeather();
}

function saveStorage() {
    localStorage.setItem("cities", JSON.stringify(cityDict));
    localStorage.setItem("curCity", JSON.stringify(selectedCity));
}

function loadStorage() {
    cityDict = JSON.parse(localStorage.getItem("cities"));
    if (cityDict == null) {
        cityDict = {};
        selectedCity = "";
    } else {
        selectedCity = JSON.parse(localStorage.getItem("curCity"));
        if (selectedCity == null) selectedCity = "";
    }
}

function checkDisplayWeather() {
    let flag = false;
    if (selectedCity == "") flag = true;
    else if (curWeather == {}) getWeather();
    $("#noSearch").attr("hidden", flag);
    $(".current").attr("hidden", !flag);
    $(".forecast").attr("hidden", !flag);
}

function updateSearchHistory() {
    Object.entries(cityDict).forEach(e => {
        const [city, data] = e;
        let btn = $("<button>")
            .attr("type", "button")
            .attr("id", city)
            .text(city);
        if(city == selectedCity) btn.addClass("active");
        else btn.addClass("inactive");
    });
}

function updateWeatherDisplay() {
    // Update current

    // Update forecast
}

// API Requests

function findCity(city) {
    let url = findCityRequest + "?q=" + city + "&appid=" + key;
    return fetch(url)
        .then(result => {
            return result.json();
        })
        .then(data => {
            let tmp = data[0];
            cityDict[tmp.name] = {
                lat: tmp.lat,
                lon: tmp.lon
            }
            selectedCity = tmp.name;
            saveStorage();
            updateSearchHistory();
        })
        .catch(ex => {
            console.log("Error: " + ex);
        });
}

function getWeather() {
    let url = getCityWeatherRequest + "?lat=" + cityDict[selectedCity].lat + "&lon=" + cityDict[selectedCity].lon + "&appid=" + key;
    return fetch(url)
        .then(result => {
            return result.json();
        })
        .then(data => {
            curWeather = {
                date: moment(),
                // Some math to convert kelvin to fahrenheit and round to nearest tenth of a degree
                temp: Math.round(((data.current.temp - 273.15) * (9 / 5) + 32) * 10) / 10,
                wind: data.current.wind_speed,
                humid: data.current.humidity,
                uvi: data.current.uvi
            }
            for (let i = 0; i < 5; i++) {
                curForecast.push({
                    date: moment().add(i + 1, 'd'),
                    // Some math to convert kelvin to fahrenheit and round to nearest tenth of a degree
                    temp: Math.round(((data.daily[i].temp.max - 273.15) * (9 / 5) + 32) * 10) / 10,
                    wind: data.daily[i].wind_speed,
                    humid: data.daily[i].humidity
                });
            }
        })
        .catch(ex => {
            console.log("error");
        });
}

// Search event handler
function searchCity(event) {
    // Prevent page refresh
    event.preventDefault();
    // After findCity finishes, save the city then check weather.
    findCity(cityInput.val()).then(() => {
        saveStorage();
        // After weather is obtained, update the display
        getWeather().then(() => {
            updateWeatherDisplay();
        });
    });
    // Clear input after a search
    cityInput.val("");
}

// Search event listener
$("#formSearch").on('submit', searchCity);

// Setup on load