const path = require('path');
const methodOverride = require('method-override');
const express = require('express');
const { engine } = require('express-handlebars');
const route = require('./routes');
const db = require('./config/dbconfig');
const bodyParser = require('body-parser');
const cors = require('cors');

db.connect();

const app = express();

app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());

app.engine('handlebars', engine()); 
app.set('view engine', 'handlebars');
app.use(methodOverride('_method'))
app.set('views', path.join(__dirname, 'resources', 'views'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true}));

route(app);


const port = 5000;
app.listen(port, () => {
  console.log(`Server đang chạy ${port}`);
});
