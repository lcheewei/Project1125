/*
 * Copyright 2013. Amazon Web Services, Inc. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
**/

// Adapted for class active-learning materials. This js file is to intialize faces of interest into AWS. 
//var config = require('./config')

var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var fs = require('fs-extra');
var path = require('path');
var region = "us-east-1";
AWS.config.region = region;
var collectionName = "faceinit";

var rekognition = new AWS.Rekognition({region: region});

console.log(collectionName);

// AWS allows you to create separate collections of faces to search in. 
// This creates the collection we'll use.
function createCollection() {
	// Index a dir of faces
	rekognition.createCollection( { "CollectionId": collectionName }, function(err, data) {
	  if (err) {
		console.log(err, err.stack); // an error occurred
	  } else {
        console.log(data);           // successful response
        console.log("Collectin name created: " +collectionName);
	  }
	});
}

// This loads a bunch of named faces into a db. It uses the name of the image as the 'externalId'
// Reads from a sub folder named 'faces'
function indexFaces() {
	var klawSync = require('klaw-sync')
	var paths = klawSync('./Faces/Classmates', { nodir: true, ignore: [ "*.json" ] });

	paths.forEach((file) => {
		console.log(file.path);
		var p = path.parse(file.path);
		var name = p.name.replace(/\W/g, '');
		var bitmap = fs.readFileSync(file.path);

		rekognition.indexFaces({
		   "CollectionId": collectionName,
		   "DetectionAttributes": [ "ALL" ],
		   "ExternalImageId": name,
		   "Image": { 
			  "Bytes": bitmap
		   }
		}, function(err, data) {
			if (err) {
				console.log(err, err.stack); // an error occurred
			} else {
				console.log(data);           // successful response
				fs.writeJson(file.path + ".json", data, err => {
					if (err) return console.error(err)
				});
			}
		});
	});
}

function deleteCollection() {
	// Index a dir of faces
	rekognition.deleteCollection( { "CollectionId": collectionName }, function(err, data) {
	  if (err) {
		console.log(err, err.stack); // an error occurred
	  } else {
        console.log(data);           // successful response
        console.log("Collection Deleted");           // successful response
	  }
	});
}

// Once you've created your collection you can run this to test it out.
function FaceSearchTest(imagePath)
{
	var bitmap = fs.readFileSync(imagePath);

	rekognition.searchFacesByImage({
		"CollectionId": collectionName,
		"FaceMatchThreshold": 80,
		"Image": { 
			"Bytes": bitmap,
		},
		"MaxFaces": 1
	}, function(err, data) {
		if (err) {
			console.log(err, err.stack); // an error occurred
		} else {
			console.log(data);           // successful response
			console.log(data.FaceMatches[0].Face);
		}
	});
}

// This uses the detect labels API call on a local image.
function DetectLabelsTest(imagePath)
{
	var bitmap = fs.readFileSync(imagePath);

	var params = {
		Image: { 
			Bytes: bitmap
		},
		MaxLabels: 10,
		MinConfidence: 50.0
	};

	rekognition.detectLabels(params, function(err, data) {
		if (err) {
			console.log(err, err.stack); // an error occurred
		} else {
			console.log(data);           // successful response
		}
	});
}


var ListCollection = function (){
    var params = {
        CollectionId: collectionName
    };
    var rekognition = new AWS.Rekognition({region: region});
    console.log("Collection Name: " +collectionName);
    rekognition.listFaces(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
}

//deleteCollection()
//createCollection();
//indexFaces();
ListCollection();