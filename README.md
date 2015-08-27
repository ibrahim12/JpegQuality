#### JpegQuality

Extract JPEG Quality Information from the Jpeg File. Also provides image progressive status.

#### How it works

Jpeg quality is not stored on Meta Data. To extract the quality infomration,

- Extract Jpeg Quantization Tables from Jpeg File Binary.
- Approximate Quality Information from the Quantization Tables
    - `Neal Krawetz` Method : "For JPEG Quality > 50"
    - `ImageMagic` Method : "For Any JPEG Quality"


#### Usage

 ```javascript

/* By Image Element */
  var image = document.getElementById("img1");

  JpegQuality.calculate(image, function(data){
        console.log(data);  /* { qualityNK : { quality : 90.00, type : 'approximate' }, qualityIM : { quality : 92.00, type : 'exact' }, progressive : false } */
  });

/* By Input Files */

    /* <input type="file" id="file" value="select a file" /> */

    var fileInput = document.getElementById('file');
    fileInput.onchange = function(){
        JpegQuality.calculate(fileInput.files[0], function(data){
            console.log(data); /* { qualityNK : { quality : 90.00, type : 'approximate' }, qualityIM : { quality : 92.00, type : 'exact' }, progressive : false } */
        });

    };


/* By Blob File */

    JpegQuality.calculate(blobFile, function(data){
        console.log(data); /* { qualityNK : { quality : 90.00, type : 'approximate' }, qualityIM : { quality : 92.00, type : 'exact' }, progressive : false } */
    });

 ```



#### References

http://fotoforensics.com/tutorial-estq.php

http://www.hackerfactor.com/src/jpegquality.c
https://github.com/brunobar79/J-I-C
https://github.com/trevor/ImageMagick/blob/master/trunk/coders/jpeg.c

https://github.com/sindresorhus/is-progressive

- Blender Source JPEG
    http://download.blender.org/source/chest/blender_2.03_tree/jpeg/

- Thanks to Exifjs for Starting Point
    https://github.com/exif-js/exif-js