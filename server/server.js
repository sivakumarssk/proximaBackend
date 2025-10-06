const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const userRouter = require('./routes/userRoutes');
const bodyParser = require('body-parser');

const app = express();
dotenv.config();

app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 } // Max file size: 10 MB
}));

app.use(cors({
    origin: true,
    methods: 'GET,POST,PUT,DELETE,PATCH',
    credentials: true,
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const PORT = 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Database connected successfully');
    })
    .catch((error) => {
        console.log('Error:', error);
    });

app.use('/api', userRouter);

// app.use(express.static(path.join(__dirname, '..', 'admin', 'dist')));
// app.get('*',(req,res)=>{
//     res.sendFile(path.join(__dirname, '..', 'admin', 'dist', 'index.html'))
// })
app.listen(PORT, () => {
    console.log('Server is started at', PORT);
});
