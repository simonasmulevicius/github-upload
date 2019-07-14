/*

const adminData = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin', adminData.routes);
app.use(shopRoutes);

app.use((req, res, next) => {
    res.status(404).render('404', { pageTitle: 'Page Not Found', path: '/' });
});

*/

const path = require('path');
const http = require('http');
const formidable = require('formidable');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const xlsx = require('node-xlsx');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let filePath = "";
let fileName = "";
const unwantedPhoneNumbersFilePath = "unwantedPhoneNumbers.xlsx";

app.get('/fileupload', function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<a href="/editUnwantedNumbers"> 0. Edit unwanted phone numbers </a><br>');
    res.write('<form action="fileuploaded" method="post" enctype="multipart/form-data">');
    res.write('<label for="fileId">1. Choose a .xlsx file of clients to filter </label>');
    res.write('<input type="file" name="filetoupload" id="fileId" accept=".xls,.xlsx"><br>');
    res.write('<label for="submit">2. Click "Filter" and get a filtered file </label>');
    res.write('<input type="submit" value="Filter">');
    res.write('</form>');
    return res.end();
});

app.post('/fileuploaded', function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<p>File was uploaded</p>');
    res.write('<a href="/fileupload">Go back << </a><br>');
    res.write('<a href="/download">Continue >> </a>');
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var oldpath = files.filetoupload.path;
        fileName = getTimePrefix() + files.filetoupload.name;
        var newpath = __dirname + '/uploads' + fileName;
        filePath = newpath;

        fs.rename(oldpath, newpath, function(err) {
            if (err) throw err;
        });
    });

    return res.end();
});

app.get('/download', function(req, res) {
    //res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<a href="/getFile"> Download file </a><br>');
    res.write('<a href="/fileupload"> Filter again </a><br>');
    res.write('<a href="/editUnwantedNumbers"> Edit unwanted phone numbers </a><br>');
    res.write('<p>List of phone numbers which were detected in unwanted phone list:</p>');

    var obj = xlsx.parse(filePath); // parses a file
    var rows = [];
    var writeStr = "";

    var unWantedPhoneNumbers = getUnwantedPhoneNumbers();
    console.log("unWantedPhoneNumbers :");
    for (var i = 0; i < unWantedPhoneNumbers.length; i++) {
        console.log(unWantedPhoneNumbers[i]);
    }

    //looping through all sheets
    for (var i = 0; i < obj.length; i++) {
        var sheet = obj[i];
        //loop through all rows in the sheet
        for (var j = 0; j < sheet['data'].length; j++) {
            //add the row to the rows array
            rows.push(sheet['data'][j]);
        }
    }

    let errorsFound = '<ol>';

    //creates the csv or xlsx string to write it to a file
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].length <= 2) {
            if (!unWantedPhoneNumbers.includes(rows[i][1])) {
                writeStr += rows[i][0] + ";" + transformName(rows[i][0]) + ";" + rows[i][1] + "\n";
                //console.log(writeStr);
            } else {
                let text = rows[i][1];
                errorsFound += ('<li>' + text + '</li>');
                console.log(text);
            }
        }
    }
    errorsFound += '</ol>';


    if (errorsFound.length > 0) {
        res.write(errorsFound);
    } else {
        res.write('<p> No errors were found </p>');
    }

    //writes to a file, but you will presumably send the csv as a      
    //response instead
    fileName = getTimePrefix() + "sortedClients.csv";
    filePath = __dirname + "/sortedContacts/" + fileName;

    fs.writeFile(filePath, writeStr, function(err) {
        if (err) {
            return console.log(err);
        }
        console.log(writeStr);
        console.log("sortedClients.csv was saved in the current directory!");
        //res.download(filePath);
    });

    return res.end();
});

app.get('/getFile', function(req, res) {
    res.download(filePath, fileName);
});

app.get('/editUnwantedNumbers', function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<a href="/fileupload"> Filter again </a><br>');
    res.write('<a href="/editUnwantedNumbers"> Edit unwanted phone numbers </a><br>');


    var obj = xlsx.parse(unwantedPhoneNumbersFilePath); // parses a file
    var rows = [];

    res.write('<h3>List of all unwanted phone numbers </h3>');
    res.write('<ul>');
    //looping through all sheets
    for (var i = 0; i < obj.length; i++) {
        var sheet = obj[i];
        //loop through all rows in the sheet
        for (var j = 0; j < sheet['data'].length; j++) {
            //add the row to the rows array
            //rows.push(sheet['data'][j][0]);

            let rawNumber = String(sheet['data'][j][0]);

            console.log(rawNumber);
            res.write('<li>' + rawNumber + '</li>');

            rows.push(String(rawNumber));
        }
    }

    res.write('</ul>');

    return res.end();
});

app.use((req, res, next) => {
    res.status(404).render('404', { pageTitle: 'Page Not Found', path: '/' });
});

app.listen(3000);





//-------------


function transformName(nominative) {
    if (nominative.endsWith("as")) {
        return nominative.substring(0, nominative.lastIndexOf("as")) + "ai";
    }
    if (nominative.endsWith("is")) {
        return nominative.substring(0, nominative.lastIndexOf("is")) + "i";
    }
    if (nominative.endsWith("us")) {
        return nominative.substring(0, nominative.lastIndexOf("us")) + "au";
    }
    if (nominative.endsWith("ys")) {
        return nominative.substring(0, nominative.lastIndexOf("ys")) + "y";
    }
    if (nominative.endsWith("ė")) {
        return nominative.substring(0, nominative.lastIndexOf("ė")) + "e";
    }
    return nominative;
}

function getTimePrefix() {
    var d = new Date();
    var timePrefix = ("/" +
        d.getFullYear() + "-" +
        ("00" + (d.getMonth() + 1)).slice(-2) + "-" +
        ("00" + d.getDate()).slice(-2) + "-[" +
        ("00" + d.getHours()).slice(-2) + "-" +
        ("00" + d.getMinutes()).slice(-2) + "-" +
        ("00" + d.getSeconds()).slice(-2) + "]_"
    );
    return timePrefix;
}

function getUnwantedPhoneNumbers() {
    var obj = xlsx.parse(unwantedPhoneNumbersFilePath); // parses a file
    var rows = [];

    //looping through all sheets
    for (var i = 0; i < obj.length; i++) {
        var sheet = obj[i];
        //loop through all rows in the sheet
        for (var j = 0; j < sheet['data'].length; j++) {
            //add the row to the rows array
            //rows.push(sheet['data'][j][0]);

            let rawNumber = String(sheet['data'][j][0]);
            let baseNumber = rawNumber;


            //console.log(typeof rawNumber);


            //console.log("rawNumber " + rawNumber);

            if (rawNumber.startsWith("86")) {
                baseNumber = rawNumber.substring(2);
            } else if (rawNumber.startsWith("3706")) {
                baseNumber = rawNumber.substring(4);
            } else if (rawNumber.startsWith("+3706")) {
                baseNumber = rawNumber.substring(5);
            }

            // console.log("baseNumber: " + baseNumber);
            // console.log(baseNumber);
            // console.log("8" + baseNumber);
            // console.log("370" + baseNumber);
            // console.log("+370" + baseNumber);

            rows.push(String(baseNumber));
            rows.push(String("86" + baseNumber));
            rows.push(String("3706" + baseNumber));
            rows.push(String("+3706" + baseNumber));
        }
    }
    //console.log(rows);
    return rows;
}