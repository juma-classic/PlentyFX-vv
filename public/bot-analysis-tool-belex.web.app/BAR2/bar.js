///START
const app_id = 36996; // Your app_id
const auth_token = 'hT44r1rpSgNlEEl'; // Your auth token
let digitsToKeep = 60; // Number of digits to keep in the list
let displayedDigits = 10; // Number of digits to display
let numSets = 10; //Sets of(IN this one it will be constant)

let websocket = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`);
// Define symbolDecimalPlaces globally
let symbolDecimalPlaces = 3;

// Ensure the WebSocket is opened before calling subscribeToTicks()
websocket.addEventListener('open', function(event) {
    subscribeToTicks();
});

let lastDigits = [];
let evenCount = 0;
let oddCount = 0;
let barGraph;



// Create and initialize the bar graph
function createBarGraph() {
    const ctx = document.getElementById('barGraph').getContext('2d');
    barGraph = new Chart(ctx, {
        plugins: [{
            afterDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                chart.data.datasets.forEach(function(dataset, i) {
                    const meta = chart.getDatasetMeta(i);
                    if (!meta.hidden) {
                        meta.data.forEach(function(element, index) {
                            // Draw the text in black, with the specified font
                            ctx.fillStyle = 'rgb(9, 255, 0)';
                            const fontSize = 16;
                            const fontStyle = 'normal';
                            const fontFamily = 'Arial';
                            ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily);

                            // Convert the number to a string and split the string every 3 characters
                            const dataString = (dataset.data[index]).toFixed(2) + "%";

                            // Now convert that string to an array of single strings
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            const padding = 15;
                            const position = element.tooltipPosition();
                            ctx.fillText(dataString, position.x, position.y - (fontSize / 2) - padding);
                        });
                    }
                });
            }
        }],
        type: 'bar',
        data: {
            labels: ['Even', 'Odd'],
            datasets: [{
                label: 'Percentage',
                data: [evenCount, oddCount],
                backgroundColor: ['rgb(0, 255, 34)', 'rgba(255, 99, 132, 0.5)'],
                borderColor: ['rgb(43, 255, 0)', 'rgba(255, 99, 132, 1)'],
                borderWidth: 1
            }]
        },

        options: {
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100, // Set the maximum value for the y-axis scale
                    stepSize: 1
                }
            }
        }
    });
}

// Update the bar graph with the latest counts
function updateBarGraph() {
    barGraph.data.datasets[0].data = [(evenCount / digitsToKeep * 100), (oddCount / digitsToKeep * 100)];
    barGraph.update();
}



websocket.addEventListener('open', (event) => {
    console.log('websocket connection established: ', event);

    const authPayload = JSON.stringify({
        authorize: auth_token,
    });

    websocket.send(authPayload);
});

websocket.addEventListener('message', (event) => {
    const receivedMessage = JSON.parse(event.data);

    switch (receivedMessage.msg_type) {
        case 'authorize':
            console.log('Authorization successful:', receivedMessage);
            break;
        case 'history':
            const prices = receivedMessage.history.prices;

            // Extract the last digits from the received prices
            lastDigits = prices.map(price => {
                const priceString = price.toString();
                const lastDigit = priceString.slice(-1); // Get the last digit
                const decimalIndex = priceString.indexOf('.'); // Find the decimal point

                if (decimalIndex !== -1 && priceString.length - decimalIndex - 1 === symbolDecimalPlaces) {
                    // If decimal part is missing or has the expected number of decimal places, return lastDigit
                    return lastDigit;
                } else {
                    return '0';
                }
            });
            // Calculate the initial count of even and odd numbers
            evenCount = lastDigits.filter(digit => digit % 2 === 0).length;
            oddCount = lastDigits.filter(digit => digit % 2 !== 0).length;

            // Create and initialize the bar graph
            createBarGraph();

            // Update the list of last digits
            updateLastDigitsList();

            // Update the even and odd percentages
            updatePercentages();

            2 ////// Create and initialize the bar graph////////
            createLineChart();


            // Update the list of last digits
            updateLastDigitsList();
            // Update the even and odd percentages
            break;
        case 'tick':
            const lastPrice = receivedMessage.tick.quote.toString();
            const lastDigit = lastPrice.slice(-1); // Get the last digit of the latest price
            const decimalIndex = lastPrice.indexOf('.'); // Find the decimal point
            let formattedPrice;
            if (decimalIndex !== -1 && lastPrice.length - decimalIndex - 1 === symbolDecimalPlaces) {
                // If decimal part is missing or has the expected number of decimal places, use the original price
                formattedPrice = lastPrice;
            } else {
                // Add trailing zeros to the decimal part
                const decimalPlacesToAdd = symbolDecimalPlaces - (lastPrice.length - decimalIndex - 1);
                const trailingZeros = '0'.repeat(decimalPlacesToAdd);
                formattedPrice = lastPrice + trailingZeros;
            }

            if (decimalIndex !== -1 && lastPrice.length - decimalIndex - 1 === symbolDecimalPlaces) {
                // If decimal part is missing or has the expected number of decimal places, add lastDigit to the list
                lastDigits.push(lastDigit);
            } else {
                lastDigits.push('0');
            }

            // Keep only the last `x` number of digits
            if (lastDigits.length > digitsToKeep) {
                lastDigits.shift();
            }

            // Calculate the updated count of even and odd numbers
            evenCount = lastDigits.filter(digit => digit % 2 === 0).length;
            oddCount = lastDigits.filter(digit => digit % 2 !== 0).length;

            document.getElementById('priceDisplay').innerText = `Latest Price: ${formattedPrice}`;
            // Update the bar graph with the latest counts
            updateBarGraph();

            // Update the list of last digits
            updateLastDigitsList();

            // Update the even and odd percentages
            updatePercentages();

            updateTable();

            break;
        default:
            console.log('received message: ', receivedMessage);
    }
});

websocket.addEventListener('close', (event) => {
    console.log('websocket connection closed: ', event);
});

websocket.addEventListener('error', (event) => {
    console.log('an error happened in our websocket connection', event);
});

// Update the even and odd percentages
function updatePercentages() {
    const totalDigits = evenCount + oddCount;
    const evenPercentage = totalDigits > 0 ? (evenCount / totalDigits * 100).toFixed(2) : 0;
    const oddPercentage = totalDigits > 0 ? (oddCount / totalDigits * 100).toFixed(2) : 0;
    document.getElementById('evenPercentage').innerText = `Even: ${evenPercentage}%`;
    document.getElementById('oddPercentage').innerText = `Odd: ${oddPercentage}%`;
}



const digitsInput = document.getElementById('digitsInput');
digitsInput.addEventListener('input', updateDigitsToKeep);

function updateDigitsToKeep() {
    const inputValue = parseInt(digitsInput.value);
    if (inputValue >= 10) {
        displayedDigits = 10;
    } else {
        displayedDigits = inputValue;
    }

    digitsToKeep = inputValue;
    if (lastDigits.length > digitsToKeep) {
        lastDigits = lastDigits.slice(-digitsToKeep);
    }
    subscribeToTicks(); // Add this line to update the WebSocket subscription
    updateLastDigitsList();
    updateBarGraph();
    updatePercentages();
}




// Define the symbol types and their decimal places
const symbolDecimalPlacesMap = {
    R_10: 3,
    R_25: 3,
    R_50: 4,
    R_75: 4,
    R_100: 2,
    "1HZ10V": 2,
    "1HZ25V": 2,
    "1HZ50V": 2,
    "1HZ75V": 2,
    "1HZ100V": 2,
    JD10: 2,
    JD25: 2,
    JD50: 2,
    JD75: 2,
    JD100: 2,
    RDBULL: 4,
    RDBEAR: 4,
};



// Get the select element by its ID
const symbolInput = document.getElementById('symbolInput');



// Add an event listener for the 'change' event
symbolInput.value = "R_10";
symbolInput.addEventListener('change', updateSymbolDecimalPlaces);



// Update the symbolDecimalPlaces value based on the selected symbol type
function updateSymbolDecimalPlaces() {
    const symbolType = symbolInput.value;
    symbolDecimalPlaces = symbolDecimalPlacesMap[symbolType] || 0;
}



// Add an event listener for the 'change' event
symbolInput.addEventListener('change', subscribeToTicks);

// Subscribe to ticks for the entered symbol type
function subscribeToTicks() {
    const symbolInput = document.getElementById('symbolInput');
    const symbolType = symbolInput.value;

    if (symbolType) {
        // Unsubscribe from the previous symbol type
        const unsubscribePayload = JSON.stringify({
            forget_all: 'ticks',
        });
        websocket.send(unsubscribePayload);

        // Clear the lastDigits array
        lastDigits = [];

        const subscriptionPayload = JSON.stringify({
            subscribe: 1,
            ticks_history: symbolType,
            end: 'latest',
            count: digitsToKeep,
        });

        websocket.send(subscriptionPayload);
    }
}




////////////////E/O LIST/////////


let sequenceCounts = {};
let sortedSequences = [];

// Function to convert a number to "E" (even) or "O" (odd)
function convertToEO(number) {
    return number % 2 === 0 ? 'E' : 'O';
}

// Function to get the sequence key
function getSequenceKey(sequence) {
    return sequence[0].repeat(sequence.length);
}



// Update the list of last digits
function updateLastDigitsList() {
    const lastDigitsList = document.getElementById('lastDigitsList');
    lastDigitsList.innerHTML = lastDigits.slice(-displayedDigits).map(digit => {
        const convertedDigit = convertToEO(digit);
        const color = convertedDigit === 'E' ? 'green' : 'red';
        return `<li style="color: ${color};">${convertedDigit}</li>`;
    }).join('');


    // Update the sequence counts

}


document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});


///SECURITY FOR NOCONSOL LOG.

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});


///SECURITY FOR NOCONSOL LOG.

console.log = function() {};

function validateInput() {
    const value = parseInt(digitsInput.value);
    if (value > 5000) {
        digitsInput.value = 5000;
        alert('Input value cannot exceed 5000. Value has been set to 5000.');
    }
}