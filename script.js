// Log a message to the console to ensure the script is linked correctly
console.log('JavaScript file is linked correctly.');

// script.js

// Game State
// Start with 20 coins
let coins = 20;
let droplets = 0;
// Storage: { name, icon, count, price }
let storage = [
  // Start with 1 of each seed, 5 fertilizer, 0 flowers
  { name: 'Sunflower Seed', icon: '🌻', count: 1, price: 10 },
  { name: 'Rose Seed', icon: '🌹', count: 1, price: 10 },
  { name: 'Daisy Seed', icon: '🌼', count: 1, price: 10 },
  { name: 'Tulip Seed', icon: '🌷', count: 1, price: 10 },
  { name: 'Fertilizer', icon: '🪴', count: 5, price: 5 },
  { name: 'Sunflower', icon: '🌻', count: 0 },
  { name: 'Rose', icon: '🌹', count: 0 },
  { name: 'Daisy', icon: '🌼', count: 0 },
  { name: 'Tulip', icon: '🌷', count: 0 }
];

// Shop state: track how many of each item are available
let shopStock = {
  'Sunflower Seed': 1,
  'Rose Seed': 1,
  'Daisy Seed': 1,
  'Tulip Seed': 1,
  'Fertilizer': 5
};
// Shop restocks every 1 hour (60 minutes * 60 seconds * 1000 ms)
const SHOP_RESET_INTERVAL = 1 * 60 * 60 * 1000; // 1 hour in ms
let nextShopReset = Date.now() + SHOP_RESET_INTERVAL;

// Garden Plots: 4 plots, each with a stage (0=empty, 1=seed, 2=sprout, 3=bloom), and a timestamp for last update
const GARDEN_PLOT_COUNT = 4;
// Growth interval: 1 minute (60 seconds * 1000 ms)
const GROWTH_INTERVAL = 60 * 1000; // 1 minute between growth stages
// Flower types and their emojis for each stage
const FLOWER_TYPES = [
  // Each flower type has correct emoji for each stage
  { name: 'Sunflower', seed: 'Sunflower Seed', icons: ['', '🌱', '🌿', '🌻'] },
  { name: 'Rose', seed: 'Rose Seed', icons: ['', '🌱', '🌿', '🌹'] },
  { name: 'Daisy', seed: 'Daisy Seed', icons: ['', '🌱', '🌿', '🌼'] },
  { name: 'Tulip', seed: 'Tulip Seed', icons: ['', '🌱', '🌿', '🌷'] }
];
// Each plot has a stage, a timestamp for when it was last updated, a needsWater flag, and a flowerType (index in FLOWER_TYPES or null)
let gardenPlots = [
  { stage: 0, lastUpdate: null, needsWater: false, flowerType: null },
  { stage: 0, lastUpdate: null, needsWater: false, flowerType: null },
  { stage: 0, lastUpdate: null, needsWater: false, flowerType: null },
  { stage: 0, lastUpdate: null, needsWater: false, flowerType: null }
];

