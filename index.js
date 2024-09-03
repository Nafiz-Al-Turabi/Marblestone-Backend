const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());

const jwt = require('jsonwebtoken');
const jwtSecretKey = process.env.ACCESS_TOKEN;

function verifyToken(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json('Access denied');
  }

  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
}



// Mongo DB default code..
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f75tpn0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();


    const PropertyCollection = client.db('marblestone').collection('properties');
    const agentCollection = client.db('marblestone').collection('agents');
    const userCollection = client.db('marblestone').collection('users');
    const contactCollection = client.db('marblestone').collection('contacts');
    const blogCollection = client.db('marblestone').collection('blogs');
    // Add property
    app.post('/postproperty', async (req, res) => {
      const propertyData = req.body;
      try {
        const result = await PropertyCollection.insertOne(propertyData);
        res.send(result);
      } catch (error) {
        console.error('Error adding property:', error);
        res.status(500).json('Failed to add property. Please try again.');
      }
    });


    app.get('/properties', async (req, res) => {
      try {
        const result = await PropertyCollection.find().toArray();
        res.send(result)
      } catch (error) {
        res.status(500).json('Failed to get properties', error)
      }
    })
    // property details
    app.get('/properties/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await PropertyCollection.findOne(query);
        res.send(result)
      } catch (error) {
        res.status(500).json('Failed to get property details', error)
      }
    });

    app.post('/addagent', async (req, res) => {
      const agentData = req.body;
      try {
        const data = {
          ...agentData,
          role: 'agent'
        }
        const result = await agentCollection.insertOne(data);
        res.send(result)
      } catch (error) {
        res.status(500).json('Failed to add add agent. Please try again.', error);
      }
    });

    app.get('/agents', async (req, res) => {
      try {
        const result = await agentCollection.find().toArray();
        res.send(result)
      } catch (error) {
        res.status(500).json('Failed to get agents. Please try again.', error);
      }
    });

    app.get('/agents/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await agentCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).json('Failed to get agent details', error)
      }
    });

    // User added in database

    app.post('/users', async (req, res) => {
      const { email, name, photoURL } = req.body;
      try {
        const existingUser = await userCollection.findOne({ email });
        if (existingUser) {
          return res.status(409).json({ message: 'Email Already in use ' });
        }

        // if Does not
        const userData = {
          name,
          email,
          photoURL,
          role: 'user'
        }
        const result = await userCollection.insertOne(userData);
        res.status(201).json(result); // Use status 201 for successful creation
      } catch (error) {
        res.status(500).json('Failed to add user:', error)
      }
    });

    app.get('/users', async (req, res) => {
      try {
        const result = await userCollection.find().toArray();
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json('Failed to get user:', error)
      }
    });


    app.post('/contacts', async (req, res) => {
      const contactData = req.body;
      contactData.timestamp = new Date().toISOString();
      try {
        const result = await contactCollection.insertOne(contactData);
        res.status(200).json(result)
      } catch (error) {
        res.status(500).json('Failed to contact us:', error)
      }
    });

    app.get('/contacts', async (req, res) => {
      try {
        const result = await contactCollection.find().toArray();
        res.send(result)
      } catch (error) {
        console.error('contact fetch failed:', error)
      }
    });
    // Blog post #*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*#*##*#*#*#*#**#*#*#*#**#*#**##*#*
    app.get('/contacts/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const query = { _id: new ObjectId(id) };
        const result = await contactCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error('contact fetch failed:', error);
        res.status(500).send('Server error');
      }
    });



    app.delete('/contacts', async (req, res) => {
      const ids = req.body.ids;
      try {
        const deleteQuery = {
          _id: {
            $in: ids.map(id => new ObjectId(id))
          }
        };
        const result = await contactCollection.deleteMany(deleteQuery);
        res.send(result);
      } catch (error) {
        console.error('Contacts failed to delete:', error);
        res.status(500).send('Server error');
      }
    });

    app.post('/postblog', async (req, res) => {
      const blogData = req.body;
      try {
        const result = await blogCollection.insertOne(blogData);
        res.status(201).json(result)
      } catch (error) {
        res.status(500).json({ message: 'Failed to post blog', error })
      }
    });

    app.get('/blogs', async (req, res) => {
      try {
        const result = await blogCollection.find().toArray();
        res.send(result)
      } catch (error) {
        res.status(500), json({ message: 'Failed to fetch or Data not found' })
      }
    });

    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const query = { _id: new ObjectId(id) }
        const result = await blogCollection.findOne(query);
        res.send(result);
      } catch (error) {

      }
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

// Mongo DB default code..end


app.get('/', (req, res) => {
  res.send('MARBLESTONE SERVER IS RUNNING...')
})
app.listen(port, () => {
  console.log(`MARBLESTONE SERVER  RUNNING ON PORT:${port}`);
})

module.exports = app;