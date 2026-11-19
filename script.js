// StayEase Hotel Booking Management System
// Data is stored in the browser using LocalStorage.

const STORAGE_KEYS = {
  rooms: "stayease_rooms",
  bookings: "stayease_bookings"
};

let rooms = [];
let bookings = [];

// ---------- Data storage ----------
function loadData() {
  const savedRooms = localStorage.getItem(STORAGE_KEYS.rooms);
  const savedBookings = localStorage.getItem(STORAGE_KEYS.bookings);

  // Add sample rooms only the first time the project is opened.
  rooms = savedRooms ? JSON.parse(savedRooms) : [
    { number: "101", type: "Single", price: 1500, status: "Available" },
    { number: "102", type: "Double", price: 2200, status: "Available" },
    { number: "201", type: "Deluxe", price: 3500, status: "Available" },
    { number: "202", type: "Suite", price: 5000, status: "Available" }
  ];
  bookings = savedBookings ? JSON.parse(savedBookings) : [];
  saveData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(rooms));
  localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
}

// ---------- Small helper functions ----------
function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  }).format(amount);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function showMessage(message, type = "success") {
  const area = document.getElementById("message-area");
  const item = document.createElement("div");
  item.className = `message ${type}`;
  item.textContent = message;
  area.appendChild(item);
  setTimeout(() => item.remove(), 3200);
}

function createBookingId() {
  return "BK" + Date.now().toString().slice(-8);
}

function getRoom(roomNumber) {
  return rooms.find(room => room.number === roomNumber);
}

function getNights(checkIn, checkOut) {
  const start = new Date(checkIn + "T00:00:00");
  const end = new Date(checkOut + "T00:00:00");
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

// ---------- Navigation ----------
function showPage(pageName) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  document.getElementById(`${pageName}-page`).classList.add("active");

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });

  const titles = { dashboard: "Dashboard", rooms: "Room Management", bookings: "Bookings" };
  document.getElementById("page-title").textContent = titles[pageName];
  renderAll();
}

document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});
document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.go));
});

// ---------- Dialog controls ----------
function openModal(id) {
  document.getElementById(id).hidden = false;
}
function closeModal(id) {
  document.getElementById(id).hidden = true;
}
document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => closeModal(button.dataset.close));
});
document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeModal(backdrop.id);
  });
});

// ---------- Room management ----------
function openRoomForm(roomNumber = "") {
  const form = document.getElementById("room-form");
  form.reset();
  document.getElementById("edit-room-original").value = roomNumber;
  document.getElementById("room-modal-title").textContent = roomNumber ? "Edit room" : "Add a room";
  document.getElementById("room-number").disabled = false;

  if (roomNumber) {
    const room = getRoom(roomNumber);
    document.getElementById("room-number").value = room.number;
    // Keep a booked room's number fixed so its existing booking stays linked.
    document.getElementById("room-number").disabled = room.status === "Booked";
    document.getElementById("room-type").value = room.type;
    document.getElementById("room-price").value = room.price;
  }
  openModal("room-modal");
}

document.getElementById("add-room-button").addEventListener("click", () => openRoomForm());
document.getElementById("dashboard-add-room").addEventListener("click", () => {
  showPage("rooms");
  openRoomForm();
});

document.getElementById("room-form").addEventListener("submit", event => {
  event.preventDefault();
  const originalNumber = document.getElementById("edit-room-original").value;
  const number = document.getElementById("room-number").value.trim();
  const type = document.getElementById("room-type").value;
  const price = Number(document.getElementById("room-price").value);

  if (!number || !type || !Number.isFinite(price) || price <= 0) {
    showMessage("Enter a valid room number, type and price.", "error");
    return;
  }

  const duplicate = rooms.some(room =>
    room.number.toLowerCase() === number.toLowerCase() && room.number !== originalNumber
  );
  if (duplicate) {
    showMessage("That room number already exists.", "error");
    return;
  }

  if (originalNumber) {
    const room = getRoom(originalNumber);
    room.number = number;
    room.type = type;
    room.price = price;
  } else {
    rooms.push({ number, type, price, status: "Available" });
  }

  document.getElementById("room-number").disabled = false;
  saveData();
  closeModal("room-modal");
  renderAll();
  showMessage(originalNumber ? "Room updated successfully." : "Room added successfully.");
});

function deleteRoom(roomNumber) {
  const room = getRoom(roomNumber);
  if (room.status === "Booked") {
    showMessage("Cancel the room's booking before deleting it.", "error");
    return;
  }
  if (!confirm(`Delete room ${roomNumber}?`)) return;
  rooms = rooms.filter(item => item.number !== roomNumber);
  saveData();
  renderAll();
  showMessage("Room deleted.");
}

