const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const artifactsDir = 'C:\\Users\\JSKM\\.gemini\\antigravity-ide\\brain\\4a52e633-b97a-4f8d-915f-0c294932c27c';
const files = fs.readdirSync(artifactsDir);
const recentFiles = files.filter(f => f.startsWith('media__1782559') && (f.endsWith('.png') || f.endsWith('.jpg')));

async function processImages() {
  for (let i = 0; i < recentFiles.length; i++) {
    const file = recentFiles[i];
    const filePath = path.join(artifactsDir, file);
    try {
      const image = await Jimp.read(filePath);
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        var red = this.bitmap.data[idx + 0];
        var green = this.bitmap.data[idx + 1];
        var blue = this.bitmap.data[idx + 2];
        if (red < 30 && green < 30 && blue < 30) {
          this.bitmap.data[idx + 3] = 0;
        }
      });
      await image.write(`e:\\New Absen\\public\\header-mascot-${i}.png`);
      console.log('Processed ' + file + ' to header-mascot-' + i + '.png');
    } catch (e) {
      console.log('Error processing ' + file + ': ' + e.message);
    }
  }
}

processImages();
