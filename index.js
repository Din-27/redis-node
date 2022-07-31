const redis = require("redis");
const express = require("express");
const app = express();
const axios = require("axios");
const port = process.env.PORT || 3000;

let redisClient;

(async () => {
    redisClient = redis.createClient(6739, "redis");

    redisClient.on("error", (error) => console.error(`Error : ${error}`));

    await redisClient.connect();
})();

async function fetchData(species) {
    const apiResponse = await axios.get(
        `https://www.fishwatch.gov/api/species/${species}`
    );
    console.log("Request sent to the API");
    return apiResponse.data;
}

async function getData(req, res) {
    let results;
    let isCached = false;
    const apiResponse = await axios.get(
        `https://www.fishwatch.gov/api/species`
    );
    try {
        const cacheResults = await redisClient.get("fish");
        if (cacheResults) {
            isCached = true;
            results = JSON.parse(cacheResults);
        } else {
            results = apiResponse.data;
            if (results.length === 0) {
                throw "API returned an empty array";
            }
            console.log("Request sent to the API");
            await redisClient.set("fish", JSON.stringify(results));
        }

        res.send({
            fromCache: isCached,
            data: results,
        });
    } catch (error) {
        console.error(error);
        res.status(404).send("Data unavailable");
    }
}

async function getSpeciesData(req, res) {
    const species = req.params.species;
    let results;
    let isCached = false;

    try {
        const cacheResults = await redisClient.get(species);
        if (cacheResults) {
            isCached = true;
            results = JSON.parse(cacheResults);
        } else {
            results = await fetchData(species);
            if (results.length === 0) {
                throw "API returned an empty array";
            }
            await redisClient.set(species, JSON.stringify(results));
        }

        res.send({
            fromCache: isCached,
            data: results,
        });
    } catch (error) {
        console.error(error);
        res.status(404).send("Data unavailable");
    }
}

app.get("/fish", getData);
app.get("/fish/:species", getSpeciesData);

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});