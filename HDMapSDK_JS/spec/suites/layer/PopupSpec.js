describe('Popup', function () {

	var c, map;

	beforeEach(function () {
		c = document.createElement('div');
		c.style.width = '400px';
		c.style.height = '400px';
		map = new HDMap.Map(c);
		map.setView(new HDMap.LatLng(55.8, 37.6), 6);
	});

	it("closes on map click when map has closePopupOnClick option", function () {
		map.options.closePopupOnClick = true;

		var popup = new HDMap.Popup()
			.setLatLng(new HDMap.LatLng(55.8, 37.6))
			.openOn(map);

		happen.click(c);

		expect(map.hasLayer(popup)).to.be(false);
	});

	it("closes on map click when popup has closeOnClick option", function () {
		map.options.closePopupOnClick = false;

		var popup = new HDMap.Popup({closeOnClick: true})
			.setLatLng(new HDMap.LatLng(55.8, 37.6))
			.openOn(map);

		happen.click(c);

		expect(map.hasLayer(popup)).to.be(false);
	});

	it("does not close on map click when popup has closeOnClick: false option", function () {
		map.options.closePopupOnClick = true;

		var popup = new HDMap.Popup({closeOnClick: false})
			.setLatLng(new HDMap.LatLng(55.8, 37.6))
			.openOn(map);

		happen.click(c);

		expect(map.hasLayer(popup)).to.be(true);
	});

	it("toggles its visibility when marker is clicked", function () {
		var marker = new HDMap.Marker(new HDMap.LatLng(55.8, 37.6));
		map.addLayer(marker);

		marker.bindPopup('Popup1');
		map.options.closePopupOnClick = true;

		// toggle open popup
		marker.fire('click', {
			latlng: new HDMap.LatLng(55.8, 37.6)
		});
		expect(map.hasLayer(marker._popup)).to.be(true);

		// toggle close popup
		marker.fire('click', {
			latlng: new HDMap.LatLng(55.8, 37.6)
		});
		expect(map.hasLayer(marker._popup)).to.be(false);
	});

	it("it should use a popup with a fuction as content with a FeatureGroup", function () {
		var marker1 = new HDMap.Marker(new HDMap.LatLng(55.8, 37.6));
		var marker2 = new HDMap.Marker(new HDMap.LatLng(54.6, 38.2));
		var group = new HDMap.FeatureGroup([marker1, marker2]).addTo(map);

		marker1.description = "I'm marker 1.";
		marker2.description = "I'm marker 2.";
		group.bindPopup(function(layer) {
			return layer.description;
		});

		map.options.closePopupOnClick = true;

		// toggle popup on marker1
		group.fire('click', {
			latlng: new HDMap.LatLng(55.8, 37.6),
			layer: marker1
		});
		expect(map.hasLayer(group._popup)).to.be(true);
		expect(group._popup._contentNode.innerHTML).to.be("I'm marker 1.");

		// toggle popup on marker2
		group.fire('click', {
			latlng: new HDMap.LatLng(54.6, 38.2),
			layer: marker2
		});
		expect(map.hasLayer(group._popup)).to.be(true);
		expect(group._popup._contentNode.innerHTML).to.be("I'm marker 2.");
	});

	it("it should function for popup content after bindPopup is called", function () {
		var marker1 = new HDMap.Marker(new HDMap.LatLng(55.8, 37.6));
		var marker2 = new HDMap.Marker(new HDMap.LatLng(54.6, 38.2));
		var group = new HDMap.FeatureGroup([marker1]).addTo(map);

		marker1.description = "I'm marker 1.";
		marker2.description = "I'm marker 2.";
		group.bindPopup(function(layer) {
			return layer.description;
		});

		group.addLayer(marker2);

		map.options.closePopupOnClick = true;

		// toggle popup on marker1
		group.fire('click', {
			latlng: new HDMap.LatLng(55.8, 37.6),
			layer: marker1
		});
		expect(map.hasLayer(group._popup)).to.be(true);
		expect(group._popup._contentNode.innerHTML).to.be("I'm marker 1.");

		// toggle popup on marker2
		group.fire('click', {
			latlng: new HDMap.LatLng(54.6, 38.2),
			layer: marker2
		});
		expect(map.hasLayer(group._popup)).to.be(true);
		expect(group._popup._contentNode.innerHTML).to.be("I'm marker 2.");
	});

	it("should use a function for popup content when a source is passed to Popup", function() {
		var marker = new HDMap.Marker(new HDMap.LatLng(55.8, 37.6)).addTo(map);
		var popup = HDMap.popup({}, marker);

		marker.description = "I am a marker.";

		marker.bindPopup(function(layer) {
			return layer.description;
		});

		marker.fire('click', {
			latlng: new HDMap.LatLng(55.8, 37.6)
		});

		expect(map.hasLayer(marker._popup)).to.be(true);
		expect(marker._popup._contentNode.innerHTML).to.be("I am a marker.");
	});

	it("triggers popupopen on marker when popup opens", function () {
		var marker1 = new HDMap.Marker(new HDMap.LatLng(55.8, 37.6));
		var marker2 = new HDMap.Marker(new HDMap.LatLng(57.123076977278, 44.861962891635));

		map.addLayer(marker1);
		map.addLayer(marker2);

		marker1.bindPopup('Popup1');
		marker2.bindPopup('Popup2');

		var spy = sinon.spy();

		marker1.on('popupopen', spy);

		expect(spy.called).to.be(false);
		marker2.openPopup();
		expect(spy.called).to.be(false);
		marker1.openPopup();
		expect(spy.called).to.be(true);
	});

	it("triggers popupclose on marker when popup closes", function () {
		var marker1 = new HDMap.Marker(new HDMap.LatLng(55.8, 37.6));
		var marker2 = new HDMap.Marker(new HDMap.LatLng(57.123076977278, 44.861962891635));

		map.addLayer(marker1);
		map.addLayer(marker2);

		marker1.bindPopup('Popup1');
		marker2.bindPopup('Popup2');

		var spy = sinon.spy();

		marker1.on('popupclose', spy);

		expect(spy.called).to.be(false);
		marker2.openPopup();
		expect(spy.called).to.be(false);
		marker1.openPopup();
		expect(spy.called).to.be(false);
		marker2.openPopup();
		expect(spy.called).to.be(true);
		marker1.openPopup();
		marker1.closePopup();
		expect(spy.callCount).to.be(2);
	});

	it("should take into account icon popupAnchor option", function () {
		var autoPanBefore = HDMap.Popup.prototype.options.autoPan;
		HDMap.Popup.prototype.options.autoPan = false;
		var popupAnchorBefore = HDMap.Icon.Default.prototype.options.popupAnchor;
		HDMap.Icon.Default.prototype.options.popupAnchor = [0, 0];

		var latlng = new HDMap.LatLng(55.8, 37.6),
			offset = new HDMap.Point(20, 30),
			icon = new HDMap.DivIcon({popupAnchor: offset}),
			marker1 = new HDMap.Marker(latlng),
			marker2 = new HDMap.Marker(latlng, {icon: icon});
		marker1.bindPopup('Popup').addTo(map);
		marker1.openPopup();
		var defaultLeft = parseInt(marker1._popup._container.style.left, 10);
		var defaultBottom = parseInt(marker1._popup._container.style.bottom, 10);
		marker2.bindPopup('Popup').addTo(map);
		marker2.openPopup();
		var offsetLeft = parseInt(marker2._popup._container.style.left, 10);
		var offsetBottom = parseInt(marker2._popup._container.style.bottom, 10);
		expect(offsetLeft - offset.x).to.eql(defaultLeft);
		expect(offsetBottom + offset.y).to.eql(defaultBottom);

		// Now retry passing a popup instance to bindPopup
		marker2.bindPopup(new HDMap.Popup());
		marker2.openPopup();
		offsetLeft = parseInt(marker2._popup._container.style.left, 10);
		offsetBottom = parseInt(marker2._popup._container.style.bottom, 10);
		expect(offsetLeft - offset.x).to.eql(defaultLeft);
		expect(offsetBottom + offset.y).to.eql(defaultBottom);

		HDMap.Popup.prototype.options.autoPan = autoPanBefore;
		HDMap.Icon.Default.prototype.options.popupAnchor = popupAnchorBefore;
	});

});

