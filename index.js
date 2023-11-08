const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;

// middlewares
app.use(cors({
    origin: [
        'http://localhost:5173', 'http://localhost:5174'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cy95lx0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('token in middleware', token);
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }

        req.user = decoded;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const assignmentCollection = client.db('assignmentDB').collection('assignments');
        const submittedAssignmentCollection = client.db('assignmentDB').collection('submitted')


        // auth related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '1h' });
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none'
                })
                .send({ success: true });
        });

        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })



        // assignmet related api
        app.get('/assignments', async (req, res) => {
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            let query = {};
            if (req.query?.difficulty) {
                query = { difficulty: req.query.difficulty }
            }
            const cursor = assignmentCollection.find(query).skip(page * size).limit(size);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/assignmentsCount', async (req, res) => {
            const count = await assignmentCollection.estimatedDocumentCount();
            res.send({ count })
        })



        app.get('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.findOne(query)
            res.send(result)
        });
        app.delete('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.deleteOne(query);
            res.send(result)
        });
        app.put('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedAssignment = req.body
            const update = {
                $set: {
                    title: updatedAssignment.title,
                    difficulty: updatedAssignment.difficulty,
                    marks: updatedAssignment.marks,
                    thumbnail: updatedAssignment.thumbnail,
                    description: updatedAssignment.description,
                    date: updatedAssignment.date,

                }
            }
            const result = await assignmentCollection.updateOne(filter, update, options);
            res.send(result)
        })

        app.post('/assignments', async (req, res) => {
            const assignments = req.body;
            const result = await assignmentCollection.insertOne(assignments);
            res.send(result)

        })

        // submitted assignment

        app.get('/submitted', async (req, res) => {

            let query = {};
            console.log('cookies', req.cookies);

            if (req.query?.status) {
                query = { status: req.query?.status }
            }

            const result = await submittedAssignmentCollection.find(query).toArray();
            res.send(result)
        })
        app.get('/submitted/personal', verifyToken, async (req, res) => {
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            let query = {};
            console.log('cookies', req.cookies);
            if (req.query?.email) {
                query = { email: req.query?.email }
            }

            const result = await submittedAssignmentCollection.find(query).toArray();
            res.send(result)
        })


        app.get('/submitted/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await submittedAssignmentCollection.findOne(query);
            res.send(result)
        })

        app.put('/submitted/:id', async (req, res) => {
            const id = req.params.id

            const filter = { _id: new ObjectId(id) }
            const updateSubmit = req.body;
            const updateDoc = {
                $set: {
                    status: updateSubmit.status,
                    obtainMarks: updateSubmit.obtainMarks,
                    feedBack: updateSubmit.feedBack
                }
            }
            const result = await submittedAssignmentCollection.updateOne(filter, updateDoc)
            res.send(result)
        });



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