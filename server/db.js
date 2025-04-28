const pg = require("pg");

// Database client
const client = new pg.Client({
  user: "postgres",
  password: "123",
  host: "localhost",
  port: 5432,
  database: "reservation_planner",
});

// Create tables
const createTables = async () => {
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
     `);

    await client.query(`
      DROP TABLE IF EXISTS reservation;
      DROP TABLE IF EXISTS customer;
      DROP TABLE IF EXISTS restaurant;
    `);

    await client.query(`
      CREATE TABLE customer(
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL
      );
      `);

    await client.query(`
      CREATE TABLE restaurant(
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100)
      );
      `);

    await client.query(`
      CREATE TABLE reservation(
        id uuid DEFAULT uuid_generate_v4(),
        party_count INTEGER NOT NULL,
        restaurant_id uuid,
        customer_id uuid,
        PRIMARY KEY (restaurant_id, customer_id),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (restaurant_id) REFERENCES restaurant(id),
        FOREIGN KEY (customer_id) REFERENCES customer(id)
      );
    `);
    return "Tables created";
  } catch (error) {
    throw error;
  }
};

// Create customer
const createCustomer = async ({ name }) => {
  const SQL = "INSERT INTO customer(name) VALUES($1) RETURNING *";
  const response = await client.query(SQL, [name]);
  return response.rows[0];
};

// Create restaurant
const createRestaurant = async ({ name }) => {
  const SQL = "INSERT INTO restaurant(name) VALUES($1) RETURNING *";
  const response = await client.query(SQL, [name]);
  return response.rows[0];
};

// Fetch customers
const fetchCustomers = async () => {
  const SQL = "SELECT * FROM customer";
  const response = await client.query(SQL);
  return response.rows;
};

// Fetch restaurants
const fetchRestaurants = async () => {
  const SQL = "SELECT * FROM restaurant";
  const response = await client.query(SQL);
  return response.rows;
};

// Create reservation
const createReservation = async ({
  customer_id,
  restaurant_id,
  party_count,
  date,
}) => {
  const SQL = `
    INSERT INTO reservation(customer_id, restaurant_id, party_count, date)
    VALUES($1, $2, $3, $4)
    RETURNING *
  `;
  const response = await client.query(SQL, [
    customer_id,
    restaurant_id,
    party_count,
    date || new Date(),
  ]);
  return response.rows[0];
};

// Destroy reservation
const destroyReservation = async (id, customer_id) => {
  const SQL = `
    DELETE FROM reservation 
    WHERE id = $1 
    AND customer_id = $2 
    RETURNING *
  `;
  const response = await client.query(SQL, [id, customer_id]);
  if (response.rows.length === 0) {
    throw new Error(
      "Reservation not found or does not belong to this customer"
    );
  }
};

module.exports = {
  client,
  createTables,
  createCustomer,
  createRestaurant,
  fetchCustomers,
  fetchRestaurants,
  createReservation,
  destroyReservation,
};
