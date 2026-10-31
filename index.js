import express from "express"
import cors from "cors";
import { Collection, MongoClient } from "mongodb"
import "dotenv/config"


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

// All post api
app.post("/add-event", async (request,response) => {
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


// GET APIS



app.get("/", (request, response) => {
    response.send("Express Server was running");
})


app.listen(PORT, () => {
    console.log(`Express server is running on port ${PORT}`)
})



export default app