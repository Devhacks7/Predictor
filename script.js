document.addEventListener('DOMContentLoaded', () => {
    const userStates = {}; // Store user states
    const apiUrl = 'https://api.51gameapi.com/api/webapi/GetEmerdList'; // Your API URL

    document.getElementById('predictButton').addEventListener('click', async () => {
        const numberInput = document.getElementById('numberInput').value;
        const resultDiv = document.getElementById('result');
        const categoryDiv = document.getElementById('category');

        if (numberInput < 0 || numberInput > 9 || isNaN(numberInput)) {
            resultDiv.innerHTML = "<b>Please enter a valid number between 0 and 9.</b>";
            return;
        }

        const userId = 'user'; // Simulate a unique user ID
        if (!userStates[userId]) {
            userStates[userId] = { manualSwitch: false, category: null };
        }

        try {
            const apiData = await fetchData();
            if (apiData.error) {
                resultDiv.innerHTML = `<b>Error fetching data:</b> ${apiData.error}`;
                return;
            }

            generatePrediction(apiData, parseInt(numberInput), resultDiv, categoryDiv, userId);
        } catch (error) {
            console.error('Error:', error);
            resultDiv.innerHTML = "<b>Failed to fetch predictions. Please try again later.</b>";
        }
    });

    async function fetchData() {
        const requestData = {
            typeId: 1,
            language: 0,
            random: "c5acbc8a25b24da1a9ddd084e17cb8b6",
            signature: "667FC72C2C362975B4C56CACDE81540C",
            timestamp: Math.floor(Date.now() / 1000),
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_API_TOKEN_HERE' // Replace with your actual API token
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestData)
        });
        return response.json();
    }

    function generatePrediction(data, lastDrawnNumber, resultDiv, categoryDiv, userId) {
        const numberScores = Array(10).fill(0);
        const drawnHistory = [5, 8, 8, 9, 3]; // Example history

        drawnHistory.forEach((number, index) => {
            numberScores[number] += index < drawnHistory.length - 3 ? 1 : -1;
        });

        numberScores[lastDrawnNumber] += 5;

        const frequencyData = data.data.find(item => item.typeName === "Frequency") || {};
        const missingData = data.data.find(item => item.typeName === "Missing") || {};

        for (let i = 0; i < 10; i++) {
            numberScores[i] += (missingData[`number_${i}`] || 0) * 2;
            numberScores[i] += (10 - (frequencyData[`number_${i}`] || 0));
        }

        const rankedPredictions = numberScores
            .map((score, i) => ({ number: i, score }))
            .filter(prediction => prediction.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 7);

        const smallCount = rankedPredictions.filter(pred => pred.number <= 4).length;
        const bigCount = rankedPredictions.filter(pred => pred.number >= 5).length;

        if (!userStates[userId].category) {
            userStates[userId].category = bigCount > smallCount ? 'BIG' : 'SMALL';
        }

        const now = new Date();
        const totalMinutes = now.getHours() * 60 + now.getMinutes() + 1 - 330;
        const formattedMinutes = String(totalMinutes).padStart(4, '0');
        const currentDate = now.toISOString().slice(0, 10).replace(/-/g, '');
        const autoPeriod = `${currentDate}01${formattedMinutes}`;

        let output = `<b>🎯 Prediction Based on Last No ${lastDrawnNumber}:</b><br><b>Top Predicted Numbers:</b><br>`;
        rankedPredictions.forEach((pred, index) => {
            const sizeLabel = pred.number >= 5 ? 'Big' : 'Small';
            output += `${index + 1}. ${pred.number} (${sizeLabel})<br>`;
        });

        output += `<br><b>📊 G Tʏᴘᴇ ➢ Wɪɴɢᴏ 1 Mɪɴ</b>`;
        output += `<br><b>💠 Pᴇʀɪᴏᴅ ➢</b> ${autoPeriod}`;
        output += `<br><b>📈 Rᴇsᴜʟᴛ ➢</b> ${userStates[userId].category}`;


        categoryDiv.innerHTML = `
            <button id="category" class="betButton">Change Pre ⚙️</button>
        `;

        document.getElementById('category').addEventListener('click', () => {
            userStates[userId].manualSwitch = !userStates[userId].manualSwitch;
            userStates[userId].category = userStates[userId].category === 'Default' ? 'New' : 'Default';
            resultDiv.innerHTML += `<br><b>Prediction switched to ${userStates[userId].category}!</b>`;
        });

        resultDiv.innerHTML = output;
    }
});