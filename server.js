//parts of code for file upload are modified from source: https://code.msdn.microsoft.com/Upload-Files-Or-To-Server-15f69aaa
var Express = require('express');
var app = Express();
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var multer = require('multer');
var bodyParser = require('body-parser');
var fs = require('fs-extra');
var filesys = require('fs')
var config = require('./config.js')
var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var path = require('path');
var ffmpeg = require('ffmpeg');
var s3 = require('s3');

AWS.config.region = config.region;
app.use(bodyParser.json());

var upload = multer({ dest: 'uploads/' })
var matches = 0;

var params = {
    localDir: './savedframes/',
    deleteRemoved: true, // default false, whether to remove s3 objects that have no corresponding local file. 
    Bucket: "imgframes",
    MaxKeys: 20,
    s3Params: {
      Bucket: "imgframes",
      Prefix: "",  // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
    },
};
var client = s3.createClient({
    maxAsyncS3: 20,     // this is the default 
    s3RetryCount: 3,    // this is the default 
    s3RetryDelay: 1000, // this is the default 
    multipartUploadThreshold: 20971520, // this is the default (20 MB) 
    multipartUploadSize: 15728640, // this is the default (15 MB) 
    //s3Options: {
      //accessKeyId: "AKIAIBPCUKCC7D42BUEQ",
      //secretAccessKey: "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",
      // any other options are passed to new AWS.S3() 
      // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property 
    //},
});


app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.post('/api/Upload', upload.array("file[]", 3), function (req, res, next) {
    console.log("1. File received in servert"); 
    io.emit('progress', "1/6: File received on server");
    console.log(req.files[0]); // req.files is array of `photos` files 
    var path = req.files[0].path;
    res.redirect("localhost:2000/index.html");

    //ListCollection();
    

    
    ExtractFrames(path, res)
        .then(UploadImagestoS3)
        .then(RetrieveImagesFromS3)
        .then(AnalyzeImage)
        .then(ClearMedia)
        .catch(function (e) {
            console.log (e);
        })
})
/*
var ListCollection = function (){
    var params = {
        CollectionId: config.collectionName
    };
    var rekognition = new AWS.Rekognition({region: config.region});
    console.log("Collection Name: " +config.collectionName);
    rekognition.listFaces(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
}*/

io.on('connection', function(socket){
});

var ExtractFrames = function(path, res) {
    return new Promise(function(resolve, reject) {
        try {
            var process = new ffmpeg(path);
            process.then(function (video) {
                console.log("2. Extracting frames from video .... ");
                io.emit('progress', "2/6: Extracting frames from video ....");
                video.fnExtractFrameToJPG('./savedframes/', {
                    frame_rate	: 1,
                    file_name : 'my_frame_%t_%s'
                }, function (error, files) {
                    if (!error){
                        console.log('Total number of frames generated: ' + files.length);
                        resolve(files);
                    }   
                });
            }, function (err) {
                console.log('Error: ' + err);
            });
        } catch (e) {
            console.log(e.code);
            console.log(e.msg);
        }   
    })
}

var UploadImagestoS3 = function() {
    return new Promise(function(resolve, reject) {
        
        console.log("3. Uploading frame images to S3 Storage ... ");
        io.emit('progress', "3/6: Uploading frame images to S3 Storage ...");
        
        var uploader = client.uploadDir(params);
        uploader.on('error', function(err) {
            console.error("unable to sync:", err.stack);
            reject(err);
        });
        uploader.on('progress', function() {
            console.log("progress", uploader.progressMd5Amount,uploader.progressAmount, uploader.progressTotal);
            io.emit('progress', "3/6: Upload status: "+uploader.progressAmount + " / " + uploader.progressTotal +" bytes");
        });
        uploader.on('end', function() {
            console.log("Uploading to S3 Storage complete");
            resolve("Uploading to S3 Storage completed");
            //resolve(uploadedfiles);
            //resolve("Frames uploaded");
        });   
    })
}

var RetrieveImagesFromS3 = function() {
    return new Promise(function(resolve, reject) {
        console.log("4. Retrieve images from AWS Storage"); 
        io.emit('progress', "4/6: Retrieve images from AWS Storage ...");
        var param = {
            Bucket: 'imgframes'    
        };
        var s3 = new AWS.S3();
        var allKeys = [];
        var i=0;

        setTimeout(function(){
            s3.listObjectsV2(param, function (err, data) {
                console.log("data: " +data);
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    reject(err);
                } else {
                    var contents = data.Contents;
                    console.log("Image frames retrieved from S3: " +contents.length);
                    contents.forEach(function (content) {
                        allKeys.push(content.Key);
                        i++;
                        console.log("i: " +i);
                    });
                    if (i>=contents.length){
                        resolve(allKeys);
                    }       
                }
            })

        }, 2000);
    })
}

