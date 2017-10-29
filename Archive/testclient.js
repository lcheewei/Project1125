
    var httpPost = new XMLHttpRequest(),
        path = "http://localhost:3000/uploadImage/",
        //data = data = JSON.stringify({image: base64});
        data = "hello";
    httpPost.onreadystatechange = function(err) {
            if (httpPost.readyState == 4 && httpPost.status == 200){
                console.log(httpPost.responseText);
            } else {
                console.log(err);
            }
        };
    // Set the content type of the request to json since that's what's being sent
    
    httpPost.open("POST", path, true);
    httpPost.setRequestHeader('Content-Type', 'application/json');
    httpPost.send(data);
