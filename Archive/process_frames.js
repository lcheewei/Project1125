//module.exports = AnalyzeImage;

var request = require('request');

var data 	= {
	'username' : 'peterparker',
	'password' : 'spiderman'
};
var url = 'http://localhost:3000/uploadImage/';
    
    console.log("ANALYZEIMAGE");
    //console.log("IMG" +img);
    request.post(url, {form:data}, function(err,response,body){ 
        console.log(body);
    });



