#!/usr/bin/env node

const Nightmare = require('nightmare'),
    path = require('path'),
    Filehound = require('filehound'),
    notifier = require('node-notifier'),
    URL = "https://login.gatech.edu/cas/login?service=https://t-square.gatech.edu/sakai-login-tool/container";
var prompt = require('prompt'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    vo = require('vo'),
    async = require('async'),
    tabletojson = require('tabletojson'),
    nightmare = Nightmare({
        show: false,
        waitTimeout: 60000
    }),
    classNames = [];

if (!fs.existsSync('cookies.json')) {
    nightmare.cookies.get({
        url: URL
    }).then((cookies) => {
        console.log("   No previous cookies detected.");
        console.log("   Please enter in your login credentials:");
        prompt.start();
        prompt.get(['gtid', 'password'], function(err, result) {
            console.log('Command-line input received:');
            console.log('  gtid: ' + result.gtid);
            console.log('  password: ' + result.password);
            nightmare.cookies.set([{
                    url: URL,
                    name: 'gtid',
                    value: result.gtid,
                    secure: true
                },
                {
                    url: URL,
                    name: 'password',
                    value: result.password,
                    secure: true
                }
            ]);
            nightmare.cookies.get({
                url: URL
            }).then((cookies) => {
                fs.writeFileSync(
                    'cookies.json',
                    JSON.stringify(cookies)
                );
                loginHandler(checkGrades)
            });
        });
    });
} else {
    loginHandler(checkGrades);
}

function loginHandler(callback) {
    fs.stat('./cookies.json', function(error, stats) {
        var buffer = new Buffer(stats.size);
        fs.open('cookies.json', 'r', (err, fd) => {
            if (err) {
                console.log("Error, could not open file!");
                return;
            } else {
                fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) {
                    var data = JSON.parse(buffer.toString("utf8", 0, buffer.length));
                    // var userPass = data.filter(x => x.name === "gtid" || x.name === "password")
                    //     .map(x => x.value);
                    userPass = data.map(x => x.value);
                    fs.closeSync(fd);
                    checkGrades(userPass[0], userPass[1]);
                });
            }
        });
    });
}

function checkGrades(username, password) {
    nightmare
        .goto('https://login.gatech.edu/cas/login?service=https://t-square.gatech.edu/sakai-login-tool/container')
        .insert('#username', username)
        .insert('#password', password)
        .click("[name='submit']")
        .wait('#siteLinkList')
        .evaluate(function() {
            var links = Array.from(document.querySelectorAll('#siteLinkList a')).map(element => element.href);
            var index = links.indexOf('https://t-square.gatech.edu/portal#');
            links.splice(index, 1);
            return links;
        })
        .then((classLinks) => {
            async.eachOfSeries(classLinks, function(link, index, callback) {
                nightmare
                    .goto(link)
                    .wait("[title='For storing and computing assessment grades from Tests & Quizzes or that are manually entered']")
                    .click("[title='For storing and computing assessment grades from Tests & Quizzes or that are manually entered']")
                    //.wait(".itemName")
                    .wait("body")
                    .html('./classes/class' + (index + 1) + '.txt', 'HTMLComplete');
                callback();
            }, function(err) {
                nightmare
                    .goto('https://t-square.gatech.edu/portal#')
                    .wait('#siteLinkList')
                    .evaluate(function() {
                        var names = Array.from(document.querySelectorAll('#siteLinkList span')).map(element => element.innerText);
                        var index = names.indexOf('My Workspace');
                        names.splice(index, 1);
                        return names;
                    }).then(names => {
                        classNames = names;
                        nightmare
                            .end()
                            .then(function(result) {
                                Filehound.create()
                                    .paths('./classes')
                                    .ext('html')
                                    .find()
                                    .then(files => {
                                        files.forEach((file, index) => {
                                            // you now have each html file!
                                            extractGrades(file, (index + 1), gradeHandler);
                                        });
                                    });
                            })
                            .catch(function(error) {
                                console.error('Search failed:', error);
                            });
                    });

            });
        });
}

function extractGrades(html, classNum, callback) {
    fs.unlinkSync("./classes/class" + classNum + ".txt");
    fs.readFile(html, 'utf8', (err, data) => {
        if (err) throw err;
        deleteFolderRecursive("./classes/class" + classNum + "_files");
        var grades = [];
        var tablesAsJson = tabletojson.convert(data);
        tablesAsJson[2].forEach(grade => {
            gradeData = JSON.stringify(grade);
            gradeData = "{\"" + gradeData.substring(gradeData.indexOf("Title"), gradeData.indexOf("*")) +
                gradeData.substring(gradeData.indexOf("*") + 1);
            grades.push(JSON.parse(gradeData));
            //if (!fs.existsSync('cookies.json')) {
            // need to extract just the part of the string after the word "Title" !!!!
        });
        // make new directory here!!!
        mkdirp('./classes/class' + classNum, function(err) {
            if (err) console.error(err)
            var oldPath = './classes/class' + classNum + '/oldGrades.json',
                newPath = './classes/class' + classNum + '/newGrades.json';
            if (!fs.existsSync(newPath)) {
                fs.writeFileSync(newPath, JSON.stringify(grades));
            } else {
                fs.renameSync(newPath, oldPath);
                fs.writeFileSync(newPath, JSON.stringify(grades));
                callback(oldPath, grades, (classNum - 1));
            }
        });
    });
}

// TODO: Add functionality to detect when Course Grade changes

function gradeHandler(oldPath, newGrades, classIndex) {
    fs.stat(oldPath, function(error, stats) {
        var buffer = new Buffer(stats.size);
        fs.open(oldPath, 'r', (err, fd) => {
            if (err) {
                console.log("Error, could not open file!");
                return;
            } else {
                fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) {
                    var oldGrades = JSON.parse(buffer.toString("utf8", 0, buffer.length));
                    var noMatch = true;
                    newGrades.forEach(newGrade => {
                        oldGrades.forEach(oldGrade => {
                            if (newGrade["Title"] === oldGrade["Title"]) noMatch = false;
                        });
                        if (noMatch && newGrade["Grade"] !== "-") {
                            notifier.notify({
                                title: 'GradeCheck',
                                message: 'New grade added to ' + classNames[classIndex] + ': ' + newGrade["Title"],
                                sound: true
                            });
                        }
                        noMatch = true;
                    });
                    fs.closeSync(fd);
                });
            }
        });
    });
}

var deleteFolderRecursive = function(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};
