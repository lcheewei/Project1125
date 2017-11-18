var vision = require('@google-cloud/vision');
var visionClient = vision({
    projectId: 'essential-asset-165501',
    keyFilename: 'mykey.json'
});

// The name of the image file to annotate
var fileName = 'car plate.jpg';

// Prepare the request object
var request = {
  source: {
    filename: fileName
  }
};

visionClient.textDetection(request).then(response => {
    console.log(response);
    console.log("in short: " +response[0].fullTextAnnotation.text);
  }).catch(err => {
    console.error(err);
  });