describe("HDMap.Map#openPopup", function () {
	var c, map;

	beforeEach(function () {
		c = document.createElement('div');
		c.style.width = '400px';
		c.style.height = '400px';
		map = new HDMap.Map(c);
		map.setView(new HDMap.LatLng(55.8, 37.6), 6);
	});

	it("adds the popup layer to the map", function () {
		var popup = new HDMap.Popup()
			.setLatLng(new HDMap.LatLng(55.8, 37.6));
		map.openPopup(popup);
		expect(map.hasLayer(popup)).to.be(true);
	});

	it("sets popup location", function () {
		var popup = new HDMap.Popup();
		map.openPopup(popup, HDMap.latLng(55.8, 37.6));
		expect(popup.getLatLng()).to.eql(HDMap.latLng(55.8, 37.6));
	});

	it("creates a popup from content", function () {
		map.openPopup("<h2>Hello World</h2>", HDMap.latLng(55.8, 37.6));
		expect(map._popup).to.be.an(HDMap.Popup);
		expect(map._popup.getContent()).to.eql("<h2>Hello World</h2>");
	});

	it("closes existing popup", function () {
		var p1 = new HDMap.Popup().setLatLng(new HDMap.LatLng(55.8, 37.6));
		var p2 = new HDMap.Popup().setLatLng(new HDMap.LatLng(55.8, 37.6));
		map.openPopup(p1);
		map.openPopup(p2);
		expect(map.hasLayer(p1)).to.be(false);
	});

	it("does not close existing popup with autoClose: false option", function () {
		var p1 = new HDMap.Popup({autoClose: false}).setLatLng(new HDMap.LatLng(55.8, 37.6));
		var p2 = new HDMap.Popup().setLatLng(new HDMap.LatLng(55.8, 37.6));
		map.openPopup(p1);
		map.openPopup(p2);
		expect(map.hasLayer(p1)).to.be(true);
		expect(map.hasLayer(p2)).to.be(true);
	});
});
