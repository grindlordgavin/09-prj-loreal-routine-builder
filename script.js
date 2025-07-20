/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Track selected products using their IDs */
let selectedProductIds = JSON.parse(localStorage.getItem("selectedProductIds")) || [];

/* Save selected products to localStorage */
function saveSelectedProducts() {
  localStorage.setItem("selectedProductIds", JSON.stringify(selectedProductIds));
}

/* Create HTML for displaying product cards, with selection state */
function displayProducts(products) {
  console.log("selectedProductIds: ", selectedProductIds);

  productsContainer.innerHTML = products
    .map(
      (product) => {
        const isSelected = selectedProductIds.includes(product.id);
        return `
      <div class="product-card${isSelected ? " selected" : ""}" data-product-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
          <button class="desc-modal-btn" data-product-id="${product.id}">Show Description</button>
        </div>
      </div>
    `;
      }
    )
    .join("");

  // Add click event listeners to product cards for selection
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      // Prevent toggling selection if clicking the description button
      if (e.target.classList.contains('desc-modal-btn')) return;
      const productId = parseInt(card.getAttribute("data-product-id"));
      card.classList.toggle('selected');
      // Toggle selection
      if (selectedProductIds.includes(productId)) {
        selectedProductIds = selectedProductIds.filter((id) => id !== productId);
      } else {
        selectedProductIds.push(productId);
      }
      saveSelectedProducts();
      // Re-render to update selection visuals
      // displayProducts(products);
      displaySelectedProductsList();
    });
  });

  // Add modal logic for description buttons
  const descBtns = document.querySelectorAll('.desc-modal-btn');
  descBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = parseInt(btn.getAttribute('data-product-id'));
      loadProducts().then((products) => {
        const product = products.find((p) => p.id === productId);
        if (product) openModal(product);
      });
    });
  });
}

/* Display selected products list inside the existing div#selectedProductsList */
function displaySelectedProductsList() {
  const selectedListDiv = document.getElementById("selectedProductsList");
  // Load all products to get names, images, and brands of selected ones
  loadProducts().then((products) => {
    if (selectedProductIds.length === 0) {
      selectedListDiv.innerHTML = '<p>No products selected.</p>';
      return;
    }
    selectedListDiv.innerHTML = selectedProductIds
      .map((id) => {
        const prod = products.find((p) => p.id === id);
        if (!prod) return "";
        return `
          <div class="selected-product-item" data-product-id="${prod.id}">
            <img src="${prod.image}" alt="${prod.name}" class="selected-product-img">
            <div class="selected-product-info">
              <div class="selected-product-name">${prod.name}</div>
              <div class="selected-product-brand">${prod.brand}</div>
            </div>
            <button class="remove-selected-product" title="Remove" aria-label="Remove ${prod.name}">&times;</button>
          </div>
        `;
      })
      .join("");

    // Add event listeners for remove buttons
    const removeBtns = selectedListDiv.querySelectorAll(".remove-selected-product");
    removeBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering card click

        const parent = btn.closest(".selected-product-item");
        const productId = parseInt(parent.getAttribute("data-product-id"));

        selectedProductIds = selectedProductIds.filter((id) => id !== productId);

        saveSelectedProducts();
        // displaySelectedProductsList();

        btn.parentElement.classList.add('removed');
        btn.parentElement.addEventListener('transitionend', e => {
          if (e.propertyName == "transform")
            btn.parentElement.remove()
        });

        // Also update product cards selection state if visible
        const visibleCards = document.querySelectorAll('.product-card');
        visibleCards.forEach(card => {
          if (parseInt(card.getAttribute('data-product-id')) === productId) {
            card.classList.remove('selected');
          }
        });
      });
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
  displaySelectedProductsList();
});

// On page load, show selected products list (if any)
document.addEventListener("DOMContentLoaded", () => {
  displaySelectedProductsList();
});

