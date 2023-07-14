(function () {
	var t, n = [].indexOf || function (t) {
			for (var n = 0, e = this.length; e > n; n++)
				if (n in this && this[n] === t) return n;
			return -1
		},
		e = [].slice,
		r = function (t, n) {
			return function () {
				return t.apply(n, arguments)
			}
		},
		a = {}.hasOwnProperty;
	(t = function (t) {
		return "object" == typeof exports && "object" == typeof module ? t(require("jquery")) : "function" == typeof define && define.amd ?
			define(["jquery"], t) : t(jQuery)
	})(function (t) {
		var o, i, l, s, u, c, p, h, d, f, v, g, m, C, b, A, y, x;
		return i = function (t, n, e) {
			var r, a, o, i;
			for (t += "", a = t.split("."), o = a[0], i = a.length > 1 ? e + a[1] : "", r = /(\d+)(\d{3})/; r.test(o);) o = o.replace(r, "$1" + n +
				"$2");
			return o + i
		}, v = function (n) {
			var e;
			return e = {
					digitsAfterDecimal: 2,
					scaler: 1,
					thousandsSep: ",",
					decimalSep: ".",
					prefix: "",
					suffix: "",
					showZero: !1
				}, n = t.extend({}, e, n),
				function (t) {
					var e;
					return isNaN(t) || !isFinite(t) ? "" : 0 !== t || n.showZero ? (e = i((n.scaler * t).toFixed(n.digitsAfterDecimal), n.thousandsSep,
						n.decimalSep), "" + n.prefix + e + n.suffix) : ""
				}
		}, b = v(), A = v({
			digitsAfterDecimal: 0
		}), y = v({
			digitsAfterDecimal: 1,
			scaler: 100,
			suffix: "%"
		}), l = {
			count: function (t) {
				return null == t && (t = A),
					function () {
						return function (n, e, r) {
							return {
								count: 0,
								push: function () {
									return this.count++
								},
								value: function () {
									return this.count
								},
								format: t
							}
						}
					}
			},
			countUnique: function (t) {
				return null == t && (t = A),
					function (e) {
						var r;
						return r = e[0],
							function (e, a, o) {
								return {
									uniq: [],
									push: function (t) {
										var e;
										return e = t[r], n.call(this.uniq, e) < 0 ? this.uniq.push(t[r]) : void 0
									},
									value: function () {
										return this.uniq.length
									},
									format: t,
									numInputs: null != r ? 0 : 1
								}
							}
					}
			},
			listUnique: function (t) {
				return function (e) {
					var r;
					return r = e[0],
						function (e, a, o) {
							return {
								uniq: [],
								push: function (t) {
									var e;
									return e = t[r], n.call(this.uniq, e) < 0 ? this.uniq.push(t[r]) : void 0
								},
								value: function () {
									return this.uniq.join(t)
								},
								format: function (t) {
									return t
								},
								numInputs: null != r ? 0 : 1
							}
						}
				}
			},
			sum: function (t) {
				return null == t && (t = b),
					function (n) {
						var e;
						return e = n[0],
							function (n, r, a) {
								return {
									sum: 0,
									push: function (t) {
										return isNaN(parseFloat(t[e])) ? void 0 : this.sum += parseFloat(t[e])
									},
									value: function () {
										return this.sum
									},
									format: t,
									numInputs: null != e ? 0 : 1
								}
							}
					}
			},
			min: function (t) {
				return null == t && (t = b),
					function (n) {
						var e;
						return e = n[0],
							function (n, r, a) {
								return {
									val: null,
									push: function (t) {
										var n, r;
										return r = parseFloat(t[e]), isNaN(r) ? void 0 : this.val = Math.min(r, null != (n = this.val) ? n : r)
									},
									value: function () {
										return this.val
									},
									format: t,
									numInputs: null != e ? 0 : 1
								}
							}
					}
			},
			max: function (t) {
				return null == t && (t = b),
					function (n) {
						var e;
						return e = n[0],
							function (n, r, a) {
								return {
									val: null,
									push: function (t) {
										var n, r;
										return r = parseFloat(t[e]), isNaN(r) ? void 0 : this.val = Math.max(r, null != (n = this.val) ? n : r)
									},
									value: function () {
										return this.val
									},
									format: t,
									numInputs: null != e ? 0 : 1
								}
							}
					}
			},
			first: function (t) {
				return null == t && (t = b),
					function (n) {
						var e;
						return e = n[0],
							function (n, r, a) {
								return {
									val: null,
									sorter: p(null != n ? n.sorters : void 0, e),
									push: function (t) {
										var n, r;
										return r = t[e], this.sorter(r, null != (n = this.val) ? n : r) <= 0 ? this.val = r : void 0
									},
									value: function () {
										return this.val
									},
									format: function (n) {
										return isNaN(n) ? n : t(n)
									},
									numInputs: null != e ? 0 : 1
								}
							}
					}
			},
			last: function (t) {
				return null == t && (t = b),
					function (n) {
						var e;
						return e = n[0],
							function (n, r, a) {
								return {
									val: null,
									sorter: p(null != n ? n.sorters : void 0, e),
									push: function (t) {
										var n, r;
										return r = t[e], this.sorter(r, null != (n = this.val) ? n : r) >= 0 ? this.val = r : void 0
									},
									value: function () {
										return this.val
									},
									format: function (n) {
										return isNaN(n) ? n : t(n)
									},
									numInputs: null != e ? 0 : 1
								}
							}
					}
			},
			average: function (t) {
				return null == t && (t = b),
					function (n) {
						var e;
						return e = n[0],
							function (n, r, a) {
								return {
									sum: 0,
									len: 0,
									push: function (t) {
										return isNaN(parseFloat(t[e])) ? void 0 : (this.sum += parseFloat(t[e]), this.len++)
									},
									value: function () {
										return this.sum / this.len
									},
									format: t,
									numInputs: null != e ? 0 : 1
								}
							}
					}
			},
			sumOverSum: function (t) {
				return null == t && (t = b),
					function (n) {
						var e, r;
						return r = n[0], e = n[1],
							function (n, a, o) {
								return {
									sumNum: 0,
									sumDenom: 0,
									push: function (t) {
										return isNaN(parseFloat(t[r])) || (this.sumNum += parseFloat(t[r])), isNaN(parseFloat(t[e])) ? void 0 : this.sumDenom +=
											parseFloat(t[e])
									},
									value: function () {
										return this.sumNum / this.sumDenom
									},
									format: t,
									numInputs: null != r && null != e ? 0 : 2
								}
							}
					}
			},
			sumOverSumBound80: function (t, n) {
				return null == t && (t = !0), null == n && (n = b),
					function (e) {
						var r, a;
						return a = e[0], r = e[1],
							function (e, o, i) {
								return {
									sumNum: 0,
									sumDenom: 0,
									push: function (t) {
										return isNaN(parseFloat(t[a])) || (this.sumNum += parseFloat(t[a])), isNaN(parseFloat(t[r])) ? void 0 : this.sumDenom +=
											parseFloat(t[r])
									},
									value: function () {
										var n;
										return n = t ? 1 : -1, (.821187207574908 / this.sumDenom + this.sumNum / this.sumDenom + 1.2815515655446004 * n * Math.sqrt(
											.410593603787454 / (this.sumDenom * this.sumDenom) + this.sumNum * (1 - this.sumNum / this.sumDenom) / (this.sumDenom *
												this.sumDenom))) / (1 + 1.642374415149816 / this.sumDenom)
									},
									format: n,
									numInputs: null != a && null != r ? 0 : 2
								}
							}
					}
			},
			fractionOf: function (t, n, r) {
				return null == n && (n = "total"), null == r && (r = y),
					function () {
						var a;
						return a = 1 <= arguments.length ? e.call(arguments, 0) : [],
							function (e, o, i) {
								return {
									selector: {
										total: [
											[],
											[]
										],
										row: [o, []],
										col: [
											[], i
										]
									}[n],
									inner: t.apply(null, a)(e, o, i),
									push: function (t) {
										return this.inner.push(t)
									},
									format: r,
									value: function () {
										return this.inner.value() / e.getAggregator.apply(e, this.selector).inner.value()
									},
									numInputs: t.apply(null, a)().numInputs
								}
							}
					}
			}
		}, s = function (t) {
			return {
				Count: t.count(A),
				"Count Unique Values": t.countUnique(A),
				"List Unique Values": t.listUnique(", "),
				Sum: t.sum(b),
				"Integer Sum": t.sum(A),
				Average: t.average(b),
				Minimum: t.min(b),
				Maximum: t.max(b),
				First: t.first(b),
				Last: t.last(b),
				"Sum over Sum": t.sumOverSum(b),
				"80% Upper Bound": t.sumOverSumBound80(!0, b),
				"80% Lower Bound": t.sumOverSumBound80(!1, b),
				"Sum as Fraction of Total": t.fractionOf(t.sum(), "total", y),
				"Sum as Fraction of Rows": t.fractionOf(t.sum(), "row", y),
				"Sum as Fraction of Columns": t.fractionOf(t.sum(), "col", y),
				"Count as Fraction of Total": t.fractionOf(t.count(), "total", y),
				"Count as Fraction of Rows": t.fractionOf(t.count(), "row", y),
				"Count as Fraction of Columns": t.fractionOf(t.count(), "col", y)
			}
		}(l), m = {
			Table: function (t, n) {
				return g(t, n)
			},
			"Table Barchart": function (n, e) {
				return t(g(n, e)).barchart()
			},
			Heatmap: function (n, e) {
				return t(g(n, e)).heatmap("heatmap", e)
			},
			"Row Heatmap": function (n, e) {
				return t(g(n, e)).heatmap("rowheatmap", e)
			},
			"Col Heatmap": function (n, e) {
				return t(g(n, e)).heatmap("colheatmap", e)
			}
		}, h = {
			en: {
				aggregators: s,
				renderers: m,
				localeStrings: {
					renderError: "An error occurred rendering the PivotTable results.",
					computeError: "An error occurred computing the PivotTable results.",
					uiRenderError: "An error occurred rendering the PivotTable UI.",
					selectAll: "Select All",
					selectNone: "Select None",
					tooMany: "(too many to list)",
					filterResults: "Filter values",
					apply: "Apply",
					cancel: "Cancel",
					totals: "Total",
					vs: "vs",
					by: "by"
				}
			}
		}, d = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], u = ["Sun", "Mon", "Tue", "Wed", "Thu",
			"Fri", "Sat"
		], x = function (t) {
			return ("0" + t).substr(-2, 2)
		}, c = {
			bin: function (t, n) {
				return function (e) {
					return e[t] - e[t] % n
				}
			},
			dateFormat: function (t, n, e, r, a) {
				var o;
				return null == e && (e = !1), null == r && (r = d), null == a && (a = u), o = e ? "UTC" : "",
					function (e) {
						var i;
						return i = new Date(Date.parse(e[t])), isNaN(i) ? "" : n.replace(/%(.)/g, function (t, n) {
							switch (n) {
							case "y":
								return i["get" + o + "FullYear"]();
							case "m":
								return x(i["get" + o + "Month"]() + 1);
							case "n":
								return r[i["get" + o + "Month"]()];
							case "d":
								return x(i["get" + o + "Date"]());
							case "w":
								return a[i["get" + o + "Day"]()];
							case "x":
								return i["get" + o + "Day"]();
							case "H":
								return x(i["get" + o + "Hours"]());
							case "M":
								return x(i["get" + o + "Minutes"]());
							case "S":
								return x(i["get" + o + "Seconds"]());
							default:
								return "%" + n
							}
						})
					}
			}
		}, f = function (t) {
			return function (t, n) {
				var e, r, a, o, i, l, s;
				if (l = /(\d+)|(\D+)/g, i = /\d/, s = /^0/, "number" == typeof t || "number" == typeof n) return isNaN(t) ? 1 : isNaN(n) ? -1 : t -
					n;
				if (e = String(t), a = String(n), e === a) return 0;
				if (!i.test(e) || !i.test(a)) return e > a ? 1 : -1;
				for (e = e.match(l), a = a.match(l); e.length && a.length;)
					if (r = e.shift(), o = a.shift(), r !== o) return i.test(r) && i.test(o) ? r.replace(s, ".0") - o.replace(s, ".0") : r > o ? 1 : -
						1;
				return e.length - a.length
			}
		}(this), C = function (t) {
			var n, e, r, a;
			r = {}, e = {};
			for (n in t) a = t[n], r[a] = n, "string" == typeof a && (e[a.toLowerCase()] = n);
			return function (t, n) {
				return null != r[t] && null != r[n] ? r[t] - r[n] : null != r[t] ? -1 : null != r[n] ? 1 : null != e[t] && null != e[n] ? e[t] - e[
					n] : null != e[t] ? -1 : null != e[n] ? 1 : f(t, n)
			}
		}, p = function (n, e) {
			var r;
			if (null != n)
				if (t.isFunction(n)) {
					if (r = n(e), t.isFunction(r)) return r
				} else if (null != n[e]) return n[e];
			return f
		}, o = function () {
			function n(t, e) {
				var a, o, i, s, u, c, p, h;
				null == e && (e = {}), this.getAggregator = r(this.getAggregator, this), this.getRowKeys = r(this.getRowKeys, this), this.getColKeys =
					r(this.getColKeys, this), this.sortKeys = r(this.sortKeys, this), this.arrSort = r(this.arrSort, this), this.input = t, this.aggregator =
					null != (a = e.aggregator) ? a : l.count()(), this.aggregatorName = null != (o = e.aggregatorName) ? o : "Count", this.colAttrs =
					null != (i = e.cols) ? i : [], this.rowAttrs = null != (s = e.rows) ? s : [], this.valAttrs = null != (u = e.vals) ? u : [], this.sorters =
					null != (c = e.sorters) ? c : {}, this.derivedAttributes = null != (p = e.derivedAttributes) ? p : {}, this.filter = null != (h = e
						.filter) ? h : function () {
						return !0
					}, this.tree = {}, this.rowKeys = [], this.colKeys = [], this.rowTotals = {}, this.colTotals = {}, this.allTotal = this.aggregator(
						this, [], []), this.sorted = !1, n.forEachRecord(this.input, this.derivedAttributes, function (t) {
						return function (n) {
							return t.filter(n) ? t.processRecord(n) : void 0
						}
					}(this))
			}
			return n.forEachRecord = function (n, e, r) {
				var o, i, l, s, u, c, p, h, d, f, v, g;
				if (o = t.isEmptyObject(e) ? r : function (t) {
						var n, a, o;
						for (n in e) o = e[n], t[n] = null != (a = o(t)) ? a : t[n];
						return r(t)
					}, t.isFunction(n)) return n(o);
				if (t.isArray(n)) {
					if (t.isArray(n[0])) {
						f = [];
						for (l in n)
							if (a.call(n, l) && (i = n[l], l > 0)) {
								h = {}, d = n[0];
								for (s in d) a.call(d, s) && (u = d[s], h[u] = i[s]);
								f.push(o(h))
							}
						return f
					}
					for (v = [], c = 0, p = n.length; p > c; c++) h = n[c], v.push(o(h));
					return v
				}
				if (n instanceof jQuery) return g = [], t("thead > tr > th", n).each(function (n) {
					return g.push(t(this).text())
				}), t("tbody > tr", n).each(function (n) {
					return h = {}, t("td", this).each(function (n) {
						return h[g[n]] = t(this).text()
					}), o(h)
				});
				throw new Error("unknown input format")
			}, n.prototype.forEachMatchingRecord = function (t, e) {
				return n.forEachRecord(this.input, this.derivedAttributes, function (n) {
					return function (r) {
						var a, o, i;
						if (n.filter(r)) {
							for (a in t)
								if (i = t[a], i !== (null != (o = r[a]) ? o : "null")) return;
							return e(r)
						}
					}
				}(this))
			}, n.prototype.arrSort = function (t) {
				var n, e;
				return e = function () {
						var e, r, a;
						for (a = [], e = 0, r = t.length; r > e; e++) n = t[e], a.push(p(this.sorters, n));
						return a
					}.call(this),
					function (t, n) {
						var r, o, i;
						for (o in e)
							if (a.call(e, o) && (i = e[o], r = i(t[o], n[o]), 0 !== r)) return r;
						return 0
					}
			}, n.prototype.sortKeys = function () {
				return this.sorted ? void 0 : (this.sorted = !0, this.rowKeys.sort(this.arrSort(this.rowAttrs)), this.colKeys.sort(this.arrSort(
					this.colAttrs)))
			}, n.prototype.getColKeys = function () {
				return this.sortKeys(), this.colKeys
			}, n.prototype.getRowKeys = function () {
				return this.sortKeys(), this.rowKeys
			}, n.prototype.processRecord = function (t) {
				var n, e, r, a, o, i, l, s, u, c, p, h, d;
				for (n = [], h = [], s = this.colAttrs, a = 0, o = s.length; o > a; a++) d = s[a], n.push(null != (u = t[d]) ? u : "null");
				for (c = this.rowAttrs, l = 0, i = c.length; i > l; l++) d = c[l], h.push(null != (p = t[d]) ? p : "null");
				return r = h.join(String.fromCharCode(0)), e = n.join(String.fromCharCode(0)), this.allTotal.push(t), 0 !== h.length && (this.rowTotals[
						r] || (this.rowKeys.push(h), this.rowTotals[r] = this.aggregator(this, h, [])), this.rowTotals[r].push(t)), 0 !== n.length && (
						this.colTotals[e] || (this.colKeys.push(n), this.colTotals[e] = this.aggregator(this, [], n)), this.colTotals[e].push(t)), 0 !==
					n.length && 0 !== h.length ? (this.tree[r] || (this.tree[r] = {}), this.tree[r][e] || (this.tree[r][e] = this.aggregator(this, h,
						n)), this.tree[r][e].push(t)) : void 0
			}, n.prototype.getAggregator = function (t, n) {
				var e, r, a;
				return a = t.join(String.fromCharCode(0)), r = n.join(String.fromCharCode(0)), e = 0 === t.length && 0 === n.length ? this.allTotal :
					0 === t.length ? this.colTotals[r] : 0 === n.length ? this.rowTotals[a] : this.tree[a][r], null != e ? e : {
						value: function () {
							return null
						},
						format: function () {
							return ""
						}
					}
			}, n
		}(), t.pivotUtilities = {
			aggregatorTemplates: l,
			aggregators: s,
			renderers: m,
			derivers: c,
			locales: h,
			naturalSort: f,
			numberFormat: v,
			sortAs: C,
			PivotData: o
		}, g = function (n, e) {
			var r, o, i, l, s, u, c, p, h, d, f, v, g, m, C, b, A, y, x, w, N, S, T, k;
			u = {
				table: {
					clickCallback: null
				},
				localeStrings: {
					totals: "Total"
				}
			}, e = t.extend(!0, {}, u, e), i = n.colAttrs, v = n.rowAttrs, m = n.getRowKeys(), s = n.getColKeys(), e.table.clickCallback && (c =
				function (t, r, o) {
					var l, s, u;
					s = {};
					for (u in i) a.call(i, u) && (l = i[u], null != o[u] && (s[l] = o[u]));
					for (u in v) a.call(v, u) && (l = v[u], null != r[u] && (s[l] = r[u]));
					return function (r) {
						return e.table.clickCallback(r, t, s, n)
					}
				}), f = document.createElement("table"), f.className = "pvtTable", C = function (t, n, e) {
				var r, a, o, i, l, s, u, c;
				if (0 !== n) {
					for (i = !0, c = r = 0, l = e; l >= 0 ? l >= r : r >= l; c = l >= 0 ? ++r : --r) t[n - 1][c] !== t[n][c] && (i = !1);
					if (i) return -1
				}
				for (a = 0; n + a < t.length;) {
					for (u = !1, c = o = 0, s = e; s >= 0 ? s >= o : o >= s; c = s >= 0 ? ++o : --o) t[n][c] !== t[n + a][c] && (u = !0);
					if (u) break;
					a++
				}
				return a
			}, x = document.createElement("thead");
			for (h in i)
				if (a.call(i, h)) {
					o = i[h], N = document.createElement("tr"), 0 === parseInt(h) && 0 !== v.length && (y = document.createElement("th"), y.setAttribute(
							"colspan", v.length), y.setAttribute("rowspan", i.length), N.appendChild(y)), y = document.createElement("th"), y.className =
						"pvtAxisLabel", y.textContent = o, N.appendChild(y);
					for (p in s) a.call(s, p) && (l = s[p], k = C(s, parseInt(p), parseInt(h)), -1 !== k && (y = document.createElement("th"), y.className =
						"pvtColLabel", y.textContent = l[h], y.setAttribute("colspan", k), parseInt(h) === i.length - 1 && 0 !== v.length && y.setAttribute(
							"rowspan", 2), N.appendChild(y)));
					0 === parseInt(h) && (y = document.createElement("th"), y.className = "pvtTotalLabel", y.innerHTML = e.localeStrings.totals, y.setAttribute(
						"rowspan", i.length + (0 === v.length ? 0 : 1)), N.appendChild(y)), x.appendChild(N)
				}
			if (0 !== v.length) {
				N = document.createElement("tr");
				for (p in v) a.call(v, p) && (d = v[p], y = document.createElement("th"), y.className = "pvtAxisLabel", y.textContent = d, N.appendChild(
					y));
				y = document.createElement("th"), 0 === i.length && (y.className = "pvtTotalLabel", y.innerHTML = e.localeStrings.totals), N.appendChild(
					y), x.appendChild(N)
			}
			f.appendChild(x), b = document.createElement("tbody");
			for (p in m)
				if (a.call(m, p)) {
					g = m[p], N = document.createElement("tr");
					for (h in g) a.call(g, h) && (S = g[h], k = C(m, parseInt(p), parseInt(h)), -1 !== k && (y = document.createElement("th"), y.className =
						"pvtRowLabel", y.textContent = S, y.setAttribute("rowspan", k), parseInt(h) === v.length - 1 && 0 !== i.length && y.setAttribute(
							"colspan", 2), N.appendChild(y)));
					for (h in s) a.call(s, h) && (l = s[h], r = n.getAggregator(g, l), T = r.value(), A = document.createElement("td"), A.className =
						"pvtVal row" + p + " col" + h, A.textContent = r.format(T), A.setAttribute("data-value", T), null != c && (A.onclick = c(T, g, l)),
						N.appendChild(A));
					w = n.getAggregator(g, []), T = w.value(), A = document.createElement("td"), A.className = "pvtTotal rowTotal", A.textContent = w.format(
						T), A.setAttribute("data-value", T), null != c && (A.onclick = c(T, g, [])), A.setAttribute("data-for", "row" + p), N.appendChild(
						A), b.appendChild(N)
				}
			N = document.createElement("tr"), y = document.createElement("th"), y.className = "pvtTotalLabel", y.innerHTML = e.localeStrings.totals,
				y.setAttribute("colspan", v.length + (0 === i.length ? 0 : 1)), N.appendChild(y);
			for (h in s) a.call(s, h) && (l = s[h], w = n.getAggregator([], l), T = w.value(), A = document.createElement("td"), A.className =
				"pvtTotal colTotal", A.textContent = w.format(T), A.setAttribute("data-value", T), null != c && (A.onclick = c(T, [], l)), A.setAttribute(
					"data-for", "col" + h), N.appendChild(A));
			return w = n.getAggregator([], []), T = w.value(), A = document.createElement("td"), A.className = "pvtGrandTotal", A.textContent = w
				.format(T), A.setAttribute("data-value", T), null != c && (A.onclick = c(T, [], [])), N.appendChild(A), b.appendChild(N), f.appendChild(
					b), f.setAttribute("data-numrows", m.length), f.setAttribute("data-numcols", s.length), f
		}, t.fn.pivot = function (n, e, r) {
			var a, i, s, u, c, p, d, f;
			null == r && (r = "en"), null == h[r] && (r = "en"), a = {
				cols: [],
				rows: [],
				vals: [],
				dataClass: o,
				filter: function () {
					return !0
				},
				aggregator: l.count()(),
				aggregatorName: "Count",
				sorters: {},
				derivedAttributes: {},
				renderer: g
			}, u = t.extend(!0, {}, h.en.localeStrings, h[r].localeStrings), s = {
				rendererOptions: {
					localeStrings: u
				},
				localeStrings: u
			}, c = t.extend(!0, {}, s, t.extend({}, a, e)), d = null;
			try {
				p = new c.dataClass(n, c);
				try {
					d = c.renderer(p, c.rendererOptions)
				} catch (v) {
					i = v, "undefined" != typeof console && null !== console && console.error(i.stack), d = t("<span>").html(c.localeStrings.renderError)
				}
			} catch (v) {
				i = v, "undefined" != typeof console && null !== console && console.error(i.stack), d = t("<span>").html(c.localeStrings.computeError)
			}
			for (f = this[0]; f.hasChildNodes();) f.removeChild(f.lastChild);
			return this.append(d)
		}, t.fn.pivotUI = function (e, r, i, l) {
			var s, u, c, d, v, g, m, C, b, A, y, x, w, N, S, T, k, F, E, D, I, R, M, L, O, K, q, U, V, j, H, B, W, P, J, _, z, G, Q;
			null == i && (i = !1), null == l && (l = "en"), null == h[l] && (l = "en"), g = {
				derivedAttributes: {},
				aggregators: h[l].aggregators,
				renderers: h[l].renderers,
				hiddenAttributes: [],
				menuLimit: 500,
				cols: [],
				rows: [],
				vals: [],
				dataClass: o,
				exclusions: {},
				inclusions: {},
				unusedAttrsVertical: 85,
				autoSortUnusedAttrs: !1,
				onRefresh: null,
				filter: function () {
					return !0
				},
				sorters: {}
			}, k = t.extend(!0, {}, h.en.localeStrings, h[l].localeStrings), T = {
				rendererOptions: {
					localeStrings: k
				},
				localeStrings: k
			}, C = this.data("pivotUIOptions"), I = null == C || i ? t.extend(!0, {}, T, t.extend({}, g, r)) : C;
			try {
				v = {}, F = [], M = 0, o.forEachRecord(e, I.derivedAttributes, function (t) {
					var n, e, r, o;
					if (I.filter(t)) {
						F.push(t);
						for (n in t) a.call(t, n) && null == v[n] && (v[n] = {}, M > 0 && (v[n]["null"] = M));
						for (n in v) o = null != (r = t[n]) ? r : "null", null == (e = v[n])[o] && (e[o] = 0), v[n][o]++;
						return M++
					}
				}), J = t("<table>", {
					"class": "pvtUi"
				}).attr("cellpadding", 5), H = t("<td>"), j = t("<select>").addClass("pvtRenderer").appendTo(H).bind("change", function () {
					return U()
				}), L = I.renderers;
				for (Q in L) a.call(L, Q) && t("<option>").val(Q).html(Q).appendTo(j);
				if (_ = t("<td>").addClass("pvtAxisContainer pvtUnused"), B = function () {
						var t;
						t = [];
						for (s in v) n.call(I.hiddenAttributes, s) < 0 && t.push(s);
						return t
					}(), G = !1, z = "auto" === I.unusedAttrsVertical ? 120 : parseInt(I.unusedAttrsVertical), !isNaN(z)) {
					for (d = 0, x = 0, w = B.length; w > x; x++) s = B[x], d += s.length;
					G = d > z
				}
				_.addClass(I.unusedAttrsVertical === !0 || G ? "pvtVertList" : "pvtHorizList"), b = function (e) {
					var r, a, o, i, l, s, u, c, h, d, f, g, m, C, b, y, x, w, N;
					if (N = function () {
							var t;
							t = [];
							for (b in v[e]) t.push(b);
							return t
						}(), c = !1, w = t("<div>").addClass("pvtFilterBox").hide(), w.append(t("<h4>").append(t("<span>").text(e), t("<span>").addClass(
							"count").text("(" + N.length + ")"))), N.length > I.menuLimit) w.append(t("<p>").html(I.localeStrings.tooMany));
					else
						for (N.length > 5 && (i = t("<p>").appendTo(w), m = p(I.sorters, e), f = I.localeStrings.filterResults, t("<input>", {
								type: "text"
							}).appendTo(i).attr({
								placeholder: f,
								"class": "pvtSearch"
							}).bind("keyup", function () {
								var e, r, a;
								return a = t(this).val().toLowerCase().trim(), r = function (t, e) {
									return function (r) {
										var o, i;
										return o = a.substring(t.length).trim(), 0 === o.length ? !0 : (i = Math.sign(m(r.toLowerCase(), o)), n.call(e, i) >= 0)
									}
								}, e = a.startsWith(">=") ? r(">=", [1, 0]) : a.startsWith("<=") ? r("<=", [-1, 0]) : a.startsWith(">") ? r(">", [1]) : a.startsWith(
									"<") ? r("<", [-1]) : a.startsWith("~") ? function (t) {
									return 0 === a.substring(1).trim().length ? !0 : t.toLowerCase().match(a.substring(1))
								} : function (t) {
									return -1 !== t.toLowerCase().indexOf(a)
								}, w.find(".pvtCheckContainer p label span.value").each(function () {
									return e(t(this).text()) ? t(this).parent().parent().show() : t(this).parent().parent().hide()
								})
							}), i.append(t("<br>")), t("<button>", {
								type: "button"
							}).appendTo(i).html(I.localeStrings.selectAll).bind("click", function () {
								return w.find("input:visible:not(:checked)").prop("checked", !0).toggleClass("changed"), !1
							}), t("<button>", {
								type: "button"
							}).appendTo(i).html(I.localeStrings.selectNone).bind("click", function () {
								return w.find("input:visible:checked").prop("checked", !1).toggleClass("changed"), !1
							})), a = t("<div>").addClass("pvtCheckContainer").appendTo(w), g = N.sort(p(I.sorters, e)), d = 0, h = g.length; h > d; d++) y =
							g[d], x = v[e][y], l = t("<label>"), s = !1, I.inclusions[e] ? s = n.call(I.inclusions[e], y) < 0 : I.exclusions[e] && (s = n.call(
								I.exclusions[e], y) >= 0), c || (c = s), t("<input>").attr("type", "checkbox").addClass("pvtFilter").attr("checked", !s).data(
								"filter", [e, y]).appendTo(l).bind("change", function () {
								return t(this).toggleClass("changed")
							}), l.append(t("<span>").addClass("value").text(y)), l.append(t("<span>").addClass("count").text("(" + x + ")")), a.append(t(
								"<p>").append(l));
					return o = function () {
						return w.find("[type='checkbox']").length > w.find("[type='checkbox']:checked").length ? r.addClass("pvtFilteredAttribute") : r.removeClass(
							"pvtFilteredAttribute"), w.find(".pvtSearch").val(""), w.find(".pvtCheckContainer p").show(), w.hide()
					}, u = t("<p>").appendTo(w), N.length <= I.menuLimit && t("<button>", {
						type: "button"
					}).text(I.localeStrings.apply).appendTo(u).bind("click", function () {
						return w.find(".changed").removeClass("changed").length && U(), o()
					}), t("<button>", {
						type: "button"
					}).text(I.localeStrings.cancel).appendTo(u).bind("click", function () {
						return w.find(".changed:checked").removeClass("changed").prop("checked", !1), w.find(".changed:not(:checked)").removeClass(
							"changed").prop("checked", !0), o()
					}), C = t("<span>").addClass("pvtTriangle").html(" &#x25BE;").bind("click", function (n) {
						var e, r, a;
						return r = t(n.currentTarget).position(), e = r.left, a = r.top, w.css({
							left: e + 10,
							top: a + 10
						}).show()
					}), r = t("<li>").addClass("axis_" + A).append(t("<span>").addClass("pvtAttr").text(e).data("attrName", e).append(C)), c && r.addClass(
						"pvtFilteredAttribute"), _.append(r).append(w)
				};
				for (A in B) a.call(B, A) && (c = B[A], b(c));
				W = t("<tr>").appendTo(J), u = t("<select>").addClass("pvtAggregator").bind("change", function () {
					return U()
				}), O = I.aggregators;
				for (Q in O) a.call(O, Q) && u.append(t("<option>").val(Q).html(Q));
				for (t("<td>").addClass("pvtVals").appendTo(W).append(u).append(t("<br>")), t("<td>").addClass(
						"pvtAxisContainer pvtHorizList pvtCols").appendTo(W), P = t("<tr>").appendTo(J), P.append(t("<td>").addClass(
						"pvtAxisContainer pvtRows").attr("valign", "top")), R = t("<td>").attr("valign", "top").addClass("pvtRendererArea").appendTo(P), I
					.unusedAttrsVertical === !0 || G ? (J.find("tr:nth-child(1)").prepend(H), J.find("tr:nth-child(2)").prepend(_)) : J.prepend(t(
						"<tr>").append(H).append(_)), this.html(J), K = I.cols, E = 0, N = K.length; N > E; E++) Q = K[E], this.find(".pvtCols").append(
					this.find(".axis_" + t.inArray(Q, B)));
				for (q = I.rows, D = 0, S = q.length; S > D; D++) Q = q[D], this.find(".pvtRows").append(this.find(".axis_" + t.inArray(Q, B)));
				null != I.aggregatorName && this.find(".pvtAggregator").val(I.aggregatorName), null != I.rendererName && this.find(".pvtRenderer").val(
					I.rendererName), y = !0, V = function (e) {
					return function () {
						var r, a, o, i, l, s, p, h, d, v, g, m, C, b;
						if (m = {
								derivedAttributes: I.derivedAttributes,
								localeStrings: I.localeStrings,
								rendererOptions: I.rendererOptions,
								sorters: I.sorters,
								cols: [],
								rows: [],
								dataClass: I.dataClass
							}, l = null != (d = I.aggregators[u.val()]([])().numInputs) ? d : 0, b = [], e.find(".pvtRows li span.pvtAttr").each(function () {
								return m.rows.push(t(this).data("attrName"))
							}), e.find(".pvtCols li span.pvtAttr").each(function () {
								return m.cols.push(t(this).data("attrName"))
							}), e.find(".pvtVals select.pvtAttrDropdown").each(function () {
								return 0 === l ? t(this).remove() : (l--, "" !== t(this).val() ? b.push(t(this).val()) : void 0)
							}), 0 !== l)
							for (p = e.find(".pvtVals"), Q = h = 0, v = l; v >= 0 ? v > h : h > v; Q = v >= 0 ? ++h : --h) {
								for (i = t("<select>").addClass("pvtAttrDropdown").append(t("<option>")).bind("change", function () {
										return U()
									}), g = 0, o = B.length; o > g; g++) c = B[g], i.append(t("<option>").val(c).text(c));
								p.append(i)
							}
						return y && (b = I.vals, A = 0, e.find(".pvtVals select.pvtAttrDropdown").each(function () {
								return t(this).val(b[A]), A++
							}), y = !1), m.aggregatorName = u.val(), m.vals = b, m.aggregator = I.aggregators[u.val()](b), m.renderer = I.renderers[j.val()],
							r = {}, e.find("input.pvtFilter").not(":checked").each(function () {
								var n;
								return n = t(this).data("filter"), null != r[n[0]] ? r[n[0]].push(n[1]) : r[n[0]] = [n[1]]
							}), a = {}, e.find("input.pvtFilter:checked").each(function () {
								var n;
								return n = t(this).data("filter"), null != r[n[0]] ? null != a[n[0]] ? a[n[0]].push(n[1]) : a[n[0]] = [n[1]] : void 0
							}), m.filter = function (t) {
								var e, a, o, i;
								if (!I.filter(t)) return !1;
								for (a in r)
									if (e = r[a], o = "" + (null != (i = t[a]) ? i : "null"), n.call(e, o) >= 0) return !1;
								return !0
							}, R.pivot(F, m), s = t.extend({}, I, {
								cols: m.cols,
								rows: m.rows,
								vals: b,
								exclusions: r,
								inclusions: a,
								inclusionsInfo: a,
								aggregatorName: u.val(),
								rendererName: j.val()
							}), e.data("pivotUIOptions", s), I.autoSortUnusedAttrs && (C = e.find("td.pvtUnused.pvtAxisContainer"), t(C).children("li").sort(
								function (n, e) {
									return f(t(n).text(), t(e).text())
								}).appendTo(C)), R.css("opacity", 1), null != I.onRefresh ? I.onRefresh(s) : void 0
					}
				}(this), U = function (t) {
					return function () {
						return R.css("opacity", .5), setTimeout(V, 10)
					}
				}(this), U(), this.find(".pvtAxisContainer").sortable({
					update: function (t, n) {
						return null == n.sender ? U() : void 0
					},
					connectWith: this.find(".pvtAxisContainer"),
					items: "li",
					placeholder: "pvtPlaceholder"
				})
			} catch (Z) {
				m = Z, "undefined" != typeof console && null !== console && console.error(m.stack), this.html(I.localeStrings.uiRenderError)
			}
			return this
		}, t.fn.heatmap = function (n, e) {
			var r, a, o, i, l, s, u, c, p, h, d;
			switch (null == n && (n = "heatmap"), c = this.data("numrows"), u = this.data("numcols"), r = null != e && null != (p = e.heatmap) ?
				p.colorScaleGenerator : void 0, null == r && (r = function (t) {
					var n, e;
					return e = Math.min.apply(Math, t), n = Math.max.apply(Math, t),
						function (t) {
							var r;
							return r = 255 - Math.round(255 * (t - e) / (n - e)), "rgb(255," + r + "," + r + ")"
						}
				}), a = function (n) {
					return function (e) {
						var a, o, i;
						return o = function (r) {
							return n.find(e).each(function () {
								var n;
								return n = t(this).data("value"), null != n && isFinite(n) ? r(n, t(this)) : void 0
							})
						}, i = [], o(function (t) {
							return i.push(t)
						}), a = r(i), o(function (t, n) {
							return n.css("background-color", a(t))
						})
					}
				}(this), n) {
			case "heatmap":
				a(".pvtVal");
				break;
			case "rowheatmap":
				for (o = l = 0, h = c; h >= 0 ? h > l : l > h; o = h >= 0 ? ++l : --l) a(".pvtVal.row" + o);
				break;
			case "colheatmap":
				for (i = s = 0, d = u; d >= 0 ? d > s : s > d; i = d >= 0 ? ++s : --s) a(".pvtVal.col" + i)
			}
			return a(".pvtTotal.rowTotal"), a(".pvtTotal.colTotal"), this
		}, t.fn.barchart = function () {
			var n, e, r, a, o, i;
			for (o = this.data("numrows"), a = this.data("numcols"), n = function (n) {
					return function (e) {
						var r, a, o, i;
						return r = function (r) {
							return n.find(e).each(function () {
								var n;
								return n = t(this).data("value"), null != n && isFinite(n) ? r(n, t(this)) : void 0
							})
						}, i = [], r(function (t) {
							return i.push(t)
						}), a = Math.max.apply(Math, i), o = function (t) {
							return 100 * t / (1.4 * a)
						}, r(function (n, e) {
							var r, a;
							return r = e.text(), a = t("<div>").css({
								position: "relative",
								height: "55px"
							}), a.append(t("<div>").css({
								position: "absolute",
								bottom: 0,
								left: 0,
								right: 0,
								height: o(n) + "%",
								"background-color": "gray"
							})), a.append(t("<div>").text(r).css({
								position: "relative",
								"padding-left": "5px",
								"padding-right": "5px"
							})), e.css({
								padding: 0,
								"padding-top": "5px",
								"text-align": "center"
							}).html(a)
						})
					}
				}(this), e = r = 0, i = o; i >= 0 ? i > r : r > i; e = i >= 0 ? ++r : --r) n(".pvtVal.row" + e);
			return n(".pvtTotal.colTotal"), this
		}
	})
}).call(this);
//# sourceMappingURL=pivot.min.js.map