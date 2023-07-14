/*! Rappid v2.4.0 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2015 client IO

 2018-11-16 


This Source Code Form is subject to the terms of the Rappid Trial License
, v. 2.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_v2.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/
"use strict";(function(t){var e=t.linkTools.SourceArrowhead.extend({tagName:"circle",attributes:{cx:3,r:10,fill:"transparent",stroke:"#5755a1","stroke-width":2,cursor:"move",class:"target-arrowhead","fill-opacity":.2}});var r=t.linkTools.TargetArrowhead.extend({tagName:"circle",attributes:{cx:-7,r:10,fill:"transparent",stroke:"#5755a1","stroke-width":2,cursor:"move",class:"target-arrowhead","fill-opacity":.2}});var o=t.linkTools.Button.extend({children:[{tagName:"circle",selector:"button",attributes:{r:10,fill:"#f6f6f6",stroke:"#5755a1","stroke-width":2,cursor:"pointer"}},{tagName:"path",selector:"icon",attributes:{d:"M -4 -4 4 4 M -4 4 4 -4",fill:"none",stroke:"#5755a1","stroke-width":4,"pointer-events":"none"}}]});t.linkTools.mapping={SourceArrowhead:e,TargetArrowhead:r,Remove:o}})(joint);