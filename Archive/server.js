var express = require('express');
var app 	= express();

// setup data parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
app.post('/uploadImage/', function (req, res) {
  console.log(req.body);
  //res.send("reply")
});

app.listen(3000, function () {
	console.log('Listening on port 3000!');
})

/*
function postNewImageType(req, res, next){
    var json = JSON.parse(req.body),
        newImageTypeData = {
            name: json.name,
            image: "placeholder.png"
        },
        imageBuffer = decodeBase64Image(data),
        newImageType = new ImageType(newImageTypeData);

    //First we save the image to Mongo to get an id

    newImageType.save(function(err){
        if(err) return next(new restify.InvalidArgumentError(JSON.stringify(err.errors)));
        var fileName = cfg.imageFolder + newImageType._id + '.jpeg';

        fs.writeFile(fileName, imageBuffer.data, function(err){
            //Handle error in next middleware function somehow
            if (err) return next(err);
            newImageType.set({image: 'filename.png'});
            newImageType.save(function(err){
                if (err) return next(new restify.InvalidArgumentError(JSON.stringify(err.errors)));
                res.send(201, imagetype);
            });
        })
    });
}
*/

/*
var express = require('express');
var app 	= express();

// setup data parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
app.post('/uploadImage/', function (req, res) {
  console.log(req.body);
  //res.send("reply")
});

app.listen(3000, function () {
	console.log('Listening on port 3000!');
})
*/
/*
function postNewImageType(req, res, next){
    var json = JSON.parse(req.body),
        newImageTypeData = {
            name: json.name,
            image: "placeholder.png"
        },
        imageBuffer = decodeBase64Image(data),
        newImageType = new ImageType(newImageTypeData);

    //First we save the image to Mongo to get an id

    newImageType.save(function(err){
        if(err) return next(new restify.InvalidArgumentError(JSON.stringify(err.errors)));
        var fileName = cfg.imageFolder + newImageType._id + '.jpeg';

        fs.writeFile(fileName, imageBuffer.data, function(err){
            //Handle error in next middleware function somehow
            if (err) return next(err);
            newImageType.set({image: 'filename.png'});
            newImageType.save(function(err){
                if (err) return next(new restify.InvalidArgumentError(JSON.stringify(err.errors)));
                res.send(201, imagetype);
            });
        })
    });
}
*/



/*
function postNewImageType(req, res, next){
    var json = JSON.parse(req.body),
        newImageTypeData = {
            name: json.name,
            image: "placeholder.png"
        },
        imageBuffer = decodeBase64Image(data),
        newImageType = new ImageType(newImageTypeData);

    //First we save the image to Mongo to get an id

    newImageType.save(function(err){
        if(err) return next(new restify.InvalidArgumentError(JSON.stringify(err.errors)));
        var fileName = cfg.imageFolder + newImageType._id + '.jpeg';

        fs.writeFile(fileName, imageBuffer.data, function(err){
            //Handle error in next middleware function somehow
            if (err) return next(err);
            newImageType.set({image: 'filename.png'});
            newImageType.save(function(err){
                if (err) return next(new restify.InvalidArgumentError(JSON.stringify(err.errors)));
                res.send(201, imagetype);
            });
        })
    });
}
*/