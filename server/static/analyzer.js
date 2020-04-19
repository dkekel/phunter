// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
// const URL = "https://teachablemachine.withgoogle.com/models/vLznqld0l/";
const URL = "https://teachablemachine.withgoogle.com/models/K2JgHmctg/";

let model, labelContainer, thumbnailContainer, maxPredictions;

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
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        const childElement = document.createElement("div");
        childElement.className = "progress";
        childElement.style.cssText = "height: 20px";
        labelContainer.appendChild(childElement);
    }

    thumbnailContainer = document.getElementById("user-thumbnails");

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
            for (let user of users) {
                await predictImages(user.userId);
                sleep(1500);
            }
            resolve(users.length);
        };

        // Send request
        request.send();
    });
};

const predictImages = async (userId) => {
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
                appendThumbnail(userId, image);
                setImageForRecognition(userId, image);
                result[image] = await predict();
                updateProbabilityBars(result);
            }
            await categorizeResult({user: userId, result: result});
            resolve();
        };
        request.send();
    });
};

const clearThumbnails = () => {
    thumbnailContainer.innerHTML = "";
};

const appendThumbnail = (userId, image) => {
    const thumbnailHolder = document.createElement("div");
    thumbnailHolder.className = "d-inline p-2";
    thumbnailContainer.appendChild(thumbnailHolder);
    const thumbnail = document.createElement("img");
    thumbnail.className = "profile-thumbnail img-thumbnail rounded";
    thumbnail.src = `photos/${userId}/${image}`;
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
            const classNormalized = classTotal / totalCount;
            labelContainer.childNodes[i].innerHTML =
                `<div class="progress-bar ${i === 0 ? 'bg-success' : 'bg-warning'}" 
role="progressbar" style="width: ${classNormalized * 100}%" 
aria-valuenow="${classNormalized}" aria-valuemin="0" aria-valuemax="1">
${imageResult[i].className}: ${classNormalized.toFixed(2)}</div>`;
        }
    }
};

const categorizeResult = (result) => {
    const request = new XMLHttpRequest();
    const data = JSON.stringify(result);
    request.open("POST", 'http://localhost:3000/categorize', false);
    request.setRequestHeader("Content-Type", "application/json");
    addTokenHeader(request);
    request.send(data);
    return request;
};

const addTokenHeader = (request) => {
    const token = document.getElementById("api-token").value;
    request.setRequestHeader("Api-Token", token);
};

const sleep = (miliseconds) => {
    const currentTime = new Date().getTime();
    while (currentTime + miliseconds >= new Date().getTime()) {
    }
};