var AnalyzeImage = function(keys) {
    return new Promise(function(resolve, reject) {

        var param = {
            Bucket: 'imgframes'    
        };
        app.use(Express.static('public'));
        var rekognition = new AWS.Rekognition({region: config.region});
        console.log("5. Sending " + keys.length + " images to AWS for Facial Recognition"); 
        io.emit('progress', "5/6: Sending images to AWS for Facial Recognition ...");

        var img_name;
        
        var API_Returns =0;
        

        function SearchFaces (key) {
            img_name = key;
            var s3Bucket = new AWS.S3();
            var urlParams = {Bucket: 'imgframes', Key: img_name};
            var img_url;
            s3Bucket.getSignedUrl('getObject', urlParams, function(err, url){
                img_url = url;
                //console.log('the url of the image is: ' +img_url);
            })
            if (img_name == ".DS_Store") {
                API_Returns++;
                return;
            }
            console.log('Image under analysis: ' +img_name);
            rekognition.searchFacesByImage({
                "CollectionId": config.collectionName,
                "FaceMatchThreshold": 70,
                "Image": { 
                // "Bytes": bitmap,
                    "S3Object":{
                        "Bucket":"imgframes",
                        "Name": img_name
                    }
                },"MaxFaces": 3
            }, function(err, data) {
                API_Returns++;
                if (err) {
                    console.log("Error: " +err);
                } else {
                    if(data.FaceMatches && data.FaceMatches.length > 0 && data.FaceMatches[0].Face){
                        matches++;
                        var facematch = {
                            SN: matches,
                            ExtName:0,
                            Confidence:0,
                            link: img_url,
                            S3_img_name: img_name,
                        };
                        facematch["ExtName"] = data.FaceMatches[0].Face.ExternalImageId;
                        facematch["Confidence"] = data.FaceMatches[0].Face.Confidence;
                        facematch["link"] =img_url;
                        console.log (data.FaceMatches[0]);	
                        console.log (facematch.link);	
                        io.emit('progress', "6/6: Face Match found!");
                        io.emit('facematch', facematch);
                        
                        //response.send(data.FaceMatches[0].Face);
                        //resolve("Facematch found!");
                    } else {
                        //resolve("No matching faces found");
                    }
                    console.log("API results returned:" +API_Returns);
                }
                if (API_Returns >= keys.length) {
                    console.log("Analysis results returned:" +API_Returns);
                    resolve(matches);
                }
            }); 
        }
        keys.forEach(function(e) {
            setTimeout(function(){
                console.log("key: "+e);
                //if (e == ".DS_Store") return;
                SearchFaces(e);
            }, 500);  
        })
        //resolve(matches);
        console.log("APIs sent:" +keys.length);
        
    })
}

var ClearMedia = function(matches) {
    return new Promise(function(resolve, reject) {
        console.log ("Analysis Complete. " + matches +" face match(es) found.");	
        io.emit('progress', "Clearing uploaded media ...");
        console.log ("Clearing Media");	
        
        var rmDir = function(dirPath, removeSelf) {
            if (removeSelf === undefined)
              removeSelf = true;
            try { var files = filesys.readdirSync(dirPath); }
            catch(e) { return; }
            if (files.length > 0)
              for (var i = 0; i < files.length; i++) {
                var filePath = dirPath + '/' + files[i];
                if (filesys.statSync(filePath).isFile()){
                    filesys.unlinkSync(filePath);
                    //console.log ("Clearing file: " +files[i]);
                    io.emit('progress', "Clearing file: "+files[i]);	
                }
                else
                  rmDir(filePath);
              }
            if (removeSelf)
                filesys.rmdirSync(dirPath);
        };
        rmDir('./savedframes/', false);
        rmDir('./uploads/', false);

        var ClearDir = client.deleteDir(params);
        ClearDir.on('error', function(err) {
            console.error("unable to clear directory:", err.stack);
            reject(err);
        });
        ClearDir.on('progress', function() {
            console.log("progress", ClearDir.progressAmount, ClearDir.progressTotal);
            io.emit('progress', "6/6: Clear S3 Directory"+ClearDir.progressAmount + " / " + ClearDir.progressTotal +" bytes");
        });
        ClearDir.on('end', function() {
            console.log("Clear S3 Storage complete");
            resolve("Clear S3 Storage completed");
            io.emit('progress', "S3 Directory cleared");
            io.emit('progress', "Analysis Completed and cache files cleared");
        }); 



    })
}

server.listen(2000, function(){
    console.log('Server listening on port 2000:');
  });
