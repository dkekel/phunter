## PHunter (Fibonacci Girls)
This project is an attempt to automate online dating. 
It uses TensorFlow models to classify and select Tinder profiles.

The classification consists of two steps:
1. Faces extracted from profile photos.
2. A prediction algorithm using separate TF model is ran to decide if the profile should be selected.

The training dataset that was used for the profiles' selection TF model consists of a specific subset of faces that might not be relevant to your taste.
Please take this into account when using the default model.

### Requirements
PHunter is using [MongoDB](https://www.mongodb.com/) as its storage.
You might need to install MongoDB locally or use any Cloud-based service which provides it.

### Running the project
To run the server:
1. Start node server `node server/server.js`
2. Open the main page `http://localhost:3000/`
3. Login to Tinder in another tab
4. Open DevTools in the browser in Tinder tab and extract API token from Local Storage 
5. Enter the token at PHunter screen and click `Start`

To run the client:
1. Navigate to sub-folder `phunter`
2. Run `npm run serve` command

## Technical implementation
The algorithm consists of the parts:
* Server side
* Client side

Face recognition and cropping is done server side using `face-api.js` library and Node.js `Canvas` implementation.
It uses `@tensorflow/tfjs-node` module for performance improvements. There are also a custom built TensorFlow binaries
to support modern CPU instructions.

The analysis of the profile faces using custom TensorFlow model is done client side to benefit from WebGL GPU API.
This requires the tab to be active during the whole matching process. It is possible to open a separate browser window
and keep it in the background running PHunter.

**There is a known issue with Chrome browser where prediction calculations always result in 0. Please use FireFox instead.**

## Building TensorFlow for all CPU instructions
1. Build Docker image `docker build -t tf-build -f Dockerfile-build-tensor .`
2. Run image `docker run -it tf-build /bin/bash`
3. Copy the build result from the running container `docker cp yourimageid:/tensorflow/bazel-bin/tensorflow/tools/lib_package/libtensorflow.tar.gz tf.tar.gz`

## Update `@tensorflow/tfjs-node` to use custom build
1. Copy TF build output `cp tf.tar.gz ~/node_modules/@tensorflow/tfjs-node/deps`
2. Switch to TF node folder `cd ~/node_modules/@tensorflow/tfjs-node/deps`
3. Unpack TF build result `tar -xf libtensorflow.tar.gz`