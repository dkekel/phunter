const express = require("express");
const compression = require('compression');
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const fileUtils = require("./utils/fileutils");
const matcher = require("./matcher");

const upload = multer({dest: path.join(__dirname, 'uploads/')});
const app = express();
app.use(express.static(path.join(__dirname, 'static')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(compression());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:8080"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Api-Token");
    next();
});

app.listen(3000, async () => {
    await matcher.loadFaceModels();
    console.info("Server running on port 3000");
});

app.get("/train", (req, res, next) => {
    res.sendFile(`${__dirname}/static/train-model.js`);
});

app.get("/results", async (req, res, next) => {
    const pageSize = Number(req.query.size);
    const offset = Number(req.query.offset);
    const prettyFlag = req.query.classType === 'pretty';
    const results = await matcher.getUnverifiedProfiles(prettyFlag, pageSize, offset);
    res.json(results);
});

app.post("/feed", async (req, res, next) => {
    const apiToken = req.header('Api-Token');
    const config = req.body;
    const userList = await matcher.processFeed(config, apiToken);
    res.json({users: userList});
});

app.post("/categorize", async (req, res, next) => {
    const apiToken = req.header('Api-Token');
    const reqBody = req.body;
    const userResult = await matcher.categorizeUser(reqBody.result, reqBody.user, reqBody.config, apiToken);
    res.json({userScore: userResult});
});

app.post("/markPretty", async (req, res, next) => {
    const reqBody = req.body;
    const apiToken = req.header('Api-Token');
    const result = await matcher.updateUserProfileSelection(reqBody, apiToken);
    res.json(result);
});

app.post("/markAllProcessed", async (req, res, next) => {
    const pretty = req.body.pretty;
    const result = await matcher.markAllProcessed(pretty);
    res.json(result);
});

app.get("/trainModelSize", async (req, res, next) => {
    const trainDataSizes = await matcher.getTrainDataSizePerClass();
    res.json(trainDataSizes);
});

app.get("/trainModel", async (req, res, next) => {
    const dataSetSize = Number(req.query.dataSetSize);
    const trainData = await matcher.getTrainingData(dataSetSize);
    res.json(trainData);
});

app.get("/storedModels", async (req, res, next) => {
    const models = await matcher.getStoredModels();
    res.json(models);
});

app.post("/saveModel", upload.any(), async (req, res, next) => {
    const files = req.files;
    const modelFolder = Date.now();
    for (let file of files) {
        fileUtils.saveTrainedModel(file.filename, file.originalname, modelFolder);
    }
    res.json({modelName: modelFolder});
});

app.post("/saveModelMetadata", async (req, res, next) => {
    const modelMetadata = req.body;
    await matcher.storeTrainedModelMetadata(modelMetadata);
    res.json({status: "ok"});
});

app.get("/extractClassified", async (req, res, next) => {
    const type = req.query.type;
    await matcher.extractReClassifiedProfiles(type);
    res.json({status: "ok"});
});