const express = require("express");
const db = require("../db/db");
// const roverController = require("../controllers/rover")
const prisma = require("../db/prisma");
const app = express();

cardRouter = express.Router(); // Create the router instance

cardRouter.get("/hello", async (req, res, next) => {
  console.log("hello");
  res.send("Hello, world!");
});

cardRouter.post('/card', async (req, res) => {
  const { title, description, published, authorId } = req.body;
  try {
    const post = await prisma.post.create({
      data: {
        title,
        content: description, // Assuming "description" maps to "content"
        published: published || false,
        author: { connect: { id: authorId } }
      }
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = cardRouter; // Export the router