// Render the garden plots with overlays for each growth stage
function renderGarden() {
  const grid = document.getElementById('garden-plot-grid');
  if (!grid) return;
  grid.innerHTML = '';
  gardenPlots.forEach((plot, idx) => {
    // Create a container for each plot
    const plotContainer = document.createElement('div');
    plotContainer.className = 'garden-plot';
    plotContainer.style.position = 'relative';
    plotContainer.style.display = 'flex';
    plotContainer.style.justifyContent = 'center';
    plotContainer.style.alignItems = 'center';

    // Plot background (SVG)
    const plotImg = document.createElement('img');
    plotImg.src = 'img/plot.svg';
    plotImg.alt = `Plot ${idx + 1}`;
    plotImg.className = 'plot-svg';
    plotContainer.appendChild(plotImg);

    // Overlay for growth stage (emoji for now)
    if (plot.stage > 0 && plot.flowerType !== null) {
      const overlay = document.createElement('span');
      overlay.className = 'plant-stage';
      overlay.style.position = 'absolute';
      overlay.style.top = '50%';
      overlay.style.left = '50%';
      overlay.style.transform = 'translate(-50%, -50%)';
      overlay.style.fontSize = '2.5rem';
      // Show the correct emoji for this flower type and stage
      overlay.textContent = FLOWER_TYPES[plot.flowerType].icons[plot.stage];

      // Add tooltip for growth stage, time remaining, and water status
      let stageName = '';
      if (plot.stage === 1) stageName = 'Seed';
      else if (plot.stage === 2) stageName = 'Sprout';
      else if (plot.stage === 3) stageName = 'Bloom';

      let timeLeft = '';
      if (plot.stage > 0 && plot.stage < 3 && plot.lastUpdate) {
        const now = Date.now();
        const msLeft = Math.max(0, GROWTH_INTERVAL - (now - plot.lastUpdate));
        const sec = Math.ceil(msLeft / 1000);
        if (plot.needsWater) {
          timeLeft = 'Needs water to grow!';
        } else {
          timeLeft = `Next stage in: ${sec}s`;
        }
      } else if (plot.stage === 3) {
        timeLeft = 'Fully grown!';
      } else if (plot.stage === 1 && plot.needsWater) {
        timeLeft = 'Needs water to start growing!';
      }

      overlay.title = `Stage: ${stageName}\n${timeLeft}`;
      plotContainer.title = overlay.title; // Also set on container for easier hover
      plotContainer.appendChild(overlay);

      // Show a water droplet icon if needs water
      if (plot.needsWater && plot.stage < 3) {
        const waterIcon = document.createElement('span');
        waterIcon.textContent = '💧';
        waterIcon.style.position = 'absolute';
        waterIcon.style.bottom = '10px';
        waterIcon.style.right = '10px';
        waterIcon.style.fontSize = '1.5rem';
        waterIcon.title = 'Needs water!';
        plotContainer.appendChild(waterIcon);
      }
    }


    // If plot is in bloom, allow clicking the plot to open a modal for harvest/cancel
    if (plot.stage === 3) {
      plotContainer.style.cursor = 'pointer';
      plotContainer.onclick = () => openHarvestModal(idx);
    }
// Modal for harvesting flowers from garden
function openHarvestModal(plotIdx) {
  // Create a simple modal if not present
  let modal = document.getElementById('harvest-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'harvest-modal';
    modal.className = 'modal-bg';
    modal.innerHTML = `
      <div class="modal-box">
        <p id="harvest-modal-text">Harvest this flower?</p>
        <button id="harvest-confirm">Harvest</button>
        <button id="harvest-cancel">Cancel</button>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    modal.classList.remove('hidden');
  }
  // Set up text and buttons
  document.getElementById('harvest-modal-text').textContent = `Harvest flower from plot ${plotIdx+1}?`;
  document.getElementById('harvest-confirm').onclick = function() {
    harvestPlot(plotIdx);
    closeHarvestModal();
  };
  document.getElementById('harvest-cancel').onclick = closeHarvestModal;
  modal.classList.remove('hidden');
}

function closeHarvestModal() {
  let modal = document.getElementById('harvest-modal');
  if (modal) modal.classList.add('hidden');
}

    grid.appendChild(plotContainer);
  });
}

// Plant a seed in the first empty plot (for demo/testing)
function plantSeedInGarden() {
  // Find the first empty plot
  const emptyIdx = gardenPlots.findIndex(plot => plot.stage === 0);
  if (emptyIdx !== -1) {
    gardenPlots[emptyIdx].stage = 1; // Seed stage
    gardenPlots[emptyIdx].lastUpdate = null; // Not growing yet
    gardenPlots[emptyIdx].needsWater = true; // Needs water to start
    renderGarden();
  } else {
    alert('No empty plots!');
  }
}

// Growth timer: check every 2 seconds for updates (stage advances every GROWTH_INTERVAL)
setInterval(() => {
  const now = Date.now();
  let changed = false;
  gardenPlots.forEach(plot => {
    // Only advance if not waiting for water and not at max stage
    if (plot.stage > 0 && plot.stage < 3 && plot.lastUpdate && !plot.needsWater) {
      if (now - plot.lastUpdate >= GROWTH_INTERVAL) {
        // After timer, require water again to advance
        plot.needsWater = true;
        plot.lastUpdate = null; // Pause timer until watered
        // Advance stage only after next watering
        plot.stage++;
        changed = true;
      }
    }
  });
  if (changed) renderGarden();
}, 2000); // check every 2 seconds

// Harvest a flower from a plot in full bloom
// Harvest a flower from a plot in full bloom
function harvestPlot(idx) {
  // Add the correct flower type to storage based on the plot's flowerType
  let flowerType = gardenPlots[idx].flowerType;
  if (flowerType !== null && flowerType >= 0 && flowerType < FLOWER_TYPES.length) {
    let flowerName = FLOWER_TYPES[flowerType].name;
    let storageIdx = storage.findIndex(item => item.name === flowerName);
    if (storageIdx !== -1) {
      storage[storageIdx].count++;
    }
  }
  // Reset the plot to empty
  gardenPlots[idx] = { stage: 0, lastUpdate: null, needsWater: false, flowerType: null };
  renderGarden();
  updateStorageUI();
  alert('Flower harvested! It was added to your storage.');
}

// Make showScreen available globally for navigation buttons
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(screen) {
    screen.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}
window.showScreen = showScreen;


// Render storage grid
function updateStorageUI() {
  const grid = document.getElementById('storage-grid');
  if (!grid) return;
  grid.innerHTML = '';
  storage.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'storage-item';
    div.innerHTML = `
      <button style="font-size:2.2rem; background:linear-gradient(135deg,#e0f7fa 60%,#8BD1CB 100%); border:none; border-radius:1rem; padding:1.2rem; cursor:pointer;">${item.icon}</button>
      <div class="storage-title">${item.name}</div>
      <div class="storage-count">x${item.count}</div>
    `;
    div.onclick = () => openSellModal(idx);
    grid.appendChild(div);
  });
}

// Modal logic
let sellIndex = null;
let modalAction = null; // 'sell', 'plant', 'fertilize'
let selectedPlotIndex = null; // For fertilizer use

function openSellModal(idx) {
  sellIndex = idx;
  modalAction = 'sell';
  const modal = document.getElementById('sell-modal');
  const text = document.getElementById('sell-modal-text');
  // Clear any extra buttons
  updateModalButtons(idx);
  text.textContent = `Sell 1 ${storage[idx].name}? (You have ${storage[idx].count})`;
  modal.classList.remove('hidden');
}

function updateModalButtons(idx) {
  // Show/hide plant or use buttons depending on item
  const sellBtn = document.getElementById('sell-confirm');
  let plantBtn = document.getElementById('plant-confirm');
  let useBtn = document.getElementById('use-confirm');
  // Remove if already present
  if (plantBtn) plantBtn.remove();
  if (useBtn) useBtn.remove();
  // Add Plant button for any seed
  if (storage[idx].name.endsWith('Seed')) {
    plantBtn = document.createElement('button');
    plantBtn.id = 'plant-confirm';
    plantBtn.textContent = 'Plant';
    plantBtn.style.marginLeft = '1rem';
    plantBtn.onclick = () => {
      modalAction = 'plant';
      showPlantPlotPicker(storage[idx].name);
    };
    sellBtn.parentNode.insertBefore(plantBtn, sellBtn.nextSibling);
  }
  // Add Use button for Fertilizer
  if (storage[idx].name === 'Fertilizer') {
    useBtn = document.createElement('button');
    useBtn.id = 'use-confirm';
    useBtn.textContent = 'Use';
    useBtn.style.marginLeft = '1rem';
    useBtn.onclick = () => {
      modalAction = 'fertilize';
      showFertilizePlotPicker();
    };
    sellBtn.parentNode.insertBefore(useBtn, sellBtn.nextSibling);
  }
}

function closeSellModal() {
  sellIndex = null;
  modalAction = null;
  selectedPlotIndex = null;
  document.getElementById('sell-modal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sell-confirm').onclick = () => {
    if (sellIndex !== null && storage[sellIndex].count > 0) {
      // Set sell prices for shop items
      let sellPrice = 5;
      if (storage[sellIndex].name === 'Flower Seed') sellPrice = 10;
      if (storage[sellIndex].name === 'Fertilizer') sellPrice = 5;
      // Sell harvested flowers for 15 coins
      if (
        storage[sellIndex].name === 'Sunflower' ||
        storage[sellIndex].name === 'Rose' ||
        storage[sellIndex].name === 'Daisy' ||
        storage[sellIndex].name === 'Tulip' ||
        storage[sellIndex].name === 'Lily' ||
        storage[sellIndex].name === 'Peony'
      ) {
        sellPrice = 15;
      }
      storage[sellIndex].count--;
      coins += sellPrice;
      updateCoinUI();
      updateStorageUI();
      closeSellModal();
      alert(`Item sold! +${sellPrice} coins`);
    } else {
      alert('No items to sell!');
      closeSellModal();
    }
  };
  document.getElementById('sell-cancel').onclick = closeSellModal;
});

// Show a picker to select a plot to plant a seed
function showPlantPlotPicker(seedName) {
  // Show a simple prompt for beginners
  let emptyPlots = gardenPlots.map((plot, idx) => plot.stage === 0 ? idx : null).filter(idx => idx !== null);
  if (emptyPlots.length === 0) {
    alert('No empty plots to plant a seed!');
    closeSellModal();
    return;
  }
  let plotNum = prompt(`Enter plot number to plant seed (1-${gardenPlots.length}). Empty plots: ${emptyPlots.map(i => i+1).join(', ')}`);
  let plotIdx = parseInt(plotNum) - 1;
  if (emptyPlots.includes(plotIdx)) {
    // Plant the correct seed type
    let flowerType = FLOWER_TYPES.findIndex(f => f.seed === seedName);
    if (flowerType === -1) {
      alert('Invalid seed type!');
      closeSellModal();
      return;
    }
    gardenPlots[plotIdx].stage = 1;
    gardenPlots[plotIdx].lastUpdate = null; // Not growing yet
    gardenPlots[plotIdx].needsWater = true;
    gardenPlots[plotIdx].flowerType = flowerType;
    storage[sellIndex].count--;
    updateStorageUI();
    renderGarden();
    closeSellModal();
    alert(`Planted a ${FLOWER_TYPES[flowerType].name} seed in plot ${plotIdx+1}! Now water it to start growing!`);
  } else {
    alert('Invalid plot selected.');
    closeSellModal();
  }
}

// Show a picker to select a plot to use fertilizer
function showFertilizePlotPicker() {
  // Find all plots that can be fertilized (seeds or sprouts only)
  let fertilizable = gardenPlots.map((plot, idx) => (plot.stage > 0 && plot.stage < 3) ? idx : null).filter(idx => idx !== null);
  if (fertilizable.length === 0) {
    alert('No plants to fertilize! (Only seeds or sprouts can be fertilized)');
    closeSellModal();
    return;
  }
  // Ask the player which plot to fertilize
  let plotNum = prompt(`Enter plot number to fertilize (1-${gardenPlots.length}). Fertilizable plots: ${fertilizable.map(i => i+1).join(', ')}`);
  let plotIdx = parseInt(plotNum) - 1;
  if (fertilizable.includes(plotIdx)) {
    // Check if the plant needs water
    if (gardenPlots[plotIdx].needsWater) {
      // Fertilizer has no effect if the plant needs water
      alert('You must water this plant before using fertilizer! Fertilizer only skips the waiting time, not the watering requirement.');
      closeSellModal();
      return;
    }
    // Check if the plant is already ready to advance (should not happen, but just in case)
    if (gardenPlots[plotIdx].stage > 0 && gardenPlots[plotIdx].stage < 3 && !gardenPlots[plotIdx].needsWater) {
      // Fertilizer skips the timer: make the plant ready for watering immediately
      gardenPlots[plotIdx].lastUpdate = null; // Pause timer
      gardenPlots[plotIdx].needsWater = true; // Needs water to advance
      storage[sellIndex].count--;
      updateStorageUI();
      renderGarden();
      closeSellModal();
      alert(`Fertilizer used on plot ${plotIdx+1}! The plant is now ready to be watered to advance.`);
    } else {
      alert('Fertilizer cannot be used on this plot right now.');
      closeSellModal();
    }
  } else {
    alert('Invalid plot selected.');
    closeSellModal();
  }
}

// Buy an item from the shop and update storage and shopStock
function buyItem(item) {
  // Find storage item by name (case-insensitive)
  const idx = storage.findIndex(s => s.name.toLowerCase().replace(/\s/g,'') === item.toLowerCase().replace(/\s/g,''));
  if (idx !== -1 && storage[idx].price && shopStock[item] && shopStock[item] > 0) {
    const price = storage[idx].price;
    if (coins >= price) {
      coins -= price;
      storage[idx].count++;
      shopStock[item]--;
      updateCoinUI();
      updateStorageUI();
      renderShop();
      alert(`You bought a ${storage[idx].name} for ${price} coins!`);
    } else {
      alert(`Not enough coins! ${storage[idx].name} costs ${price} coins.`);
    }
  } else if (shopStock[item] === 0) {
    alert('This item is out of stock! Wait for the shop to restock.');
  } else {
    alert("Item not found or not for sale!");
  }
}
// Render the shop grid with empty slots for purchased items
function renderShop() {
  const shopGrid = document.querySelector('.shop-grid');
  if (!shopGrid) return;
  shopGrid.innerHTML = '';
  // Shop items: 1 of each seed, plus fertilizer
  const shopItems = [
    // Use correct emoji for each seed
    { name: 'Sunflower Seed', icon: '🌻', price: 10, max: 1 },
    { name: 'Rose Seed', icon: '🌹', price: 10, max: 1 },
    { name: 'Daisy Seed', icon: '🌼', price: 10, max: 1 },
    { name: 'Tulip Seed', icon: '🌷', price: 10, max: 1 },
    { name: 'Fertilizer', icon: '🪴', price: 5, max: 5 }
  ];
  // For each shop item, show the correct number of buyable and sold out slots
  shopItems.forEach(function(item) {
    for (let i = 0; i < item.max; i++) {
      const div = document.createElement('div');
      div.className = 'shop-item';
      // If this slot is still available (less slots sold than stock)
      if (i < shopStock[item.name]) {
        div.innerHTML = `<button onclick="buyItem('${item.name}')">${item.icon}</button><div class="shop-title">${item.name}<br><span style='color:#159A48;font-size:0.95rem;'>${item.price} coins</span></div>`;
      } else {
        div.innerHTML = `<button disabled style="background:#eee;">&nbsp;</button><div class="shop-title" style="color:#bbb;">(Sold Out)</div>`;
      }
      shopGrid.appendChild(div);
    }
  });
  // Add placeholders for future items to fill a 3x3 grid (9 total)
  let total = shopItems.reduce((sum, item) => sum + item.max, 0);
  for (let i = total; i < 9; i++) {
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `<button disabled>🌻</button><div class="shop-title">Coming Soon</div>`;
    shopGrid.appendChild(div);
  }
}

// Shop reset every 5 hours
function resetShop() {
  shopStock = {
    'Sunflower Seed': 1,
    'Rose Seed': 1,
    'Daisy Seed': 1,
    'Tulip Seed': 1,
    'Fertilizer': 5
  };
  nextShopReset = Date.now() + SHOP_RESET_INTERVAL;
  renderShop();
}
setInterval(resetShop, SHOP_RESET_INTERVAL);

// Countdown timer for shop restock
function updateShopCountdown() {
  const timerDiv = document.getElementById('shop-restock-timer');
  if (!timerDiv) return;
  const now = Date.now();
  let msLeft = nextShopReset - now;
  if (msLeft < 0) msLeft = 0;
  // Calculate hours, minutes, seconds
  const hours = Math.floor(msLeft / (1000 * 60 * 60));
  const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((msLeft % (1000 * 60)) / 1000);
  timerDiv.textContent = `Shop restocks in: ${hours}h ${minutes}m ${seconds}s`;
}
setInterval(updateShopCountdown, 1000);

// Also reset shop and start countdown on page load
resetShop();
updateShopCountdown();
// Update the coin balance in both the shop and the main balance section
function updateCoinUI() {
  // Update main balance
  const balanceCoins = document.getElementById('balance-coins');
  if (balanceCoins) {
    balanceCoins.textContent = coins;
  }
  // Update shop (if present)
  const shopCoins = document.getElementById('coins');
  if (shopCoins) {
    shopCoins.textContent = coins;
  }
}

function plantSeed(plotEl) {
  const seedIndex = inventory.findIndex(item => item.includes("flower"));
  if (seedIndex !== -1) {
    plotEl.textContent = '🌸';
    inventory.splice(seedIndex, 1);
    updateInventoryUI();
  } else {
    alert("You don’t have a flower seed!");
  }
}


// Trivia questions array (add more as needed)
const triviaQuestions = [
  {
    question: 'How many people in the world live without clean water?',
    options: [
      '703 million', // correct
      '4 billion',
      '3,000'
    ],
    correct: 0
  },
  {
    question: 'Which of the following is NOT a benefit of clean water access?',
    options: [
      'Children have more time for education',
      'Higher chance of diseases like Cholera', // correct
      'Improved food security and nutrition'
    ],
    correct: 1
  },
  {
    question: 'Which causes more people to die each year?',
    options: [
      'Diseases from dirty water', // correct
      'All forms of violence (including war)',
      'They cause about the same number of deaths'
    ],
    correct: 0
  },
  {
    question: 'On average, how many hours do women and girls around the world spend collecting water?',
    options: [
      '1,000',
      '200 million', // correct
      '1 million'
    ],
    correct: 1
  }
];

// Show a trivia modal for water collection
function answerTrivia() {
  // Pick a random question each time
  const trivia = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];

  // Create modal if not present
  let modal = document.getElementById('trivia-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'trivia-modal';
    modal.className = 'modal-bg';
    document.body.appendChild(modal);
  }

  // Helper to render the modal content
  function renderTriviaModal(message) {
    // message is optional, shown if wrong answer
    let msgHtml = message ? `<div style='color:#F5402C; font-weight:bold; margin-bottom:0.5rem;'>${message}</div>` : '';
    modal.innerHTML = `
      <div class="modal-box">
        <p style="font-size:1.1rem; font-weight:bold; color:#159A48;">${trivia.question}</p>
        <div style="margin:1rem 0; display:flex; flex-direction:column; gap:0.75rem;">
          <button id="trivia-opt-0" style="padding:0.5rem 1rem;">${trivia.options[0]}</button>
          <button id="trivia-opt-1" style="padding:0.5rem 1rem;">${trivia.options[1]}</button>
          <button id="trivia-opt-2" style="padding:0.5rem 1rem;">${trivia.options[2]}</button>
        </div>
        ${msgHtml}
        <button id="trivia-exit" style="background:#eee; color:#333; margin-top:1rem;">Exit</button>
      </div>
    `;
    // Add event listeners for answer buttons
    for (let i = 0; i < 3; i++) {
      document.getElementById(`trivia-opt-${i}`).onclick = function() {
        if (i === trivia.correct) {
          // Correct answer
          droplets += 5;
          // Use setTimeout to make sure the DOM is updated before accessing elements
          modal.innerHTML = `
            <div class="modal-box">
              <p style='color:#159A48; font-weight:bold;'>Correct! +5 water droplets 💧</p>
              <button id="trivia-close">OK</button>
            </div>
          `;
          setTimeout(() => {
            // Always check if the element exists before updating it
            const bal = document.getElementById('balance-droplets');
            if (bal) bal.textContent = droplets;
            const closeBtn = document.getElementById('trivia-close');
            if (closeBtn) {
              closeBtn.onclick = function() {
                modal.classList.add('hidden');
              };
            }
          }, 0); // 0ms delay to ensure DOM is ready
        } else {
          // Wrong answer, let them try again
          renderTriviaModal('Try again!');
        }
      };
    }
    // Exit button
    document.getElementById('trivia-exit').onclick = function() {
      modal.classList.add('hidden');
    };
  }

  // Show the modal
  modal.classList.remove('hidden');
  renderTriviaModal();
}


function solvePuzzle() {
  // Super simple drag-and-drop pipe puzzle for beginners
  // Only 2 slots to fill, and only 2 pieces to choose from (both are correct)

  // The correct solution: [straight (90°), elbow (90°)]
  const solution = [
    { type: 'straight', rotation: 90 },
    { type: 'elbow', rotation: 90 }
  ];

  // Only show the 2 correct pieces as draggable options
  const availablePieces = [
    { type: 'straight', rotation: 90 },
    { type: 'elbow', rotation: 90 }
  ];

  // Unicode for pipes
  const pipeChars = {
    'straight': ['│', '─', '│', '─'], // 0, 90, 180, 270
    'elbow': ['└', '┌', '┐', '┘']     // 0, 90, 180, 270
  };

  // The slots to fill (start empty)
  let slots = [null, null];

  // Create modal if not present
  let modal = document.getElementById('puzzle-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'puzzle-modal';
    modal.className = 'modal-bg';
    document.body.appendChild(modal);
  }

  // Helper to render the puzzle UI
  function renderPuzzle(message) {
    // Show a simple water source and flower target
    let msgHtml = message ? `<div style='color:#F5402C; font-weight:bold; margin-bottom:0.5rem;'>${message}</div>` : '';
    // Pipe legend for beginners
    let legendHtml = `<div style='display:flex; justify-content:center; gap:1.5rem; margin-bottom:0.5rem;'>
      <div style='font-size:1.3rem;'><span style='border:1.5px solid #8BD1CB; border-radius:0.4rem; padding:0.2rem 0.5rem; background:#e0f7fa;'>│</span><br><span style='font-size:0.9rem; color:#159A48;'>Straight</span></div>
      <div style='font-size:1.3rem;'><span style='border:1.5px solid #8BD1CB; border-radius:0.4rem; padding:0.2rem 0.5rem; background:#e0f7fa;'>┐</span><br><span style='font-size:0.9rem; color:#159A48;'>Elbow</span></div>
      <div style='font-size:1.3rem;'><span style='border:1.5px solid #8BD1CB; border-radius:0.4rem; padding:0.2rem 0.5rem; background:#e0f7fa;'>🖱️</span><br><span style='font-size:0.9rem; color:#159A48;'>Drag & drop</span></div>
    </div>`;

    // Puzzle row: water source, 2 slots, flower
    let puzzleHtml = `<div style="display:flex; align-items:center; gap:0.5rem; justify-content:center; margin-bottom:1.2rem;">
      <span style='font-size:2rem; margin-right:0.2rem;'>🚰</span>`;
    // Render slots
    for (let i = 0; i < 2; i++) {
      let slotContent = '';
      if (slots[i]) {
        // Show the pipe piece in the slot
        const rotIdx = slots[i].rotation / 90;
        slotContent = `<span style='font-size:2.5rem; pointer-events:none;'>${pipeChars[slots[i].type][rotIdx]}</span>`;
      } else {
        // Empty slot
        slotContent = `<span style='font-size:2.5rem; color:#bbb;'>⬜</span>`;
      }
      puzzleHtml += `<div class='pipe-slot' data-idx='${i}' style='width:3.5rem; height:3.5rem; border:2px dashed #8BD1CB; border-radius:0.7rem; background:#f8f8f8; display:flex; align-items:center; justify-content:center;' ondragover='event.preventDefault()'></div>`;
    }
    puzzleHtml += `<span style='font-size:2rem; margin-left:0.2rem;'>🌸</span></div>`;

    // Draggable pieces row
    let piecesHtml = `<div style='display:flex; justify-content:center; gap:0.7rem; margin-bottom:0.7rem;'>`;
    availablePieces.forEach((piece, i) => {
      // Only show pieces that are not already placed in a slot
      let isPlaced = slots.some(slot => slot && slot._pieceId === i);
      if (!isPlaced) {
        const rotIdx = piece.rotation / 90;
        piecesHtml += `<div class='draggable-piece' draggable='true' data-pieceid='${i}' style='font-size:2.5rem; width:3.5rem; height:3.5rem; border-radius:0.7rem; border:2px solid #8BD1CB; background:#e0f7fa; display:flex; align-items:center; justify-content:center; cursor:grab;'>${pipeChars[piece.type][rotIdx]}</div>`;
      }
    });
    piecesHtml += `</div>`;

    modal.innerHTML = `
      <div class="modal-box">
        <h4 style='color:#2E9DF7; margin-bottom:0.2rem;'>Pipe Puzzle</h4>
        <p style='margin-bottom:0.7rem; color:#159A48; font-size:1.05rem;'>Drag and drop the pipes to connect the water to the flower.<br><span style='font-size:1.1rem;'>Just fill both slots!</span></p>
        ${legendHtml}
        ${puzzleHtml}
        ${piecesHtml}
        ${msgHtml}
        <button id='puzzle-check' style='background:#159A48; color:#fff; margin-top:0.5rem;'>Check</button>
        <button id='puzzle-exit' style='background:#eee; color:#333; margin-top:0.5rem; margin-left:0.7rem;'>Exit</button>
      </div>
    `;

    // Add drag and drop event listeners for slots
    modal.querySelectorAll('.pipe-slot').forEach((slotDiv, idx) => {
      // Show the piece in the slot if present
      if (slots[idx]) {
        const rotIdx = slots[idx].rotation / 90;
        slotDiv.innerHTML = `<span style='font-size:2.5rem; pointer-events:none;'>${pipeChars[slots[idx].type][rotIdx]}</span>`;
        // Make the slot clickable to remove the piece
        slotDiv.style.cursor = 'pointer';
        slotDiv.title = 'Click to remove pipe';
        slotDiv.onclick = function() {
          slots[idx] = null;
          renderPuzzle();
        };
      } else {
        slotDiv.innerHTML = `<span style='font-size:2.5rem; color:#bbb;'>⬜</span>`;
        slotDiv.style.cursor = 'default';
        slotDiv.title = 'Drop a pipe here';
        slotDiv.onclick = null;
      }
      // Drag over
      slotDiv.ondragover = function(e) {
        e.preventDefault();
        slotDiv.style.background = '#e0f7fa';
      };
      slotDiv.ondragleave = function(e) {
        slotDiv.style.background = '#f8f8f8';
      };
      // Drop
      slotDiv.ondrop = function(e) {
        e.preventDefault();
        slotDiv.style.background = '#f8f8f8';
        const pieceId = parseInt(e.dataTransfer.getData('pieceid'));
        // Only allow drop if slot is empty
        if (!slots[idx]) {
          // Place a copy of the piece in the slot, with a _pieceId for tracking
          slots[idx] = { ...availablePieces[pieceId], _pieceId: pieceId };
          renderPuzzle();
        }
      };
    });

    // Add dragstart event listeners for pieces
    modal.querySelectorAll('.draggable-piece').forEach((pieceDiv) => {
      pieceDiv.ondragstart = function(e) {
        e.dataTransfer.setData('pieceid', pieceDiv.getAttribute('data-pieceid'));
      };
    });

    // Check button
    document.getElementById('puzzle-check').onclick = function() {
      // Only check if both slots are filled
      if (slots.every(slot => slot)) {
        // Check if the solution matches
        let correct = true;
        for (let i = 0; i < 2; i++) {
          if (!slots[i] || slots[i].type !== solution[i].type || slots[i].rotation !== solution[i].rotation) {
            correct = false;
            break;
          }
        }
        if (correct) {
          modal.innerHTML = `<div class='modal-box'><p style='color:#159A48; font-weight:bold;'>Puzzle solved! +10 water droplets 💧</p><button id='puzzle-close'>OK</button></div>`;
          droplets += 10;
          // Use setTimeout to make sure the DOM is updated before accessing elements
          setTimeout(() => {
            // Always check if the element exists before updating it
            const bal = document.getElementById('balance-droplets');
            if (bal) bal.textContent = droplets;
            const closeBtn = document.getElementById('puzzle-close');
            if (closeBtn) {
              closeBtn.onclick = function() {
                modal.classList.add('hidden');
              };
            }
          }, 0); // 0ms delay to ensure DOM is ready
        } else {
          renderPuzzle('Not quite right! Try again.');
        }
      } else {
        renderPuzzle('Fill both slots first!');
      }
    };
    // Exit button
    document.getElementById('puzzle-exit').onclick = function() {
      modal.classList.add('hidden');
    };
  }

  modal.classList.remove('hidden');
  renderPuzzle();
}


// Show a simple tap-to-clean well minigame
function cleanWell() {
  // Emojis to use for trash/bugs
  const trashEmojis = ['🪳', '🗑️', '🪰', '🦟'];
  // Randomly pick 3 or 4
  const count = Math.floor(Math.random() * 2) + 3; // 3 or 4
  // Shuffle and pick
  const shuffled = trashEmojis.sort(() => 0.5 - Math.random());
  const overlays = shuffled.slice(0, count);

  // Create modal if not present
  let modal = document.getElementById('well-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'well-modal';
    modal.className = 'modal-bg';
    document.body.appendChild(modal);
  }

  // Helper to render the well cleaning UI
  function renderWell(trashLeft) {
    // If all trash is gone, show success
    if (trashLeft.length === 0) {
      // Show success message and OK button
      modal.innerHTML = `<div class='modal-box'><p style='color:#159A48; font-weight:bold;'>Well cleaned! +15 water droplets 💧</p><button id='well-close'>OK</button></div>`;
      droplets += 15;
      // Use setTimeout to ensure DOM is updated before accessing elements
      setTimeout(() => {
        // Update water droplet counts safely
        const bal = document.getElementById('balance-droplets');
        if (bal) bal.textContent = droplets;
        const closeBtn = document.getElementById('well-close');
        if (closeBtn) {
          closeBtn.onclick = function() {
            modal.classList.add('hidden');
          };
        }
      }, 0);
      return;
    }

    // Show the well image and overlay trash/bugs
    // We'll use absolute positioning inside a relative container
    let wellHtml = `<div style='position:relative; display:inline-block; width:220px; height:220px; background:#e0f7fa; border-radius:1rem; box-shadow:0 2px 12px #2E9DF733;'>`;
    wellHtml += `<img src='img/well.png' alt='Well' style='width:220px; height:220px; border-radius:1rem; display:block;'>`;

    // Place each trash emoji at a random position
    trashLeft.forEach((emoji, i) => {
      // Random positions (fixed for each render)
      // We'll use a seeded random for repeatability
      const angle = (i * 360 / trashLeft.length) + (i * 37) % 60;
      const radius = 60 + (i % 2) * 30;
      const rad = angle * Math.PI / 180;
      const x = 90 + Math.round(Math.cos(rad) * radius);
      const y = 90 + Math.round(Math.sin(rad) * radius);
      wellHtml += `<span class='well-trash' data-idx='${i}' style='position:absolute; left:${x}px; top:${y}px; font-size:2.2rem; cursor:pointer; user-select:none; z-index:2;'>${emoji}</span>`;
    });
    wellHtml += `</div>`;

    modal.innerHTML = `
      <div class='modal-box'>
        <h4 style='color:#2E9DF7; margin-bottom:0.2rem;'>Clean the Well</h4>
        <p style='margin-bottom:0.7rem; color:#159A48; font-size:1.05rem;'>Tap all the trash and bugs to clean the well!</p>
        ${wellHtml}
        <button id='well-exit' style='background:#eee; color:#333; margin-top:1rem;'>Exit</button>
      </div>
    `;

    // Add click handlers to each trash emoji
    modal.querySelectorAll('.well-trash').forEach((el, idx) => {
      el.onclick = function() {
        // Remove this emoji and re-render
        const newTrash = trashLeft.slice();
        newTrash.splice(idx, 1);
        renderWell(newTrash);
      };
    });
    // Exit button
    document.getElementById('well-exit').onclick = function() {
      modal.classList.add('hidden');
    };
  }

  modal.classList.remove('hidden');
  renderWell(overlays);
}

// Water plants: prompt player to pick a plot that needs water
function waterPlants() {
  // Find all plots that need water and are not at stage 3
  let waterable = gardenPlots.map((plot, idx) => (plot.needsWater && plot.stage > 0 && plot.stage < 3) ? idx : null).filter(idx => idx !== null);
  if (waterable.length === 0) {
    alert('No plants need water right now!');
    return;
  }
  // Show a prompt to pick a plot
  let msg = `Which plot do you want to water? (1-${gardenPlots.length})\nPlots needing water: ${waterable.map(i => i+1).join(', ')}\n(5 droplets required)`;
  let plotNum = prompt(msg);
  let plotIdx = parseInt(plotNum) - 1;
  if (waterable.includes(plotIdx)) {
    if (droplets < 5) {
      alert('Not enough water droplets! You need 5.');
      return;
    }
    // Water the plot
    droplets -= 5;
    document.getElementById('droplets').textContent = droplets;
    const bal = document.getElementById('balance-droplets');
    if (bal) bal.textContent = droplets;
    // If just planted (stage 1, lastUpdate null), start timer
    if (gardenPlots[plotIdx].stage === 1 && gardenPlots[plotIdx].lastUpdate === null) {
      gardenPlots[plotIdx].lastUpdate = Date.now();
      gardenPlots[plotIdx].needsWater = false;
      renderGarden();
      alert(`You watered plot ${plotIdx+1}! It will start growing.`);
    } else if (gardenPlots[plotIdx].stage > 0 && gardenPlots[plotIdx].stage < 3 && gardenPlots[plotIdx].needsWater) {
      // Allow to advance to next stage after timer
      gardenPlots[plotIdx].lastUpdate = Date.now();
      gardenPlots[plotIdx].needsWater = false;
      renderGarden();
      alert(`You watered plot ${plotIdx+1}! It will continue growing.`);
    }
  } else {
    alert('Invalid plot selected or does not need water.');
  }
}

// Initialize the game UI
showScreen('garden');
updateStorageUI();
updateCoinUI();
// Update the water droplet balance in the correct element
const dropletEl = document.getElementById('balance-droplets');
if (dropletEl) dropletEl.textContent = droplets;
renderGarden();

// For testing: you can call plantSeedInGarden() in the console to plant a seed
// Example: plantSeedInGarden();
