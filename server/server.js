const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fileUtils = require("./utils/fileutils");
const matcher = require("./matcher");

const corsOptions = {
    origin: 'http://localhost:8080',
    optionsSuccessStatus: 200
}
const app = express();
app.use(express.static(path.join(__dirname, 'static')));
app.use('/photos', express.static(path.join(__dirname, 'static/photos')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.listen(3000, async () => {
    await matcher.loadFaceModels();
    console.info("Server running on port 3000");
});

app.get("/", (req, res, next) => {
    res.sendFile(`${__dirname}/html/mentor.html`);
});

app.get("/results", cors(corsOptions), async (req, res, next) => {
    const offset = Number(req.query.offset);
    const results = await matcher.getUnverifiedProfiles(offset);
    res.json(results);
});

app.get("/feed", async (req, res, next) => {
    const apiToken = req.header('Api-Token');
    const userList = await matcher.processFeed(apiToken);
    // const userList = await matcher.getStoredFeed();
    res.json({users: userList});
});

app.get("/images/:userId", async (req, res, next) => {
    const userId = req.params.userId;
    const images = await fileUtils.getImageURLs(userId);
    res.json({images: images});
});

app.post("/categorize", async (req, res, next) => {
    const apiToken = req.header('Api-Token');
    const reqBody = req.body;
    const userResult = await matcher.categorizeUser(reqBody.result, reqBody.user, apiToken);
    res.json({userScore: userResult});
});

app.options('/markPretty', cors(corsOptions));
app.post("/markPretty", cors(corsOptions), async (req, res, next) => {
    const reqBody = req.body;
    const apiToken = req.header('Api-Token');
    await matcher.updateUserProfileSelection(reqBody, apiToken);
    res.json({status: "ok"});
});

app.get("/extractClassified", cors(corsOptions), async (req, res, next) => {
    const type = req.query.type;
    await matcher.extractReClassifiedProfiles(type);
    res.json({status: "ok"});
});