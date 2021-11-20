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
var curForecast = {

};

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
        updateSearchHistory();
        if (selectedCity == null) selectedCity = "";
    }
}

function checkDisplayWeather() {
    let flag = false;
    if (selectedCity == "") flag = true;
    // This should only happen when page is freshly loaded and a city exists from localStorage
    else if (Object.keys(curWeather).length === 0) {
        // Get fresh data about that city
        getWeather().then(() => {
            updateWeatherDisplay();
        });
    }
    if (flag) {
        $("#noSearch").removeAttr("hidden");
        $(".current").attr("hidden", "hidden");
        $(".forecast").attr("hidden", "hidden");
    } else {
        $("#noSearch").attr("hidden", "hidden");
        $(".current").removeAttr("hidden");
        $(".forecast").removeAttr("hidden");
    }
}

function updateSearchHistory() {
    cityHistory.empty();
    Object.entries(cityDict).forEach(e => {
        const [city, _] = e;
        let btn = $("<button>")
            .attr("type", "button")
            .attr("id", city)
            .text(city);
        if (city == selectedCity) btn.addClass("active order-first btn w-75 mb-2 fw-bolder");
        else btn.addClass("inactive btn w-75 mb-2");
        cityHistory.append(btn);
    });
}

function getUVClass(uvi) {
    if (uvi < 3) return "UVLow";
    else if (uvi < 6) return "UVMod";
    else if (uvi < 8) return "UVHigh";
    else if (uvi < 11) return "UVVHigh";
    else return "UVExt";
}

function updateWeatherDisplay() {
    // Update current
    $("#curCityName").text(selectedCity + " (" + curWeather.date.format("MM/DD/YYYY") + ")")
    .append($("<br><img>").attr("src", curWeather.img));
    $("#curTemp").text("Temp: " + curWeather.temp + "F");
    $("#curWind").text("Wind: " + curWeather.wind + "mph");
    $("#curHumidity").text("Humidity: " + curWeather.humid + "%");
    let uvClass = getUVClass(curWeather.uvi);
    $("#curUV").html(`UV Index: <span class="${uvClass}">${curWeather.uvi}</span>`);

    // Update forecast
    $(".dayContainer").empty();
    curForecast.forEach(day => {
        $(".dayContainer").append(
            $("<div>")
            .addClass("day col-2")
            .html(`<h5 class="text-center">${day.date.format("MM/DD/YYYY")}</h5>` +
            `<img src="${day.img}"/>` +
            `<p>Temp: ${day.temp}F</p>` +
            `<p>Wind: ${day.wind}mph</p>` +
            `<p>Humidity: ${day.humid}%</p>`)
        );
    });
}

// API Requests

function findCity(city) {
    let url = findCityRequest + "?q=" + city + "&appid=" + key;
    return fetch(url)
        .then(result => {
            return result.json();
        })
        .then(data => {
            // If multiple cities are returned, only use the first one
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
            console.log(data);
            console.log(data.current.weather[0].id);
            curWeather = {
                date: moment(),
                // Some math to convert kelvin to fahrenheit and round to nearest tenth of a degree
                temp: Math.round(((data.current.temp - 273.15) * (9 / 5) + 32) * 10) / 10,
                // Convert m/s to mph
                wind: Math.round((data.current.wind_speed * 2.237) * 10 / 10),
                humid: data.current.humidity,
                uvi: data.current.uvi,
                img: `https://openweathermap.org/img/wn/${data.current.weather[0].icon}.png`
            }
            curForecast = [];
            for (let i = 0; i < 5; i++) {
                curForecast.push({
                    date: moment().add(i + 1, 'd'),
                    // Some math to convert kelvin to fahrenheit and round to nearest tenth of a degree
                    temp: Math.round(((data.daily[i].temp.max - 273.15) * (9 / 5) + 32) * 10) / 10,
                    // Convert m/s to mph
                    wind: Math.round((data.daily[i].wind_speed * 2.237) * 10 / 10),
                    humid: data.daily[i].humidity,
                    img: `https://openweathermap.org/img/wn/${data.daily[i].weather[0].icon}.png`
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
            checkDisplayWeather();
            updateWeatherDisplay();
        });
    });
    // Clear input after a search
    cityInput.val("");
}

// Search event listener
$("#formSearch").on('submit', searchCity);

// Search History event handler
function searchHistory(event) {
    event.preventDefault();
    selectedCity = event.target.getAttribute("id");
    saveStorage();
    updateSearchHistory();
    getWeather().then(() => {
        checkDisplayWeather();
        updateWeatherDisplay();
    });
}

// Setup on load
setup();

$("#cityHistory").on('click', ".inactive", searchHistory);