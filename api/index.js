
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User.js');
const NewPlace = require('./models/NewPlace.js');
const Booking = require('./models/Booking.js');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');
const morgan = require('morgan');
require('dotenv').config();

app.use(cors({
  credentials: true,
  origin: 'http://localhost:5173'
}));

app.use(morgan('tiny'));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

const options = {
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 600000,
};

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, options);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    setTimeout(connectToDatabase, 5000);
  }
};

connectToDatabase();

function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, process.env.jwtSecret, {}, (err, userData) => {
      if (err) reject(err);
      resolve(userData);
    });
  });
}

app.get('/test', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_URL, options);
    res.json('test ok');
  } catch (error) {
    res.json("Connection failed");
  }
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userDoc = await User.findOne({ email });
    if (userDoc && bcrypt.compareSync(password, userDoc.password)) {
      jwt.sign({
        email: userDoc.email,
        id: userDoc._id
      }, process.env.jwtSecret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token).json(userDoc);
      });
    } else {
      res.status(422).json('Invalid credentials');
    }
  } catch (e) {
    res.status(500).json(e);
  }
});

app.get('/profile', async (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, process.env.jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const user = await User.findById(userData.id).select('name email id');
      res.json(user);
    });
  } else {
    res.json(null);
  }
});

app.get('/user-places', async (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, process.env.jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const places = await NewPlace.find({ owner: userData.id });
    res.json(places);
  });
});

app.post('/logout', (req, res) => {
  res.cookie('token', '').json(true);
});

app.post('/upload-by-link', async (req, res) => {
  const { link } = req.body;
  const newName = Date.now() + '.jpg';
  await imageDownloader.image({
    url: link,
    dest: __dirname + '/uploads/' + newName,
  });
  res.json(newName);
});

const photoMiddleware = multer({ dest: '/uploads/' });

app.post('/upload', photoMiddleware.array('photos', 100), (req, res) => {
  const uploadedFiles = req.files.map(file => {
    const parts = file.originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = file.path + '.' + ext;
    fs.renameSync(file.path, newPath);
    return newPath.replace('/uploads/', '');
  });
  res.json(uploadedFiles);
});

app.post('/places', (req, res) => {
  const { token } = req.cookies;
  const {
    title, address, addedPhotos, description,
    perks, extraInfo, checkIn, checkOut, maxGuests, price,
  } = req.body;


  jwt.verify(token, process.env.jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await NewPlace.create({
      owner: userData.id,
      title, address, photos:addedPhotos, description,
      perks, extraInfo, checkIn, checkOut, maxGuests, price,
    });
    res.json(placeDoc);
  });
});

app.get('/places/:id', async (req, res) => {
  const { id } = req.params;
  const place = await NewPlace.findById(id);
  res.json(place);
});

app.put('/places', async (req, res) => {
  const { token } = req.cookies;
  const {
    id, title, address, addedPhotos, description,
    perks, extraInfo, checkIn, checkOut, maxGuests, price,
  } = req.body;

  jwt.verify(token, process.env.jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await NewPlace.findById(id);
    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title, address, addedPhotos, description,
        perks, extraInfo, checkIn, checkOut, maxGuests, price,
      });
      await placeDoc.save();
      res.json('ok');
    } else {
      res.status(403).json('Forbidden');
    }
  });
});

app.get('/places', async (req, res) => {
  const places = await NewPlace.find();
  res.json(places);
});

app.post('/bookings', async (req, res) => {
  const userData = await getUserDataFromReq(req);
  const {
    place, checkIn, checkOut, numberOfGuests, name, phone, price,
  } = req.body;
  try {
    const booking = await Booking.create({
      place, checkIn, checkOut, numberOfGuests, name, phone, price,
      user: userData.id,
    });
    res.json(booking);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get('/bookings', async (req, res) => {
  const userData = await getUserDataFromReq(req);
  const bookings = await Booking.find({ user: userData.id }).populate('place');
  res.json(bookings);
});

app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
