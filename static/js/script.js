// Constants for emissions calculations
const ANNUAL_EMISSIONS = 36.3; // billion metric tons of CO2 (2021)
const EMISSIONS_PER_SECOND = ANNUAL_EMISSIONS * 1000000000 / (365 * 24 * 60 * 60);
const CARBON_BUDGET = 400; // billion metric tons CO2 for 1.5°C target

// Initialize counters
let totalEmissions = 0;
const startTime = new Date();

// Update counter
function updateCounter() {
    const currentTime = new Date();
    const secondsElapsed = (currentTime - startTime) / 1000;
    totalEmissions = EMISSIONS_PER_SECOND * secondsElapsed;
    
    // Update main counter
    document.getElementById('counter').textContent = Math.floor(totalEmissions).toLocaleString();
    
    // Update annual emissions
    document.getElementById('annual-emissions').textContent = 
        `${ANNUAL_EMISSIONS.toFixed(1)} billion tons/year`;
    
    // Update carbon budget
    const remainingBudget = CARBON_BUDGET - (ANNUAL_EMISSIONS * (secondsElapsed / (365 * 24 * 60 * 60)));
    document.getElementById('carbon-budget').textContent = 
        `${Math.max(0, remainingBudget.toFixed(1))} billion tons remaining`;
    
    // Request next frame
    requestAnimationFrame(updateCounter);
}

// Start the counter
updateCounter();
