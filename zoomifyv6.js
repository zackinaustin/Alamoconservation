$(document).ready(function () {
	var imgWidth = 22346;
	var imgHeight = 31438;
	var url = 'https://razor.ischool.utexas.edu/AlamoConservation/wall-images/A-Bay1south/A-bay1south_img/';
	var crossOrigin = 'anonymous';
	var imgCenter = [imgWidth / 2, -imgHeight / 2];
	/**
	 * Elements that make up the popup.
	 */
	var pop = document.getElementById('pop');
	var content = document.getElementById('popup-content');
	var closer = document.getElementById('popup-closer');
	var submit = document.getElementById('yes');
	//variabale used for data storage
	var selectedfeature;
	var addfeature;
	var format;
	var data;
	var properties = {};
	/**
	 * Add a click handler to hide the popup.
	 * @return {boolean} Don't follow the href.
	 */
	var overlay = new ol.Overlay({
		/*  element: container */
		element: content
	});
	var disoverlay = new ol.Overlay({
		/*  element: container */
		stopEvent: false,
		element: pop
	});
	// Maps always need a projection, but the static image is not geo-referenced,
	// and are only measured in pixels.  So, we create a fake projection that the
	// map can use to properly display the layer.
	var proj = new ol.proj.Projection({
		code: 'ZOOMIFY',
		units: 'pixels',
		extent: [0, 0, imgWidth, imgHeight]
	});
	var mousePositionControl = new ol.control.MousePosition({
		coordinateFormat: ol.coordinate.createStringXY(4),
		projection: proj,
		// comment the following two lines to have the mouse position
		// be placed within the map.
		className: 'custom-mouse-position',
		target: document.getElementById('mouse-position'),
		undefinedHTML: '&nbsp;'
	});
	var source = new ol.source.Zoomify({
		url: url,
		size: [imgWidth, imgHeight],
		crossOrigin: crossOrigin,
		projection: proj,
	});
	var vector_layer = new ol.layer.Vector({
		name: 'my_vectorlayer',
		source: new ol.source.GeoJSON({
			projection: proj,
			url: '/AlamoConservation/php/data_reader.php'
		}),
		style: new ol.style.Style({
			fill: new ol.style.Fill({
				color: '#ffffff'
			}),
			stroke: new ol.style.Stroke({
				color: '#000000',
				width: 5
			}),
			image: new ol.style.Circle({
				radius: 7,
				fill: new ol.style.Fill({
					color: '#ffcc33'
				})
			})
		}),
		opacity: 0.5
	});
	//operation after composing vector_layer
	vector_layer.on("postcompose", function () {
		var vectorlayer_features = vector_layer.getSource().getFeatures();
		vectorlayer_features.forEach(function (afeature) {
			if (afeature.get("Color")) {
				afeature.setStyle(new ol.style.Style({
					fill: new ol.style.Fill({
						color: afeature.get("Color"),
						opacity: 0.3
					}),
					stroke: new ol.style.Stroke({
						color: afeature.get("Color"),
						width: 2
					}),
					image: new ol.style.Circle({
						radius: 7,
						fill: new ol.style.Fill({
							color: '#ffcc33'
						})
					})
				}))
			}
		});
	})
	var map = new ol.Map({
		controls: ol.control.defaults({
			attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
				collapsible: false
			})
		}).extend([mousePositionControl]),
		layers: [
			new ol.layer.Tile({
				source: source,
			}),
			vector_layer
		],
		/* renderer: exampleNS.getRendererFromQueryString(), */
		overlays: [overlay, disoverlay],
		target: 'map',
		view: new ol.View({
			projection: proj,
			center: imgCenter,
			// minResolution:1,
			// extent:[0, 0, 100, 900],
			minZoom: 1.7,
			zoom: 1,
			extent: [0, -imgHeight, imgWidth, 0],
		})
	});
	// make interactions global so they can later be removed
	var select_interaction,
		draw_interaction,
		modify_interaction;
	// get the interaction type
	var $interaction_type = $('[name="interaction_type"]');
	// rebuild interaction when changed
	$interaction_type.on('click', function (e) {
		// add new interaction
		if (this.value === 'draw') {
			addDrawInteraction();
		} else {
			addModifyInteraction();
		}
	});
	var $geom_type = $('#geom_type');
	// rebuild interaction when the geometry type is changed
	$geom_type.on('change', function (e) {
		map.removeInteraction(draw_interaction);
		addDrawInteraction();
		$("#type").children().show();
		if ($('#geom_type').val() === "Polygon") {
			$(".type_option[value!='Efflorescence']").hide();
		}
	});
	// get data type to save in
	$data_type = $('#data_type');
	// clear map and rebuild interaction when changed
	$data_type.onchange = function () {
		clearMap();
		map.removeInteraction(draw_interaction);
		addDrawInteraction();
	};

	function addModifyInteraction() {
		$("#popup-content").hide();
		// remove draw interaction
		map.removeInteraction(draw_interaction);
		// create select interaction
		select_interaction = new ol.interaction.Select({
			// make sure only the desired layer can be selected
			layers: function (vector_layer) {
				return vector_layer.get('name') === 'my_vectorlayer';
			}
		});
		map.addInteraction(select_interaction);
		// grab the features from the select interaction to use in the modify interaction
		var selected_features = select_interaction.getFeatures();
		// when a feature is selected...
		selected_features.on('add', function (event) {
			$("#forpigment").hide();
			// grab the feature
			var feature = event.element;
			console.log(feature.get("Wall") + feature.getGeometry().getLastCoordinate());
			pop.style.display = 'block';
			disoverlay.setPosition(feature.getGeometry().getLastCoordinate());
			$("#diswall").html(feature.get("Wall"));
			$("#distype").html(feature.get("Type"));
			if (feature.get("Type") === "Pigment") {
				$("#forpigment").show();
				$("#discolor").html(feature.get("Color"));
				$("#disactor").html(feature.get("Actor"));
			}
			if (typeof feature.getProperties(files).files != "undefined") {
				console.log(feature.getProperties(files));
				$("#disfiles").show();
				$("#disfile").html(feature.getProperties(files).files[0].name);
				$("#disfile").attr("href", feature.getProperties(files).files[0].url);
			} else {
				$("#disfiles").hide();
				console.log("none");
			}
			// ...listen for changes and save them
			feature.on('change', saveData);
			// listen to pressing of delete key, then delete selected features
			$(document).on('keyup', function (event) {
				if (event.keyCode == 46) {
					// remove all selected features from select_interaction and my_vectorlayer
					selected_features.forEach(function (selected_feature) {
						var selected_feature_id = selected_feature.getId();
						// remove from select_interaction
						selected_features.remove(selected_feature);
						// features aus vectorlayer entfernen
						var vectorlayer_features = vector_layer.getSource().getFeatures();
						vectorlayer_features.forEach(function (source_feature) {
							var source_feature_id = source_feature.getId();
							if (source_feature_id === selected_feature_id) {
								// remove from my_vectorlayer
								vector_layer.getSource().removeFeature(source_feature);
								// save the changed data
								saveData();
							}
						});
					});
					// remove listener
					$(document).off('keyup');
				}
			});
		});
		selected_features.on('remove', function (event) {
			pop.style.display = 'none';
		})
		// create the modify interaction
		modify_interaction = new ol.interaction.Modify({
			features: selected_features,
			// delete vertices by pressing the SHIFT key
			deleteCondition: function (event) {
				return ol.events.condition.shiftKeyOnly(event) &&
					ol.events.condition.singleClick(event);
			}
		});
		// add it to the map
		map.addInteraction(modify_interaction);
	}
	// creates a draw interaction
	function addDrawInteraction() {
		$("pop").hide();
		$("#forpigment").hide();
		// remove other interactions
		map.removeInteraction(select_interaction);
		map.removeInteraction(modify_interaction);
		// create the interaction
		draw_interaction = new ol.interaction.Draw({
			source: vector_layer.getSource(),
			type: /** @type {ol.geom.GeometryType} */ ($geom_type.val())
		});
		// add it to the map
		map.addInteraction(draw_interaction);
		// when a new feature has been drawn...
		draw_interaction.on('drawend', function (event) {
			$('#files').empty();
			var id = uid();
			// give the feature this id
			event.feature.setId(id);
			document.getElementById("option_default").selected = true;
			$(".color-control").hide();
			$(".actor-control").hide();
			// create a unique id
			// console.log(JSON.stringify(event));
			try {
				vector_layer.getSource().removeFeature(selectedfeature);
			} catch (e) {};
			var coordinate = event.feature.getGeometry().getLastCoordinate();
			selectedfeature = event.feature;
			if (getX(coordinate) >= 0 && getX(coordinate) <= 22346 && getY(coordinate) <= 0 && getY(coordinate) >= (-31438)) {
				var hdms = ol.coordinate.toStringXY(coordinate);
				overlay.setPosition(coordinate);
				content.style.display = 'block';
				adjust($("div.ol-overlaycontainer-stopevent div:first-child"), 875, 965);
				/*
$("div.ol-overlaycontainer-stopevent div:first-child").position({
					of:$("div.ol-overlaycontainer-stopevent"),
					collision:"fit"
				})
*/
				// it is later needed to delete features
				var id = uid();
				// give the feature this id
				event.feature.setId(id);
			} else {
				vector_layer.getSource().removeFeature(selectedfeature);
			}
			// save the changed data
			/* saveData(); */
			// console.log($("#loginform").position().left);
		});
	}
	// add the draw interaction when the page is first shown
	addDrawInteraction();
	// shows data in textarea
	// replace this function by what you need
	function writeData(){
		// get the format the user has chosen
		if ($data_type.val() === 'GeoJSON') {
			// format is JSON
			$('#data').val(JSON.stringify(data, null, 4));
		} else {
			// format is XML (GPX or KML)
			var serializer = new XMLSerializer();
			$('#data').val(serializer.serializeToString(data));
		}
	}

	function saveData() {
		// get the format the user has chosen
		var data_type = $data_type.val(),
			// define a format the data shall be converted to
			// this will be the data in the chosen format
			format = new ol.format[$data_type.val()]();
		try {
			// convert the data of the vector_layer into the chosen format
			data = format.writeFeatures(vector_layer.getSource().getFeatures());
			/* data＝format.writeFeatures() */
		} catch (e) {
			// at time of creation there is an error in the GPX format (18.7.2014)
			$('#data').val(e.name + ": " + e.message);
			return;
		}
		if ($data_type.val() === 'GeoJSON') {
			// format is JSON
			$('#data').val(JSON.stringify(data, null, 4));
		} else {
			// format is XML (GPX or KML)
			var serializer = new XMLSerializer();
			$('#data').val(serializer.serializeToString(data));
		}
		var myJSONString = JSON.stringify(data);
		var ReadyString = myJSONString.replace(/\\n/g, "\\n")
			.replace(/\\'/g, "\\'")
			.replace(/\\"/g, '\\"')
			.replace(/\\&/g, "\\&")
			.replace(/\\r/g, "\\r")
			.replace(/\\t/g, "\\t")
			.replace(/\\b/g, "\\b")
			.replace(/\\f/g, "\\f");
		console.log(ReadyString);
		$.ajax({
			type: "post",
			url: "php/db.php",
			data: 'data=' + ReadyString,
			beforeSend: function (jqXHR, settings) {
				var url = settings.url + "?" + settings.data;
				console.log(url);
			},
			error: function (XMLHttpRequest, textStatus, errorThrown) {
				alert("before error");
				alert(XMLHttpRequest.status);
				alert(XMLHttpRequest.readyState);
				alert(textStatus);
			},
			complete: function (msg) {
				console.log("sent");
			},
		});
	}
	//event listener for element
	// clear map when user clicks on 'Delete all features'
	$("#delete").click(function () {
		clearMap();
	});
	$("#cancel").on("click", function (evet) {
		$(".color-control").hide();
		$(".actor-control").hide();
		content.style.display = 'none';
		vector_layer.getSource().removeFeature(selectedfeature);
		$('#files').empty();
	});
	submit.onclick = function () {
		if ($('#type').val() === "Select") {
			alert("Please select a type");
		} else {
			$(".color-control").hide();
			$(".actor-control").hide();
			content.style.display = 'none';
			console.log("hit submit");
			format = new ol.format[$data_type.val()]();
			/* data = format.writeFeature(selectedfeature); */
			properties.Type = $('#type').val();
			if ($("#type").val() === "Pigment") {
				properties.Color = $('#color').val();
				properties.Actor = $('#actor').val();
			}
			if ($("#type").val() === "Graffiti") {
				properties.Actor = $('#actor').val();
			}
			properties.initialDate = $("#initialDate").val();
			properties.foundDate = $("#foundDate").val();
			properties.entryDate = getTodayDate();
			console.log(selectedfeature.getId());
			properties.thisid = selectedfeature.getId();
			selectedfeature.setStyle(new ol.style.Style({
				fill: new ol.style.Fill({
					color: $('#color').val(),
					opacity: 0.3
				}),
				stroke: new ol.style.Stroke({
					color: '#ffcc33',
					width: 2
				}),
				image: new ol.style.Circle({
					radius: 7,
					fill: new ol.style.Fill({
						color: '#ffcc33'
					})
				})
			}))
			selectedfeature.setProperties(properties);
			console.log(data);
			writeData();
			/*
var myJSONString = JSON.stringify(data);
			var ReadyString = myJSONString.replace(/\\n/g, "\\n")
				.replace(/\\'/g, "\\'")
				.replace(/\\"/g, '\\"')
				.replace(/\\&/g, "\\&")
				.replace(/\\r/g, "\\r")
				.replace(/\\t/g, "\\t")
				.replace(/\\b/g, "\\b")
				.replace(/\\f/g, "\\f");
			console.log(ReadyString);
			$.ajax({
				type: "post",
				url: "data.php",
				data: 'data=' + ReadyString,
				beforeSend: function (jqXHR, settings) {
					var url = settings.url + "?" + settings.data;
					alert(url);
				},
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					alert("before error");
					alert(XMLHttpRequest.status);
					alert(XMLHttpRequest.readyState);
					alert(textStatus);
				},
				complete: function (msg) {
					console.log("sent");
				},
			});
*/
			saveData();
			selectedfeature = null;
			properties = {};
			$('#files').empty();
		};
	};
	$("#type").on("change", function () {
		console.log("changed");
		console.log($("#type").val());
		if ($("#type").val() !== "Pigment") {
			console.log("here we go");
			$(".color-control").hide();
			$(".actor-control").hide();
		}
		if ($("#type").val() !== "Grafitti") {
			console.log("here we go");
			$(".actor-control").hide();
		}
		if ($("#type").val() === "Grafitti") {
			$(".actor-control").show();
		}
		if ($("#type").val() === "Pigment") {
			console.log("here we go");
			$(".color-control").show();
			$(".actor-control").show();
		}
	});
	closer.onclick = function () {
		vector_layer.getSource().removeFeature(selectedfeature);
		content.style.display = 'none';
		closer.blur();
		return false;
		$('#files').empty();
	};
	//independent function called above
	function getTodayDate() {
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth() + 1; //January is 0!
		var yyyy = today.getFullYear();
		if (dd < 10) {
			dd = '0' + dd
		}
		if (mm < 10) {
			mm = '0' + mm
		}
		today = mm + '/' + dd + '/' + yyyy;
		return today;
	}
	// clears the map and the output of the data
	function clearMap() {
		vector_layer.getSource().clear();
		if (select_interaction) {
			select_interaction.getFeatures().clear();
		}
		$('#data').val('');
	}
	// creates unique id's
	function uid() {
		var id = 0;
		return function () {
			if (arguments[0] === 0) {
				id = 0;
			}
			return id++;
		}
	}

	function adjust(element, width, height) {
		if (element.offset().left + element.width() > $("#map").offset().left + $("#map").width()) {
			element.offset({
				left: element.offset().left - element.width()
			});
		};
		if (element.offset().top + element.height() > $("#map").offset().top + $("#map").height()) {
			element.offset({
				top: $("#map").offset().top + $("#map").height() - element.height()
			});
		}
	}

	function uploadadjust(element, width, height) {
		if (element.offset().top + element.height() > $("#map").offset().top + $("#map").height()) {
			element.offset({
				top: $("#map").offset().top + $("#map").height() - element.height()
			});
			
			
		}
		$("div#files div:first-child").removeAttr('style');
	}

	function getX(coordinate) {
		var format = "{x}";
		return parseFloat(ol.coordinate.format(coordinate, format, 4));
	}

	function getY(coordinate) {
		var format = "{y}";
		return parseFloat(ol.coordinate.format(coordinate, format, 4));
	}
	//file upload function
	var url = window.location.hostname === 'blueimp.github.io' ?
		'//jquery-file-upload.appspot.com/' : 'php/',
		uploadButton = $('<a/>')
			.addClass('btn btn-primary')
			.prop('disabled', true)
			.text('Processing...')
			.on('click', function () {
				var $this = $(this),
					data = $this.data();
				$this
					.off('click')
					.text('Abort')
					.on('click', function () {
						$this.remove();
						data.abort();
					});
				data.submit().always(function () {
					$this.remove();
				});
			});
	$('#fileupload').fileupload({
		url: url,
		dataType: 'json',
		autoUpload: false,
		acceptFileTypes: /(\.|\/)(gif|jpe?g|png|pdf|doc?x|xls?x)$/i,
		maxFileSize: 5000000, // 5 MB
		// Enable image resizing, except for Android and Opera,
		// which actually support image resizing, but fail to
		// send Blob objects via XHR requests:
		disableImageResize: /Android(?!.*Chrome)|Opera/
			.test(window.navigator.userAgent),
		previewMaxWidth: 100,
		previewMaxHeight: 100,
		previewCrop: true
	}).on('fileuploadadd', function (e, data) {
		data.context = $('<div/>').appendTo('#files');
		$.each(data.files, function (index, file) {
			var node = $('<p/>')
				.append($('<span/>').text(file.name));
			if (!index) {
				node
					.append('<br>')
					.append(uploadButton.clone(true).data(data));
			}
			node.appendTo(data.context);
		});
	}).on('fileuploadprocessalways', function (e, data) {
		var index = data.index,
			file = data.files[index],
			node = $(data.context.children()[index]);
		if (file.preview) {
			node
				.prepend('<br>')
				.prepend(file.preview);
		}
		if (file.error) {
			node
				.append('<br>')
				.append($('<span class="text-danger"/>').text(file.error));
		}
		if (index + 1 === data.files.length) {
			data.context.find('a')
				.text('Upload')
				.prop('disabled', !! data.files.error);
		}
		uploadadjust($("div.ol-overlaycontainer-stopevent div:first-child"), 875, 965);
	}).on('fileuploadprogressall', function (e, data) {
		var progress = parseInt(data.loaded / data.total * 100, 10);
		$('#progress .progress-bar').css(
			'width',
			progress + '%'
		);
	}).on('fileuploaddone', function (e, data) {
		var files = [];
		$.each(data.result.files, function (index, file) {
			var singlefile = {};
			if (file.url) {
				var link = $('<a>')
					.attr('target', '_blank')
					.prop('href', file.url);
				$(data.context.children()[index])
					.wrap(link);
				singlefile.name = file.name;
				singlefile.url = file.url;
			} else if (file.error) {
				var error = $('<span class="text-danger"/>').text(file.error);
				$(data.context.children()[index])
					.append('<br>')
					.append(error);
			}
			files.push(singlefile);
		});
		properties.files = files;
	}).on('fileuploadfail', function (e, data) {
		$.each(data.files, function (index) {
			var error = $('<span class="text-danger"/>').text('File upload failed.');
			$(data.context.children()[index])
				.append('<br>')
				.append(error);
		});
	}).prop('disabled', !$.support.fileInput)
		.parent().addClass($.support.fileInput ? undefined : 'disabled');
	//validate login
	$.ajax({
		type: "post",
		url: "php/validate.php",
		dataType: "text",
		complete: function (data) {
			console.log(data.responseText);
			if (data.responseText === "0") {
				map.removeInteraction(draw_interaction);
				addModifyInteraction();
				$("#controlpanel").hide();
				console.log("hiding");
			} else {
				if (data.responseText === "1") {
					$("#login").hide();
					$("#logout").show();
				}
			}
		}
	});
})