
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');


function getMostUsedKey(keyToOccurrence) {
    var maxOccurence = 0;
    var maxKey;
    Object.keys(keyToOccurrence).map((element) => {
        if (!maxKey || keyToOccurrence[element] > maxOccurence) {
            maxOccurence = keyToOccurrence[element];
            maxKey = element;
        }
    });
    return maxKey;
}

function isListItem(string) {
    return /^[\s]*[-•–][\s].*$/g.test(string);
}

function headlineByLevel(level) {
    if (level == 1) {
        return 'H1';
    } else if (level == 2) {
        return 'H2';
    } else if (level == 3) {
        return 'H3';
    } else if (level == 4) {
        return 'H4';
    } else if (level == 5) {
        return 'H5';
    } else if (level == 6) {
        return 'H6';
    }
    return '';
}

function findParentItem(current, type) {
    if((current.type && current.type < type) || (current.type && !type)) return current;
    if(!current.parent) return null;

    return findParentItem(current.parent, type);
}

function deleteParent(items) {
    items.map((item) => {
        delete item.parent;
        item.items && item.items.length && deleteParent(item.items);
    });
}

async function loadPdf(url) {
    var option = url;

    if(Buffer.isBuffer(url)) {
        option = {
            data: url
        };
    }
    const pdf = await pdfjsLib.getDocument(option).promise;
        const heightToOccurrence = {};
        const fontToOccurrence = {};
        var maxHeight = 0;
        const pages = [];
        for(var i =1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const scale = 1.0;
            const viewport = page.getViewport({scale: scale});
            const textContent = await page.getTextContent();
            
            const textItems = textContent.items.map((item) => {
               
                const tx = pdfjsLib.Util.transform(
                    viewport.transform,
                    item.transform
                );

                const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
                const dividedHeight = item.height / fontHeight;

                
                const res = {
                    //type: options.type,
                    //annotation: options.annotation,
                    //parsedElements: options.parsedElements,
                    //lineFormat: options.lineFormat,
                    //unopenedFormat: options.unopenedFormat,
                    //unclosedFormat: options.unclosedFormat,
                    x: Math.round(item.transform[4]),
                    y: Math.round(item.transform[5]),
                    width: Math.round(item.width),
                    height: Math.round(dividedHeight <= 1 ? item.height : dividedHeight),
                    text: item.str,
                    font: item.fontName,
                    dir: item.dir,
                    hasEOL: item.hasEOL,
                    type: ''
                };

                heightToOccurrence[res.height] = heightToOccurrence[res.height] ? heightToOccurrence[res.height] + 1 : 1;
                fontToOccurrence[res.font] = fontToOccurrence[res.font] ? fontToOccurrence[res.font] + 1 : 1;
                if (res.height > maxHeight) {
                    maxHeight = res.height;
                    maxHeightFont = res.font;
                }

                return res;

            });

            pages.push({
                items: textItems
            });
        }  
        
        const mostUsedHeight = parseInt(getMostUsedKey(heightToOccurrence));
        //const mostUsedFont = getMostUsedKey(fontToOccurrence);

        const distanceToOccurrence = {};
        pages.forEach(page => {
            var lastItemOfMostUsedHeight;
            page.items.forEach(item => {
                if (item.height == mostUsedHeight && item.text.trim().length > 0) {
                    if (lastItemOfMostUsedHeight && item.y != lastItemOfMostUsedHeight.y) {
                        const distance = lastItemOfMostUsedHeight.y - item.y;
                        if (distance > 0) {
                            distanceToOccurrence[distance] = distanceToOccurrence[distance] ? distanceToOccurrence[distance] + 1 : 1;
                        }
                    }
                    lastItemOfMostUsedHeight = item;
                } else {
                    lastItemOfMostUsedHeight = null;
                }
            });
        });
        //const mostUsedDistance = parseInt(getMostUsedKey(distanceToOccurrence));
/*
        const globalState = {
            mostUsedHeight: mostUsedHeight,
            mostUsedFont: mostUsedFont,
            mostUsedDistance: mostUsedDistance,
            maxHeight: maxHeight,
            maxHeightFont: maxHeightFont,
            //fontToFormats: fontToFormats
        };        
*/
        const heights = [];
        var lastHeight;
        const min2ndLevelHeaderHeigthOnMaxPage = mostUsedHeight + ((maxHeight - mostUsedHeight) / 4);
        pages.forEach(page => {
            page.items.forEach(item => {
                if (!item.type && item.height == maxHeight && item.height > min2ndLevelHeaderHeigthOnMaxPage) {                    
                    item.type = 'H1';
                }
                if (!item.type && item.height > mostUsedHeight && !isListItem(item.text)) {
                    if (!heights.includes(item.height) && (!lastHeight || lastHeight > item.height)) {
                        heights.push(item.height);
                    }
                }
            });
        });

        heights.sort((a, b) => b - a);

        heights.forEach((height, i) => {
            const headlineLevel = i + 2;
            if (headlineLevel <= 6) {
                const headlineType = headlineByLevel(2 + i);
                pages.forEach(page => {
                    page.items.forEach(item => {
                        if (!item.type && item.height == height && !isListItem(item.text)) {
                            item.type = headlineType;
                        }
                    });
                });
            }
        });

        let current = null;
        let isLastEol = false;
        let lastY = 0;
        const contents = [];
        
        pages.map((page, pageIndex) => {
            page.items.map((item, i) => {                
                if(!current) {
                    current = {
                        type: item.type || '',
                        text: item.text,
                        items: []
                    };
                    contents.push(current);
                    lastY = item.y;
                }
                else {
                    if(!isLastEol && lastY != item.y) isLastEol = true;

                    if((!isLastEol && !(current.type && !item.type)) || (!item.type && !item.height)) {
                        current.text += item.text;
                    }
                    else if((item.type || isLastEol) && (item.type <= current.type || !current.type)) {
                        const parentNode = findParentItem(current, item.type);

                        current = {
                            type: item.type || '',
                            text: item.text,
                            items: []
                        };
                        if(!parentNode) {                            
                            contents.push(current);
                        }
                        else {
                            current.parent = parentNode;
                            parentNode.items.push(current);
                        }
                    }
                    else {
                        const node = {
                            type: item.type || '',
                            text: item.text,
                            parent: current,
                            items: []
                        };                        
                        current.items.push(node);
                        current = node;
                    }
                }

                if(item.hasEOL) {
                    isLastEol = true;
                    //if(!current.type) current.text += '\n';
                }
                else {
                    isLastEol = false;
                }
                lastY = item.y;
            });
        });

        deleteParent(contents);
        
        return contents;
}


module.exports = {
    load: loadPdf
}