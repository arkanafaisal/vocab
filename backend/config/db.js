import { MongoClient, ServerApiVersion } from 'mongodb'

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


let db
async function connectDb(){
    if(db){return}
        try{
            console.log('Connecting to MongoDB...');
            await client.connect()
            console.log('Connected to MongoDB');
            db = client.db('account')
        }catch(error){
            console.error("Error connecting to MongoDB:", error);
            throw error; // Re-throw the error for handling in the calling function
        }
}


async function closeDbConnection() {
    try {
        console.log('Closing MongoDB connection...');
        await client.close();
    } catch (error) {
        console.error("Error closing MongoDB connection:", error);
    }
}

function getDb() {
    if(!db) throw new error('db is not ready yet')
    return db
}

export {connectDb, closeDbConnection, getDb}
