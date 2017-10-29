var videoFrameExtractor = require('../index'),
    findRemoveSync = require('find-remove');


var result = findRemoveSync('./test/tmp', {extensions: ['.png']});

videoFrameExtractor.extractFrame('./test/fixtures/timecode.mov', '00:58:30', i, './test/tmp/'+i+'.png');
