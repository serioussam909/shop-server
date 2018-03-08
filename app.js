import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import logger from 'morgan';
import mongoose from 'mongoose';
import SourceMapSupport from 'source-map-support';
import cors from 'cors'

// import routes
import shopRoutes from './routes/shop.route';
// define our app using express

const app = express();

// allow-cors
app.use(cors());
// configure app
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(__dirname + '/uploads'));
// set the port
const port = process.env.PORT || 3001;
// connect to database
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/shop', {
});

// add Source Map Support
SourceMapSupport.install();

app.use('/api/item', shopRoutes);
app.get('/', (req, res) => {
    return res.end('v0.1');
})
// catch 404
app.use((req, res, next) => {
    res.status(404).send('<h2 align=center>Page Not Found!</h2>');
});
// start the server
app.listen(port, () => {
    console.log(`App Server Listening at ${port}`);
});