const Nightmare = require('nightmare')
var prompt = require('prompt'),
    fs = require('fs'),
    nightmare = Nightmare({
        show: true
    });

if (!fs.existsSync('cookies.json')) {
    nightmare.cookies.get({
        url: "https://login.gatech.edu/cas/login?service=https://t-square.gatech.edu/sakai-login-tool/container"
    }).then((cookies) => {
        console.log("   No previous cookies detected.");
        console.log("   Please enter in your login credentials:");
        prompt.start();
        prompt.get(['gtid', 'password'], function(err, result) {
            console.log('Command-line input received:');
            console.log('  gtid: ' + result.gtid);
            console.log('  password: ' + result.password);
            nightmare.cookies.set([{
                    url: "https://login.gatech.edu/cas/login?service=https://t-square.gatech.edu/sakai-login-tool/container",
                    name: 'gtid',
                    value: result.gtid,
                    secure: true
                },
                {
                    url: "https://login.gatech.edu/cas/login?service=https://t-square.gatech.edu/sakai-login-tool/container",
                    name: 'password',
                    value: result.password,
                    secure: true
                }
            ]);
            nightmare.cookies.get({
                url: "https://login.gatech.edu/cas/login?service=https://t-square.gatech.edu/sakai-login-tool/container"
            }).then((cookies) => {
                fs.writeFileSync(
                    'cookies.json',
                    JSON.stringify(cookies)
                );
                fileHandler();
            });
        });
    });
} else {
    nightmare.cookies.set(fs.readFileSync('cookies.json'));
    fileHandler();
}

function checkGrades(username, password) {
    //console.log(username, password);
    nightmare
        .goto('https://login.gatech.edu/cas/login?service=https://t-square.gatech.edu/sakai-login-tool/container')
        .wait(4000)
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
        .then((classLink) => {
            console.log(classLink);
        });
    nightmare
        .end()
        .then(function(result) {
            console.log(result);
        })
        .catch(function(error) {
            console.error('Search failed:', error);
        });
}

function fileHandler() {
    fs.stat('cookies.json', function(error, stats) {
        var buffer = new Buffer(stats.size);
        fs.open('cookies.json', 'r', (err, fd) => {
            if (!err) {
                fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) {
                    var data = JSON.parse(buffer.toString("utf8", 0, buffer.length));
                    var userPass = data.filter(x => x.name === "gtid" || x.name === "password")
                        .map(x => x.value);
                    fs.close(fd);
                    checkGrades(userPass[0], userPass[1]);
                });
            }
        });
    });

}

//// @TODO: experimental code:
// var Nightmare = require('nightmare')
// var storedCookies // This is where we will store the cookies. It could be stored in a file or database to make it permanent
//
// // First instance:
// var nightmare1 = Nightmare({
//     show: true
// })
// nightmare1.
// goto('https://google.com').
// cookies.get().
// then((cookies) => {
//     storedCookies = cookies
//     console.log(storedCookies);
// })


//@TODO: implement a way to wait for the user to enter their username and password for the first time
// Nightmare.action('waitForUser', function(done) {
//     this.evaluate_now(function() {
//
//     }, done)
// });
// the following code follows along as well:

// if (nightmare.cookies.get() === null) {
//     nightmare.wait(function() {
//         nightmare.show = true;
//         nightmare.waitForUser();
//     })
// } else {
//
// }


// -------------------------------end of relevant code------------------------------------- //

// var Revenant = require('revenant'),
//     phantom = require('phantom');
//
// const URL = "https://t-square.gatech.edu/portal/login";
//
// const SELECTOR = '#button btn-submit';
//
// var browser = new Revenant();
//
// console.log('yo');
// browser
//     .openPage(URL)
//     .then(function() {
//         console.log('hi');
//         return browser.waitForElement(SELECTOR);
//     })
//     .then(function() {
//         return browser.getInnerHTML(SELECTOR);
//     })
//     .then(function(result) {
//         console.log(result);
//
//         browser.done();
//     }).catch(function(error) {
//         browser.done();
//     });
//


// var //Crawler = require("simplecrawler"),
//     url = require("url"),
//     //cheerio = require("cheerio"),
//     request = require("request"),
//     //webdriver = require('selenium-webdriver'),
//     //chromedriver = require('chromedriver'),
//     phantom = require('phantom');
//
// var initialURL = "https://t-square.gatech.edu/portal";
//
// console.log(phantom);

