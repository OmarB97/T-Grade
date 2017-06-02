require('crontab').load(function(err, crontab) {
    crontab.jobs().forEach(job => {
        crontab.remove(job);
    });
    var job = crontab.create('cd ' + __dirname + ' && /usr/local/bin/node ' + __dirname + '/main.js\n', '@hourly'); // '' + __dirname + '/main.js'
    if (job == null) {
        console.log('failed to create job');
    }
    crontab.save(function(err, crontab) {
        if (err) {
            console.log(err);
        }
    });

    console.log(job.toString());
});

// /usr/local/bin/node
