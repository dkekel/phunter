const fetch = require('node-fetch');

const apiUrl = 'https://api.gotinder.com';
let apiToken;

let setToken = (token) => apiToken = token;

let getProfile = async () => await fetch(
    apiUrl + '/v2/profile?include=account,super_likes',
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

let likeProfile = async (userId, superLike) => {
    try {
        const canSuperLike = superLike && await checkSuperLikes();
        const likeUrl = apiUrl + '/like/' + userId + (canSuperLike ? '/super' : '');
        const response = await fetch(
            likeUrl,
            {method: 'post', headers: {'X-Auth-Token': apiToken}}
        );
        const json = await checkStatus(response);
        console.info(`${(canSuperLike ? 'Super' : '')} Liked user ${userId}; Result: ${json.status}`)
    } catch (error) {
        console.error(`Error liking user ${userId}; Reason: ${error}`)
    }
};

const checkSuperLikes = async () => {
    const response = await getProfile();
    const profileJson = await checkStatus(response);
    return profileJson.data.super_likes.remaining > 0;
};

let rejectProfile = async (userId) => {
    try {
        const response = await fetch(
            apiUrl + '/pass/' + userId,
            {method: 'post', headers: {'X-Auth-Token': apiToken}}
        );
        const json = await checkStatus(response);
        console.warn(`Rejected user ${userId}; Result: ${json.status}`)
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