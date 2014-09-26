(function()
{

	var saveAs = saveAs
			|| (navigator.msSaveBlob && navigator.msSaveBlob.bind(navigator))
			|| (function(view)
			{
				"use strict";
				var doc = view.document, get_URL = function()
				{
					return view.URL || view.webkitURL || view;
				}, URL = view.URL || view.webkitURL || view, save_link = doc
						.createElementNS("http://www.w3.org/1999/xhtml", "a"), can_use_save_link = "download" in save_link, click = function(
						node)
				{
					var event = doc.createEvent("MouseEvents");
					event.initMouseEvent("click", true, false, view, 0, 0, 0,
							0, 0, false, false, false, false, 0, null);
					node.dispatchEvent(event);
				}, webkit_req_fs = view.webkitRequestFileSystem, req_fs = view.requestFileSystem
						|| webkit_req_fs || view.mozRequestFileSystem, throw_outside = function(
						ex)
				{
					(view.setImmediate || view.setTimeout)(function()
					{
						throw ex;
					}, 0);
				}, force_saveable_type = "application/octet-stream", fs_min_size = 0, deletion_queue = [], process_deletion_queue = function()
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
				}, dispatch = function(filesaver, event_types, event)
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
				}, FileSaver = function(blob, name)
				{
					var filesaver = this, type = blob.type, blob_changed = false, object_url, target_view, get_object_url = function()
					{
						var object_url = get_URL().createObjectURL(blob);
						deletion_queue.push(object_url);
						return object_url;
					}, dispatch_all = function()
					{
						dispatch(filesaver,
								"writestart progress write writeend".split(" "));
					}, fs_error = function()
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
					}, abortable = function(func)
					{
						return function()
						{
							if (filesaver.readyState !== filesaver.DONE)
							{
								return func.apply(this, arguments);
							}
						};
					}, create_if_not_found =
					{
						create : true,
						exclusive : false
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
						blob = slice.call(blob, 0, blob.size,
								force_saveable_type);
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
					}
					if (!req_fs)
					{
						fs_error();
						return;
					}
					fs_min_size += blob.size;
					req_fs(
							view.TEMPORARY,
							fs_min_size,
							abortable(function(fs)
							{
								fs.root
										.getDirectory(
												"saved",
												create_if_not_found,
												abortable(function(dir)
												{
													var save = function()
													{
														dir
																.getFile(
																		name,
																		create_if_not_found,
																		abortable(function(
																				file)
																		{
																			file
																					.createWriter(
																							abortable(function(
																									writer)
																							{
																								writer.onwriteend = function(
																										event)
																								{
																									target_view.location.href = file
																											.toURL();
																									deletion_queue
																											.push(file);
																									filesaver.readyState = filesaver.DONE;
																									dispatch(
																											filesaver,
																											"writeend",
																											event);
																								};
																								writer.onerror = function()
																								{
																									var error = writer.error;
																									if (error.code !== error.ABORT_ERR)
																									{
																										fs_error();
																									}
																								};
																								"writestart progress write abort"
																										.split(
																												" ")
																										.forEach(
																												function(
																														event)
																												{
																													writer["on"
																															+ event] = filesaver["on"
																															+ event];
																												});
																								writer
																										.write(blob);
																								filesaver.abort = function()
																								{
																									writer
																											.abort();
																									filesaver.readyState = filesaver.DONE;
																								};
																								filesaver.readyState = filesaver.WRITING;
																							}),
																							fs_error);
																		}),
																		fs_error);
													};
													dir
															.getFile(
																	name,
																	{
																		create : false
																	},
																	abortable(function(
																			file)
																	{
																		file
																				.remove();
																		save();
																	}),
																	abortable(function(
																			ex)
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
				}, FS_proto = FileSaver.prototype, saveAs = function(blob, name)
				{
					return new FileSaver(blob, name);
				};
				FS_proto.abort = function()
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

	var last_word = "";
	var should_choose_sentence = 0;
	var word_arr = {};
	var result = "";
	var element = document.createElement('style');
	element.innerHTML = "alex{color: #d14;background-color: rgb(240, 250, 5);}";
	document.body.appendChild(element);

	window
			.addEventListener(
					'keydown',
					function(e)
					{
						if (e.keyCode == 192)
						{
							for ( var key in word_arr)
							{
								result = result + key + '...' + word_arr[key]
										+ '\r\n';
							}

							var blob = new Blob(
							[ result ],
							{
								type : "text/plain;charset=utf-8"
							});
							saveAs(blob, CurrentDate() + ".txt");
							result = "";
						}

						if (e.keyCode == 27)
						{

							if (last_word == "")
							{
								alert("Select your word first!")
							}
							else
							{
								var selection = window.getSelection();

								if (selection.toString().trim().indexOf(
										last_word) > -1)
								{
									word_arr[last_word] = selection.toString()
											.trim();
									should_choose_sentence = 0;
								}
								else
									alert("Your word is not included in the sentence you have selected,please select again");

							}
						}

					}, false);

	window.addEventListener('mouseup', function()
	{
		var selection = window.getSelection();
		var word = selection.toString().trim();
		var reg = new RegExp("[a-zA-Z]{2,30}");
		if ((word.match(reg)) == word)
		{
			if (selection.focusNode.parentNode.tagName == "ALEX")
				str = selection.focusNode.parentNode.parentNode.innerHTML;
			else
				str = selection.focusNode.parentNode.innerHTML;
			var n = str.search("\\b" + word + "\\b");
			if (str.substring(n - 6, n) == "<alex>")
			{
				var re = new RegExp("<alex>" + word + "</alex>", 'g');
				str = str.replace(re, word);
				if (selection.focusNode.parentNode.tagName == "ALEX")
					selection.focusNode.parentNode.parentNode.innerHTML = str;
				else
					selection.focusNode.parentNode.innerHTML = str;
				delete word_arr[word];
				last_word = "";
				should_choose_sentence = 0;

			}
			else
			{
				if (should_choose_sentence == 0)
				{
					var re = new RegExp("\\b" + word + "\\b", 'g');
					str = str.replace(re, "<alex>" + word + "</alex>");
					selection.focusNode.parentNode.innerHTML = str;
					last_word = word;
					should_choose_sentence = 1;
				}

			}
		}
	}, false);

	var element = document.createElement('script');
	element.setAttribute('src', 'http://dict.cn/hc/init.php');
	document.body.appendChild(element);

})();