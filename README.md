# pdf-to-json

# example
```js
npm i node-pdf-to-json
```

```js
const fs = require('fs');
const pdf2json = require('node-pdf-to-json');

const url = __dirname + '/pro.pdf';
fs.readFile(url, function (error, data) {
    if (error) {
        console.log(error);
        return;
    }
    var unitArray = new Uint8Array(data);

    // 指定buffer或路径都可以
    pdf2json.load(unitArray).then((contents) => {
        fs.writeFileSync(__dirname + '/pdf.json', JSON.stringify(contents));
    });
});

pdf2json.load(url).then((contents) => {
    fs.writeFileSync(__dirname + '/pdf.json', JSON.stringify(contents));
});
```