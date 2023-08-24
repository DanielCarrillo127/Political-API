const mongoose  = require ('mongoose');


const URI = process.env.MONGODB_URL? process.env.MONGODB_URL : console.log('No found database');

mongoose.connect(URI,{
    useUnifiedTopology: true,
    useNewUrlParser: true, 
    
})
.then(() => {
    console.log(URI)
    console.log("Success when connecting to the database");
})
.catch(() => {
    console.error("Couldnt connect to the database. Exiting...");
    process.exit();
});

const connection = mongoose.connection;
connection.once('open',() => {
    console.log('[ Connection with DB sucefully ]');
});