function renderRooms() {
  const grid = document.getElementById("rooms-grid");
  const filter = document.getElementById("room-filter").value;
  const visibleRooms = rooms.filter(room => filter === "all" || room.status === filter);
  document.getElementById("room-count-label").textContent = `${visibleRooms.length} room(s) shown`;

  if (visibleRooms.length === 0) {
    grid.innerHTML = '<div class="empty-state">No rooms found. Add a room to get started.</div>';
    return;
  }

  grid.innerHTML = visibleRooms.map(room => `
    <article class="room-card">
      <div class="room-card-top">
        <div><div class="room-number">Room ${escapeHTML(room.number)}</div><div class="room-type">${escapeHTML(room.type)} room</div></div>
        <span class="status ${room.status.toLowerCase()}">${room.status}</span>
      </div>
      <div class="room-price">${formatMoney(room.price)} <small>/ night</small></div>
      <div class="room-card-bottom">
        <div class="room-actions">
          <button class="small-button" data-edit-room="${escapeHTML(room.number)}">Edit</button>
          <button class="small-button danger" data-delete-room="${escapeHTML(room.number)}">Delete</button>
        </div>
        ${room.status === "Available"
          ? `<button class="small-button book" data-book-room="${escapeHTML(room.number)}">Book now</button>`
          : '<span class="status booked">Not available</span>'}
      </div>
    </article>
  `).join("");

  grid.querySelectorAll("[data-edit-room]").forEach(button =>
    button.addEventListener("click", () => openRoomForm(button.dataset.editRoom))
  );
  grid.querySelectorAll("[data-delete-room]").forEach(button =>
    button.addEventListener("click", () => deleteRoom(button.dataset.deleteRoom))
  );
  grid.querySelectorAll("[data-book-room]").forEach(button =>
    button.addEventListener("click", () => openBookingForm(button.dataset.bookRoom))
  );
}

document.getElementById("room-filter").addEventListener("change", renderRooms);

// ---------- Booking creation ----------
function populateRoomOptions(selectedRoom = "") {
  const select = document.getElementById("booking-room");
  const availableRooms = rooms.filter(room =>
    room.status === "Available" || room.number === selectedRoom
  );
  select.innerHTML = '<option value="">Select available room</option>' +
    availableRooms.map(room =>
      `<option value="${escapeHTML(room.number)}">${escapeHTML(room.number)} — ${escapeHTML(room.type)} (${formatMoney(room.price)}/night)</option>`
    ).join("");
  if (selectedRoom) select.value = selectedRoom;
}

function openBookingForm(roomNumber = "") {
  if (rooms.filter(room => room.status === "Available").length === 0 && !roomNumber) {
    showMessage("There are no available rooms to book.", "error");
    return;
  }
  document.getElementById("booking-form").reset();
  document.getElementById("guest-count").value = 1;
  populateRoomOptions(roomNumber);
  document.getElementById("night-count").textContent = "—";
  document.getElementById("night-price").textContent = "—";
  document.getElementById("booking-total").textContent = "—";
  openModal("booking-modal");
}

document.getElementById("new-booking-button").addEventListener("click", () => openBookingForm());

function updatePricePreview() {
  const room = getRoom(document.getElementById("booking-room").value);
  const checkIn = document.getElementById("check-in").value;
  const checkOut = document.getElementById("check-out").value;
  const nights = checkIn && checkOut ? getNights(checkIn, checkOut) : 0;

  document.getElementById("night-count").textContent = nights > 0 ? nights : "—";
  document.getElementById("night-price").textContent = room ? formatMoney(room.price) : "—";
  document.getElementById("booking-total").textContent =
    room && nights > 0 ? formatMoney(room.price * nights) : "—";
}

["booking-room", "check-in", "check-out"].forEach(id => {
  document.getElementById(id).addEventListener("change", updatePricePreview);
});

document.getElementById("booking-form").addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("customer-name").value.trim();
  const phone = document.getElementById("customer-phone").value.trim();
  const email = document.getElementById("customer-email").value.trim();
  const roomNumber = document.getElementById("booking-room").value;
  const checkIn = document.getElementById("check-in").value;
  const checkOut = document.getElementById("check-out").value;
  const guests = Number(document.getElementById("guest-count").value);
  const room = getRoom(roomNumber);

  if (!name || !phone || !email || !roomNumber || !checkIn || !checkOut) {
    showMessage("Please fill in all required fields.", "error");
    return;
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    showMessage("Enter a valid 10-digit Indian mobile number.", "error");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMessage("Enter a valid email address.", "error");
    return;
  }
  if (!room || room.status !== "Available") {
    showMessage("This room is not available. Please select another room.", "error");
    return;
  }
  if (getNights(checkIn, checkOut) <= 0) {
    showMessage("Check-out date must be after check-in date.", "error");
    return;
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
    showMessage("Enter a guest count between 1 and 20.", "error");
    return;
  }

  const nights = getNights(checkIn, checkOut);
  const total = room.price * nights;
  const booking = {
    id: createBookingId(), customerName: name, phone, email,
    roomNumber, checkIn, checkOut, guests, nights, total,
    status: "Confirmed", createdAt: new Date().toISOString()
  };

  bookings.unshift(booking);
  room.status = "Booked";
  saveData();
  closeModal("booking-modal");
  renderAll();
  showMessage(`Booking confirmed. Booking ID: ${booking.id}`);
});

