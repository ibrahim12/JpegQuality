(function() {

    var debug = false;

    var root = this;

    var JpegQuality = function(obj) {
        if (obj instanceof JpegQuality) return obj;
        if (!(this instanceof JpegQuality)) return new JpegQuality(obj);
        this.JpegQualityWrapped = obj;
    };

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = JpegQuality;
        }
        exports.JpegQuality = JpegQuality;
    } else {
        root.JpegQuality = JpegQuality;
    }

    function base64ToArrayBuffer(base64, contentType) {
        contentType = contentType || base64.match(/^data\:([^\;]+)\;base64,/mi)[1] || ''; // e.g. 'data:image/jpeg;base64,...' => 'image/jpeg'
        base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
        var binary = atob(base64);
        var len = binary.length;
        var buffer = new ArrayBuffer(len);
        var view = new Uint8Array(buffer);
        for (var i = 0; i < len; i++) {
            view[i] = binary.charCodeAt(i);
        }
        return buffer;
    }

    function objectURLToBlob(url, callback) {
        var http = new XMLHttpRequest();
        http.open("GET", url, true);
        http.responseType = "blob";
        http.onload = function(e) {
            if (this.status == 200 || this.status === 0) {
                callback(this.response);
            }
        };
        http.send();
    }

    function getImageBinaryData(img, callback) {
        function handleBinaryFile(binFile) {
            if (callback) {
                callback.call(null, binFile);
            }else{
                return binFile;
            }
        }

        if (img.src) {
            if (/^data\:/i.test(img.src)) { // Data URI
                var arrayBuffer = base64ToArrayBuffer(img.src);
                handleBinaryFile(arrayBuffer);

            } else if (/^blob\:/i.test(img.src)) { // Object URL
                var fileReader = new FileReader();
                fileReader.onload = function(e) {
                    handleBinaryFile(e.target.result);
                };
                objectURLToBlob(img.src, function (blob) {
                    fileReader.readAsArrayBuffer(blob);
                });
            } else {
                var http = new XMLHttpRequest();
                http.onload = function() {
                    if (this.status == 200 || this.status === 0) {
                        handleBinaryFile(http.response);
                    } else {
                        throw "Could not load image";
                    }
                    http = null;
                };
                http.open("GET", img.src, true);
                http.responseType = "arraybuffer";
                http.send(null);
            }
        } else if (window.FileReader && (img instanceof window.Blob || img instanceof window.File)) {
            var fileReader = new FileReader();
            fileReader.onload = function(e) {
                if (debug) console.log("Got file of length " + e.target.result.byteLength);
                handleBinaryFile(e.target.result);
            };

            fileReader.readAsArrayBuffer(img);
        }
    }

    var QA_TABLE_DATA_SIZE = 63;
    var DCTSIZE2 = 64; /* Collected From ImageMagic */

    function QuantizationTable(index, precision, data){
        this.index = index;
        this.precision = precision;
        this.data = data; /* Data Contains 64 bytes */

        this.getEstimatedQuality = function(){
            var total = 0;
            var len = QA_TABLE_DATA_SIZE + 1;
            for(var i=1;i < len; i++){
                total += data[i];
            }
            return 100.0 - total/QA_TABLE_DATA_SIZE;
        };

        this.getQuality = function(tables){

            /**
             *
             * Quality Algorithm based on
             * http://www.hackerfactor.com/src/jpegquality.c
             *
             */

            var diff;
            var quality = -1;

            var no_of_tables = Object.keys(tables).length;

            if( no_of_tables == 0){
                console.error('No Tables Provided for Measuring Quality');
                return -2;
            }

            var estimatedQATable0 = tables[0].getEstimatedQuality();

            if(no_of_tables == 1){
                console.warn('Only one table found. Quality Estimation may be incorrect');
                quality = estimatedQATable0;

            }
            else if( no_of_tables == 2){

                var estimatedQATable1 = tables[1].getEstimatedQuality();

                diff = Math.abs( estimatedQATable0 - estimatedQATable1) * 0.49;
                diff += Math.abs( estimatedQATable0 - estimatedQATable1) * 0.49;

                quality = ( estimatedQATable0 + estimatedQATable1 + estimatedQATable1)/3.0 + diff;

            }else if( no_of_tables == 3){
                var estimatedQATable1 = tables[1].getEstimatedQuality();
                var estimatedQATable2 = tables[2].getEstimatedQuality();

                diff = Math.abs( estimatedQATable0 - estimatedQATable1) * 0.49;
                diff += Math.abs( estimatedQATable0 - estimatedQATable2) * 0.49;

                quality =  ( estimatedQATable0 + estimatedQATable1 + estimatedQATable2)/3.0 + diff;
            }

            return { quality: quality, type : 'approximate' };

        };

        this.getImageMagicQuality = function(tables){
            /**
             * Use ImageMagic Source Algorithm,
             *  https://subversion.imagemagick.org/subversion/ImageMagick/trunk
             *
             *  https://github.com/trevor/ImageMagick/blob/master/trunk/coders/jpeg.c
             *  Line : 801
             *
             *  DCTSIZE2 Assumed to be 64
             *
             * @type {Number}
             */

            var no_of_tables = Object.keys(tables).length;

            if(  no_of_tables == 0){
                console.error('No Tables Provided for Measuring Quality');
                return -2;
            }

            /* Approximate table for two tables */
            var hash_for_2_table =
                [
                    1020, 1015,  932,  848,  780,  735,  702,  679,  660,  645,
                    632,  623,  613,  607,  600,  594,  589,  585,  581,  571,
                    555,  542,  529,  514,  494,  474,  457,  439,  424,  410,
                    397,  386,  373,  364,  351,  341,  334,  324,  317,  309,
                    299,  294,  287,  279,  274,  267,  262,  257,  251,  247,
                    243,  237,  232,  227,  222,  217,  213,  207,  202,  198,
                    192,  188,  183,  177,  173,  168,  163,  157,  153,  148,
                    143,  139,  132,  128,  125,  119,  115,  108,  104,   99,
                    94,   90,   84,   79,   74,   70,   64,   59,   55,   49,
                    45,   40,   34,   30,   25,   20,   15,   11,    6,    4,
                    0
                ];

            var sums_for_2_table =
                [
                    32640, 32635, 32266, 31495, 30665, 29804, 29146, 28599, 28104,
                    27670, 27225, 26725, 26210, 25716, 25240, 24789, 24373, 23946,
                    23572, 22846, 21801, 20842, 19949, 19121, 18386, 17651, 16998,
                    16349, 15800, 15247, 14783, 14321, 13859, 13535, 13081, 12702,
                    12423, 12056, 11779, 11513, 11135, 10955, 10676, 10392, 10208,
                    9928,  9747,  9564,  9369,  9193,  9017,  8822,  8639,  8458,
                    8270,  8084,  7896,  7710,  7527,  7347,  7156,  6977,  6788,
                    6607,  6422,  6236,  6054,  5867,  5684,  5495,  5305,  5128,
                    4945,  4751,  4638,  4442,  4248,  4065,  3888,  3698,  3509,
                    3326,  3139,  2957,  2775,  2586,  2405,  2216,  2037,  1846,
                    1666,  1483,  1297,  1109,   927,   735,   554,   375,   201,
                    128,     0
                ];

            /* Approximate table for one tables */

            var hash_for_one_table =
                [
                    510,  505,  422,  380,  355,  338,  326,  318,  311,  305,
                    300,  297,  293,  291,  288,  286,  284,  283,  281,  280,
                    279,  278,  277,  273,  262,  251,  243,  233,  225,  218,
                    211,  205,  198,  193,  186,  181,  177,  172,  168,  164,
                    158,  156,  152,  148,  145,  142,  139,  136,  133,  131,
                    129,  126,  123,  120,  118,  115,  113,  110,  107,  105,
                    102,  100,   97,   94,   92,   89,   87,   83,   81,   79,
                    76,   74,   70,   68,   66,   63,   61,   57,   55,   52,
                    50,   48,   44,   42,   39,   37,   34,   31,   29,   26,
                    24,   21,   18,   16,   13,   11,    8,    6,    3,    2,
                    0

                ];

            var sums_for_one_table =
                [
                    16320, 16315, 15946, 15277, 14655, 14073, 13623, 13230, 12859,
                    12560, 12240, 11861, 11456, 11081, 10714, 10360, 10027,  9679,
                    9368,  9056,  8680,  8331,  7995,  7668,  7376,  7084,  6823,
                    6562,  6345,  6125,  5939,  5756,  5571,  5421,  5240,  5086,
                    4976,  4829,  4719,  4616,  4463,  4393,  4280,  4166,  4092,
                    3980,  3909,  3835,  3755,  3688,  3621,  3541,  3467,  3396,
                    3323,  3247,  3170,  3096,  3021,  2952,  2874,  2804,  2727,
                    2657,  2583,  2509,  2437,  2362,  2290,  2211,  2136,  2068,
                    1996,  1915,  1858,  1773,  1692,  1620,  1552,  1477,  1398,
                    1326,  1251,  1179,  1109,  1031,   961,   884,   814,   736,
                    667,   592,   518,   441,   369,   292,   221,   151,    86,
                    64,     0
                ];

            var quality_type = '';
            var quality = -1;
            var sum = 0;
            for(var i=0; i <  no_of_tables; i++){
                for( var j = 0; j < tables[i].data.length; j++){
                    sum += tables[i].data[j];
                }
            }

            if(  no_of_tables == 2){

                var qvalue = tables[0].data[2] + tables[0].data[53] +
                    tables[1].data[0] + tables[1].data[ DCTSIZE2 - 1 ];

                for( var i =0; i< 100; i++){
                    if ((qvalue < hash_for_2_table[i]) && (sum < sums_for_2_table[i]))
                        continue;
                    if (((qvalue <= hash_for_2_table[i]) && (sum <= sums_for_2_table[i])) || (i >= 50))
                        quality = i+1;

                    quality_type = (qvalue <= hash_for_one_table[i]) &&
                    (sum <= sums_for_one_table[i]) ? "exact" : "approximate";

                    if (debug) console.log( quality, quality_type );

                    break;
                }

            }else{
                var qvalue = tables[0].data[2] + tables[0].data[53];

                for( var i =0; i< 100; i++){
                    if ((qvalue < hash_for_one_table[i]) && (sum < sums_for_one_table[i]))
                        continue;
                    if (((qvalue <= hash_for_one_table[i]) && (sum <= sums_for_one_table[i])) || (i >= 50))
                        quality = i+1;

                    quality_type = (qvalue <= hash_for_one_table[i]) &&
                    (sum <= sums_for_one_table[i]) ? "exact" : "approximate";

                    if (debug) console.log( quality, quality_type );

                    break;
                }
            }

            return { quality: quality, type : quality_type };

        };
    }

    function QuantizationTableData(length, data){
        this.length = length;
        this.data = data;

        this.getIndex = function(byte){
            return byte & 0x0f;
        };

        this.getPrecision = function(byte){
            return byte & 0xf0;
        };

        this.getTables = function(){
            var qa_tables = [];
            var no_of_tables = this.length / (QA_TABLE_DATA_SIZE + 2 );
            var data_index = 0;
            while( no_of_tables ){
                var table_index = this.getIndex( data[data_index] );
                var table_precision = this.getPrecision( data[data_index] );

                data_index++;

                var qa_data = this.data.slice(data_index, data_index + QA_TABLE_DATA_SIZE + 1);

                data_index += QA_TABLE_DATA_SIZE + 1;

                qa_tables.push( new QuantizationTable(table_index, table_precision, qa_data) );

                no_of_tables--;
            }

            return qa_tables;
        }
    }

    function findJpegQualityAndProgressiveStatus(file){

        var dataView = new DataView(file);

        if (debug) console.log("Got file of length " + file.byteLength);
        if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
            if (debug) console.log("Not a valid JPEG");
            return false; // not a valid jpeg
        }

        var offset = 2,
            length = file.byteLength,
            marker,
            progressive = false,
            quantization_tables_data = [];

        while (offset < length) {
            if (dataView.getUint8(offset) != 0xFF) {
                if (debug) console.log("Not a valid marker at offset " + offset + ", found: " + dataView.getUint8(offset));
                break;
            }
            /* offset IS AT 0xFF */

            marker = dataView.getUint8(offset + 1);

            if (debug) console.log(marker);

            var tag_length = dataView.getUint16(offset+2);

            if(debug) console.log('Tag Length:', tag_length);

            if (marker == 219) {
                if (debug) console.log("Found 0xFFDB marker");

                var table_length = tag_length - 2;
                var data_start_index = offset + 4;

                var table_data = [];
                for(var offset_index=0; offset_index < tag_length; offset_index++ ){
                    table_data.push( dataView.getUint8(data_start_index + offset_index) );
                }

                if( table_length % (QA_TABLE_DATA_SIZE + 2) !== 0 ){
                    if (debug) console.warn('Invalid Table Size');
                }

                quantization_tables_data.push(new QuantizationTableData(table_length, table_data ));

            }else if( marker == 192){
                progressive = true;
            }

            offset += 2 + tag_length;

        }

        if(debug) console.log(quantization_tables_data);

        var all_qa_tables = [];
        for( var i=0; i < quantization_tables_data.length; i++){
            var qa_tables = quantization_tables_data[i].getTables();
            for( var j=0; j < qa_tables.length; j++ ){
                all_qa_tables[qa_tables[j].index] = qa_tables[j];
            }
        }

        var quality1 = new QuantizationTable().getQuality(all_qa_tables);
        var quality2 = new QuantizationTable().getImageMagicQuality(all_qa_tables);


        if(debug){
            console.log(all_qa_tables);
            console.log('Quality:', new QuantizationTable().getQuality(all_qa_tables) );
            console.log('Quality(ImageMagic):', new QuantizationTable().getImageMagicQuality(all_qa_tables) );
            console.log("Progressive", progressive);
        }

        return { qualityNK : quality1, qualityIM: quality2, progressive: progressive }
    }


    JpegQuality.calculate = function(img, callback) {
        if ((img instanceof Image || img instanceof HTMLImageElement) && !img.complete) return false;

        getImageBinaryData(img, function(binaryData){
            var data = findJpegQualityAndProgressiveStatus(binaryData);
            callback(data);
        });

    };

    if (typeof define === 'function' && define.amd) {
        define('JpegQuality', [], function() {
            return JpegQuality;
        });
    }
}.call(this));

