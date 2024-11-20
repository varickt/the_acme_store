require("dotenv").config();
const { Client } = require("pg");
const client = new Client(process.env.DATABASE_URL || "postgres://localhost/the_acme_store_db");
const uuid = require("uuid");
const bcrypt = require("bcrypt");

const createTables = async () => {
  const SQL = `
    DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS products;

    CREATE TABLE users (
      id UUID PRIMARY KEY,
      username VARCHAR(20) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    );

    CREATE TABLE products (
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE
    );

    CREATE TABLE favorites (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id) NOT NULL,
      product_id UUID REFERENCES products(id) NOT NULL,
      CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
    );
  `;
  await client.query(SQL);
};

const createUser = async ({ username, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const SQL = `
    INSERT INTO users(id, username, password) 
    VALUES($1, $2, $3) RETURNING *;
  `;
  const response = await client.query(SQL, [uuid.v4(), username, hashedPassword]);
  return response.rows[0];
};

const createProduct = async ({ name }) => {
  const SQL = `
    INSERT INTO products(id, name) 
    VALUES($1, $2) RETURNING *;
  `;
  const response = await client.query(SQL, [uuid.v4(), name]);
  return response.rows[0];
};

const createFavorite = async ({ user_id, product_id }) => {
  const SQL = `
    INSERT INTO favorites(id, user_id, product_id)
    VALUES($1, $2, $3) RETURNING *;
  `;
  const response = await client.query(SQL, [uuid.v4(), user_id, product_id]);
  return response.rows[0];
};

// Sample data insertion functions
const seedData = async () => {
  // Create sample users
  const userJoe = await createUser({ username: "joe", password: "password123" });
  const userLucy = await createUser({ username: "lucy", password: "password123" });

  // Create sample products
  const productPizza = await createProduct({ name: "pizza" });
  const productPasta = await createProduct({ name: "pasta" });
  const productPie = await createProduct({ name: "pie" });

  // Assign favorites for users
  await createFavorite({ user_id: userJoe.id, product_id: productPizza.id });
  await createFavorite({ user_id: userJoe.id, product_id: productPasta.id });
  await createFavorite({ user_id: userLucy.id, product_id: productPie.id });

  console.log("Sample data seeded successfully");
};

const fetchUsers = async () => {
  const SQL = `
    SELECT id, username FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchProducts = async () => {
  const SQL = `
    SELECT id, name FROM products;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchFavorites = async (user_id) => {
  const SQL = `
    SELECT f.id, p.name AS product_name
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    WHERE f.user_id = $1;
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
};

const destroyFavorite = async ({ user_id, id }) => {
  const SQL = `
    DELETE FROM favorites
    WHERE user_id = $1 AND id = $2;
  `;
  await client.query(SQL, [user_id, id]);
};

module.exports = {
  client,
  createTables,
  createUser,
  createProduct,
  fetchUsers,
  fetchProducts,
  createFavorite,
  fetchFavorites,
  destroyFavorite,
  seedData
};
