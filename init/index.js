require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geoCodingClient = mbxGeocoding({ accessToken: mapToken });

const mongoUrl = process.env.ATLASDB_URL;

main()
  .then(() => console.log("connected to DB"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(mongoUrl);
}

const initDB = async () => {
  try {
    await Listing.deleteMany({});

    const updatedData = await Promise.all(
      initData.data.map(async (obj) => {
        const { _id, ...rest } = obj;
        try {
          const response = await geoCodingClient
            .forwardGeocode({
              query: `${rest.location}, ${rest.country}`,
              limit: 1,
            })
            .send();
          const geometry = response.body.features[0].geometry || null;
          return {
            ...rest,
            owner: "69ff60bd4e80fd8dd008ee99",
            geometry,
            reviews: [],
          };
        } catch (error) {
          console.error(`Geocoding failed for ${rest.location}:`, error.message);
          return {
            ...rest,
            owner: "69ff60bd4e80fd8dd008ee99",
            geometry: null,
            reviews: [],
          };
        }
      })
    );

    await Listing.insertMany(updatedData);
    console.log("DB is initialized!");
  } catch (error) {
    console.error("Error initializing DB:", error);
  }
};

initDB();