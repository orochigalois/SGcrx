(function ()
{
    var f = document;

    function g(a, e, b)
    {
        a[e] = b
    };
    var h = function (a, e)
    {
        for (var b = a.split(/\./), d = window, c = 0; c < b.length - 1; c++) d[b[c]] || (d[b[c]] = {}), d = d[b[c]];
        d[b[b.length - 1]] = e
    };
    if (!k) var k = g;
    var l = {
        ar: 1,
        bg: 1,
        ca: 1,
        cs: 1,
        da: 1,
        de: 1,
        el: 1,
        es: 1,
        et: 1,
        fi: 1,
        fr: 1,
        gl: 1,
        hi: 1,
        hr: 1,
        hu: 1,
        id: 1,
        it: 1,
        iw: 1,
        ja: 1,
        ko: 1,
        lt: 1,
        lv: 1,
        mt: 1,
        nl: 1,
        no: 1,
        pl: 1,
        "pt-BR": 1,
        "pt-PT": 1,
        ro: 1,
        ru: 1,
        sk: 1,
        sl: 1,
        sq: 1,
        sr: 1,
        sv: 1,
        th: 1,
        tr: 1,
        uk: 1,
        vi: 1,
        "zh-TW": 1,
        "zh-CN": 1
    }, m;

    function n()
    {
        "undefined" == typeof m && (m = -1 != navigator.userAgent.toLowerCase().indexOf("msie"));
        return m
    }
    h("dict_api.load", function (a, e, b, d)
    {
        e = a.indexOf("?"); - 1 != e && (h("dict_api.cgiParams", a.substring(e + 1)), a = a.substring(0, e));
        h("dict_api.serviceBase", a);
        a = [a, "/dictionary/js/dictionary_api_compiled"];
        b && l[b] && a.push("_", b);
        a.push(".js");
        a = a.join("");
        (b = f.getElementsByTagName("head")[0]) || (b = f.body.parentNode.appendChild(f.createElement("head")));
        var c = f.createElement("script");
        c.type = "text/javascript";
        c.src = a;
        if (d)
        {
            var j = d;
            d = function ()
            {
                if ((!n() || !("complete" != c.readyState && "loaded" != c.readyState)) &&
                    j) j(), j = null
            };
            n() ? c.onreadystatechange = d : c.onload = d
        }
        b.appendChild(c)
    });
})();