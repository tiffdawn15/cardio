const express = require("express");
const db = require("../db/db");
// const roverController = require("../controllers/rover")
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
app.get("/:id", async (req, res, next) => {
  const result = await db.query("SELECT * FROM card WHERE id = $1", [
    req.params.id,
  ]);
  res.send(result.rows[0]);
});

app.get("/hello", async (req, res, next) => {
  console.log("hello");
});

app.post('/card', async (req, res) => {
    const { title, description, } = req.body;
    try {
      const post = await prisma.post.create({
        data: {
          title,
          content,
          published: published || false,
          author: { connect: { id: authorId } }
        }
      });
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = cardRouter;
