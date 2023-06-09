const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d9amltv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const classCollation = client.db('crownArt').collection('class');
    const userCollation = client.db('crownArt').collection('user');
    const adminCollation = client.db('crownArt').collection('admin');

    // Add Class
    app.post('/classes', async (req, res) => {
      const newClass = req.body;
      const result = await classCollation.insertOne(newClass);
      res.send(result)
    })

    // Get Class
    app.get('/classes', async (req, res) => {
      const cursor = await classCollation.find().toArray();
      res.send(cursor)
    })

    // Save User
    app.post('/users', async (req, res) => {
      const newUser = req.body;
      const query = { email: newUser.email }
      const existingUser = await userCollation.findOne(query);
      if (existingUser) {
        return res.send({ massage: 'user already exists' })
      }
      const result = await userCollation.insertOne(newUser);
      res.send(result)
    })

    // Get User
    app.get('/users', async (req, res) => {
      const cursor = await userCollation.find().toArray();
      res.send(cursor)
    })

    //Make roll api
    app.post('/user/admin', async(req, res) => {
      const admin = req.body;
      const result = await adminCollation.insertOne(admin);
      res.send(result)
    })

    //Get role api
    app.get('/user/admin', async(req, res) => {
      const email = req.query.email;
      const cursor = await adminCollation.findOne({email: email});
      res.send(cursor);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('CrownArt is running')
})

app.listen(port, () => {
  console.log(`CrownArt server is running: ${port}`);
})