const express = require("express");
const bodyparser = require("body-parser");

const User = require("./userModel");
const cors = require("cors");

const app = express();
const mongoose = require("mongoose");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(bodyparser.json());

mongoose
  .connect(
    "mongodb+srv://dudhalkarriya9:dudhalkarriya9@prayana.pxpbg.mongodb.net/?retryWrites=true&w=majority&appName=prayana"
  )
  .then(() => {
    console.log("database connected");
  });

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    if (!users || users.length === 0) {
      return res.status(404).json({ msg: "No users found" });
    }
    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return Math.floor(d);
}

const travel = async (req, res) => {
  const { email, lat, long, uid } = req.body;
  try {
    let user = uid ? await User.findOne({ uid }) : await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const locationResponse = await fetch(
      `https://api-bdc.net/data/reverse-geocode-client?latitude=${lat}&longitude=${long}&localityLanguage=en`
    );
    const locationData = await locationResponse.json();
    const locality = locationData.locality || "unknown";

    if (!user.travelling) {
      user.travelling = true;
      user.transactions.push({
        amount: 0,
        source: "Nitte",
        sourceLat: lat,
        sourceLong: long,
        destination: "travelling",
      });
      await user.save();
      return res.status(200).json({
        msg: "Travel started",
        user,
        transact: user.transactions[user.transactions.length - 1],
      });
    } else {
      user.travelling = false;
      const lastTransaction = user.transactions.slice().reverse().find((t) => t.source !== "recharge");
      if (!lastTransaction) {
        return res.status(400).json({ msg: "No valid travel transaction found" });
      }

      const distance = getDistanceFromLatLonInKm(lastTransaction.sourceLat, lastTransaction.sourceLong, lat, long);
      const amount = Math.max(10, 10 * distance);

      if (user.balance < 40) {
        return res.status(400).json({ email: user.email, msg: "Insufficient balance" });
      }

      user.balance -= 40;
      lastTransaction.destination = "Mangalore";
      lastTransaction.amount = 40;
      await user.save();

      return res.status(200).json({
        user,
        msg: "Travel ended",
        transact: lastTransaction,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


app.get("/getAllusers", getAllUsers);
app.post("/travel", travel);

app.listen(4000, () => {
  console.log("server running on port ", 4000);
});
