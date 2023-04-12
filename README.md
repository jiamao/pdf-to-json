# pdf-to-json
把pdf内容转为json结构.
```json
[
    {
        "type": "H1",
        "text": "投资是一场远行",
        "items": [
            {
                "type": "H4",
                "text": "基本信息 核心人员介绍 过往业绩",
                "items": []
            },
            {
                "type": "H3",
                "text": "一、企业介绍 ABOUT US",
                "items": [
                ]
            },
            {
                "type": "H3",
                "text": "二、投资体系 ",
                "items": [
                ]
            },
            {
                "type": "H2",
                "text": "感谢观看",
                "items": []
            }
        ]
    }
]
```
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