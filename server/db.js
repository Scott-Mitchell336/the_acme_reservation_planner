//
// db.js
// Created by Scott Mitchell on 04/26/2025
// Block 34 - The Acme reservation Planner
//
// This file contains the database connection and CRUD operations for the Acme reservation planner.
// It uses the pg library to connect to a PostgreSQL database and perform SQL queries.
//

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
// This function creates the necessary tables in the PostgreSQL database.
// It creates the customer, restaurant, and reservation tables.
// The customer and restaurant tables have a one-to-many relationship with the reservation table.
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
// This function creates a new customer in the database.
// It takes the customer name as a parameter and returns the created customer object.
// The function uses a SQL query to insert the customer name into the customer table.
// The customer ID is automatically generated using the uuid extension.
// The function returns the created customer object, which includes the ID and name of the customer.
const createCustomer = async ({ name }) => {
  const SQL = "INSERT INTO customer(name) VALUES($1) RETURNING *";
  const response = await client.query(SQL, [name]);
  return response.rows[0];
};

// Create restaurant
// This function creates a new restaurant in the database.
// It takes the restaurant name as a parameter and returns the created restaurant object.
// The function uses a SQL query to insert the restaurant name into the restaurant table.
// The restaurant ID is automatically generated using the uuid extension.
// The function returns the created restaurant object, which includes the ID and name of the restaurant.
const createRestaurant = async ({ name }) => {
  const SQL = "INSERT INTO restaurant(name) VALUES($1) RETURNING *";
  const response = await client.query(SQL, [name]);
  return response.rows[0];
};

// Fetch all customers
// This function retrieves all customers from the database.
// It executes a SQL query to select all rows from the customer table.
// The function returns an array of customer objects.
// Each customer object contains the id and name of the customer.
const fetchCustomers = async () => {
  const SQL = "SELECT * FROM customer";
  const response = await client.query(SQL);
  return response.rows;
};

// Fetch all restaurants
// This function retrieves all restaurants from the database.
// It executes a SQL query to select all rows from the restaurant table.
// The function returns an array of restaurant objects.
// Each restaurant object contains the id and name of the restaurant.
const fetchRestaurants = async () => {
  const SQL = "SELECT * FROM restaurant";
  const response = await client.query(SQL);
  return response.rows;
};

// Create reservation
// Create a reservation for a customer at a restaurant
// This function creates a reservation for a customer at a restaurant.
// It takes the customer ID, restaurant ID, party count, and date as parameters.
// If the date is not provided, it defaults to the current date and time.
// The function returns the created reservation object.
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

// Fetch reservations
// Fetch all reservations with customer and restaurant details
// This function retrieves all reservations along with customer and restaurant details
// and orders them by date in descending order.
const fetchReservations = async () => {
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
  return response.rows;
};

// Destroy reservation
// This function deletes a reservation from the database.
// It takes the reservation ID and customer ID as parameters.
// The function executes a SQL query to delete the reservation from the reservation table.
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
