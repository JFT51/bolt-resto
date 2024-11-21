document.addEventListener('DOMContentLoaded', function() {
      // ... existing code ...

      // Fetch weather data for Brussels
      const startDate = '2024-10-10';
      const endDate = '2024-11-11';
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=50.85&longitude=4.35&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode&timezone=Europe%2FBerlin&start_date=${startDate}&end_date=${endDate}`;

      fetch(apiUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          const weatherData = data.daily;
          const tableBody = document.querySelector('#weatherTable tbody');

          weatherData.time.forEach((date, index) => {
            const newRow = tableBody.insertRow();
            const dateObject = new Date(date);
            newRow.insertCell().textContent = dateObject.toLocaleDateString();
            newRow.insertCell().textContent = `${weatherData.temperature_2m_min[index]}°C - ${weatherData.temperature_2m_max[index]}°C`;
            newRow.insertCell().textContent = `${weatherData.windspeed_10m_max[index]} m/s`;
            newRow.insertCell().textContent = `${weatherData.precipitation_sum[index]} mm`;
            newRow.insertCell().textContent = getWeatherEmoji(weatherData.weathercode[index]);

            console.log('Row data:', {
              date: dateObject.toLocaleDateString(),
              minTemp: `${weatherData.temperature_2m_min[index]}°C`,
              maxTemp: `${weatherData.temperature_2m_max[index]}°C`,
              windSpeed: `${weatherData.windspeed_10m_max[index]} m/s`,
              precipitation: `${weatherData.precipitation_sum[index]} mm`,
              weatherCode: getWeatherEmoji(weatherData.weathercode[index])
            });
          });
        })
        .catch(error => console.error('Error fetching weather data:', error));
    });

    // ... existing code ...
