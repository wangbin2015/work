describe("Map", function () {
	var map,
		spy;
	beforeEach(function () {
		map = HDMap.map(document.createElement('div'));
	});

	describe("#remove", function () {
		it("fires an unload event if loaded", function () {
			var container = document.createElement('div'),
			    map = new HDMap.Map(container).setView([0, 0], 0),
				spy = sinon.spy();
			map.on('unload', spy);
			map.remove();
			expect(spy.called).to.be.ok();
		});

		it("fires no unload event if not loaded", function () {
			var container = document.createElement('div'),
			    map = new HDMap.Map(container),
				spy = sinon.spy();
			map.on('unload', spy);
			map.remove();
			expect(spy.called).not.to.be.ok();
		});

		describe("corner case checking", function () {
			it("throws an exception upon reinitialization", function () {
				var container = document.createElement('div'),
					map = new HDMap.Map(container);
				expect(function () {
					HDMap.map(container);
				}).to.throwException(function (e) {
					expect(e.message).to.eql("Map container is already initialized.");
				});
				map.remove();
			});

			it("throws an exception if a container is not found", function () {
				expect(function () {
					HDMap.map('nonexistentdivelement');
				}).to.throwException(function (e) {
					expect(e.message).to.eql("Map container not found.");
				});
				map.remove();
			});
		});

		it("undefines container._hdmap", function () {
			var container = document.createElement('div'),
			    map = new HDMap.Map(container);
			map.remove();
			expect(container._hdmap).to.be(undefined);
		});

		it("unbinds events", function () {
			var container = document.createElement('div'),
			    map = new HDMap.Map(container).setView([0, 0], 1),
				spy = sinon.spy();

			map.on('click dblclick mousedown mouseup mousemove', spy);
			map.remove();

			happen.click(container);
			happen.dblclick(container);
			happen.mousedown(container);
			happen.mouseup(container);
			happen.mousemove(container);

			expect(spy.called).to.not.be.ok();
		});
	});

	describe('#getCenter', function () {
		it('throws if not set before', function () {
			expect(function () {
				map.getCenter();
			}).to.throwError();
		});

		it('returns a precise center when zoomed in after being set (#426)', function () {
			var center = HDMap.latLng(10, 10);
			map.setView(center, 1);
			map.setZoom(19);
			expect(map.getCenter()).to.eql(center);
		});

		it('returns correct center after invalidateSize (#1919)', function () {
			map.setView(HDMap.latLng(10, 10), 1);
			map.invalidateSize();
			expect(map.getCenter()).not.to.eql(HDMap.latLng(10, 10));
		});
	});

	describe("#whenReady", function () {
		describe("when the map has not yet been loaded", function () {
			it("calls the callback when the map is loaded", function () {
				var spy = sinon.spy();
				map.whenReady(spy);
				expect(spy.called).to.not.be.ok();

				map.setView([0, 0], 1);
				expect(spy.called).to.be.ok();
			});
		});

		describe("when the map has already been loaded", function () {
			it("calls the callback immediately", function () {
				var spy = sinon.spy();
				map.setView([0, 0], 1);
				map.whenReady(spy);

				expect(spy.called).to.be.ok();
			});
		});
	});

	describe("#setView", function () {
		it("sets the view of the map", function () {
			expect(map.setView([51.505, -0.09], 13)).to.be(map);
			expect(map.getZoom()).to.be(13);
			expect(map.getCenter().distanceTo([51.505, -0.09])).to.be.lessThan(5);
		});

		it("can be passed without a zoom specified", function () {
			map.setZoom(13);
			expect(map.setView([51.605, -0.11])).to.be(map);
			expect(map.getZoom()).to.be(13);
			expect(map.getCenter().distanceTo([51.605, -0.11])).to.be.lessThan(5);
		});

		it("defaults to zoom passed as map option", function () {
			map = HDMap.map(document.createElement('div'), {zoom: 13});
			expect(map.setView([51.605, -0.11])).to.be(map);
			expect(map.getZoom()).to.be(13);
		});
	});

	describe("#getBounds", function () {
		it("is safe to call from within a moveend callback during initial load (#1027)", function () {
			map.on("moveend", function () {
				map.getBounds();
			});

			map.setView([51.505, -0.09], 13);
		});
	});

	describe('#setMaxBounds', function () {
		it("aligns pixel-wise map view center with maxBounds center if it cannot move view bounds inside maxBounds (#1908)", function () {
			var container = map.getContainer();
			// large view, cannot fit within maxBounds
			container.style.width = container.style.height = "1000px";
			document.body.appendChild(container);
			// maxBounds
			var bounds = HDMap.latLngBounds([51.5, -0.05], [51.55, 0.05]);
			map.setMaxBounds(bounds, {animate: false});
			// set view outside
			map.setView(HDMap.latLng([53.0, 0.15]), 12, {animate: false});
			// get center of bounds in pixels
			var boundsCenter = map.project(bounds.getCenter()).round();
			expect(map.project(map.getCenter()).round()).to.eql(boundsCenter);
			document.body.removeChild(container);
		});
		it("moves map view within maxBounds by changing one coordinate", function () {
			var container = map.getContainer();
			// small view, can fit within maxBounds
			container.style.width = container.style.height = "200px";
			document.body.appendChild(container);
			// maxBounds
			var bounds = HDMap.latLngBounds([51, -0.2], [52, 0.2]);
			map.setMaxBounds(bounds, {animate: false});
			// set view outside maxBounds on one direction only
			// leaves untouched the other coordinate (that is not already centered)
			var initCenter = [53.0, 0.1];
			map.setView(HDMap.latLng(initCenter), 16, {animate: false});
			// one pixel coordinate hasn't changed, the other has
			var pixelCenter = map.project(map.getCenter()).round();
			var pixelInit = map.project(initCenter).round();
			expect(pixelCenter.x).to.eql(pixelInit.x);
			expect(pixelCenter.y).not.to.eql(pixelInit.y);
			// the view is inside the bounds
			expect(bounds.contains(map.getBounds())).to.be(true);
			document.body.removeChild(container);
		});
	});

	describe("#getMinZoom and #getMaxZoom", function () {
		describe('#getMinZoom', function () {
			it('returns 0 if not set by Map options or TileLayer options', function () {
				var map = HDMap.map(document.createElement('div'));
				expect(map.getMinZoom()).to.be(0);
			});
		});

		it("minZoom and maxZoom options overrides any minZoom and maxZoom set on layers", function () {

			var map = HDMap.map(document.createElement('div'), {minZoom: 2, maxZoom: 20});

			HDMap.tileLayer("{z}{x}{y}", {minZoom: 4, maxZoom: 10}).addTo(map);
			HDMap.tileLayer("{z}{x}{y}", {minZoom: 6, maxZoom: 17}).addTo(map);
			HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 22}).addTo(map);

			expect(map.getMinZoom()).to.be(2);
			expect(map.getMaxZoom()).to.be(20);
		});
	});

	describe("#getMinZoom and #getMaxZoom", function () {
		describe('#getMinZoom', function () {
			it('returns 0 if not set by Map options or TileLayer options', function () {
				var map = HDMap.map(document.createElement('div'));
				expect(map.getMinZoom()).to.be(0);
			});
		});

		it("minZoom and maxZoom options overrides any minZoom and maxZoom set on layers", function () {

			var map = HDMap.map(document.createElement('div'), {minZoom: 2, maxZoom: 20});

			HDMap.tileLayer("{z}{x}{y}", {minZoom: 4, maxZoom: 10}).addTo(map);
			HDMap.tileLayer("{z}{x}{y}", {minZoom: 6, maxZoom: 17}).addTo(map);
			HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 22}).addTo(map);

			expect(map.getMinZoom()).to.be(2);
			expect(map.getMaxZoom()).to.be(20);
		});
	});

	describe("#hasLayer", function () {
		it("returns false when passed undefined, null, or false", function () {
			var map = HDMap.map(document.createElement('div'));
			expect(map.hasLayer(undefined)).to.equal(false);
			expect(map.hasLayer(null)).to.equal(false);
			expect(map.hasLayer(false)).to.equal(false);
		});
	});

	function layerSpy() {
		var layer = new HDMap.Layer();
		layer.onAdd = sinon.spy();
		layer.onRemove = sinon.spy();
		return layer;
	}

	describe("#addLayer", function () {

		it("calls layer.onAdd immediately if the map is ready", function () {
			var layer = layerSpy();
			map.setView([0, 0], 0);
			map.addLayer(layer);
			expect(layer.onAdd.called).to.be.ok();
		});

		it("calls layer.onAdd when the map becomes ready", function () {
			var layer = layerSpy();
			map.addLayer(layer);
			expect(layer.onAdd.called).not.to.be.ok();
			map.setView([0, 0], 0);
			expect(layer.onAdd.called).to.be.ok();
		});

		it("does not call layer.onAdd if the layer is removed before the map becomes ready", function () {
			var layer = layerSpy();
			map.addLayer(layer);
			map.removeLayer(layer);
			map.setView([0, 0], 0);
			expect(layer.onAdd.called).not.to.be.ok();
		});

		it("fires a layeradd event immediately if the map is ready", function () {
			var layer = layerSpy(),
			    spy = sinon.spy();
			map.on('layeradd', spy);
			map.setView([0, 0], 0);
			map.addLayer(layer);
			expect(spy.called).to.be.ok();
		});

		it("fires a layeradd event when the map becomes ready", function () {
			var layer = layerSpy(),
			    spy = sinon.spy();
			map.on('layeradd', spy);
			map.addLayer(layer);
			expect(spy.called).not.to.be.ok();
			map.setView([0, 0], 0);
			expect(spy.called).to.be.ok();
		});

		it("does not fire a layeradd event if the layer is removed before the map becomes ready", function () {
			var layer = layerSpy(),
			    spy = sinon.spy();
			map.on('layeradd', spy);
			map.addLayer(layer);
			map.removeLayer(layer);
			map.setView([0, 0], 0);
			expect(spy.called).not.to.be.ok();
		});

		it("adds the layer before firing layeradd", function (done) {
			var layer = layerSpy();
			map.on('layeradd', function () {
				expect(map.hasLayer(layer)).to.be.ok();
				done();
			});
			map.setView([0, 0], 0);
			map.addLayer(layer);
		});

		describe("When the first layer is added to a map", function () {
			it("fires a zoomlevelschange event", function () {
				var spy = sinon.spy();
				map.on("zoomlevelschange", spy);
				expect(spy.called).not.to.be.ok();
				HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 10}).addTo(map);
				expect(spy.called).to.be.ok();
			});
		});

		describe("when a new layer with greater zoomlevel coverage than the current layer is added to a map", function () {
			it("fires a zoomlevelschange event", function () {
				var spy = sinon.spy();
				HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 10}).addTo(map);
				map.on("zoomlevelschange", spy);
				expect(spy.called).not.to.be.ok();
				HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 15}).addTo(map);
				expect(spy.called).to.be.ok();
			});
		});

		describe("when a new layer with the same or lower zoomlevel coverage as the current layer is added to a map", function () {
			it("fires no zoomlevelschange event", function () {
				var spy = sinon.spy();
				HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 10}).addTo(map);
				map.on("zoomlevelschange", spy);
				expect(spy.called).not.to.be.ok();
				HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 10}).addTo(map);
				expect(spy.called).not.to.be.ok();
				HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 5}).addTo(map);
				expect(spy.called).not.to.be.ok();
			});
		});
	});

	describe("#removeLayer", function () {
		it("calls layer.onRemove if the map is ready", function () {
			var layer = layerSpy();
			map.setView([0, 0], 0);
			map.addLayer(layer);
			map.removeLayer(layer);
			expect(layer.onRemove.called).to.be.ok();
		});

		it("does not call layer.onRemove if the layer was not added", function () {
			var layer = layerSpy();
			map.setView([0, 0], 0);
			map.removeLayer(layer);
			expect(layer.onRemove.called).not.to.be.ok();
		});

		it("does not call layer.onRemove if the map is not ready", function () {
			var layer = layerSpy();
			map.addLayer(layer);
			map.removeLayer(layer);
			expect(layer.onRemove.called).not.to.be.ok();
		});

		it("fires a layerremove event if the map is ready", function () {
			var layer = layerSpy(),
			    spy = sinon.spy();
			map.on('layerremove', spy);
			map.setView([0, 0], 0);
			map.addLayer(layer);
			map.removeLayer(layer);
			expect(spy.called).to.be.ok();
		});

		it("does not fire a layerremove if the layer was not added", function () {
			var layer = layerSpy(),
			    spy = sinon.spy();
			map.on('layerremove', spy);
			map.setView([0, 0], 0);
			map.removeLayer(layer);
			expect(spy.called).not.to.be.ok();
		});

		it("does not fire a layerremove if the map is not ready", function () {
			var layer = layerSpy(),
			    spy = sinon.spy();
			map.on('layerremove', spy);
			map.addLayer(layer);
			map.removeLayer(layer);
			expect(spy.called).not.to.be.ok();
		});

		it("removes the layer before firing layerremove", function (done) {
			var layer = layerSpy();
			map.on('layerremove', function () {
				expect(map.hasLayer(layer)).not.to.be.ok();
				done();
			});
			map.setView([0, 0], 0);
			map.addLayer(layer);
			map.removeLayer(layer);
		});

		it("supports adding and removing a tile layer without initializing the map", function () {
			var layer = HDMap.tileLayer("{z}{x}{y}");
			map.addLayer(layer);
			map.removeLayer(layer);
		});

		it("supports adding and removing a tile layer without initializing the map", function () {
			map.setView([0, 0], 18);
			var layer = HDMap.gridLayer();
			map.addLayer(layer);
			map.removeLayer(layer);
		});

		describe("when the last tile layer on a map is removed", function () {
			it("fires a zoomlevelschange event", function () {
				map.whenReady(function () {
					var spy = sinon.spy();
					var tl = HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 10}).addTo(map);

					map.on("zoomlevelschange", spy);
					expect(spy.called).not.to.be.ok();
					map.removeLayer(tl);
					expect(spy.called).to.be.ok();
				});
			});
		});

		describe("when a tile layer is removed from a map and it had greater zoom level coverage than the remainding layer", function () {
			it("fires a zoomlevelschange event", function () {
				map.whenReady(function () {
					var spy = sinon.spy(),
						tl = HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 10}).addTo(map),
					    t2 = HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 15}).addTo(map);

					map.on("zoomlevelschange", spy);
					expect(spy.called).to.not.be.ok();
					map.removeLayer(t2);
					expect(spy.called).to.be.ok();
				});
			});
		});

		describe("when a tile layer is removed from a map it and it had lesser or the sa,e zoom level coverage as the remainding layer(s)", function () {
			it("fires no zoomlevelschange event", function () {
				map.whenReady(function () {
					var tl = HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 10}).addTo(map),
					    t2 = HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 10}).addTo(map),
					    t3 = HDMap.tileLayer("{z}{x}{y}", {minZoom: 0, maxZoom: 5}).addTo(map);

					map.on("zoomlevelschange", spy);
					expect(spy).not.toHaveBeenCalled();
					map.removeLayer(t2);
					expect(spy).not.toHaveBeenCalled();
					map.removeLayer(t3);
					expect(spy).not.toHaveBeenCalled();
				});
			});
		});
	});

	describe("#eachLayer", function () {
		it("returns self", function () {
			expect(map.eachLayer(function () {})).to.be(map);
		});

		it("calls the provided function for each layer", function () {
			var t1 = HDMap.tileLayer("{z}{x}{y}").addTo(map),
			    t2 = HDMap.tileLayer("{z}{x}{y}").addTo(map),
				spy = sinon.spy();

			map.eachLayer(spy);

			expect(spy.callCount).to.eql(2);
			expect(spy.firstCall.args).to.eql([t1]);
			expect(spy.secondCall.args).to.eql([t2]);
		});

		it("calls the provided function with the provided context", function () {
			var t1 = HDMap.tileLayer("{z}{x}{y}").addTo(map),
				spy = sinon.spy();

			map.eachLayer(spy, map);

			expect(spy.thisValues[0]).to.eql(map);
		});
	});

	describe("#invalidateSize", function () {
		var container,
		    origWidth = 100,
			clock;

		beforeEach(function () {
			container = map.getContainer();
			container.style.width = origWidth + "px";
			document.body.appendChild(container);
			map.setView([0, 0], 0);
			map.invalidateSize({pan: false});
			clock = sinon.useFakeTimers();
		});

		afterEach(function () {
			document.body.removeChild(container);
			clock.restore();
		});

		it("pans by the right amount when growing in 1px increments", function () {
			container.style.width = (origWidth + 1) + "px";
			map.invalidateSize();
			expect(map._getMapPanePos().x).to.be(1);

			container.style.width = (origWidth + 2) + "px";
			map.invalidateSize();
			expect(map._getMapPanePos().x).to.be(1);

			container.style.width = (origWidth + 3) + "px";
			map.invalidateSize();
			expect(map._getMapPanePos().x).to.be(2);
		});

		it("pans by the right amount when shrinking in 1px increments", function () {
			container.style.width = (origWidth - 1) + "px";
			map.invalidateSize();
			expect(map._getMapPanePos().x).to.be(0);

			container.style.width = (origWidth - 2) + "px";
			map.invalidateSize();
			expect(map._getMapPanePos().x).to.be(-1);

			container.style.width = (origWidth - 3) + "px";
			map.invalidateSize();
			expect(map._getMapPanePos().x).to.be(-1);
		});

		it("pans back to the original position after growing by an odd size and back", function () {
			container.style.width = (origWidth + 5) + "px";
			map.invalidateSize();

			container.style.width = origWidth + "px";
			map.invalidateSize();

			expect(map._getMapPanePos().x).to.be(0);
		});

		it("emits no move event if the size has not changed", function () {
			var spy = sinon.spy();
			map.on("move", spy);

			map.invalidateSize();

			expect(spy.called).not.to.be.ok();
		});

		it("emits a move event if the size has changed", function () {
			var spy = sinon.spy();
			map.on("move", spy);

			container.style.width = (origWidth + 5) + "px";
			map.invalidateSize();

			expect(spy.called).to.be.ok();
		});

		it("emits a moveend event if the size has changed", function () {
			var spy = sinon.spy();
			map.on("moveend", spy);

			container.style.width = (origWidth + 5) + "px";
			map.invalidateSize();

			expect(spy.called).to.be.ok();
		});

		it("debounces the moveend event if the debounceMoveend option is given", function () {
			var spy = sinon.spy();
			map.on("moveend", spy);

			container.style.width = (origWidth + 5) + "px";
			map.invalidateSize({debounceMoveend: true});

			expect(spy.called).not.to.be.ok();

			clock.tick(200);

			expect(spy.called).to.be.ok();
		});
	});

	describe('#flyTo', function () {

		it('move to requested center and zoom, and call zoomend once', function (done) {
			var spy = sinon.spy(),
				newCenter = new HDMap.LatLng(10, 11),
				newZoom = 12,
				callback = function () {
					expect(map.getCenter()).to.eql(newCenter);
					expect(map.getZoom()).to.eql(newZoom);
					spy();
					expect(spy.calledOnce).to.be.ok();
					done();
				};
			map.setView([0, 0], 0);
			map.once('zoomend', callback).flyTo(newCenter, newZoom);
		});

	});

});
