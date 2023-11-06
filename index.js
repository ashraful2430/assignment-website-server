const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cy95lx0.mongodb.net/?retryWrites=true&w=majority`;

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
        const assignmentCollection = client.db('assignmentDB').collection('assignments');
        const submittedAssignmentCollection = client.db('assignmentDB').collection('submitted')

        app.get('/assignments', async (req, res) => {
            const cursor = assignmentCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.findOne(query)
            res.send(result)
        })

        app.post('/assignments', async (req, res) => {
            const assignments = req.body;
            const result = await assignmentCollection.insertOne(assignments);
            res.send(result)

        })

        // submitted assignment

        app.get('/submitted', async (req, res) => {
            const result = await submittedAssignmentCollection.find().toArray();
            res.send(result)
        })

        app.post('/submitted', async (req, res) => {
            const submitted = req.body;
            const result = await submittedAssignmentCollection.insertOne(submitted);
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);










app.get('/', (req, res) => {
    res.send('assignment server is running')
});
app.listen(port, () => {
    console.log(`assignment server is running of ${port}`);
})