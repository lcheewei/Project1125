var frameExtractor = require('frame-extractor');
//frameExtractor.extractFrame(sourceFilePath, numOfFrames, frameNumber, outputPath); 
frameExtractor.extractFrame('movie.mp4', "50",10, 'frame%04d.jpg');
 