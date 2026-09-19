// Front-page chart: Reform UK 2024 vote share vs share of graduates, by constituency.
// Data: assets/data/education-reform.json ({ fit: {intercept, slope, r}, rows: [[name, degree%, reform%, winner]] }).
(function () {
    var fig = document.getElementById('edu-chart');
    if (!fig) return;
    var svg = fig.querySelector('.chart-svg');
    var tip = fig.querySelector('.chart-tip');
    var NS = 'http://www.w3.org/2000/svg';

    var W = 560, H = 360, M = { top: 14, right: 16, bottom: 44, left: 46 };
    var X0 = 15, X1 = 70, Y0 = 0, Y1 = 50;
    var x = function (v) { return M.left + (v - X0) / (X1 - X0) * (W - M.left - M.right); };
    var y = function (v) { return H - M.bottom - (v - Y0) / (Y1 - Y0) * (H - M.top - M.bottom); };

    function el(name, attrs, parent) {
        var n = document.createElementNS(NS, name);
        for (var k in attrs) n.setAttribute(k, attrs[k]);
        (parent || svg).appendChild(n);
        return n;
    }
    function text(str, attrs, parent) { var t = el('text', attrs, parent); t.textContent = str; return t; }

    // Axes and gridlines
    var grid = el('g', { class: 'chart-grid' });
    [0, 10, 20, 30, 40, 50].forEach(function (v) {
        el('line', { x1: M.left, x2: W - M.right, y1: y(v), y2: y(v) }, grid);
        text(v + '%', { x: M.left - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'chart-tick' });
    });
    [20, 30, 40, 50, 60, 70].forEach(function (v) {
        text(v + '%', { x: x(v), y: H - M.bottom + 18, 'text-anchor': 'middle', class: 'chart-tick' });
    });
    text('Residents with a degree (2021)', { x: (M.left + W - M.right) / 2, y: H - 6, 'text-anchor': 'middle', class: 'chart-axis' });
    text('Reform UK vote, 2024', { x: 0, y: 0, transform: 'translate(12,' + (M.top + (H - M.top - M.bottom) / 2) + ') rotate(-90)', 'text-anchor': 'middle', class: 'chart-axis' });

    fetch(fig.dataset.src || '/site-draft/assets/data/education-reform.json')
        .then(function (r) { return r.json(); })
        .then(draw)
        .catch(function () { fig.classList.add('chart-failed'); });

    function draw(data) {
        var dots = el('g', { class: 'chart-dots' });
        var pts = data.rows.map(function (d) {
            var c = el('circle', { cx: x(d[1]), cy: y(d[2]), r: 3.1 }, dots);
            return { d: d, c: c, px: x(d[1]), py: y(d[2]) };
        });

        // Trend line (least squares, computed from the same data)
        var f = data.fit;
        el('line', { class: 'chart-trend', x1: x(18), y1: y(f.intercept + f.slope * 18), x2: x(66), y2: y(f.intercept + f.slope * 66) });
        var perTen = Math.abs(f.slope * 10).toFixed(1);
        text('Each 10 points more graduates:', { x: x(46.5), y: y(34), class: 'chart-note-svg' });
        text('about ' + perTen + ' points less Reform', { x: x(46.5), y: y(34) + 15, class: 'chart-note-svg' });

        // Hover / tap: highlight the nearest constituency
        var hot = null;
        function nearest(evt) {
            var box = svg.getBoundingClientRect();
            var mx = (evt.clientX - box.left) * (W / box.width);
            var my = (evt.clientY - box.top) * (H / box.height);
            var best = null, bd = 400;
            pts.forEach(function (p) {
                var dd = (p.px - mx) * (p.px - mx) + (p.py - my) * (p.py - my);
                if (dd < bd) { bd = dd; best = p; }
            });
            return best;
        }
        function show(evt) {
            var p = nearest(evt);
            if (hot && hot !== p) hot.c.classList.remove('is-hot');
            if (!p) { tip.hidden = true; hot = null; return; }
            hot = p; p.c.classList.add('is-hot');
            tip.innerHTML = '<b>' + p.d[0] + '</b>' + p.d[1] + '% graduates &middot; Reform ' + p.d[2] + '%';
            tip.hidden = false;
            var box = svg.getBoundingClientRect();
            var left = p.px / W * box.width, top = p.py / H * box.height;
            tip.style.left = Math.min(Math.max(left, 90), box.width - 90) + 'px';
            tip.style.top = top + 'px';
        }
        svg.addEventListener('pointermove', show);
        svg.addEventListener('pointerdown', show);
        svg.addEventListener('pointerleave', function () {
            tip.hidden = true;
            if (hot) hot.c.classList.remove('is-hot');
            hot = null;
        });
    }
})();
