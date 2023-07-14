/*! Rappid v2.4.0 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2015 client IO

 2018-11-16 


This Source Code Form is subject to the terms of the Rappid Trial License
, v. 2.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_v2.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/
"use strict";(function(e,r){var t=10;function n(e,t,n,a){var o=n.clone();var i=e.center();if(t)o.rotate(i,t);var g=new r.Point(e.x,o.y);if(g.equals(n)){g.x--;a--}g.move(o,o.x<i.x?a:-e.width-a);if(t)g.rotate(i,-t);return g.round()}e.routers.mapping=function(e,r,a){var o=a.model;var i=[];var g=o.getSourceElement();if(g){i.push(n(g.getBBox(),g.angle(),a.sourceAnchor,r.padding||r.sourcePadding||t))}Array.prototype.push.apply(i,e);var u=o.getTargetElement();if(u){i.push(n(u.getBBox(),u.angle(),a.targetAnchor,r.padding||r.targetPadding||t))}return i}})(joint,g);