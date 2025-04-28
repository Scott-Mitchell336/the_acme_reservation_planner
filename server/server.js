const express = require("express");
const {
  client,
  createTables,
  createCustomer,
  createRestaurant,
  fetchCustomers,
  fetchRestaurants,
  createReservation,
  destroyReservation,
} = require("./db");

const app = express();
app.use(express.json());

// Routes
// Get all customers
app.get("/api/customers", async (req, res) => {
  try {
    const customers = await fetchCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all restaurants
app.get("/api/restaurants", async (req, res) => {
  try {
    const restaurants = await fetchRestaurants();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reservations
app.get("/api/reservations", async (req, res) => {
  try {
    const SQL = `
      SELECT 
        reservation.id as reservation_id,
        reservation.party_count,
        reservation.date,
        customer.id as customer_id,
        customer.name as customer_name,
        restaurant.id as restaurant_id,
        restaurant.name as restaurant_name
      FROM reservation
      INNER JOIN customer ON reservation.customer_id = customer.id
      INNER JOIN restaurant ON reservation.restaurant_id = restaurant.id
      ORDER BY reservation.date DESC
    `;
    const response = await client.query(SQL);
    res.json(response.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create customer
app.post("/api/customers", async (req, res) => {
  try {
    const { name } = req.body;
    console.log("Creating customer with name:", name);
    const customer = await createCustomer({ name });
    console.log("Customer created:", customer);
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create restaurant
app.post("/api/restaurants", async (req, res) => {
  try {
    const { name } = req.body;
    const restaurant = await createRestaurant({ name });
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create reservation
app.post("/api/customers/:id/reservations", async (req, res) => {
  try {
    const customer_id = req.params.id;
    const { restaurant_id, date, party_count } = req.body;

    const reservation = await createReservation({
      customer_id,
      restaurant_id,
      party_count,
      date,
    });

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete reservation
app.delete("/api/customers/:customer_id/reservations/:id", async (req, res) => {
  try {
    const { customer_id, id } = req.params;
    await destroyReservation(id, customer_id);
    res.status(204).send();
  } catch (error) {
    if (
      error.message ===
      "Reservation not found or does not belong to this customer"
    ) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Init function to test all methods
const init = async () => {
  try {
    await client.connect();
    console.log("Connected to database");

    await createTables();
    console.log("Tables created");

    const customer = await createCustomer({ name: "John Doe" });
    console.log("Customer created:", customer);

    const restaurant = await createRestaurant({ name: "Fine Diner" });
    console.log("Restaurant created:", restaurant);

    const customers = await fetchCustomers();
    console.log("Fetched customers:", customers);

    const restaurants = await fetchRestaurants();
    console.log("Fetched restaurants:", restaurants);

    const reservation = await createReservation({
      customer_id: customer.id,
      restaurant_id: restaurant.id,
      party_count: 4,
    });
    console.log("Reservation created:", reservation);

    await destroyReservation(reservation.id);
    console.log("Reservation destroyed");
  } catch (error) {
    console.error(error);
  }
};

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  init();
});
