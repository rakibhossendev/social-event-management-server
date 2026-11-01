import express, { response } from "express"
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb"
import "dotenv/config"
import { createRemoteJWKSet, errors, jwtVerify } from "jose";


const app = express();
const PORT = 5000;

app.use(cors())
app.use(express.json())

const client = new MongoClient(`${process.env.MONGODB_URL}`)

export const connectToMongoDB = async () => {
    try {
        await client.connect();
        console.log("MongoDb connected successfully");
        return client
    } catch (error) {
        console.log(error)
    }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient?.db("social-event-management");
const addEventCollection = db?.collection("add-event");
const joinedEventCollection = db?.collection("joined-event");

// Middleware
async function verifyJWTToken(request, response, next) {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        return response.status(401).send({ message: "OOps! Your are not authorized user!!!!!" })
    }
    const jwtToken = authHeader.split(" ")[ 1 ]
    if (!jwtToken) {
        return response.status(401).send({ message: "OOPs! You are not authorized user!!!." })
    }
    try {
        const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_BASE_URL}/api/auth/jwks`))
        const { payload } = await jwtVerify(jwtToken, JWKS)
    } catch (error) {
        console.error(error)
    }

    next()
}


// All post api
app.post("/add-event", verifyJWTToken, async (request, response) => {
    try {
        const addEventData = request.body;

        if (!addEventCollection) {
            return response.status(500).send({
                success: false,
                message: "MongoDB collection is not initialized",
            });
        }
        const result = await addEventCollection.insertOne(addEventData);
        response.status(201).send({
            success: true,
            message: "Event added successfully",
            insertedId: result.insertedId,
        });

    } catch (error) {
        console.error("Add Event Error:", error);
        response.status(500).send({
            success: false,
            message: "Failed to add event",
        });
    }
});

//  Join event data 
app.post("/join-event", async (request, response) => {
    try {
        const { eventId, email, postJoinEvent } = request.body;

        const event = await addEventCollection.findOne({ _id: new ObjectId(eventId) })
        if (!event) {
            return response.status(404).send({
                success: false,
                message: "Event not found",
                error: {
                    code: "NOT_FOUND"
                }
            })
        }
        if (event.email == email) {
            return response.status(403).send({
                success: false,
                message: "This event is your's",
                error: {
                    code: "CANT'T_JOIN"
                }
            })
        }
        const alreadyJoined = await joinedEventCollection.findOne({
            eventId: new ObjectId(eventId),
            participateEmail: email
        });
        if (alreadyJoined) {
            return response.status(409).send({
                success: false,
                message: "You have already joined this event",
                error: {
                    code: "ALREADY_JOINED"
                }
            })
        }
        const result = await joinedEventCollection.insertOne({
            ...postJoinEvent,
            eventId: new ObjectId(eventId),
            joinedAt: new Date()
        })
        return response.status(201).send({
            success: true,
            message: "Successfully joined event",
            data: result
        })

    } catch (error) {
        console.error(error);
        return response.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: {
                code: "INTERNAL_SERVER_ERROR"
            }
        })
    }
})


// GET APIS
app.get("/recent-event", async (request, response) => {
    try {
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
        const result = await addEventCollection?.find({ eventDate: { $gte: today } }).sort({ eventDate: 1 }).limit(6).toArray();
        response.send(result)
    } catch (error) {
        console.error(error);
        response.status(500).send({ message: "Failed to fetched data" })
    }
})

// All Events
app.get("/all-events", async (request, response) => {
    try {
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
        const result = await addEventCollection.find({ eventDate: { $gte: today } }).sort({ eventDate: 1 }).toArray();
        response.send(result);
    } catch (error) {
        console.error(error);
        response.status(500).send({ message: "Failed to fetched data" })
    }
})

// Event Details
app.get("/event/:id", async (request, response) => {
    try {
        const { id } = request.params;
        const result = await addEventCollection.findOne({ _id: new ObjectId(id) });
        response.send(result)
    } catch (error) {
        console.error(error);
        response.status(500).send({ message: "Fail to fetch data" })
    }
})
//  Filter event use email
app.get("/my-events/:email", async (request, response) => {
    try {
        const { email } = request.params
        const result = await addEventCollection.find({ email: email }).toArray();
        response.send(result)

    } catch (error) {
        console.error(error);
        response.status(500).send({ message: "Failed to fetched data" })
    }

})




app.get("/", (request, response) => {
    response.send("Express Server was running");
})


app.listen(PORT, () => {
    console.log(`Express server is running on port ${PORT}`)
})



export default app
