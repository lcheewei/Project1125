//parts of code for file upload are modified from source: https://code.msdn.microsoft.com/Upload-Files-Or-To-Server-15f69aaa
var Express = require('express');
var app = Express();
//var http = require('http').Server(app);
var server = require('http').createServer(app)
var io = require('socket.io')(server)
//var io = require('socket.io')(http);

var multer = require('multer');
var bodyParser = require('body-parser');
var fs = require('fs-extra');
var config = require('./config.js')
var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var path = require('path');
var ffmpeg = require('ffmpeg');
var s3 = require('s3');


AWS.config.region = config.region;
app.use(bodyParser.json());

var upload = multer({ dest: 'uploads/' })

var client = s3.createClient({
 maxAsyncS3: 20,     // this is the default 
 s3RetryCount: 3,    // this is the default 
 s3RetryDelay: 1000, // this is the default 
 multipartUploadThreshold: 20971520, // this is the default (20 MB) 
 multipartUploadSize: 15728640, // this is the default (15 MB) 
 s3Options: {
   accessKeyId: "AKIAJCA3RSQROTY4HERA",
   secretAccessKey: "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",
   // any other options are passed to new AWS.S3() 
   // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property 
 },
});

var params = {
    localDir: './savedframes/',
    deleteRemoved: true, // default false, whether to remove s3 objects 
                         // that have no corresponding local file. 
    MaxKeys: 20,
    s3Params: {
      Bucket: "imgframes",
      Prefix: "",  // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
    },
};

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.post('/api/Upload', upload.array("imgUploader", 3), function (req, res, next) {
    console.log("1. File received in servert"); 
    io.emit('chat message', "1/6: File received on server");
    console.log(req.files[0]); // req.files is array of `photos` files 
    var path = req.files[0].path;
    ExtractImage (path, res);
    //AnalyzeImage (path, res);
})

io.on('connection', function(socket){

    socket.on('chat message', function(msg){
        console.log("-->"+msg);
      io.emit('chat message', msg);
    });
});

function ExtractImage (path, response) {
    var p = new Promise(function (resolve, reject) {
        try {
            var process = new ffmpeg(path);
            process.then(function (video) {
                console.log("2. Extracting frames from video .... ");
                io.emit('chat message', "2/6: Extracting frames from video ....");
                video.fnExtractFrameToJPG('./savedframes/', {
                    frame_rate	: 0.1,
                    file_name : 'my_frame_%t_%s'
                }, function (error, files) {
                    if (!error){
                        console.log('Total number of frames generated: ' + files.length);
                        console.log('Frame1: ' + files[1]);
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
    }).then (function (uploadedfiles) {
        console.log("3. Uploading frame images to S3 Storage ... ");
        io.emit('chat message', "3/6: Uploading frame images to S3 Storage ...");

        var p1 = new Promise(function (resolve, reject) {
            var uploader = client.uploadDir(params);
            
            uploader.on('error', function(err) {
              console.error("unable to sync:", err.stack);
              reject(err);
            });

            uploader.on('end', function() {
                console.log("Uploading to S3 Storage complete");
                resolve("Uploading to S3 Storage completed");
                //resolve(uploadedfiles);
                //resolve("Frames uploaded");
            });
        }).then (function (status) {
            console.log("4. Retrieve images from AWS Storage"); 
            io.emit('chat message', "4/6: Retrieve images from AWS Storage ...");
            var p2 = new Promise(function (resolve, reject) {
                var param = {
                    Bucket: 'imgframes'    
                };
                var s3 = new AWS.S3();
                var allKeys = [];
                listAllKeys();
                function listAllKeys() {
                    s3.listObjectsV2(param, function (err, data) {
                        if (err) {
                            console.log(err, err.stack); // an error occurred
                            reject(err);
                        } else {
                            //console.log(data);
                            var contents = data.Contents;
                            contents.forEach(function (content) {
                                allKeys.push(content.Key);
                            });
                            resolve(allKeys);
                            /*if (data.IsTruncated) {
                                params.ContinuationToken = data.NextContinuationToken;
                                console.log("get further list...");
                                listAllKeys();
                            } */
                        }
                    });
                }
            }).then (function (keys) {
                console.log("all keys[1]   " +keys[1]);

                var img_name = keys[1];
                app.use(Express.static('public'));
                var rekognition = new AWS.Rekognition({region: config.region});
                console.log("5. Sending images to AWS for Facial Recognition"); 
                io.emit('chat message', "5/6: Sending images to AWS for Facial Recognition ...");
                console.log(img_name); 
                rekognition.searchFacesByImage({
                     "CollectionId": config.collectionName,
                     "FaceMatchThreshold": 70,
                     "Image": { 
                        // "Bytes": bitmap,
                        "S3Object":{
                            "Bucket":"imgframes",
                            "Name": "1D1A1435.jpg"
                         }
                     },
                     "MaxFaces": 3
                }, function(err, data) {
                     if (err) {
                         console.log("error" +err);
                         //res.send(err);
                         //reject("Error matching faces");
                     } else {
                        if(data.FaceMatches && data.FaceMatches.length > 0 && data.FaceMatches[0].Face)
                        {
                            console.log ("Face match found!");	 
                            console.log (data.FaceMatches[0].Face);	
                            io.emit('chat message', "6/6: Face Match found!"+ data.FaceMatches[0].Face);
                            
                            response.send(data.FaceMatches[0].Face);
                             return(data.FaceMatches[0].Face);
                        } else {
                            return("No matching faces found");
                        }
                    }
                    console.log("data");
                });

            }).then (function (result) {
                //return res.end("Matching face detected! Image ID is .. " + result.ExternalImageId + "   " + result);
                
            }).catch(function (error) {
                console.log(error);
            });
        }).catch(function (error) {
            console.log(error);
        });
    }).catch(function (error) {
        console.log(error);
    });
}
/*
app.listen(2000, function (a) {
    console.log("Server listening to port 2000");
});*/


server.listen(2000, function(){
    console.log('io connector listening on 2000:');
  });
