import express from 'express';
import path from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import session from 'express-session';
import api from './routes';

//db connection
const db = mongoose.connection;
db.on('error', console.error);
db.once('open', ()=>{console.log('Connected to mongodb server');});

mongoose.connect('mongodb://localhost/test');

const app = express();
const port = 3000;

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use('/api', api);
app.use('/', express.static(path.join(__dirname, './../public')));


app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

//session
app.use(session({
    secret : 'SiHwang1$2$3$4',
    resave : false,
    saveUninitialized : true
}));


app.get('/hello', (req, res) =>{
    return res.send('Hello sihwang');
});

app.get('*', (req, res)=>{
    res.sendFile(path.resolve(__dirname, './../public/index.html'))
})

app.listen(port, () => {
    console.log('listening on port', port);
});
