const express = require("express");
const { 
  createTables, 
  createUser, 
  createProduct, 
  fetchUsers, 
  fetchProducts, 
  createFavorite, 
  fetchFavorites, 
  destroyFavorite,
  client 
} = require("./db");
const app = express();

app.use(express.json());
app.use(require("morgan")("dev"));

const init = async () => {
  await client.connect();
  await createTables();
  console.log("Tables created");

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
};

// Routes
// GET all users
app.get("/api/users", async (req, res) => {
  const users = await fetchUsers();
  res.status(200).json(users);
});

// GET all products
app.get("/api/products", async (req, res) => {
  const products = await fetchProducts();
  res.status(200).json(products);
});

// GET favorites for a specific user
app.get("/api/users/:id/favorites", async (req, res) => {
  const { id } = req.params;
  const favorites = await fetchFavorites(id);
  res.status(200).json(favorites);
});

// POST a new favorite for a user
app.post("/api/users/:id/favorites", async (req, res) => {
  const { id } = req.params;
  const { product_id } = req.body;
  const newFavorite = await createFavorite({ user_id: id, product_id });
  res.status(201).json(newFavorite);
});

// DELETE a favorite for a user
app.delete("/api/users/:userId/favorites/:id", async (req, res) => {
  const { userId, id } = req.params;
  await destroyFavorite({ user_id: userId, id });
  res.status(204).send();
});

init();
