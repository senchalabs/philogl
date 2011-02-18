var total = 0,
    fail = 0;

assert = function(passed) {
    ++total;
    if (!passed) {
        ++fail;
        var trace = printStackTrace().reverse();
        document.write('<p>FAIL at ');
        for (var i in trace) {
            var t = trace[i];
            if (t.indexOf('printStackTrace') === 0) {
                break;
            }
            if (t[t.length - 1] !== ')')
                t = t.substr(t.lastIndexOf('/') + 1, t.length);
            document.write(t + '<br>\n');
        }
        document.write('</p>');
    }
};

finish = function() {
    document.write('<p>');
    document.write(total + ' total tests, ' + fail + ' failure(s)');
    document.write('</p>');
    document.close();
};

