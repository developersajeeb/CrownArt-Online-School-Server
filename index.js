const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken')
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

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' })
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(403).send({ error: true, massage: 'unauthorized access' })
    }
    req.decoded = decoded;
    next()
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const classCollation = client.db('crownArt').collection('class');
    const userCollation = client.db('crownArt').collection('user');

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

    //Make admin role api
    app.patch('/user/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollation.updateOne(filter, updateDoc);
      res.send(result);
    })

    // Email query for admin
    app.get('/user/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await userCollation.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result)
    })

    //Make instructor role api
    app.patch('/user/instructor/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };
      const result = await userCollation.updateOne(filter, updateDoc);
      res.send(result);
    })

    // Email query for instructor
    app.get('/user/instructor/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ instructor: false })
      }

      const query = { email: email }
      const user = await userCollation.findOne(query);
      const result = { instructor: user?.role === 'instructor' }
      res.send(result)
    })

    // Get role specific data
    app.get('/user-type/:role', async (req, res) => {
      res.send(await userCollation.find({
        role: req.params.role
      })
        .toArray()
      )
    })

    // Get status specific Classes
    app.get('/approved-classes/:status', async (req, res) => {
      res.send(await classCollation.find({
        classStatus: req.params.status
      })
        .toArray()
      )
    })

    // Get single class
    app.get('/class/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classCollation.findOne(query);
      res.send(result)
    })

    // Update the class info
    app.put('/class/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedClass = req.body;
      const newClass = {
        $set: {
          className: updatedClass.className,
          classImg: updatedClass.classImg,
          availableSeats: updatedClass.availableSeats,
          price: updatedClass.price,
          description: updatedClass.description,
        }
      }
      const result = await classCollation.updateOne(filter, newClass, options);
      res.send(result)
    })

    // Get Some Data by per parson add classes data
    app.get('/my-classes', async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { instructorEmail: req.query.email }
      }
      const result = await classCollation.find(query).toArray();
      res.send(result)
    })

    //Make class approve api
    app.patch('/class/approve/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          classStatus: 'approve'
        },
      };
      const result = await classCollation.updateOne(filter, updateDoc);
      res.send(result);
    })

    //Make class deny api
    app.patch('/class/deny/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          classStatus: 'deny'
        },
      };
      const result = await classCollation.updateOne(filter, updateDoc);
      res.send(result);
    })

    // JWT
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '24h'
      });
      res.send({ token });
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