// var crawler = new Crawler(initialURL);
//
// request("https://t-square.gatech.edu/portal", {
//     // The jar option isn't necessary for simplecrawler integration, but it's
//     // the easiest way to have request remember the session cookie between this
//     // request and the next
//     jar: true
// }, function(error, response, body) {
//     // Start by saving the cookies. We'll likely be assigned a session cookie
//     // straight off the bat, and then the server will remember the fact that
//     // this session is logged in as user "iamauser" after we've successfully
//     // logged in
//
//     // console.log("error", error);
//     // console.log("response", response);
//     // console.log("body", body);
//
//     if (error) {
//         console.log(error);
//     } else {
//         //crawler.cookies.addFromHeaders(response.headers["set-cookie"]);
//
//         // We want to get the names and values of all relevant inputs on the page,
//         // so that any CSRF tokens or similar things are included in the POST
//         // request
//         var $ = cheerio.load(body),
//             formDefaults = {},
//             // You should adapt these selectors so that they target the
//             // appropriate form and inputs
//             formAction = $("#fm1").attr("action"),
//             loginInputs = $("input");
//         //console.log(formAction.html());
//         //console.log(formAction);
//
//         // We loop over the input elements and extract their names and values so
//         // that we can include them in the login POST request
//         loginInputs.each(function(i, input) {
//             //console.log(input);
//             var inputName = $(input).attr("name"),
//                 inputValue = $(input).val();
//
//             formDefaults[inputName] = inputValue;
//         });
//
//         delete formDefaults.reset;
//         formDefaults.warn = "false";
//         //console.log(formDefaults);
//
//         // Time for the login request!
//         //url.resolve(initialURL, formAction)
//         request.post("https://cas-test.gatech.edu/cas/serviceValidate", {
//                 // We can't be sure that all of the input fields have a correct default
//                 // value. Maybe the user has to tick a checkbox or something similar in
//                 // order to log in. This is something you have to find this out manually
//                 // by logging in to the site in your browser and inspecting in the
//                 // network panel of your favorite dev tools what parameters are included
//                 // in the request.
//                 form: Object.assign(formDefaults, {
//                     username: "obaradei3",
//                     password: "22397Pisces!!!"
//                 }),
//                 // We want to include the saved cookies from the last request in this
//                 // one as well
//                 jar: true
//             },
//             function(error, response, body) {
//                 // console.log("error:", error);
//                 //console.log("response:", response);
//                 console.log("body:", body);
//                 // That should do it! We're now ready to start the crawler
//                 // crawler.interval = 10000 //600000 // 10 minutes
//                 // crawler.maxConcurrency = 1; // 1 active check at a time
//                 // crawler.maxDepth = 5;
//                 crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();

//                 }),
//                 // We want to include the saved cookies from the last request in this
//                 // one as well
//                 jar: true
//             },
//             function(error, response, body) {
//                 // console.log("error:", error);
//                 //console.log("response:", response);
//                 console.log("body:", body);
//                 // That should do it! We're now ready to start the crawler
//                 // crawler.interval = 10000 //600000 // 10 minutes
//                 // crawler.maxConcurrency = 1; // 1 active check at a time
//                 // crawler.maxDepth = 5;
//                 crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();

//                 }),
//                 // We want to include the saved cookies from the last request in this
//                 // one as well
//                 jar: true
//             },
//             function(error, response, body) {
//                 // console.log("error:", error);
//                 //console.log("response:", response);
//                 console.log("body:", body);
//                 // That should do it! We're now ready to start the crawler
//                 // crawler.interval = 10000 //600000 // 10 minutes
//                 // crawler.maxConcurrency = 1; // 1 active check at a time
//                 // crawler.maxDepth = 5;
//                 crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();

//                 }),
//                 // We want to include the saved cookies from the last request in this
//                 // one as well
//                 jar: true
//             },
//             function(error, response, body) {
//                 // console.log("error:", error);
//                 //console.log("response:", response);
//                 console.log("body:", body);
//                 // That should do it! We're now ready to start the crawler
//                 // crawler.interval = 10000 //600000 // 10 minutes
//                 // crawler.maxConcurrency = 1; // 1 active check at a time
//                 // crawler.maxDepth = 5;
//                 crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();
//function(error, response, body) {
//                 // console.log("error:", error);
//                 //console.log("response:", response);
//                 console.log("body:", body);
//                 // That should do it! We're now ready to start the crawler
//                 // crawler.interval = 10000 //600000 // 10 minutes
//                 // crawler.maxConcurrency = 1; // 1 active check at a time
//                 // crawler.maxDepth = 5;
//                 crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();

