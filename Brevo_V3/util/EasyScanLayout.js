sap.ui.define(["jquery.sap.global", "sap/ovp/cards/CommonUtils", "sap/ovp/ui/UIActions", "sap/ui/Device", "sap/ui/core/Control",
	"sap/ui/core/ResizeHandler", "sap/ovp/app/resources", "sap/ovp/app/OVPUtils"
], function (q, C, U, D, a, R, O, b) {
	"use strict";
	var c = function (s) {
		this.init(s);
	};
	c.prototype.init = function (s) {
		s.beforeDragCallback = this._beforeDragHandler.bind(this);
		s.dragStartCallback = this._dragStartHandler.bind(this);
		s.dragMoveCallback = this._dragMoveHandler.bind(this);
		s.dragEndCallback = this._dragEndHandler.bind(this);
		s.endCallback = this._endHandler.bind(this);
		this.layout = s.layout;
		this.afterReplaceElements = s.afterReplaceElements || function () {};
		this.settings = s;
		delete s.afterReplaceElements;
		this.destroy();
		this.uiActions = new U(this.settings).enable();
		this.aCardsOrder = null;
		this.verticalMargin = null;
		this.horizontalMargin = null;
		this.columnCount = null;
		this.top = null;
		this.left = null;
		this.width = null;
		this.layoutOffset = null;
		this.jqLayout = null;
		this.jqLayoutInner = null;
		this.isRTLEnabled = null;
		this.lastCollidedEl = null;
		this.lastCollisionTop = null;
		this.SCROLL_OFFSET = 16;
	};
	c.prototype.findCollision = function (e, j, k) {
		var l;
		for (var i = 0; i < k.length; i++) {
			var n = k[i];
			var o = !(n.posDnD.right < e || n.posDnD.left > e);
			var p = !(n.posDnD.bottom < j || n.posDnD.top > j);
			if (o && p) {
				l = n;
				break;
			}
		}
		return l;
	};
	c.prototype.isCollisionTop = function (e, i, j) {
		var k = ((j.posDnD.bottom - j.posDnD.top) / 2) + j.posDnD.top;
		var l = !(k < i || j.posDnD.top > i);
		return l;
	};
	c.prototype._dragMoveHandler = function (e, i) {
		var s = e.element;
		var j = e.moveX - this.layoutOffset.left;
		var k = e.moveY - this.jqLayout.get(0).getBoundingClientRect().top + this.jqLayout.scrollTop();
		if (!i) {
			var v = document.getElementsByClassName("sapFDynamicPageContentWrapper")[0];
			var l = v.offsetHeight;
			var n = v.getBoundingClientRect();
			if ((e.evt.clientY - v.offsetTop + this.SCROLL_OFFSET) > l) {
				v.scrollTop = v.scrollTop + this.SCROLL_OFFSET;
			} else if (((e.evt.clientY - v.offsetTop) < n.top + this.SCROLL_OFFSET) && v.scrollTop !== 0) {
				v.scrollTop = v.scrollTop - this.SCROLL_OFFSET;
			}
		}
		var o = this.findCollision(j, k, this.aCardsOrder);
		if (!o) {
			return;
		}
		var p = this.isCollisionTop(j, k, o);
		if (o === s) {
			this.lastCollidedEl = o;
			return;
		}
		if (o === this.lastCollidedEl) {
			if (this.lastCollisionTop === p) {
				return;
			}
			if (this.lastCollisionTop) {
				this.lastCollisionTop = p;
				if (s.posDnD.top > o.posDnD.top) {
					return;
				}
			} else {
				this.lastCollisionTop = p;
				if (s.posDnD.top < o.posDnD.top) {
					return;
				}
			}
		}
		if (this.lastCollidedEl && (this.lastCollidedEl !== o && this.lastCollidedEl !== s) && (this.lastCollidedEl.posDnD.left === o.posDnD.left &&
				this.lastCollidedEl.posDnD.left === s.posDnD.left)) {
			o = this.lastCollidedEl;
		}
		this.dragAndDropElement(s, o);
		this.lastCollidedEl = this.findCollision(j, k, this.aCardsOrder);
		if (this.lastCollidedEl) {
			this.lastCollisionTop = this.isCollisionTop(j, k, this.lastCollidedEl);
		}
	};
	c.prototype.dragAndDropElement = function (s, t) {
		if (s && t) {
			this.aCardsOrder = this.dragAndDropSwapElement(s, t, this.aCardsOrder);
			this.drawLayout(this.aCardsOrder);
		}
	};
	c.prototype.dragAndDropSwapElement = function (s, t, i) {
		var n = i.slice();
		var e = i.indexOf(s);
		var j = i.indexOf(t);
		n[j] = s;
		n[e] = t;
		if (!!this.positionChanges && t && t.children) {
			var T = t.children[0].getAttribute("id");
			this.positionChanges.push({
				changeType: "position",
				content: {
					cardId: T.substring(T.indexOf("mainView--") + 10, T.length),
					position: e,
					oldPosition: j
				},
				isUserDependent: true
			});
		}
		return n;
	};
	c.prototype.dragAndDropSwapElementForKeyboardNavigation = function (s, t) {
		if (s && t) {
			var l = this.layout.getVisibleLayoutItems().map(function (j) {
				return j.$().parent()[0];
			});
			var e = 0;
			for (var i = 0; i < l.length; i++) {
				if (l[i] === s) {
					l[i] = t;
					e++;
					continue;
				}
				if (l[i] === t) {
					l[i] = s;
					e++;
					continue;
				}
			}
			if (e === 2) {
				this.afterReplaceElements(l);
			}
		}
	};
	c.prototype.initCardsSettingsForDragAndDrop = function () {
		this.jqLayout = this.layout.$();
		this.jqLayoutInner = this.jqLayout.children().first();
		var l = this.jqLayout.scrollTop();
		var e = this.jqLayoutInner.height();
		this.isRTLEnabled = sap.ui.getCore().getConfiguration().getRTL() ? 1 : -1;
		this.aCardsOrder = [];
		this.layoutOffset = this.jqLayout.offset();
		if (D.system.tablet === true && D.system.desktop === false) {
			this.jqLayout.css('height', this.jqLayoutInner.height());
		}
		var v = this.layout.getVisibleLayoutItems();
		if (!v) {
			return;
		}
		this.aCardsOrder = v.map(function (n) {
			var o = n.$().parent()[0];
			o.posDnD = {
				width: o.offsetWidth,
				height: o.offsetHeight
			};
			o.style.width = o.offsetWidth + "px";
			return o;
		});
		var j = this.jqLayoutInner.children().first();
		var i = (this.isRTLEnabled === 1) ? "margin-left" : "margin-right";
		this.verticalMargin = parseInt(j.css(i), 10);
		var k = this.aCardsOrder[0];
		this.horizontalMargin = parseInt(q(k).css("margin-bottom"), 10);
		this.columnCount = this.layout.getColumnCount();
		this.top = k.getBoundingClientRect().top - this.jqLayoutInner[0].getBoundingClientRect().top;
		this.left = k.getBoundingClientRect().left - this.jqLayoutInner[0].getBoundingClientRect().left;
		this.width = k.offsetWidth;
		q(this.aCardsOrder).css("position", "absolute");
		this.drawLayout(this.aCardsOrder);
		this.jqLayoutInner.height(e);
		this.jqLayout.scrollTop(l);
	};
	c.prototype.drawLayout = function (e) {
		var o = [];
		for (var i = 0; i < this.columnCount; i++) {
			o[i] = 0;
		}
		for (var n = 0; n < e.length; n++) {
			var k = n % this.columnCount;
			var l = o[k]++;
			var p = this.left - this.isRTLEnabled * (k * this.verticalMargin + k * this.width);
			var r = this.top;
			var s = e[n];
			for (var j = 0; j < l; j++) {
				r += this.horizontalMargin;
				var t = n - (j + 1) * this.columnCount;
				r += e[t].posDnD.height;
			}
			s.posDnD.top = r;
			s.posDnD.bottom = r + s.posDnD.height;
			s.posDnD.left = p;
			s.posDnD.right = p + s.posDnD.width;
			this.updateElementCSS(e[n]);
		}
	};
	c.prototype.updateElementCSS = function (e) {
		q(e).css({
			top: e.posDnD.top,
			left: e.posDnD.left
		});
	};
	c.prototype._dragStartHandler = function (e, i) {
		this.positionChanges = [];
		if (D.system.desktop) {
			q('body').addClass("sapOVPDisableUserSelect sapOVPDisableImageDrag");
		}
		if (window.getSelection) {
			var s = window.getSelection();
			s.removeAllRanges();
		}
		this.initCardsSettingsForDragAndDrop();
	};
	c.prototype._beforeDragHandler = function (e, u) {
		if (D.browser.mobile) {
			this.selectableElemets = q(u).find('.sapUiSelectable');
			this.selectableElemets.removeClass('sapUiSelectable');
		}
		q(this.settings.wrapper).addClass("dragAndDropMode");
	};
	c.prototype._dragEndHandler = function (e, u) {
		this.lastCollidedEl = null;
		if (e.type == 'mouseup' || e.type == 'touchend') {
			if (this.aCardsOrder) {
				this.afterReplaceElements(this.aCardsOrder);
			}
		}
		if (D.system.desktop) {
			q('body').removeClass("sapOVPDisableUserSelect sapOVPDisableImageDrag");
		}
		q(this.settings.wrapper).removeClass("dragAndDropMode");
		if (this.jqLayoutInner) {
			this.jqLayoutInner.removeAttr("style");
		}
		if (this.aCardsOrder) {
			q(this.aCardsOrder).removeAttr("style");
		}
		this.uiActions.removeClone();
	};
	c.prototype._endHandler = function (e, u) {
		if (D.browser.mobile && this.selectableElemets) {
			this.selectableElemets.addClass('sapUiSelectable');
		}
	};
	c.prototype.getSwapItemsFunction = function () {
		return this.dragAndDropSwapElementForKeyboardNavigation.bind(this);
	};
	c.prototype.destroy = function () {
		if (this.uiActions) {
			this.uiActions.disable();
			this.uiActions = null;
		}
	};
	var d = {
		buildReplaceItemsInstance: function (s) {
			var e = {
				containerSelector: ".sapUshellEasyScanLayoutInner",
				wrapper: ".sapUshellEasyScanLayout",
				draggableSelector: ".easyScanLayoutItemWrapper",
				placeHolderClass: "easyScanLayoutItemWrapper-placeHolder",
				cloneClass: "easyScanLayoutItemWrapperClone",
				moveTolerance: 10,
				switchModeDelay: 800,
				isTouch: !D.system.desktop,
				debug: false
			};
			s = q.extend(e, s);
			return new c(s);
		}
	};
	var K = function (e, s) {
		this.init(e, s);
	};
	K.prototype.init = function (e, s) {
		this.easyScanLayout = e;
		this.swapItemsFunction = (typeof s === "function") ? s : function () {};
		this.keyCodes = q.sap.KeyCodes;
		this.jqElement = e.$();
		this.jqElement.on('keydown.keyboardNavigation', this.keydownHandler.bind(this));
		q('body').on('keyup', this.bodyKeyupHandler.bind(this));
		q('body').on('keydown', this.bodyKeydownHandler.bind(this));
		this.jqElement.find(".after").on("focus.keyboardNavigation", this.afterFocusHandler.bind(this));
		this.jqElement.find(".sapUshellEasyScanLayoutInner").on("focus.keyboardNavigation", this.layoutFocusHandler.bind(this));
		this.jqElement.on("focus.keyboardNavigation", ".easyScanLayoutItemWrapper", this.layoutItemFocusHandler.bind(this));
		this._ignoreSelfFocus = false;
		this.swapSourceElement = null;
		this.lastFocussedElement = null;
		this.lastFocussedClassId = null;
		this.jqElement.on('keyup', this.ctrlArrowUpDownHandler.bind(this));
	};
	K.prototype.ctrlArrowUpDownHandler = function (e) {
		switch (e.keyCode) {
		case this.keyCodes.PAGE_UP:
			if (e.ctrlKey) {
				this.ctrlArrowHandler(e);
				this.pageUpDownHandler(e, true);
			}
			break;
		case this.keyCodes.PAGE_DOWN:
			if (e.ctrlKey) {
				this.ctrlArrowHandler(e);
				this.pageUpDownHandler(e, false);
			}
			break;
		}
	};
	K.prototype.destroy = function () {
		if (this.jqElement) {
			this.jqElement.off(".keyboardNavigation");
			this.jqElement.find(".after").off(".keyboardNavigation");
			this.jqElement.find(".sapUshellEasyScanLayoutInner").off(".keyboardNavigation");
		}
		delete this.jqElement;
		delete this.easyScanLayout;
	};
	K.prototype.getVisibleLayoutItems = function () {
		var e = this.easyScanLayout.getContent();
		var i = e.filter(function (j) {
			return j.getVisible();
		});
		return i;
	};
	K.prototype.afterFocusHandler = function () {
		if (this._ignoreSelfFocus) {
			this._ignoreSelfFocus = false;
			return;
		}
		var j = this.jqElement.find(".easyScanLayoutItemWrapper:sapTabbable").first();
		var l = j.find(":sapTabbable").last();
		if (!l.length) {
			l = j;
		}
		l.focus();
	};
	K.prototype.layoutFocusHandler = function () {
		if (this._ignoreSelfFocus) {
			this._ignoreSelfFocus = false;
			return;
		}
		this.jqElement.find(".easyScanLayoutItemWrapper:sapTabbable").first().focus();
	};
	K.prototype.layoutItemFocusHandler = function () {
		var j = q(document.activeElement);
		if (j) {
			var l = j.find("[aria-label]");
			var i, s = "";
			if (j.find('.valueStateText').length == 1) {
				var t = j.find('.valueStateText').find('.sapMObjectNumberText').text();
				var v = j.find('.valueStateText').find('.sapUiInvisibleText').text();
				j.find('.valueStateText').attr('aria-label', t + " " + v);
				j.find('.valueStateText').attr('aria-labelledby', "");
			}
			if (q(l).hasClass('kpiHeaderClass')) {
				var k = q(l).closest('div.kpiHeaderClass');
				var e = k.text();
				var n = k.attr("id");
				var V = sap.ui.getCore().byId(n).getValueColor();
				k.attr('aria-label', e + " " + V);
			}
			j.find("[role='listitem']").attr('aria-label', "");
			if (j.hasClass('easyScanLayoutItemWrapper')) {
				var o = "";
				var p = j.find('.cardCount');
				var r = O.getText("cardPositionInApp", [j.attr('aria-posinset'), j.attr('aria-setsize')]);
				if (p.length === 0) {
					o = "countDiv_" + new Date().getTime();
					var u = '<div id="' + o + '" class="cardCount" aria-label="' + r + '" hidden></div>';
					j.append(u);
				} else {
					o = p[0].id;
					p.attr('aria-label', r);
				}
				s += o + " ";
				var w = j.find('.cardType');
				if (w.length !== 0) {
					s += w[0].id + " ";
				}
			}
			if (j.hasClass('sapOvpCardHeader') && !j.hasClass('sapOvpStackCardContent')) {
				var x = "";
				var y = j.find('.cardHeaderType');
				if (y.length === 0) {
					var z = O.getText("CardHeaderType");
					x = "cardHeaderType_" + new Date().getTime();
					var A = '<div id="' + x + '" class="cardHeaderType" aria-label="' + z + '" hidden></div>';
					j.append(A);
				} else {
					x = y[0].id;
				}
				s += x + " ";
			}
			for (i = 0; i < l.length; i++) {
				if (l[i].getAttribute("role") === "heading") {
					s += l[i].id + " ";
				}
			}
			if (j.hasClass('sapOvpCardHeader')) {
				var B = j.find('.cardHeaderText');
				if (B.length !== 0) {
					for (var i = 0; i < B.length; i++) {
						s += B[i].id + " ";
					}
				}
			}
			if (s.length) {
				j.attr("aria-labelledby", s);
			}
			if (j.prop('nodeName') === "LI" && j.find('.linkListHasPopover').length !== 0) {
				if (j.find('#hasDetails').length === 0) {
					j.append("<div id='hasDetails' hidden>" + O.getText("HAS_DETAILS") + "</div>");
					j.attr('aria-describedby', "hasDetails");
				}
			}
			var F = j.attr("id");
			if ((F && F.indexOf("ovpTable") != -1) && j.find("[role='Link']") && !j.hasClass('sapUiCompSmartLink')) {
				var G = j.closest("td").attr("data-sap-ui-column"),
					H = j.closest("tbody").siblings().children().filter("tr").children();
				for (var i = 0; i < H.length; i++) {
					if (H[i].getAttribute("data-sap-ui") == G && H[i].hasChildNodes("span")) {
						var I = H[i].firstElementChild.getAttribute("id");
						j.attr("aria-labelledby", I);
					}
				}
			}
		}
	};
	K.prototype._getLayoutItemIndex = function (j) {
		if (!j.hasClass("easyScanLayoutItemWrapper")) {
			return false;
		}
		var e = j.children().attr("id");
		var i = false;
		this.getVisibleLayoutItems().forEach(function (k, l) {
			if (e == k.getId()) {
				i = l;
			}
		});
		return i;
	};
	K.prototype._changeItemsFocus = function (j) {
		var e = q('.easyScanLayoutItemWrapper');
		e.attr("tabindex", "-1");
		j.attr("tabindex", 0);
		setTimeout(function () {
			j.focus();
		}, 500);
	};
	K.prototype._swapItemsFocus = function (e, j, i) {
		e.preventDefault();
		j.attr("tabindex", "-1");
		setTimeout(function () {
			i.attr("tabindex", "0").focus();
		}, 0);
	};
	K.prototype.tabButtonHandler = function (e) {
		var j = q(document.activeElement);
		this.lastFocussedElement = j;
		if (j.hasClass("easyScanLayoutItemWrapper")) {
			return;
		}
		var i = j.closest(".easyScanLayoutItemWrapper");
		if (!i.length) {
			return;
		}
		var k = i.find(":sapTabbable");
		k = k.filter(":not([id$=after])");
		if (k.eq(k.length - 1).is(j)) {
			e.stopPropagation();
			e.stopImmediatePropagation();
			var l = this.jqElement.scrollTop();
			this._ignoreSelfFocus = true;
			this.jqElement.find(".after").focus();
			this.jqElement.scrollTop(l);
		}
	};
	K.prototype.f7Handler = function (e) {
		var j = q(document.activeElement);
		if (j.hasClass("easyScanLayoutItemWrapper")) {
			j.find(":sapTabbable").first().focus();
		} else {
			j.closest(".easyScanLayoutItemWrapper").focus();
		}
		e.preventDefault();
	};
	K.prototype.shiftTabButtonHandler = function (e) {
		var j = q(document.activeElement);
		if (j.hasClass('after')) {
			this.lastFocussedElement.focus();
			return;
		}
		if (!j.hasClass("easyScanLayoutItemWrapper")) {
			return;
		}
		this._ignoreSelfFocus = true;
		this.jqElement.find(".sapUshellEasyScanLayoutInner").focus();
	};
	K.prototype.arrowUpDownHandler = function (e, i) {
		e.preventDefault();
		var n = i ? "prev" : "next";
		var j = q(document.activeElement);
		if (!j.hasClass("sapOvpCardHeader")) {
			var k = q(j)[n](".easyScanLayoutItemWrapper");
			if (!k.is(j)) {
				this._swapItemsFocus(e, j, k);
			}
		}
	};
	K.prototype.arrowRightLeftHandler = function (e, i) {
		var j = i ? 1 : -1;
		var k = q(document.activeElement);
		var l = this._getLayoutItemIndex(k);
		if (l === false) {
			return;
		}
		var I = this.getVisibleLayoutItems()[l + j];
		if (I) {
			this._swapItemsFocus(e, k, I.$().parent());
		}
	};
	K.prototype.altPageUpAndHomeHandler = function (e) {
		var j = q(document.activeElement);
		var i = this._getLayoutItemIndex(j);
		if (i === false) {
			return;
		}
		var k = this.easyScanLayout.getColumnCount();
		var l = i % k;
		var n;
		var o = this.getVisibleLayoutItems();
		if (l == 0) {
			n = o[0];
		} else {
			n = o[i - l];
		}
		this._swapItemsFocus(e, j, n.$().parent());
	};
	K.prototype.altPageDownAndEndHandler = function (e) {
		var j = q(document.activeElement);
		var i = this._getLayoutItemIndex(j);
		if (i === false) {
			return;
		}
		var k = this.easyScanLayout.getColumnCount();
		var l = i % k;
		var n;
		var o = this.getVisibleLayoutItems();
		if ((l == (k - 1)) || ((i + (k - l)) > o.length)) {
			n = o[(o.length - 1)];
		} else {
			n = o[i + (k - l - 1)];
		}
		this._swapItemsFocus(e, j, n.$().parent());
	};
	K.prototype.ctrlHomeHandler = function (e) {
		var j = q(document.activeElement);
		var i = this._getLayoutItemIndex(j);
		if (i === false) {
			return;
		}
		var k = this.easyScanLayout.getColumnCount();
		var l = i % k;
		var v = this.getVisibleLayoutItems();
		var n = v[l];
		var o = n.$().parent();
		if (o.is(j)) {
			o = v[0].$().parent();
		}
		this._swapItemsFocus(e, j, o);
	};
	K.prototype.ctrlEndHandler = function (e) {
		var j = q(document.activeElement);
		var k = this._getLayoutItemIndex(j);
		if (k < 0) {
			return;
		}
		var l = this.easyScanLayout.getColumnCount();
		var n = k % l;
		var o;
		var v = this.getVisibleLayoutItems();
		for (var i = v.length - 1; i >= 0; i--) {
			if ((i % l) == n) {
				o = v[i];
				break;
			}
		}
		var p = o.$().parent();
		if (p.is(j)) {
			p = v[v.length - 1].$().parent();
		}
		this._swapItemsFocus(e, j, p);
	};
	K.prototype.pageUpDownHandler = function (e, i) {
		var n = i ? "prev" : "next";
		var j = q(document.activeElement);
		if (!j.hasClass("easyScanLayoutItemWrapper")) {
			return;
		}
		if (!j[n]().length) {
			return;
		}
		var k = false;
		var l = j;
		var w = q(window).height();
		while (!k) {
			var o = l[n]();
			if (!o.length) {
				k = l;
				break;
			}
			if (!i && o.offset().top > w) {
				k = o;
				break;
			}
			var p = o.offset().top;
			var s = 0;
			if (p) {
				s = p < 0 ? -1 : 1;
			}
			if (i && (s <= 0)) {
				k = o;
				break;
			}
			l = o;
		}
		this._swapItemsFocus(e, j, k);
	};
	K.prototype.ctrlArrowHandler = function (e) {
		if (this.swapSourceElement == null) {
			this.swapSourceElement = q(document.activeElement);
			if (!this.swapSourceElement.hasClass("easyScanLayoutItemWrapper")) {
				this.endSwap();
			} else {
				this.jqElement.on('keyup.keyboardNavigation', this.keyupHandler.bind(this));
				this.jqElement.addClass('dragAndDropMode');
				this.swapSourceElement.addClass('dragHovered');
			}
		}
	};
	K.prototype.keyupHandler = function (e) {
		if (this.swapSourceElement != null && e.keyCode === this.keyCodes.CONTROL) {
			var j = q(document.activeElement);
			if (j.hasClass("easyScanLayoutItemWrapper")) {
				this.swapItemsFunction(this.swapSourceElement[0], j[0]);
				this._changeItemsFocus(this.swapSourceElement);
			}
			this.endSwap();
		}
	};
	K.prototype.endSwap = function (e) {
		this.swapSourceElement.removeClass('dragHovered');
		this.jqElement.removeClass('dragAndDropMode');
		this.swapSourceElement = null;
		this.jqElement.off('keyup.keyboardNavigation');
	};
	K.prototype.checkIfSwapInterrupted = function (e) {
		if (this.swapSourceElement != null && e.keyCode != this.keyCodes.ARROW_LEFT && e.keyCode != this.keyCodes.ARROW_RIGHT && e.keyCode !=
			this.keyCodes.ARROW_UP && e.keyCode != this.keyCodes.ARROW_DOWN) {
			this.endSwap();
		}
	};
	K.prototype.spacebarHandler = function (e) {
		b.bCRTLPressed = e.ctrlKey || e.metaKey;
		var i = sap.ui.getCore().byId(e.target.id);
		if (i && i.mEventRegistry.hasOwnProperty('press')) {
			q('#' + e.target.id).addClass('sapMLIBActive');
			q('#' + e.target.id + ' span').css('color', '#FFFFFF');
			i.firePress();
		}
	};
	K.prototype.bodyKeyupHandler = function (e) {
		if (e.ctrlKey || e.metaKey) {
			b.bCRTLPressed = false;
		}
	};
	K.prototype.bodyKeydownHandler = function (e) {
		if (e.ctrlKey || e.metaKey) {
			b.bCRTLPressed = true;
		}
	};
	K.prototype.keydownHandler = function (e) {
		this.checkIfSwapInterrupted(e);
		switch (e.keyCode) {
		case this.keyCodes.TAB:
			(e.shiftKey) ? this.shiftTabButtonHandler(e): this.tabButtonHandler(e);
			break;
		case this.keyCodes.F6:
			if (e.shiftKey) {
				this._ignoreSelfFocus = true;
				this.jqElement.find(".sapUshellEasyScanLayoutInner").focus();
				q.sap.handleF6GroupNavigation(e);
			} else {
				this._ignoreSelfFocus = true;
				var i = this.jqElement.scrollTop();
				this.jqElement.find(".after").focus();
				q.sap.handleF6GroupNavigation(e);
				this.jqElement.scrollTop(i);
			}
			break;
		case this.keyCodes.F7:
			this.f7Handler(e);
			break;
		case this.keyCodes.ARROW_UP:
			if (e.ctrlKey == true) {
				this.ctrlArrowHandler(e);
			}
			this.arrowUpDownHandler(e, true);
			break;
		case this.keyCodes.ARROW_DOWN:
			if (e.ctrlKey == true) {
				this.ctrlArrowHandler(e);
			}
			this.arrowUpDownHandler(e, false);
			break;
		case this.keyCodes.ARROW_RIGHT:
			if (e.ctrlKey == true) {
				this.ctrlArrowHandler(e);
			}
			this.arrowRightLeftHandler(e, true);
			break;
		case this.keyCodes.ARROW_LEFT:
			if (e.ctrlKey == true) {
				this.ctrlArrowHandler(e);
			}
			this.arrowRightLeftHandler(e, false);
			break;
		case this.keyCodes.HOME:
			(e.ctrlKey == true) ? this.ctrlHomeHandler(e): this.altPageUpAndHomeHandler(e);
			break;
		case this.keyCodes.END:
			(e.ctrlKey == true) ? this.ctrlEndHandler(e): this.altPageDownAndEndHandler(e);
			break;
		case this.keyCodes.PAGE_UP:
			(e.altKey == true) ? this.altPageUpAndHomeHandler(e): this.pageUpDownHandler(e, true);
			if (e.ctrlKey) {
				this.ctrlArrowHandler(e);
				this.pageUpDownHandler(e, true);
			}
			break;
		case this.keyCodes.PAGE_DOWN:
			(e.altKey == true) ? this.altPageDownAndEndHandler(e): this.pageUpDownHandler(e, false);
			if (e.ctrlKey) {
				this.ctrlArrowHandler(e);
				this.pageUpDownHandler(e, false);
			}
			break;
		case this.keyCodes.SPACE:
		case this.keyCodes.ENTER:
			this.spacebarHandler(e);
			break;
		}
	};
	var E = a.extend("sap.ovp.ui.EasyScanLayout", {
		metadata: {
			designTime: true,
			library: "sap.ovp",
			aggregations: {
				content: {
					type: "sap.ui.core.Control",
					multiple: true,
					singularName: "content"
				}
			},
			defaultAggregation: "content",
			events: {
				afterRendering: {},
				afterDragEnds: {},
				afterColumnUpdate: {}
			},
			properties: {
				useMediaQueries: {
					group: "Misc",
					type: "boolean",
					defaultValue: false
				},
				dragAndDropRootSelector: {
					group: "Misc",
					type: "string"
				},
				dragAndDropEnabled: {
					group: "Misc",
					type: "boolean",
					defaultValue: true
				},
				debounceTime: {
					group: "Misc",
					type: "int",
					defaultValue: 150
				}
			}
		},
		renderer: {
			render: function (r, o) {
				r.write("<div");
				r.writeControlData(o);
				r.addClass("sapUshellEasyScanLayout");
				r.writeClasses();
				r.write(">");
				r.write("<div class='sapUshellEasyScanLayoutInner' role='list' tabindex='0' aria-label='Cards'>");
				var e = o.columnCount;
				var j = Array.apply(null, new Array(e)).map(function () {
					return [];
				});
				var k = o.getContent().filter(function (n) {
					return n.getVisible();
				});
				for (var i = 0; i < k.length; i++) {
					j[i % e].push(k[i]);
				}
				var l = 1;
				j.forEach(function (n) {
					r.write("<div");
					r.addClass("easyScanLayoutColumn");
					r.writeClasses();
					r.write(">");
					n.forEach(function (p, s) {
						r.write("<div ");
						(l === 1) ? r.write("tabindex='0' "): r.write("tabindex='-1' ");
						r.addClass("easyScanLayoutItemWrapper");
						r.write("aria-setsize=" + k.length + " aria-posinset=" + l);
						l++;
						r.writeClasses();
						r.write(">");
						r.renderControl(p);
						r.write("</div>");
					});
					r.write("</div>");
				});
				r.write("</div>");
				r.write("<div class='after' tabindex='0'></div>");
				r.write("</div>");
			}
		}
	});
	var g = function () {
		return [{
			minWidth: 0,
			styleClass: "columns-blank",
			columnCount: 1
		}, {
			minWidth: 240,
			styleClass: "columns-block",
			columnCount: 1
		}, {
			minWidth: 352,
			styleClass: "columns-narrow",
			columnCount: 1
		}, {
			minWidth: 433,
			styleClass: "columns-wide",
			columnCount: 1
		}, {
			minWidth: 704,
			styleClass: "columns-narrow",
			columnCount: 2
		}, {
			minWidth: 864,
			styleClass: "columns-wide",
			columnCount: 2
		}, {
			minWidth: 1024,
			styleClass: "columns-narrow",
			columnCount: 3
		}, {
			minWidth: 1280,
			styleClass: "columns-wide",
			columnCount: 3
		}, {
			minWidth: 1440,
			styleClass: "columns-narrow",
			columnCount: 4
		}, {
			minWidth: 1800,
			styleClass: "columns-wide",
			columnCount: 4
		}, {
			minWidth: 2560,
			styleClass: "columns-narrow",
			columnCount: 5
		}, {
			minWidth: 3008,
			styleClass: "columns-wide",
			columnCount: 5
		}, {
			minWidth: 3600,
			styleClass: "columns-narrow",
			columnCount: 4
		}, {
			minWidth: 3840,
			styleClass: "columns-wide",
			columnCount: 4
		}, {
			minWidth: 5120,
			styleClass: "columns-wide",
			columnCount: 5
		}, {
			minWidth: 6016,
			styleClass: "columns-wide",
			columnCount: 5
		}];
	};
	E.prototype.init = function () {
		this.data("sap-ui-fastnavgroup", "true", true);
		this.columnResolutionList = g();
		this.columnCount = this.columnResolutionList[0].columnCount;
		this.columnStyle = "";
		this.updateColumnClass(this.columnResolutionList[0].styleClass);
		var e = D.browser.msie && D.browser.version > 9;
		if (e && this.getUseMediaQueries()) {
			this.mediaQueryList = this.initMediaListeners(this.columnResolutionList);
		} else {
			this.resizeHandlerId = this.initResizeHandler(this.columnResolutionList);
		}
	};
	var m;
	var f = function (e, i, j) {
		var k = function (l, n) {
			this.updateColumnClass(n);
			this.refreshColumnCount(l, this.getContent());
		};
		if (j.matches) {
			window.clearTimeout(m);
			m = window.setTimeout(k.bind(this, e, i), this.getDebounceTime());
		}
	};
	var h = function (e, t) {
		var i = e.minWidth;
		var j = t && t.minWidth;
		return "(min-width: " + i + "px)" + (j ? " and (max-width: " + (j - 1) + "px)" : "");
	};
	E.prototype.initMediaListeners = function (e) {
		var j = [];
		for (var i = 0; i < e.length; i++) {
			var k = h(e[i], e[i + 1]);
			var l = window.matchMedia(k);
			var n = f.bind(this, e[i].columnCount, e[i].styleClass);
			l.addListener(n);
			l.bindedListener = n;
			n(l);
			j.push(l);
		}
		return j;
	};
	E.prototype.initResizeHandler = function (e) {
		var r;
		var i = this.getDebounceTime();
		var j = function () {
			window.clearTimeout(r);
			r = window.setTimeout(this.oControl.resizeHandler.bind(this, e), i);
		};
		return R.register(this, j);
	};
	E.prototype.resizeHandler = function (e) {
		var w = this.iWidth;
		var t = this;
		var o = this.oControl;
		var r;
		if (q(".sapFDynamicPageContent").length > 0) {
			w = window.innerWidth;
		}
		for (var i = 0; i < e.length; i++) {
			if (!e[i + 1]) {
				r = e[i];
				break;
			}
			if (e[i].minWidth <= w && e[i + 1].minWidth > w) {
				r = e[i];
				break;
			}
		}
		o.refreshColumnCount(r.columnCount, o.getContent(), t);
		o.updateColumnClass(r.styleClass);
		o.fireAfterColumnUpdate(r);
	};
	E.prototype.getColumnWidth = function (s) {
		var e;
		switch (s) {
		case "columns-blank":
			e = 0;
			break;
		case "columns-narrow":
			e = 20;
			break;
		case "columns-wide":
			e = 25;
			break;
		}
		return e;
	};
	E.prototype.refreshColumnCount = function (e, k, t) {
		this.columnCount = e;
		var l = q();
		for (var i = 0; i < e; i++) {
			l = l.add("<div class='easyScanLayoutColumn'/>");
		}
		var n = k.filter(function (p) {
			return p.getVisible();
		});
		var o = 1;
		for (var j = 0; j < n.length; j++) {
			q(n[j].getDomRef()).parent().attr('aria-posinset', o);
			o++;
			l.get(j % e).appendChild(n[j].getDomRef().parentNode);
		}
		this.$().children(".sapUshellEasyScanLayoutInner").empty().append(l);
		if (t && t.iWidth) {
			this.headerMargin(t);
		}
	};
	E.prototype.headerMargin = function (t) {
		var e = 0,
			j = 0;
		var w = t.iWidth;
		var r, k, l, s = 0,
			n, v = 0;
		var o = g();
		var p = C.getPixelPerRem();
		var u = (window.innerWidth * 1.0) / p;
		if (q(".sapFDynamicPageContent").length > 0) {
			w = window.innerWidth;
		}
		for (var i = 0; i < o.length; i++) {
			if (!o[i + 1]) {
				r = o[i];
				break;
			}
			if (o[i].minWidth <= w && o[i + 1].minWidth > w) {
				r = o[i];
				break;
			}
		}
		n = this.getColumnWidth(r.styleClass);
		l = (r.columnCount * n + (r.columnCount - 1) * 1);
		if (D.system.desktop) {
			s = q('.sapFDynamicPageScrollBar').css('width');
			if (typeof s === "string" || s instanceof String) {
				v = s.length > 0 ? parseInt(s.split("px")[0], 10) : 0;
			}
			s = (v * 1.0) / p;
		}
		k = (u - s - l) / 2;
		q('.sapFDynamicPageTitle').css({
			"margin-left": k + "rem",
			"margin-right": k + "rem",
			"visibility": "visible"
		});
		q('.sapFDynamicPageHeader').css({
			"margin-left": k + "rem",
			"margin-right": k + "rem",
			"visibility": "visible"
		});
		if (D.system.desktop) {
			u = q("body").width();
			if (q(".sapFDynamicPageContentFitContainer").length > 0) {
				e = q(".sapFDynamicPageContentFitContainer")[0].clientWidth;
			}
			if (u === e) {
				var x = q('.sapFDynamicPageTitle').css('margin-left');
				var y = q('.sapFDynamicPageTitle').css('margin-right');
				if (typeof x === "string" || x instanceof String) {
					x = x.length > 0 ? parseInt(x.split("px")[0], 10) : 0;
				}
				if (typeof y === "string" || y instanceof String) {
					y = y.length > 0 ? parseInt(y.split("px")[0], 10) : 0;
				}
				s = q('.sapFDynamicPageScrollBar').css('width');
				if (typeof s === "string" || s instanceof String) {
					v = s.length > 0 ? parseInt(s.split("px")[0], 10) : 0;
				}
				s = v;
				j = s / 2;
				x = (x + j) / (p * 1.0);
				y = (y + j) / (p * 1.0);
				q('.sapFDynamicPageTitle').css({
					"margin-left": x + "rem",
					"margin-right": y + "rem",
					"visibility": "visible"
				});
				q('.sapFDynamicPageHeader').css({
					"margin-left": x + "rem",
					"margin-right": y + "rem",
					"visibility": "visible"
				});
			}
		}
	};
	E.prototype.getColumnCount = function () {
		return this.columnCount;
	};
	E.prototype.getVisibleLayoutItems = function () {
		var e = this.getContent();
		var i = e.filter(function (j) {
			return j.getVisible();
		});
		return i;
	};
	E.prototype.updateColumnClass = function (e) {
		if (this.columnStyle === e) {
			return;
		}
		this.removeStyleClass(this.columnStyle);
		this.addStyleClass(e);
		this.columnStyle = e;
	};
	E.prototype.afterDragAndDropHandler = function (e) {
		var A = this.removeAllAggregation("content", true);
		var v = [];
		var V = 0;
		e.forEach(function (j, k) {
			var l = j.children[0].getAttribute("id");
			var o = sap.ui.getCore().byId(l);
			v.push(o);
			q(j).attr('aria-posinset', k + 1);
		});
		for (var i = 0; i < A.length; i++) {
			if (A[i].getVisible()) {
				this.addAggregation("content", v[V], true);
				V++;
			} else {
				this.addAggregation("content", A[i], true);
			}
		}
		this.fireAfterDragEnds({
			positionChanges: this.layoutDragAndDrop.positionChanges
		});
		this.refreshColumnCount(this.getColumnCount(), this.getContent());
	};
	E.prototype.setActive = function (s) {
		if (s) {
			this.removeStyleClass("ovpOverlay");
		} else {
			this.addStyleClass("ovpOverlay");
		}
	};
	E.prototype.getActive = function () {
		return !this.hasStyleClass("ovpOverlay");
	};
	E.prototype.onAfterRendering = function () {
		if (!this.getDragAndDropRootSelector()) {
			this.setDragAndDropRootSelector("#" + this.getId());
		}
		if (this.layoutDragAndDrop) {
			this.layoutDragAndDrop.destroy();
		}
		if (this.getDragAndDropEnabled()) {
			this.layoutDragAndDrop = d.buildReplaceItemsInstance({
				afterReplaceElements: this.afterDragAndDropHandler.bind(this),
				rootSelector: this.getDragAndDropRootSelector(),
				layout: this
			});
		}
		if (this.keyboardNavigation) {
			this.keyboardNavigation.destroy();
		}
		var s = this.layoutDragAndDrop ? this.layoutDragAndDrop.getSwapItemsFunction() : null;
		this.keyboardNavigation = new K(this, s);
		this.fireAfterRendering();
	};
	E.prototype.exit = function () {
		if (this.mediaQueryList) {
			this.mediaQueryList.forEach(function (e) {
				e.removeListener(e.bindedListener);
			});
			delete this.mediaQueryList;
		}
		if (this.resizeHandlerId) {
			R.deregister(this.resizeHandlerId);
		}
		if (this.layoutDragAndDrop) {
			this.layoutDragAndDrop.destroy();
			delete this.layoutDragAndDrop;
		}
	};
	return E;
});