const fetch = require('node-fetch');

const apiUrl = 'https://api.gotinder.com';
let apiToken;

let setToken = (token) => apiToken = token;

let getProfile = () => fetch(
    apiUrl + '/profile',
    {headers: {'X-Auth-Token': apiToken}}
);

let getUserProfile = (userId) => fetch(
    apiUrl + '/user/' + userId,
    {headers: {'X-Auth-Token': apiToken}}
);

let getFeed = () => fetch(
    apiUrl + '/v2/recs/core',
    {headers: {'X-Auth-Token': apiToken}}
);

let likeProfile = async (userId) => {
    try {
        const response = await fetch(
            apiUrl + '/like/' + userId,
            {method: 'post', headers: {'X-Auth-Token': apiToken}}
        );
        const json = await checkStatus(response);
        console.log(`Liked user ${userId}; Result: ${json.status}`)
    } catch (error) {
        console.error(`Error liking user ${userId}; Reason: ${error}`)
    }
};

let rejectProfile = async (userId) => {
    try {
        const response = await fetch(
            apiUrl + '/pass/' + userId,
            {method: 'post', headers: {'X-Auth-Token': apiToken}}
        );
        const json = await checkStatus(response);
        console.log(`Rejected user ${userId}; Result: ${json.status}`)
    } catch (error) {
        console.error(`Error rejecting user ${userId}; Reason: ${error}`)
    }
};

const checkStatus = async (response) => {
    if (response.ok) { // res.status >= 200 && res.status < 300
        return await response.json();
    } else {
        console.error(response.statusText);
    }
};

module.exports = {setToken, getProfile, getUserProfile, getFeed, likeProfile, rejectProfile};