//                 }),
//                 // We want to include the saved cookies from the last request in this
//                 // one as well
//                 jar: true
//             },
//             function(error, response, body) {
//                 // console.log("error:", error);
//                 //console.log("response:", response);
//                 console.log("body:", body);
//                 // That should do it! We're now ready to start the crawler
//                 // crawler.interval = 10000 //600000 // 10 minutes
//                 // crawler.maxConcurrency = 1; // 1 active check at a time
//                 // crawler.maxDepth = 5;
//                 crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();
// start();
//
// function(error, response, body) {
//                 // console.log("error:", error);
//                 //console.log("response:", response);
//                 console.log("body:", body);
//                 // That should do it! We're now ready to start the crawler
//                 // crawler.interval = 10000 //600000 // 10 minutes
//                 // crawler.maxConcurrency = 1; // 1 active check at a time
//                 // crawler.maxDepth = 5;
//                 crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();

//                 }),
//                 // We want to include the saved cookies from the last request in this
//                 // one as well
//                 jar: true
//             },
//             function(error, response, body) {
//                 // console.log("error:", error);
//                 //console.log("response:", response);
//                 console.log("body:", body);
//                 // That should do it! We're now ready to start the crawler
//                 // crawler.interval = 10000 //600000 // 10 minutes
//                 // crawler.maxConcurrency = 1; // 1 active check at a time
//                 // crawler.maxDepth = 5;
//                 crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();
//crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();
// start();
//
// function(error, response, body) {
//                 // console.log("error:", error);
//                 //console.log("response:", response);
//                 console.log("body:", body);
//                 // That should do it! We're now ready to start the crawler
//                 // crawler.interval = 10000 //600000 // 10 minutes
//                 // crawler.maxConcurrency = 1; // 1 active check at a time
//                 // crawler.maxDepth = 5;
//                 crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();

//                 }),
//                 // We want to include the saved cookies from the last request in this
//                 // one as well
//                 jar: true
//             },
//             function(error, response, body) {
//                 // console.log("error:", error);
//                 //console.log("response:", response);
//                 console.log("body:", body);
//                 // That should do it! We're now ready to start the crawler
//                 // crawler.interval = 10000 //600000 // 10 minutes
//                 // crawler.maxConcurrency = 1; // 1 active check at a time
//                 // crawler.maxDepth = 5;
//                 crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();

//                 }),
//                 // We want to include the saved cookies from the last request in this
//                 // one as well
//                 jar: true
//             },
//             function(error, response, body) {
//                 // console.log("error:", error);
//                 //console.log("response:", response);
//                 console.log("body:", body);
//                 // That should do it! We're now ready to start the crawler
//                 // crawler.interval = 10000 //600000 // 10 minutes
//                 // crawler.maxConcurrency = 1; // 1 active check at a time
//                 // crawler.maxDepth = 5;
//                 crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();
//crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();
// start();
//
// function(error, response, body) {
//                 // console.log("error:", error);
//                 //console.log("response:", response);
//                 console.log("body:", body);
//                 // That should do it! We're now ready to start the crawler
//                 // crawler.interval = 10000 //600000 // 10 minutes
//                 // crawler.maxConcurrency = 1; // 1 active check at a time
//                 // crawler.maxDepth = 5;
//                 crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();

//                 }),
//                 // We want to include the saved cookies from the last request in this
//                 // one as well
//                 jar: true
//             },
//             function(error, response, body) {
//                 // console.log("error:", error);
//                 //console.log("response:", response);
//                 console.log("body:", body);
//                 // That should do it! We're now ready to start the crawler
//                 // crawler.interval = 10000 //600000 // 10 minutes
//                 // crawler.maxConcurrency = 1; // 1 active check at a time
//                 // crawler.maxDepth = 5;
//                 crawler.respectRobotsTxt = false;
//                 crawler.start();
//             });
//     }
// });
// crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
//     console.log("Fetched", queueItem.url, responseBuffer.toString());
// });
//
// // crawler.interval = 600000 // 10 minutes
// // crawler.maxConcurrency = 1; // 1 active check at a time
// // crawler.maxDepth = 5;
// //
// // crawler.start();
