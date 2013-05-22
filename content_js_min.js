/* Copyright 2011 Google Inc. All Rights Reserved. */
(function ()
{
	function load(url, callback)
    {
        var xhr;
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = ensureReadiness;

        function ensureReadiness()
        {
            if (xhr.readyState < 4)
            {
                return;
            }
            if (xhr.status !== 200)
            {
                return;
            }
            if (xhr.readyState === 4)
            {
                callback(xhr);
            }
        }
        xhr.open('GET', url, false);
        xhr.send('');
    }
    var saveAs = saveAs || (navigator.msSaveBlob && navigator.msSaveBlob.bind(navigator)) || (function (view)
    {
        "use strict";
        var doc = view.document,
            get_URL = function ()
            {
                return view.URL || view.webkitURL || view;
            }, URL = view.URL || view.webkitURL || view,
            save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"),
            can_use_save_link = "download" in save_link,
            click = function (node)
            {
                var event = doc.createEvent("MouseEvents");
                event.initMouseEvent("click", true, false, view, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                node.dispatchEvent(event);
            }, webkit_req_fs = view.webkitRequestFileSystem,
            req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem,
            throw_outside = function (ex)
            {
                (view.setImmediate || view.setTimeout)(function ()
                {
                    throw ex;
                }, 0);
            }, force_saveable_type = "application/octet-stream",
            fs_min_size = 0,
            deletion_queue = [],
            process_deletion_queue = function ()
            {
                var i = deletion_queue.length;
                while (i--)
                {
                    var file = deletion_queue[i];
                    if (typeof file === "string")
                    {
                        URL.revokeObjectURL(file);
                    }
                    else
                    {
                        file.remove();
                    }
                }
                deletion_queue.length = 0;
            }, dispatch = function (filesaver, event_types, event)
            {
                event_types = [].concat(event_types);
                var i = event_types.length;
                while (i--)
                {
                    var listener = filesaver["on" + event_types[i]];
                    if (typeof listener === "function")
                    {
                        try
                        {
                            listener.call(filesaver, event || filesaver);
                        }
                        catch (ex)
                        {
                            throw_outside(ex);
                        }
                    }
                }
            }, FileSaver = function (blob, name)
            {
                var filesaver = this,
                    type = blob.type,
                    blob_changed = false,
                    object_url, target_view, get_object_url = function ()
                    {
                        var object_url = get_URL().createObjectURL(blob);
                        deletion_queue.push(object_url);
                        return object_url;
                    }, dispatch_all = function ()
                    {
                        dispatch(filesaver, "writestart progress write writeend".split(" "));
                    }, fs_error = function ()
                    {
                        if (blob_changed || !object_url)
                        {
                            object_url = get_object_url(blob);
                        }
                        if (target_view)
                        {
                            target_view.location.href = object_url;
                        }
                        filesaver.readyState = filesaver.DONE;
                        dispatch_all();
                    }, abortable = function (func)
                    {
                        return function ()
                        {
                            if (filesaver.readyState !== filesaver.DONE)
                            {
                                return func.apply(this, arguments);
                            }
                        };
                    }, create_if_not_found = {
                        create: true,
                        exclusive: false
                    }, slice;
                filesaver.readyState = filesaver.INIT;
                if (!name)
                {
                    name = "download";
                }
                if (can_use_save_link)
                {
                    object_url = get_object_url(blob);
                    save_link.href = object_url;
                    save_link.download = name;
                    click(save_link);
                    filesaver.readyState = filesaver.DONE;
                    dispatch_all();
                    return;
                }
                if (view.chrome && type && type !== force_saveable_type)
                {
                    slice = blob.slice || blob.webkitSlice;
                    blob = slice.call(blob, 0, blob.size, force_saveable_type);
                    blob_changed = true;
                }
                if (webkit_req_fs && name !== "download")
                {
                    name += ".download";
                }
                if (type === force_saveable_type || webkit_req_fs)
                {
                    target_view = view;
                }
                else
                {
                    target_view = view.open();
                } if (!req_fs)
                {
                    fs_error();
                    return;
                }
                fs_min_size += blob.size;
                req_fs(view.TEMPORARY, fs_min_size, abortable(function (fs)
                {
                    fs.root.getDirectory("saved", create_if_not_found, abortable(function (dir)
                    {
                        var save = function ()
                        {
                            dir.getFile(name, create_if_not_found, abortable(function (file)
                            {
                                file.createWriter(abortable(function (writer)
                                {
                                    writer.onwriteend = function (event)
                                    {
                                        target_view.location.href = file.toURL();
                                        deletion_queue.push(file);
                                        filesaver.readyState = filesaver.DONE;
                                        dispatch(filesaver, "writeend", event);
                                    };
                                    writer.onerror = function ()
                                    {
                                        var error = writer.error;
                                        if (error.code !== error.ABORT_ERR)
                                        {
                                            fs_error();
                                        }
                                    };
                                    "writestart progress write abort".split(" ").forEach(function (event)
                                    {
                                        writer["on" + event] = filesaver["on" + event];
                                    });
                                    writer.write(blob);
                                    filesaver.abort = function ()
                                    {
                                        writer.abort();
                                        filesaver.readyState = filesaver.DONE;
                                    };
                                    filesaver.
                                    readyState = filesaver.WRITING;
                                }), fs_error);
                            }), fs_error);
                        };
                        dir.getFile(name,
                        {
                            create: false
                        }, abortable(function (file)
                        {
                            file.remove();
                            save();
                        }), abortable(function (ex)
                        {
                            if (ex.code === ex.NOT_FOUND_ERR)
                            {
                                save();
                            }
                            else
                            {
                                fs_error();
                            }
                        }));
                    }), fs_error);
                }), fs_error);
            }, FS_proto = FileSaver.prototype,
            saveAs = function (blob, name)
            {
                return new FileSaver(blob, name);
            };
        FS_proto.abort = function ()
        {
            var filesaver = this;
            filesaver.readyState = filesaver.DONE;
            dispatch(filesaver, "abort");
        };
        FS_proto.readyState = FS_proto.INIT = 0;
        FS_proto.WRITING = 1;
        FS_proto.DONE = 2;
        FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null;
        view.addEventListener("unload", process_deletion_queue, false);
        return saveAs;
    }(self));

    function CurrentDate()
    {
        var d = new Date();
        var month = new Array();
        month[0] = "01";
        month[1] = "02";
        month[2] = "03";
        month[3] = "04";
        month[4] = "05";
        month[5] = "06";
        month[6] = "07";
        month[7] = "08";
        month[8] = "09";
        month[9] = "10";
        month[10] = "11";
        month[11] = "12";
        return d.getFullYear() + month[d.getMonth()] + d.getDate();
    }
	
	var word_arr={};
    var result = "";
    var element = document.createElement('style');
    element.innerHTML = "code{color: #d14;background-color: rgb(240, 250, 5);border: 1px solid #e1e1e8;}";
    document.body.appendChild(element);
	
	window.addEventListener('keydown', function (e)
    {
        if (e.keyCode == 192)
        {	
			for (var key in word_arr) 
            {
				result = result + key + '...'+word_arr[key] + '\n';
            }
			
            var blob = new Blob([result],
            {
                type: "text/plain;charset=utf-8"
            });
            saveAs(blob, CurrentDate() + ".txt");
            result = "";
        }
    }, false);
    var d = !0,
        e = null,
        g = !1,
        l, m = function (a)
        {
            return a.replace(/^\s+|\s+$/g, "")
        }, r = function (a, b)
        {
            return function ()
            {
                return b.apply(a, arguments)
            }
        }, s = function (a)
        {
            if (a && a.tagName)
            {
                var b = a.tagName.toLowerCase();
                if ("input" == b || "textarea" == b) return d
            }
            if (document.designMode && "on" == document.designMode.toLowerCase()) return d;
            for (; a; a = a.parentNode) if (a.isContentEditable) return d;
            return g
        }, u = /[0-9A-Za-z]/,
        D = function ()
        {
            chrome.extension.sendMessage(
            {
                type: "initialize"
            }, r(this, function (a)
            {
                this.C = a.instanceId;
                a = document.createElement("div");
                var b = document.createElement("a");
                b.target = "_blank";
                this.s = a.cloneNode(g);
                this.p = document.createElement("audio");
                this.p.M = d;
                this.c = a.cloneNode(g);
                this.c.id = "gdx-bubble-container";
                this.a = a.cloneNode(g);
                this.a.id = "gdx-bubble-main";
                this.c.appendChild(this.a);
                this.b = a.cloneNode(g);
                this.b.id = "gdx-bubble-query-container";
                this.q = a.cloneNode(g);
                this.q.id = "gdx-bubble-query";
                this.l = a.cloneNode(g);
                this.l.id = "gdx-bubble-audio-icon";
                var c = a.cloneNode(g);
                c.id = "gdx-bubble-query-container-end";
                this.b.appendChild(this.q);
                this.b.appendChild(this.l);
                this.b.appendChild(c);
                this.h = a.cloneNode(g);
                this.h.id = "gdx-bubble-meaning";
                this.e = a.cloneNode(g);
                this.e.id = "gdx-bubble-options-tip";
                this.e.innerHTML = y;
                this.i = a.cloneNode(g);
                this.i.id = "gdx-bubble-more";
                this.g = b.cloneNode(g);
                this.i.appendChild(this.g);
                this.d = a.cloneNode(g);
                this.d.id = "gdx-bubble-attribution";
                this.k = b.cloneNode(g);
                this.o = a.cloneNode(g);
                this.d.appendChild(this.k);
                this.d.appendChild(this.o);
                this.r = a.cloneNode(g);
                this.r.id = "gdx-bubble-close";
                this.a.appendChild(this.r);
                this.a.appendChild(this.b);
                this.a.appendChild(this.h);
                this.a.appendChild(this.e);
                this.a.appendChild(this.d);
                this.a.appendChild(this.i);
                this.n = a.cloneNode(g);
                this.n.id = "gdx-arrow-container";
                this.c.appendChild(this.n);
                this.F = z(a, "up");
                this.D = z(a, "down");
                this.B = r(this, this.K);
                this.t = r(this, this.G);
                this.u = r(this, this.H);
                this.w = r(this, this.f);
                this.A = r(this, this.J);
                this.v = r(this, this.I);
                A("mouseup", this.B, document);
                A("click", this.t, document);
                A("dblclick", this.u, document);
                A("resize", this.w, window);
                A("keydown",
                    this.A, document);
                A("click", r(this.p, this.p.play), this.l);
                chrome.extension.onMessage.addListener(C);
                chrome.extension.onMessage.addListener(this.v)
            }))
        }, E = [],
        y = "Tip: Didn't want this definition pop-up? Try setting a trigger key in <a href=\"" + chrome.extension.getURL("options.html") + '" target="_blank">Extension Options</a>.';
    l = D.prototype;
    l.m = 0;
    l.s = e;
    l.p = e;
    l.c = e;
    l.a = e;
    l.b = e;
    l.q = e;
    l.l = e;
    l.h = e;
    l.e = e;
    l.r = e;
    l.i = e;
    l.g = e;
    l.d = e;
    l.k = e;
    l.o = e;
    l.n = e;
    l.F = e;
    l.D = e;
    l.j = e;
    l.B = e;
    l.t = e;
    l.u = e;
    l.w = e;
    l.A = e;
    l.v = e;
    var A = function (a, b, c)
    {
        document.addEventListener ? c.addEventListener(a, b, g) : c.attachEvent("on" + a, b)
    }, F = function (a, b, c)
        {
            document.removeEventListener ? c.removeEventListener(a, b, g) : c.detachEvent("on" + a, b)
        }, G = function (a)
        {
            F("mouseup", a.B, document);
            F("click", a.t, document);
            F("dblclick", a.u, document);
            F("resize", a.w, window);
            F("keydown", a.A, document);
            chrome.extension.onMessage.removeListener(C);
            chrome.extension.onMessage.removeListener(a.v);
            a.f()
        }, z = function (a, b)
        {
            var c = a.cloneNode(g),
                h = a.cloneNode(g),
                f = a.cloneNode(g);
            c.id = "gdx-arrow-main";
            "up" == b ? (h.id = "gdx-bubble-arrow-inner-up", f.id = "gdx-bubble-arrow-outer-up") : (h.id = "gdx-bubble-arrow-inner-down", f.id = "gdx-bubble-arrow-outer-down");
            c.appendChild(h);
            c.appendChild(f);
            return c
        }, H = function (a, b, c, h)
        {
            this.left = a;
            this.top = b;
            this.right = c;
            this.bottom = h
        }, J = function (a)
        {
            a.a.style.left = "0";
            a.a.style.top = "0";
            var b = a.a.offsetWidth,
                c = a.a.offsetHeight,
                h = [self.pageXOffset, self.pageYOffset],
                f = [a.j.left + h[0], a.j.top + h[1]],
                k = a.j.bottom - a.j.top,
                t = f[0] + (a.j.right - a.j.left) / 2,
                h = document.documentElement.offsetWidth +
                    document.body.scrollLeft,
                B = document.body.scrollLeft,
                p = t - b / 2;
            p + b > h && (p = h - b);
            p < B && (p = B);
            var w = f[1] - c - 12 + 2,
                q = f[1] + k + 12 - 2;
            a: if (b = new H(p, w, p + b, w + c), b.top < document.body.scrollTop) b = g;
            else
            {
                for (var c = document.getElementsByTagName("embed"), I = document.getElementsByTagName("object"), x = [self.pageXOffset, self.pageYOffset], v = 0, N = c.length + I.length; v < N; v++)
                {
                    var n = (v < c.length ? c[v] : I[v - c.length]).getBoundingClientRect(),
                        n = new H(n.left + x[0], n.top + x[1], n.right + x[0], n.bottom + x[1]);
                    if (b.bottom > n.top && n.bottom > b.top &&
                        b.left < n.right && n.left < b.right)
                    {
                        b = g;
                        break a
                    }
                }
                b = d
            }
            b ? (q = a.D, q.style.top = f[1] - 12 + "px") : (w = q, q = a.F, q.style.top = f[1] + k + "px");
            f = t - 12;
            q.style.left = f + "px";
            f - 5 > B && f + 24 + 5 < h && a.n.appendChild(q);
            a.a.style.top = w + "px";
            a.a.style.left = p + "px"
        };
    D.prototype.L = function (a)
    {
        if (a.eventKey == this.m)
        {
            this.f();
            this.l.className = "gdx-display-none";
            this.e.className = "gdx-display-none";
            this.i.className = "gdx-display-block";
            this.d.className = "gdx-display-none";
            if (a.meaningObj)
            {
                var b = a.meaningObj;
				word_arr[a.sanitizedQuery] = b.meaningText;
                this.b.className = "gdx-display-block";
                this.q.innerHTML = b.prettyQuery;
                this.h.innerHTML = b.meaningText;
                b.audio && (this.p.src = b.audio, this.l.className = "gdx-display-block");
                this.g.href = b.moreUrl;
                this.g.innerHTML = "More \u00bb";
                b.attribution && ("translation" == b.type ? (this.o.innerHTML =
                    b.attribution, this.k.className = "gdx-display-none", this.o.className = "gdx-display-inline") : (this.s.innerHTML = b.attribution, b = this.s.getElementsByTagName("a")[0], this.k.href = b.href, this.k.innerHTML = b.innerHTML.replace("http://", ""), this.k.className = "gdx-display-inline", this.o.className = "gdx-display-none"), this.d.className = "gdx-display-block")
            }
            else this.b.className = "gdx-display-none", this.h.innerHTML = "No definition found.", this.g.href = "http://www.google.com/search?q=" + encodeURIComponent(a.sanitizedQuery),
            this.g.innerHTML = 'Search the web for "' + a.sanitizedQuery + '" \u00bb';
            a.showOptionsTip && (this.e.className = "gdx-display-block");
            document.documentElement.appendChild(this.c);
            J(this)
        }
    };
    var K = function (a, b)
    {
        b == a.m && (a.h.innerHTML = "Dictionary is disabled for https pages.", a.g.href = "http://support.google.com/TODO", a.g.innerHTML = "More information \u00bb", a.i.className = "gdx-display-block", a.b.className = "gdx-display-none", a.e.className = "gdx-display-none", a.d.className = "gdx-display-none", document.documentElement.appendChild(a.c), J(a))
    }, L = function (a, b)
        {
            var c = b.getBoundingClientRect();
            a.j = new H(c.left, c.top, c.right, c.bottom)
        };
    D.prototype.f = function ()
    {
        this.m++;
        var a = this.c;
        a && a.parentNode && a.parentNode.removeChild(a);
        for (a = this.n; a && a.hasChildNodes();) a.removeChild(a.childNodes[0])
    };
    D.prototype.J = function (a)
    {
        27 == a.keyCode && this.f()
    };
    var M = function (a, b)
    {
        return "none" == b || "alt" == b && a.altKey || "ctrl" == b && (-1 != window.navigator.platform.toLowerCase().indexOf("mac") ? a.metaKey : a.ctrlKey) || "shift" == b && a.shiftKey
    }, O = function (a, b)
        {
            for (var c = b.target; c; c = c.parentNode) if (c == a.c) return d;
            return g
        }, P = function (a, b, c, h)
        {
			
            var f;
            "mouseup" == c ? f = "true" == h.popupSelect && M(b, h.popupSelectKey) : "dblclick" == c ? f = "true" == h.popupSelect && M(b, h.popupSelectKey) ? g : "true" == h.popupDblclick && M(b, h.popupDblclickKey) : (console.log("Unexpected eventType: " + c), f = g);
            if (f)
            {
				
                f =
                    0;
				var selection = window.getSelection();
                for (var k = E.length; f < k; f++) if (location.href.match(E[f])) return;
                if (!s(b.target) && (f = e, k = "", window.getSelection ? (k = window.getSelection(), f = k.getRangeAt(0), k = m(k.toString())) : document.selection && (f = document.selection.createRange(), k = m(f.text)), k && !(1 == k.length && 127 >= k.charCodeAt(0) && !k.match(u)) && !("dblclick" == c && -1 != k.indexOf(" "))))
                {
                    a.m++;
                    var t = a.m;
                    O(a, b) || L(a, f);
                    "false" == h.enableHttps && 0 == location.href.lastIndexOf("https", 0) ? K(a, t) : (window.setTimeout(r(a, function ()
                    {
                        t == this.m && (this.h.innerHTML =
                            "Searching...", this.b.className = "gdx-display-none", this.e.className = "gdx-display-none", this.i.className = "gdx-display-none", this.d.className = "gdx-display-none", document.documentElement.appendChild(this.c), J(this))
                    }), 300), chrome.extension.sendMessage(
                    {
                        type: "fetch_raw",
                        eventKey: t,
                        instanceId: a.C,
                        query: k
                    }, r(a, a.L)))
                }

				//alex add 130516
				var word =k;
				var reg = new RegExp("[a-zA-Z]{2,30}");
		        if ((word.match(reg)) == word)
		        {
		            if (selection.focusNode.parentNode.tagName == "CODE") str = selection.focusNode.parentNode.parentNode.innerHTML;
		            else str = selection.focusNode.parentNode.innerHTML;
		            var n = str.search("\\b" + word + "\\b");
		            if (str.substring(n - 6, n) == "<code>")
		            {
		                var re = new RegExp("<code>" + word + "</code>", 'g');
		                str = str.replace(re, word);
		                if (selection.focusNode.parentNode.tagName == "CODE") selection.focusNode.parentNode.parentNode.innerHTML = str;
		                else selection.focusNode.parentNode.innerHTML = str;
						delete word_arr[word];
		                
		            }
		            else
		            {
		                var re = new RegExp("\\b" + word + "\\b", 'g');
		                str = str.replace(re, "<code>" + word + "</code>");
		                selection.focusNode.parentNode.innerHTML = str;
		                
		            }
		        }
				////////////alex end
			
            }
        };
    D.prototype.K = function (a)
    {
        var b = a.target;
        if (O(this, a)) if (b == this.r) this.f();
            else
            {
                if ("a" == b.tagName.toLowerCase()) return
            }
            else this.f();
        chrome.extension.sendMessage(
        {
            type: "options"
        }, r(this, function (b)
        {
            P(this, a, "mouseup", b.options)
        }))
    };
    D.prototype.G = function (a)
    {
        var b = a.target;
        O(this, a) && "a" == b.tagName.toLowerCase() && this.f()
    };
    D.prototype.H = function (a)
    {
        chrome.extension.sendMessage(
        {
            type: "options"
        }, r(this, function (b)
        {
            P(this, a, "dblclick", b.options)
        }))
    };
    var C = function (a, b, c)
    {
        "get_selection" == a.type && (a = m(window.getSelection().toString())) && c(
        {
            selection: a
        })
    };
    D.prototype.I = function (a)
    {
        "hide" == a.type && a.instanceId == this.C && this.f()
    };
    window._dictBubbleInstance && G(window._dictBubbleInstance);
    window._gdxBubbleInstance && G(window._gdxBubbleInstance);
    window.gdxBubbleInstance && G(window.gdxBubbleInstance);
    window.gdxBubbleInstance = new D;
})();