/* Modal logic for product description */
function createModal() {
  // Only create modal if it doesn't exist
  if (document.getElementById('descModal')) return;
  const modal = document.createElement('div');
  modal.id = 'descModal';
  modal.className = 'desc-modal';
  modal.innerHTML = `
    <div class="desc-modal-backdrop"></div>
    <div class="desc-modal-content" role="dialog" aria-modal="true" aria-labelledby="descModalTitle">
      <button class="desc-modal-close" aria-label="Close description">&times;</button>
      <h3 id="descModalTitle"></h3>
      <div class="desc-modal-brand"></div>
      <img class="desc-modal-img" alt="" />
      <div class="desc-modal-desc"></div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close modal on close button or backdrop click
  modal.querySelector('.desc-modal-close').onclick = closeModal;
  modal.querySelector('.desc-modal-backdrop').onclick = closeModal;
}

function openModal(product) {
  createModal();
  const modal = document.getElementById('descModal');
  modal.querySelector('#descModalTitle').textContent = product.name;
  modal.querySelector('.desc-modal-brand').textContent = product.brand;
  modal.querySelector('.desc-modal-img').src = product.image;
  modal.querySelector('.desc-modal-img').alt = product.name;
  modal.querySelector('.desc-modal-desc').textContent = product.description;
  modal.style.display = 'flex';
  // Trap focus for accessibility
  modal.querySelector('.desc-modal-close').focus();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('descModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Helper: Get selected product objects
async function getSelectedProducts() {
  const products = await loadProducts();
  return products.filter((p) => selectedProductIds.includes(p.id));
}

// Store chat history for follow-up questions
let chatHistory = [];
let lastRoutineProducts = [];

// Helper: Add a message to the chat window
function appendChatMessage(role, content) {
  // Replace markdown bold (**) with <strong>
  const htmlContent = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg chat-msg-${role}`;
  msgDiv.innerHTML = `<span class="chat-bubble chat-bubble-${role}">${htmlContent}</span>`;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Generate routine using OpenAI API via Cloudflare Worker
async function generateRoutineWithAI(selectedProducts) {
  const minimalProducts = selectedProducts.map(p => ({
    name: p.name,
    brand: p.brand,
    category: p.category,
    description: p.description
  }));

  // Always reset chat history for a new routine
  chatHistory = [
    {
      role: "system",
      content: "You are a helpful skincare and beauty advisor. Only answer questions about skincare, haircare, makeup, fragrance, and beauty products or routines. If a question is not about these topics, politely refuse to answer. Based on the user's selected products, generate a step-by-step routine. Be clear and concise."
    },
    {
      role: "user",
      content: `Here are the selected products as JSON: ${JSON.stringify(minimalProducts, null, 2)}. Please create a routine using these products. Include product names and brands in your answer.`
    }
  ];
  lastRoutineProducts = minimalProducts;

  chatWindow.innerHTML = "<em>Generating your routine...</em>";

  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages: chatHistory })
  });
  const data = await response.json();
  let routine = "Sorry, I couldn't generate a routine. Please try again.";
  if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
    routine = data.choices[0].message.content;
    chatHistory.push({ role: "assistant", content: routine });
  }
  chatWindow.innerHTML = "";
  appendChatMessage("assistant", routine);
}

// Hide chat form until routine is generated
chatForm.style.display = "none";

// Handle Generate Routine button click
const generateBtn = document.getElementById("generateRoutine");
generateBtn.addEventListener("click", async () => {
  chatWindow.innerHTML = "<em>Generating your routine...</em>";
  chatForm.style.display = "none";
  const selectedProducts = await getSelectedProducts();
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = "<em>Please select at least one product to generate a routine.</em>";
    return;
  }
  await generateRoutineWithAI(selectedProducts);
  chatForm.style.display = "flex";
});

// Chat form submission handler for follow-up questions
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = chatForm.userInput.value.trim();
  if (!userInput) return;
  appendChatMessage("user", userInput);
  chatForm.userInput.value = "";

  // Add user message to chat history
  chatHistory.push({ role: "user", content: userInput });

  // Only allow questions about the routine or beauty topics
  // (The system prompt already guides the assistant)
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: chatHistory })
  });
  const data = await response.json();
  let reply = "Sorry, I couldn't get a response. Please try again.";
  if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
    reply = data.choices[0].message.content;
    chatHistory.push({ role: "assistant", content: reply });
  }
  appendChatMessage("assistant", reply);
});
