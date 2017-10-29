function getVideoImage(path, secs, callback) {
    var me = this, video = document.createElement('video');
    video.onloadedmetadata = function() {
      if ('function' === typeof secs) {
        secs = secs(this.duration);
      }
      this.currentTime = Math.min(Math.max(0, (secs < 0 ? this.duration : 0) + secs), this.duration);
    };
    video.onseeked = function(e) {
      var canvas = document.createElement('canvas');
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      var img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = canvas.toDataURL();

      //AnalyzeImage();
      //myBundle.myFunc();
      //sendBase64ToServer('name', canvas.toDataURL('image/jpeg'));
      console.log("IMG" +img);
      callback.call(me, img, this.currentTime, e);
    };
    video.onerror = function(e) {
      callback.call(me, undefined, undefined, e);
    };
    video.src = path;
  }
  
  function showImageAt(secs) {
    var duration;
    getVideoImage(
      './videos/test2.mp4',
      function(totalTime) {
        duration = totalTime;
        return secs;
      },
      function(img, secs, event) {
        if (event.type == 'seeked') {
          var li = document.createElement('li');
          li.innerHTML += '<b>Frame at second ' + secs + ':</b><br />';
          li.appendChild(img);
       
          document.getElementById('olFrames').appendChild(li);
          secs +=5;
          console.log("secs " +secs);
          if (duration >= secs) {
            showImageAt(secs);
          };
        }
      }
    );
  }
/*
var data2 	= {
	'username' : 'peterparker',
	'password' : 'spiderman'
};
  
var sendBase64ToServer = function(name, base64){
    var httpPost = new XMLHttpRequest(),
        path = "http://localhost:3000/uploadImage/",
        data = data = JSON.stringify({image: base64});
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
};
*/