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



// GET APIS



app.get("/", (request, response) => {
    response.send("Express Server was running");
})


app.listen(PORT, () => {
    console.log(`Express server is running on port ${PORT}`)
})



export default app