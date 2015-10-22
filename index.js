var Base = require('mocha').reporters.Base
var JSONCov = require('mocha').reporters.JSONCov
var log = console.log
var color = Base.color
var cursor = Base.cursor

/**
 * Expose `Teamcity`.
 */

exports = module.exports = Teamcity

/**
 * Initialize a new `Teamcity` reporter.
 *
 * @param {Runner} runner
 * @api public
 */

function Teamcity(runner) {
    Base.call(this, runner)
    JSONCov.call(this, runner, false)

    runner.on('start', function(suite) {
        log("##teamcity[testSuiteStarted name='mocha.suite' duration='" + this.stats.duration + "']")
    })

    runner.on('suite', function(suite) {
        if (suite.root) return

        suite.startDate = Date.now()
        log("##teamcity[testSuiteStarted name='" + escape(suite.title) + "']")
    })

    runner.on('test', function(test) {
        log("##teamcity[testStarted name='" + escape(test.title) + "' captureStandardOutput='true']")
    })

    runner.on('pass', function(test) {
        var fmt = color('checkmark', '  ' + Base.symbols.ok) + color('pass', ' %s') + color(test.speed, ' (%dms)')
        cursor.CR()
        log(fmt, test.title, test.duration)
    })

    runner.on('fail', function(test, err) {
        log("##teamcity[testFailed name='" + escape(test.title) + "' message='" + escape(err.message) + "' captureStandardOutput='true' details='" + escape(err.stack) + "']")
    })

    runner.on('pending', function(test) {
        var fmt = color('pending', '  - %s')
        log(fmt, test.title)

        log("##teamcity[testIgnored name='" + escape(test.title) + "' message='pending']")
    })

    runner.on('test end', function(test) {
        log("##teamcity[testFinished name='" + escape(test.title) + "' duration='" + test.duration + "']")
    })

    runner.on('suite end', function(suite) {
        if (suite.root) return

        log("##teamcity[testSuiteFinished name='" + escape(suite.title) + "' duration='" + (Date.now() - suite.startDate) + "']")
    })

    runner.on('end', function() {
        log("##teamcity[testSuiteFinished name='mocha.suite' duration='" + this.stats.duration + "']")
        log()

        var data = this.cov
        var threshold = this.threshold || 0
        if (!data) {
            log("##teamcity[message text='CODE-COVERAGE CHECK FAILED' errorDetails='Error reading report file.' status='ERROR']")
            return
        }

        var cov = Math.ceil(data.coverage)

        log("##teamcity[message text='Code Coverage is " + cov + "%']")
        log("##teamcity[blockOpened name='Code Coverage Summary']")
        log("##teamcity[buildStatisticValue key='CodeCoverageB' value='" + cov + "']")
        log("##teamcity[buildStatisticValue key='CodeCoverageAbsLCovered' value='" + data.hits + "']")
        log("##teamcity[buildStatisticValue key='CodeCoverageAbsLTotal' value='" + data.sloc + "']")
        log("##teamcity[buildStatisticValue key='CodeCoverageL' value='" + cov + "']")
        log("##teamcity[blockClosed name='Code Coverage Summary']")

        if (cov >= threshold) {
            log("##teamcity[message text='CODE-COVERAGE CHECK PASSED' status='NORMAL']")
        } else {
            log("##teamcity[message text='CODE-COVERAGE CHECK FAILED' errorDetails='Insufficient code coverage.' status='ERROR']")
        }

        log()
    }.bind(this))
}

/**
 * Escape the given `str`.
 */

function escape(str) {
    if (!str) return ''
    return str
        .toString()
        .replace(/\|/g, "||")
        .replace(/\n/g, "|n")
        .replace(/\r/g, "|r")
        .replace(/\[/g, "|[")
        .replace(/\]/g, "|]")
        .replace(/\u0085/g, "|x")
        .replace(/\u2028/g, "|l")
        .replace(/\u2029/g, "|p")
        .replace(/'/g, "|'")
}
