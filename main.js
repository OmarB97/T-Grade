const Nightmare = require('nightmare'),
    path = require('path'),
    URL = "https://login.gatech.edu/cas/login?service=https://t-square.gatech.edu/sakai-login-tool/container";
var prompt = require('prompt'),
    fs = require('fs'),
    vo = require('vo'),
    async = require('async'),
    nightmare = Nightmare({
        show: true,
        waitTimeout: 60000
    });

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
                fileHandler(checkGrades)
                //checkGrades(userPass[0], userPass[1]);
            });
        });
    });
} else {
    //nightmare.cookies.set(fs.readFileSync('cookies.json'));
    fileHandler(checkGrades);
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
            console.log(classLinks);
            async.eachOfSeries(classLinks, function(link, index, callback) {
                nightmare
                    .goto(link)
                    .wait("[title='For storing and computing assessment grades from Tests & Quizzes or that are manually entered']")
                    .click("[title='For storing and computing assessment grades from Tests & Quizzes or that are manually entered']")
                    //.wait(".itemName")
                    .wait("body")
                    .html(path.dirname(path.resolve(__dirname, 'main.js')) + '/grades/class' + (index + 1) + '.txt', 'HTMLComplete');
                callback();
            }, function(err) {
                nightmare
                    .end()
                    .then(function(result) {
                        console.log(result);
                    })
                    .catch(function(error) {
                        console.error('Search failed:', error);
                    });
            });
        });
}

function fileHandler(callback) {
    fs.stat('cookies.json', function(error, stats) {
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
