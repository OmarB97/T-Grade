require('crontab').load(function(err, crontab) {
    var job = crontab.create('node ' + __dirname + '/main.js', '@hourly'); // '' + __dirname + '/main.js'
    if (job == null) {
        console.log('failed to create job');
    }
    crontab.save(function(err, crontab) {
        if (err) {
            console.log(err);
        }
    });
});