// ---------- Booking management ----------
function renderBookings() {
  const body = document.getElementById("bookings-body");
  const query = document.getElementById("booking-search").value.trim().toLowerCase();
  const filtered = bookings.filter(booking =>
    booking.customerName.toLowerCase().includes(query) ||
    booking.id.toLowerCase().includes(query)
  );
  document.getElementById("booking-count-label").textContent = `${filtered.length} reservation(s) shown`;

  if (filtered.length === 0) {
    body.innerHTML = '<tr><td colspan="8" class="empty-row">No bookings found.</td></tr>';
    return;
  }

  body.innerHTML = filtered.map(booking => `
    <tr>
      <td><strong>${escapeHTML(booking.id)}</strong></td>
      <td>${escapeHTML(booking.customerName)}</td>
      <td>${escapeHTML(booking.roomNumber)}</td>
      <td>${escapeHTML(booking.checkIn)} → ${escapeHTML(booking.checkOut)}</td>
      <td>${booking.guests}</td>
      <td><strong>${formatMoney(booking.total)}</strong></td>
      <td><span class="status ${booking.status.toLowerCase()}">${booking.status}</span></td>
      <td>
        <button class="small-button" data-view-booking="${escapeHTML(booking.id)}">View</button>
        ${booking.status === "Confirmed" ? `<button class="small-button danger" data-cancel-booking="${escapeHTML(booking.id)}">Cancel</button>` : ""}
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-view-booking]").forEach(button =>
    button.addEventListener("click", () => viewBooking(button.dataset.viewBooking))
  );
  body.querySelectorAll("[data-cancel-booking]").forEach(button =>
    button.addEventListener("click", () => cancelBooking(button.dataset.cancelBooking))
  );
}

document.getElementById("booking-search").addEventListener("input", renderBookings);

function viewBooking(bookingId) {
  const booking = bookings.find(item => item.id === bookingId);
  if (!booking) return;
  const details = [
    ["Booking ID", booking.id], ["Customer", booking.customerName],
    ["Phone", booking.phone], ["Email", booking.email],
    ["Room number", booking.roomNumber], ["Guests", booking.guests],
    ["Check-in", booking.checkIn], ["Check-out", booking.checkOut],
    ["Number of nights", booking.nights], ["Total amount", formatMoney(booking.total)],
    ["Booking status", booking.status]
  ];
  document.getElementById("booking-details-content").innerHTML = details.map(([label, value]) =>
    `<div class="detail-item"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`
  ).join("");
  openModal("details-modal");
}

function cancelBooking(bookingId) {
  const booking = bookings.find(item => item.id === bookingId);
  if (!booking || booking.status !== "Confirmed") return;
  if (!confirm(`Cancel booking ${bookingId}?`)) return;

  booking.status = "Cancelled";
  const room = getRoom(booking.roomNumber);
  if (room) room.status = "Available";

  saveData();
  renderAll();
  showMessage("Booking cancelled. The room is available again.");
}

// ---------- Dashboard and page rendering ----------
function renderDashboard() {
  const available = rooms.filter(room => room.status === "Available").length;
  const booked = rooms.filter(room => room.status === "Booked").length;
  const confirmedBookings = bookings.filter(booking => booking.status === "Confirmed");
  const revenue = confirmedBookings.reduce((sum, booking) => sum + booking.total, 0);

  document.getElementById("total-rooms").textContent = rooms.length;
  document.getElementById("available-rooms").textContent = available;
  document.getElementById("booked-rooms").textContent = booked;
  document.getElementById("total-bookings").textContent = bookings.length;
  document.getElementById("total-revenue").textContent = formatMoney(revenue);

  const recentBody = document.getElementById("recent-bookings-body");
  if (confirmedBookings.length === 0) {
    recentBody.innerHTML = '<tr><td colspan="6" class="empty-row">No confirmed bookings yet.</td></tr>';
    return;
  }
  recentBody.innerHTML = confirmedBookings.slice(0, 5).map(booking => `
    <tr>
      <td><strong>${escapeHTML(booking.id)}</strong></td>
      <td>${escapeHTML(booking.customerName)}</td>
      <td>${escapeHTML(booking.roomNumber)}</td>
      <td>${escapeHTML(booking.checkIn)}</td>
      <td><strong>${formatMoney(booking.total)}</strong></td>
      <td><span class="status confirmed">Confirmed</span></td>
    </tr>
  `).join("");
}

function renderAll() {
  renderDashboard();
  renderRooms();
  renderBookings();
}

// ---------- Start the application ----------
loadData();
renderAll();
