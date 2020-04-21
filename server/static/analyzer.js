// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
// const URL = "https://teachablemachine.withgoogle.com/models/vLznqld0l/";
// const URL = "https://teachablemachine.withgoogle.com/models/K2JgHmctg/";
const URL = "https://teachablemachine.withgoogle.com/models/8mc6xcvVm/";

let model, labelContainer, thumbnailContainer, infoLog, maxPredictions;

const fibonacciMapping = {"0": 0, "1": 0.1, "2": 0.2, "3": 0.3, "5": 0.6, "8": 0.8, "PARFAIT": 1};

// Load the image model and setup the webcam
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds "tmImage" object to your window (window.tmImage)
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // append elements to the DOM
    labelContainer = document.getElementById("label-container");
    clearBars();
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        const childElement = document.createElement("div");
        childElement.className = "progress";
        childElement.style.cssText = "height: 20px";
        labelContainer.appendChild(childElement);
    }

    thumbnailContainer = document.getElementById("user-thumbnails");
    clearThumbnails();
    infoLog = document.getElementById("info-log");
    clearLog();

    let feedSize = await getUsers();
    while (feedSize > 0) {
        feedSize = await getUsers();
    }
}

const getUsers = async () => {
    return new Promise(resolve => {
        const request = new XMLHttpRequest();
        request.open('GET', 'http://localhost:3000/feed', true);
        addTokenHeader(request);
        request.onload = async () => {
            const data = JSON.parse(request.response);
            const users = data.users;
            appendFeedSizeLog(users.length);
            for (let user of users) {
                await predictImages(user);
                sleep(1500);
            }
            resolve(users.length);
        };

        // Send request
        appendFeedLoadingLog();
        request.send();
    });
};

const predictImages = async (user) => {
    const userId = user.userId;
    const userName = user.userName;
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', `http://localhost:3000/images/${userId}`, false);
        request.onload = async () => {
            // Begin accessing JSON data here
            const data = JSON.parse(request.response);
            const images = data.images;
            const result = {};
            clearThumbnails();
            for (let image of images) {
                setImageForRecognition(userId, image);
                const predictionResult = await predict();
                result[image] = predictionResult;
                appendThumbnail(userId, image, predictionResult);
                updateProbabilityBars(result);
            }
            await categorizeResult({user: userId, result: result}, userName);
            resolve();
        };
        request.send();
    });
};

const clearBars = () => {
    labelContainer.innerHTML = "";
};

const clearThumbnails = () => {
    thumbnailContainer.innerHTML = "";
};

const clearLog = () => {
    infoLog.innerHTML = "";
};

const appendThumbnail = (userId, image, predictionResult) => {
    const prettyProbability = predictionResult[0].probability;
    const thumbnailHolder = document.createElement("div");
    thumbnailHolder.className = "d-inline p-2";
    thumbnailContainer.appendChild(thumbnailHolder);
    const thumbnail = document.createElement("img");
    thumbnail.className = "profile-thumbnail img-thumbnail rounded";
    thumbnail.src = `photos/${userId}/${image}`;
    thumbnail.title = `Pretty: ${prettyProbability}`;
    thumbnailHolder.appendChild(thumbnail);
};

const setImageForRecognition = (userId, image) => {
    document.getElementById("test-img").src = `photos/${userId}/faces/${image}`;
};

// run the webcam image through the image model
const predict = async () => {
    const image = document.getElementById("test-img");
    // predict can take in an image, video or canvas html element
    return await model.predict(image);
};

const updateProbabilityBars = (totalResult) => {
    let totalCount = 0;
    const perClassTotal = [0, 0];
    for (let key in totalResult) {
        totalCount++;
        const imageResult = totalResult[key];
        for (let i = 0; i < maxPredictions; i++) {
            let classTotal = perClassTotal[i];
            classTotal += imageResult[i].probability;
            perClassTotal[i] = classTotal;
            const classNormalized = (classTotal / totalCount) * 100;
            labelContainer.childNodes[i].innerHTML =
                `<div class="progress-bar ${i === 0 ? 'bg-success' : 'bg-warning'}" 
role="progressbar" style="width: ${classNormalized}%" 
aria-valuenow="${classNormalized}" aria-valuemin="0" aria-valuemax="100">
${imageResult[i].className}: ${classNormalized.toFixed(2)}%</div>`;
        }
    }
};

const categorizeResult = (result, userName) => {
    return new Promise(resolve => {
        const request = new XMLHttpRequest();
        const data = JSON.stringify(result);
        request.open("POST", 'http://localhost:3000/categorize', false);
        request.setRequestHeader("Content-Type", "application/json");
        addTokenHeader(request);
        request.onreadystatechange = () => { // Call a function when the state changes.
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    const data = JSON.parse(request.response);
                    const userScore = data.userScore;
                    appendUserTotalLog(userScore, userName);
                }
                resolve();
            }
        };
        request.send(data);
    });
};

const addTokenHeader = (request) => {
    const token = document.getElementById("api-token").value;
    request.setRequestHeader("Api-Token", token);
};

const appendFeedLoadingLog = () => {
    const logRecord = createLogLine();
    logRecord.innerHTML = `Loading next candidates... Espera por favor!`;
};

const appendFeedSizeLog = (candidatesCount) => {
    const logRecord = createLogLine();
    logRecord.innerHTML = `Successfully loaded <b>${candidatesCount}</b> candidates with faces!`;
};

const appendUserTotalLog = (prettyScore, userName) => {
    const logRecord = createLogLine();
    const roundedScore = parseFloat(prettyScore.toFixed(1));
    let fibonacciScore;
    for (let key in fibonacciMapping) {
        if (roundedScore <= fibonacciMapping[key]) {
            fibonacciScore = key;
            break;
        }
    }
    logRecord.innerHTML = `<b>${userName}</b> score: ${fibonacciScore}`;
};

const createLogLine = () => {
    const logRecord = document.createElement("samp");
    logRecord.className = "d-block";
    infoLog.appendChild(logRecord);
    logRecord.scrollIntoView();
    return logRecord;
};

const sleep = (miliseconds) => {
    const currentTime = new Date().getTime();
    while (currentTime + miliseconds >= new Date().getTime()) {
    }
};