// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
// const URL = "https://teachablemachine.withgoogle.com/models/vLznqld0l/";
const URL = "https://teachablemachine.withgoogle.com/models/K2JgHmctg/";

let model, labelContainer, maxPredictions;

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
        labelContainer.appendChild(document.createElement("div"));
    }

    await getUsers();
}

const getUsers = async () => {
    const request = new XMLHttpRequest();
    request.open('GET', 'http://localhost:3000/feed', true);
    request.onload = async () => {
        const data = JSON.parse(request.response);
        const users = data.users;
        for (let user of users) {
            await predictImages(user.userId);
            sleep(1500);
        }
    };

    // Send request
    request.send();
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
            for (let image of images) {
                document.getElementById("test-img").src = `photos/${userId}/faces/${image}`;
                result[image] = await predict();
            }
            await categorizeResult({user: userId, result: result});
            resolve();
        };
        request.send();
    });
};

// run the webcam image through the image model
const predict = async (imageResult) => {
    const image = document.getElementById("test-img");
    // predict can take in an image, video or canvas html element
    imageResult = await model.predict(image);
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.childNodes[i].innerHTML =
            imageResult[i].className + ": " + imageResult[i].probability.toFixed(2);
    }
    return imageResult;
};

const categorizeResult = (result) => {
    const request = new XMLHttpRequest();
    const data = JSON.stringify(result);
    request.open("POST", 'http://localhost:3000/categorize', false);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(data);
    return request;
};

const sleep = (miliseconds) => {
    const currentTime = new Date().getTime();
    while (currentTime + miliseconds >= new Date().getTime()) {
    }
};