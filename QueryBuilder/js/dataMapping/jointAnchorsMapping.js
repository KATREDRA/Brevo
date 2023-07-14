/*! Rappid v2.4.0 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2015 client IO

 2018-11-16 


This Source Code Form is subject to the terms of the Rappid Trial License
, v. 2.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_v2.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/
"use strict";(function(e){e.anchors.mapping=function(e,t,i){var r;var n=e.model;var d=e.getNodeUnrotatedBBox(t);var a=n.getBBox().center();var o=n.angle();var l=n.getItemSide(e.findAttribute("item-id",t));if(l==="left"){r=d.leftMiddle()}else if(l==="right"){r=d.rightMiddle()}else{var f=i;if(i instanceof Element){var v=this.paper.findView(i);f=v?v.getNodeBBox(i).center():new g.Point}f.rotate(a,o);r=f.x<=d.x+d.width/2?d.leftMiddle():d.rightMiddle()}return r.rotate(a,-o)}})(joint);