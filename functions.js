
var ExtractFrames = function(path) {
    
    return new Promise(function(resolve, reject) {
        try {
            console.log ('Extractframes path: ' +path);
            var process = new ffmpeg(path);
            process.then(function (video) {
                console.log('2. Extracting frames from video .... ');
                io.emit('progress', '2/6: Extracting frames from video ....');
                video.fnExtractFrameToJPG('./savedframes/', {
                    frame_rate	: VideoSampleRate,
                    file_name : 'my_frame_%t_%s'
                }, function (error, files) {
                    if (!error){
                        console.log('Total number of frames generated: ' + files.length);
                        resolve(files);
                    }   
                });
            }, function (err) {
                console.log('Error: ' + err);
                reject ('Error extracting files');
            });
        } catch (e) {
            console.log(e.code);
            console.log(e.msg);
        }   
    });
};

var UploadImagestoS3 = function() {
    return new Promise(function(resolve, reject) {
        
        console.log('3. Uploading frame images to S3 Storage ... ');
        io.emit('progress', '3/6: Uploading frame images to S3 Storage ...');
        
        var uploader = client.uploadDir(params);
        uploader.on('error', function(err) {
            console.error('unable to sync:', err.stack);
            reject(err);
        });
        uploader.on('progress', function() {
            //console.log('progress', uploader.progressMd5Amount,uploader.progressAmount, uploader.progressTotal);
            io.emit('progress', '3/6: Upload status: '+uploader.progressAmount + ' / ' + uploader.progressTotal +' bytes');
        });
        uploader.on('end', function() {
            console.log('Uploading to S3 Storage complete');
            resolve('Uploading to S3 Storage completed');
            //resolve(uploadedfiles);
            //resolve("Frames uploaded");
        });   
    });
};

var RetrieveImagesFromS3 = function() {
    return new Promise(function(resolve, reject) {
        console.log('4. Retrieve images from AWS Storage'); 
        io.emit('progress', '4/6: Retrieve images from AWS Storage ...');
        var param = {
            Bucket: 'imgframes2'    
        };
        var s3 = new AWS.S3();
        var allKeys = [];
        var i=0;

        setTimeout(function(){
            s3.listObjectsV2(param, function (err, data) {
                console.log('data: ' +data);
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    reject(err);
                } else {
                    var contents = data.Contents;
                    console.log('Image frames retrieved from S3: ' +contents.length);
                    contents.forEach(function (content) {
                        allKeys.push(content.Key);
                        i++;
                    });
                    if (i>=contents.length){
                        resolve(allKeys);
                    }       
                }
            });
        }, 5000);
    });
};

var AnalyzeImage = function(keys) {
    return new Promise(function(resolve, reject) {

        app.use(Express.static('public'));
        var rekognition = new AWS.Rekognition({region: config.region});
        console.log('5. Sending ' + keys.length + ' images to AWS for Facial Recognition'); 
        io.emit('progress', '5/6: Sending images to AWS for Facial Recognition ...');

        var img_name;
        var API_Returns =0;
        
        function SearchFaces (key) {
            img_name = key;
            var s3Bucket = new AWS.S3();
            var urlParams = {Bucket: 'imgframes2', Key: img_name};
            var img_url;
            s3Bucket.getSignedUrl('getObject', urlParams, function(err, url){
                img_url = url;
                //console.log('the url of the image is: ' +img_url);
            });
            if (img_name == '.DS_Store') {
                API_Returns++;
                return;
            }
            //console.log('Image under analysis: ' +img_name);
            rekognition.searchFacesByImage({
                'CollectionId': config.collectionName,
                'FaceMatchThreshold': 70,
                'Image': { 
                // "Bytes": bitmap,
                    'S3Object':{
                        'Bucket':'imgframes2',
                        'Name': img_name
                    }
                },'MaxFaces': 3
            }, function(err, data) {
                API_Returns++;
                if (err) {
                    //console.log('Error: ' +err);
                } else {
                    if(data.FaceMatches && data.FaceMatches.length > 0 && data.FaceMatches[0].Face){
                        matches++;
                        var facematch = {
                            SN: matches,
                            ExtName:0,
                            Similarity:0,
                            Confidence:0,
                            link: img_url,
                            S3_img_name: img_name,
                        };
                        facematch['ExtName'] = data.FaceMatches[0].Face.ExternalImageId;
                        facematch['Confidence'] = data.FaceMatches[0].Face.Confidence;
                        facematch['link'] =img_url;
                        facematch['Similarity'] =data.FaceMatches[0].Similarity;
                        console.log (data.FaceMatches[0]);	
                        console.log (facematch.link);	
                        io.emit('progress', '6/6: Face Match found!');
                        io.emit('facematch', facematch);
                        
                        //response.send(data.FaceMatches[0].Face);
                        //resolve("Facematch found!");
                    } else {
                        //resolve("No matching faces found");
                    }
                    console.log('API results returned:' +API_Returns);
                }
                if (API_Returns >= keys.length) {
                    console.log('Analysis results returned:' +API_Returns);
                    console.log ('Analysis Complete. ' + matches +' face match(es) found.');	
                    io.emit('progress', 'Analysis Complete. ' + matches +' face match(es) found.');
                    resolve();
                }
            }); 
        }
        keys.forEach(function(e) {
            setTimeout(function(){
                //console.log('key: '+e);
                //if (e == ".DS_Store") return;
                SearchFaces(e);
            }, 500);  
        });
        console.log('APIs sent:' +keys.length);
        
    });
};

var ClearMedia = function() {
    return new Promise(function(resolve, reject) {
        
        console.log ('Clearing Media');	
        setTimeout(remove, 1500);


        function remove() {
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
                            io.emit('progress', 'Clearing file: '+files[i]);	
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
                console.error('unable to clear directory:', err.stack);
                reject(err);
            });
            ClearDir.on('progress', function() {
                console.log('progress', ClearDir.progressAmount, ClearDir.progressTotal);
                io.emit('progress', '6/6: Clear S3 Directory'+ClearDir.progressAmount + ' / ' + ClearDir.progressTotal +' bytes');
            });
            ClearDir.on('end', function() {
                console.log('Clear S3 Storage complete');
                resolve('Clear S3 Storage completed');
                io.emit('progress', 'S3 Directory cleared');
                io.emit('progress', 'Analysis Completed and cache files cleared');
            }); 

        }
        
    });
};
