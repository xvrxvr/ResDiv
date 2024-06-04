'use strict';

var DrawDims = {
  PIN_LEN:  20,
  TXT_GAP:  3,
  BOX_GAP:  3,

  R_WIDTH:  16,
  R_HEIGHT: 40,

  V_DIA:    40,

  I_LEN:    30,
  I_TH:     12,
  I_TH2:    6,

  J_DIA:    6,

  L_ARROW:  8,

  DASH:     [5,5]
};

var DrSels = {
  N:  {},
  B:  {F: 'bold'},  // Base
//  T:  {S: 'green', F: 'bold'}, // Target
//  Ta: {S: 'red', F: 'bold'},   // Faled target
  G:  {S: 'green', F: 'bold'}, // Solver assigned roles
  R:  {},           // Restriction
  Ra: {S: 'red'},   // Failed restriction
  D:  {F: 'italic'} // Derived
};

function DrawLib(c_name)
{
  this.Canvas = document.getElementById(c_name);
  this.ctx    = this.Canvas.getContext("2d");
  this.dark_mode = test_dark_mode();

  this.x = 0;
  this.y = 0;
}

function test_dark_mode()
{
    try { return window.matchMedia("(prefers-color-scheme: dark)").matches;} catch(e) {return false;}
}

DrawLib.prototype = {

  main_color: function() {return this.dark_mode ? "white" : "black";},
  bg_color: function() {return this.dark_mode ? "black" : "white";},

  Goto: function(x,y) {if (typeof(x) == 'object') {this.x=x.x; this.y=x.y;} else {this.x=x; this.y=y;}},
  Get:  function()  {return {x:this.x,y:this.y};},
  Put:  function(v) {this.x=v.x; this.y=v.y;},

  Clear: function() 
  {
    this.ctx.fillStyle = this.bg_color();
    this.ctx.strokeStyle = this.main_color();
    this.ctx.fillRect(0, 0, this.Canvas.width, this.Canvas.height);
  },

////////////////////////////////
  Join: function()
  {
    this.ctx.beginPath();
    this.ctx.arc(this.x,this.y, DrawDims.J_DIA>>1, 0, 2 * Math.PI);
    this.ctx.fill();
  },

///////////////////////////////
  Line: function(script)
  {
    var dashed = 'dash' in script[0];
    var arrow = 'arrow' in script[0] && script[0].arrow;
    if (dashed) 
    {
      var sv = this.ctx.getLineDash();
      this.ctx.setLineDash(DrawDims.DASH);
    }
    this.ctx.beginPath();
    this.ctx.moveTo(this.x,this.y);
    var hor_dir=true;
    var is_pos;
    for(var step of script)
    {
      if ('dx' in step) {is_pos=step.dx>0;      this.x+=step.dx;  hor_dir=true; } else
      if ('x' in step)  {is_pos=step.x>this.x;  this.x=step.x;    hor_dir=true;}
      if ('dy' in step) {is_pos=step.dy<0;      this.y+=step.dy;  hor_dir=false;} else
      if ('y' in step)  {is_pos=step.y<this.y;  this.y=step.y;    hor_dir=false;}
      this.ctx.lineTo(this.x,this.y);
    }
    this.ctx.stroke();
    if (dashed) this.ctx.setLineDash(sv);
    if (arrow) 
    {
      this.ctx.beginPath();
      this.ctx.moveTo(this.x,this.y);
      if (is_pos)             this.ctx.lineTo(this.x-DrawDims.L_ARROW,this.y+DrawDims.L_ARROW); else this.ctx.lineTo(this.x+DrawDims.L_ARROW,this.y-DrawDims.L_ARROW);
      if (is_pos == hor_dir)  this.ctx.lineTo(this.x-DrawDims.L_ARROW,this.y-DrawDims.L_ARROW); else this.ctx.lineTo(this.x+DrawDims.L_ARROW,this.y+DrawDims.L_ARROW);
      this.ctx.lineTo(this.x,this.y);
      this.ctx.fill();
    }
  },

///////////////////////////////
  Res:  function(text,dash) 
  {
    var box = this.ResBox(text);

    var tx = this.x;
    var ty = this.y;

    if (dash) 
    {
      var sv = this.ctx.getLineDash();
      this.ctx.setLineDash(DrawDims.DASH);
    }

    this.ctx.beginPath();
    this.ctx.moveTo(this.x,this.y);
    this.y+=box.pinl;
    this.ctx.lineTo(this.x,this.y);
    this.x-=DrawDims.R_WIDTH>>1;
    this.ctx.moveTo(this.x,this.y);
    this.ctx.lineTo(this.x,this.y+DrawDims.R_HEIGHT);
    this.ctx.lineTo(this.x+DrawDims.R_WIDTH,this.y+DrawDims.R_HEIGHT);
    this.ctx.lineTo(this.x+DrawDims.R_WIDTH,this.y);
    this.ctx.lineTo(this.x,this.y);
    this.x+=DrawDims.R_WIDTH>>1;
    this.y+=DrawDims.R_HEIGHT;
    this.ctx.moveTo(this.x,this.y);
    this.y+=box.pinl;
    this.ctx.lineTo(this.x,this.y);
    this.ctx.stroke();

    if (dash) this.ctx.setLineDash(sv);

    tx += (DrawDims.R_WIDTH>>1)+DrawDims.TXT_GAP;
    this.Text(text,'L',tx,ty+(box.h>>1));
  },

  ResBox: function(text, dash)
  {
    var w = DrawDims.R_WIDTH+DrawDims.TXT_GAP;
    var pinl = DrawDims.PIN_LEN;
    var tm = this.TextBox(text);
    var h = DrawDims.R_HEIGHT+2*pinl;
    if (h<tm.h)
    {
      pinl = (tm.h-DrawDims.R_HEIGHT+1)>>1;
      h=DrawDims.R_HEIGHT+2*pinl;
    }
    var f = this.Res;
    var rv = {w: w+tm.w+DrawDims.TXT_GAP, h: h, dx: DrawDims.R_WIDTH>>1, pinl: pinl, draw: function () {f.call(this,text,dash);}, ID: tm.ID };
    if (dash) rv.dash=true;
    return rv;
  },

  V: function(text, dashed)
  {
    var box = this.VBox(text);

    if (dashed)
    {
      var sv = this.ctx.getLineDash();
      this.ctx.setLineDash(DrawDims.DASH);
    }

    this.ctx.beginPath();
    this.ctx.arc(this.x,this.y+(box.h>>1), DrawDims.V_DIA>>1, 0, 2 * Math.PI);
    this.ctx.moveTo(this.x,this.y);
    this.ctx.lineTo(this.x,this.y+box.pinl);
    this.ctx.moveTo(this.x,this.y+box.h-box.pinl);
    this.ctx.lineTo(this.x,this.y+box.h);
    this.ctx.stroke();

    if (dashed) this.ctx.setLineDash(sv);
    this.Text(text,'L',this.x+box.dx+DrawDims.TXT_GAP,this.y+(box.h>>1));

    this.Text('V','C',this.x,this.y+(box.h>>1),"bold 20px courier");
    this.y+=box.h;

  },

  VBox: function(text, dashed)
  {
    var w = DrawDims.V_DIA+DrawDims.TXT_GAP;
    var pinl = DrawDims.PIN_LEN;
    var h = DrawDims.V_DIA+pinl*2;
    var tm = this.TextBox(text);
    if (h<tm.h)
    {
      pinl = (tm.h-DrawDims.V_DIA+1)>>1;
      h=DrawDims.V_DIA+pinl*2;
    }
    var f = this.V;
    var rv = {w: w+tm.w+DrawDims.TXT_GAP, h: h, dx: DrawDims.V_DIA>>1, pinl: pinl, draw: function() {f.call(this,text,dashed);}, ID: tm.ID };
    if (dashed) rv.dash=true;
    return rv;
  },

  IH: function(text)
  {
    var box = this.IHBox(text);

    this.ctx.fillRect(this.x+box.pinl,this.y-(DrawDims.I_TH2>>1),box.w-DrawDims.I_TH2-box.pinl*2,DrawDims.I_TH2);

    var ex = this.x+box.w-box.pinl;

    this.ctx.beginPath();
    this.ctx.moveTo(ex-(DrawDims.I_TH>>1),this.y-box.dy);
    this.ctx.lineTo(ex-(DrawDims.I_TH>>1),this.y+box.dy);
    this.ctx.lineTo(ex,this.y);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(this.x,this.y);
    this.ctx.lineTo(this.x+box.pinl,this.y);
    this.ctx.moveTo(ex,this.y);
    this.ctx.lineTo(this.x+box.w,this.y);
    this.ctx.stroke();

    this.Text(text,'T',this.x+(box.w>>1),this.y+(DrawDims.I_TH>>1)+DrawDims.TXT_GAP);

    this.x+=box.w;
  },

  IHBox:  function(text)
  {
    var w = DrawDims.I_LEN+2*DrawDims.PIN_LEN;
    var h = DrawDims.I_TH;
    var pinl = DrawDims.PIN_LEN;
    var tm = this.TextBox(text);
    if (w<tm.w)
    {
      pinl = (tm.w-DrawDims.I_LEN+1)>>1;
      w=DrawDims.I_LEN+2*pinl;
    }
    var f=this.IH;
    return {w: w, h: h+DrawDims.TXT_GAP+tm.h, dy: DrawDims.I_TH>>1, pinl: pinl, draw: function() {f.call(this,text);}, ID: tm.ID }; 
  },

  IV: function(text)
  {
    var box = this.IVBox(text);

    this.ctx.fillRect(this.x-(DrawDims.I_TH2>>1),this.y+box.pinl,DrawDims.I_TH2,box.h-DrawDims.I_TH2-box.pinl*2);

    var ex = this.y+box.h-box.pinl;

    this.ctx.beginPath();
    this.ctx.moveTo(this.x-box.dx,ex-(DrawDims.I_TH>>1));
    this.ctx.lineTo(this.x+box.dx,ex-(DrawDims.I_TH>>1));
    this.ctx.lineTo(this.x,ex);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(this.x,this.y);
    this.ctx.lineTo(this.x,this.y+box.pinl);
    this.ctx.moveTo(this.x,ex);
    this.ctx.lineTo(this.x,this.y+box.h);
    this.ctx.stroke();

    this.Text(text,'L',this.x+(DrawDims.I_TH>>1)+DrawDims.TXT_GAP,this.y+(box.h>>1));

    this.y+=box.h;
  },

  IVBox:  function(text)
  {
    var h = DrawDims.I_LEN+2*DrawDims.PIN_LEN;
    var w = DrawDims.I_TH;
    var pinl = DrawDims.PIN_LEN;
    var tm = this.TextBox(text);
    if (h<tm.h)
    {
      pinl = (tm.h-DrawDims.I_LEN+1)>>1;
      h=DrawDims.I_LEN+2*pinl;
    }
    var f=this.IV;
    return {w: w+DrawDims.TXT_GAP+tm.w, h: h, dx: DrawDims.I_TH>>1, pinl: pinl, draw: function() {f.call(this,text);}, ID: tm.ID }; 
  },

  sel_font: function(sel,font)
  {
    if (typeof(font) == 'undefined') font = '12px courier';
    if (!(sel in DrSels)) sel=sel[0];
    sel = DrSels[sel] || {};
    this.ctx.font = (sel.F || '')+' '+font;
    this.ctx.fillStyle = sel.S || this.main_color();
  },

  Text: function(text, align, x, y, font)
  {
    var box = this.TextBox(text,font);
    if (typeof(x) == 'undefined') x=this.x;
    if (typeof(y) == 'undefined') y=this.y;
    if (align=='T' || align=='B' || align=='C') x-=box.w>>1; else
    if (align=='R') x-=box.w;
    if (align=='L' || align=='R' || align=='C') y-=box.h>>1; else
    if (align=='B') y-=box.h;
    this.ctx.textBaseline = "top";
    for(var l of box.ll)
    {
      this.sel_font(l[0],font);
      this.ctx.fillText(l[1],x,y);
      y+=/*this.ctx.measureText(l).height*/12+DrawDims.TXT_GAP;
    }
    this.ctx.fillStyle = this.main_color();
  },

  TextBox: function(text, font)
  {
    var w=0;
    var h=0;
    var ll = [];
    var line0 = 0;
    for(var l of text.split(/\n/))
    {
      var r;
      var sel = 'N';
      var ln = l;
      if ((r=/^\[(\w+)\](.*)$/.exec(l))!==null)
      {
        sel = r[1];
        ln  = r[2];
      }
      if (!line0) line0 = ln;
      ll.push([sel,ln]);
    }
    for(var str of ll)
    {
      this.sel_font(str[0],font);
      var s = this.ctx.measureText(str[1]);
      h+=/*s.height*/12+DrawDims.TXT_GAP;
      if (w<s.width) w=s.width;
    }
    this.ctx.fillStyle = this.main_color();
    if (h) h-=DrawDims.TXT_GAP;
    return {w:w, h:h, ll:ll, ID: /^([\w.]+)/.exec(line0)[1]};
  }

}
/////////////////////////////////////////////////////////

function DrAlignBox(rows, cols, data, opts)
{
  this.rows = rows;
  this.cols = cols;
  this.row_sizes = []; while(this.row_sizes.length<rows) this.row_sizes.push([0,0,0]);
  this.col_sizes = []; while(this.col_sizes.length<cols) this.col_sizes.push([0,0,0]);
  this.data = data;
  this.spacers = [];
  this.dx = 0;
  this.lines = [];

  var self = this;
  this.draw = function () 
  {
    self.SetAnchor(this.x,this.y);
    self.DrawObjs(this);
  }

  var sp_by_col = [];

  if (typeof(opts) == 'undefined') opts={};
  if ('spacers' in opts)
  {
    this.spacers = opts.spacers; // Spacers: array of objects of { obj: <spacer object>, col: <spacer column>, pin: <pin (or pins) to align spacer by vertical>, pinidx: <pin index> }
    for(var i of opts.spacers)  {sp_by_col[i.col]=i; i.obj._SP=true;}
  }
  
//  var postponed = [];

  // Get max sizes
  var y=0;
  for(var cur_row of data)
  {
    var x=0;
    for(var cur_cell of cur_row)
    {
      cur_cell._x = x;
      cur_cell._y = y;
      cur_cell._self = this;
      var rs = (cur_cell._rs = 'row_span' in cur_cell ? cur_cell.row_span : 1) || 1;
      var cs = (cur_cell._cs = 'col_span' in cur_cell ? cur_cell.col_span : 1) || 1;
//      if (rs>1 || cs>1) postponed.push(cur_cell);
      if (cs==1)
      {
        var w1 = 'dx' in cur_cell ? cur_cell.dx :  cur_cell.w>>1;
        var w2 = cur_cell.w-w1;
        if (this.col_sizes[x][0]<w1) this.col_sizes[x][0]=w1;
        if (this.col_sizes[x][1]<w2) this.col_sizes[x][1]=w2;
      }
      if (rs==1)
      {
        var h1 = 'dy' in cur_cell ? cur_cell.dy : cur_cell.h>>1;
        var h2 = cur_cell.h-h1;
        if (this.row_sizes[y][0]<h1) this.row_sizes[y][0]=h1;
        if (this.row_sizes[y][1]<h2) this.row_sizes[y][1]=h2;
      }
      ++x;
    }
    ++y;
  }
//!!! Process postponed cells (for multicell sizes)

  // Eval cols/rows shifts
  var j=0;
  for(var i of this.row_sizes)
  {
    i[2] = j;
    j+=i[0]+i[1]/*+DrawDims.BOX_GAP*/;
  }
  this.h=j;
  this.row_sizes.push([0,0,j]);
  j=0;
  var col=0;
  for(var i of this.col_sizes)
  {
    i[2] = j;
    j+=i[0]+i[1]+DrawDims.BOX_GAP;
    if (typeof(sp_by_col[col]) != 'undefined')
    {
      var sp = sp_by_col[col];
      sp._DX = sp.obj._DX = j;
      j+=sp.obj.w+DrawDims.BOX_GAP;
    }
    ++col;
  }
  this.col_sizes.push([0,0,j]);
  this.w=j-DrawDims.BOX_GAP;

  // Eval shifts (_DX & _DY - shift from upper left corner of bounding box to top left corner of internal item)
  for(var cur_row of data)
    for(var cur_cell of cur_row)
    {
      var rs = cur_cell._rs;
      var cs = cur_cell._cs;
      if (cs==1)
      {
        var w1 = 'dx' in cur_cell ? cur_cell.dx :  cur_cell.w>>1;
        cur_cell._DX = this.col_sizes[cur_cell._x][0]-w1;
      }
      else // Multi col span - align by center of item
      {
        var w1 = cur_cell.w>>1;
        var mid = (this.col_sizes[cur_cell._x+cs][2] - this.col_sizes[cur_cell._x][2])>>1;
        cur_cell._DX = mid-w1;
      }
      if (rs==1)
      {
        var h1 = 'dy' in cur_cell ? cur_cell.dy :  cur_cell.h>>1;
        cur_cell._DY = this.row_sizes[cur_cell._y][0]-h1;
      }
      else // Multi col span - align by center of item
      {
        var h1 = cur_cell.h>>1;
        var mid = (this.row_sizes[cur_cell._y+rs][2] - this.row_sizes[cur_cell._y][2])>>1;
        cur_cell._DY = mid-h1;
      }
    }

}

DrAlignBox.prototype = {

  postprocess:  function()
  {
    for(var sp of this.spacers)
    {
      sp.obj._DY = sp._DY = this.row_sizes[sp.pin._y+(sp.pinidx ? sp.pin._rs : 0)][2];
//      this.GetPinCoord(sp.pin)[sp.pinidx].y;
    }
  },

  // Return array with 2 set of pin coordinates (top/bottom or left/right)
  //  lx: ly:  - Shift from this cell bounding box to pin
  //  x:   y:  - Shift from global bouding box to pin
  //  pos: 'top'/'bottom'/'left'/'right'
  GetPinCoord:  function(pin)
  {
    if (pin instanceof Array) // 2 objects - get middle point
    {
      var p1 = this.GetPinCoord(pin[0]);
      var p2 = this.GetPinCoord(pin[1]);

      for(var i of [0,1])
      {
        p1[i].x = (p1[i].x+p2[i].x) >> 1;
        p1[i].y = (p1[i].y+p2[i].y) >> 1;
      }

      return p1;
    }

    var rv=[];
    if ('dx' in pin) // vertical pins - return top/bottom part
    {
      rv.push({lx: pin._DX + pin.dx, ly: pin._DY,           pos: 'top'});
      rv.push({lx: pin._DX + pin.dx, ly: pin._DY+pin.h,     pos: 'bottom'});
    }
    else
    {
      rv.push({lx: pin._DX,          ly: pin._DY + pin.dy,  pos: 'left'});
      rv.push({lx: pin._DX+pin.w,    ly: pin._DY + pin.dy,  pos: 'right'});
    }
    for(var i of rv)
    {
      i.x = this.col_sizes[pin._x][2] + i.lx;
      i.y = this.row_sizes[pin._y][2] + i.ly;
    }
    return rv;
  },

  // Set coordinate of top/left pin to draw
  SetAnchor:  function(x,y)
  {
    this.anch_x = x - this.dx;
    this.anch_y = y;
  },

  // Add lines to drawing. Lines is an array of objects:
  // from: [<pin>,0/1] or [<pin1>,0/1,<pin2>0/1] - Start point
  // to:   [<pin>,0/1] or [<pin1>,0/1,<pin2>0/1] - End point
  // dash: 1      - Draw dashed
  // join: 1/2/3  - Draw Join point (star/end/both)
  // arrow: 1     - Draw arrow on end
  // pin:  'up'/'dn' - Draw connection pin ('to' ignored)
  AddLines:  function(lines)
  {
    this.lines.push.apply(this.lines,lines);
  },

  // Returns x/y abs coordinates of object (or pair of objects)
  pos: function(obj, idx)
  {
    if (typeof(idx) == 'undefined') idx=0;
    var o1 = this.GetPinCoord(obj)[idx];
    o1.x+=this.anch_x;
    o1.y+=this.anch_y;
    return o1;
  },

  // Position dr_lib instance to draw object
  Position: function(obj, dr_lib)
  {
    var xy = this.pos(obj);
    dr_lib.Goto(xy.x,xy.y);
  },

  GetHitObj:  function(x,y)
  {
    for(var item of this.HitAreas)
    {
      if (x>=item.x && y>=item.y && x<item.x+item.w && y<item.y+item.h) return item.ID;
    }
    return null;
  },

  // Position and draw all objects (by function refs captured by '*Box' methods)
  DrawObjs: function(dr_lib)
  {
    this.HitAreas = [];
    for(var cur_row of this.data)
    {
      for(var cur_cell of cur_row)
      {
        if (!('draw' in cur_cell)) continue;
        this.Position(cur_cell,dr_lib);
        if ('ID' in cur_cell)
          this.HitAreas.push({ID: cur_cell.ID, x: dr_lib.x-cur_cell.dx, y: dr_lib.y, w: cur_cell.w, h: cur_cell.h});
        cur_cell.draw.call(dr_lib);
        if ('HitAreas' in cur_cell)
          for(var vv of cur_cell.HitAreas)
            this.HitAreas.push(vv);
        var low_y = this.row_sizes[cur_cell._y+cur_cell._rs][2]+this.anch_y;
        var script = {dy:0};
        if ('dash' in cur_cell) script.dash = true;
        var arrow = 'arrow' in cur_cell ? cur_cell.arrow : 0;
        if (dr_lib.y<low_y) 
        {
          script.dy = low_y-dr_lib.y;
          script.arrow = (arrow&2);
          dr_lib.Line([script]);
        }
        else if (arrow&2)
        {
          script.dy = 1;
          script.arrow = true;
          dr_lib.Line([script]);
        }
        if (cur_cell._DY)
        {
          this.Position(cur_cell,dr_lib);
          script.dy = -cur_cell._DY;
          script.arrow = (arrow&1);
          dr_lib.Line([script]);
        }
        else if (arrow&1)
        {
          this.Position(cur_cell,dr_lib);
          script.dy = -1;
          script.arrow = true;
          dr_lib.Line([script]);
        }
      }
    }
    for(var sp of this.spacers)
    {
      dr_lib.Goto(sp._DX+this.anch_x,sp._DY+this.anch_y);
      if ('ID' in sp)
        this.HitAreas.push({ID: sp.ID, x: dr_lib.x, y: dr_lib.y-sp.obj.dy, w: sp.obj.w, h: sp.obj.h});
      sp.obj.draw.call(dr_lib);
    }

    var self = this;
    var get_pin_pos_aux = function(pin,pin_idx)
    {
      if ('_SP' in pin)
        return {
          y: pin._DY + self.anch_y,
          x: pin._DX + (pin_idx ? pin.w : 0) + self.anch_x
        };

      return {
        y: self.row_sizes[pin._y + (pin_idx ? pin._rs : 0)][2] + self.anch_y,
        x: self.GetPinCoord(pin)[0].x + self.anch_x
      };
    };

    var get_pin_pos = function(pins)
    {
      if (pins.length == 2) return get_pin_pos_aux(pins[0],pins[1]);
      var v1 = get_pin_pos_aux(pins[0],pins[1]);
      var v2 = get_pin_pos_aux(pins[2],pins[3]);
      v1.x = (v1.x+v2.x)>>1;
      v1.y = (v1.y+v2.y)>>1;
      return v1;
    }

    var sv_pos;
    for(var l of this.lines)
    {
      var from = get_pin_pos(l.from);
      if ('pin' in l) from.x = self.anch_x+self.dx;  // Force pins to be aligned on one vertical line!
      dr_lib.Goto(from);

      if (('join' in l) && (l.join&1)) dr_lib.Join();

      if ('pin' in l) // Draw pin
      {
        dr_lib.Line([{dy: (l.pin == 'up' ? -DrawDims.PIN_LEN : DrawDims.PIN_LEN)}]);
        if (l.pin == 'dn') sv_pos = dr_lib.Get();
        continue;
      }

      if (!('to' in l)) continue;

      var to = get_pin_pos(l.to);
      var scp = [];
      if (from.x != to.x) scp.push({dx: to.x-from.x});
      if (from.y != to.y) scp.push({dy: to.y-from.y});
      if (scp.length==0) continue;

      if ('dash' in l) {scp[0].dash=true; scp[0].arrow=false;}
      if ('arrow' in l) scp[0].arrow=true;

      dr_lib.Line(scp);

      if (('join' in l) && (l.join&2)) dr_lib.Join();
    }
    if (sv_pos) dr_lib.Put(sv_pos);
  },

  AddPins:  function(pin1, pin2)
  {
    for(var i of this.row_sizes) i[2]+=DrawDims.PIN_LEN;
    this.h+=2*DrawDims.PIN_LEN;

    this.dx = this.GetPinCoord(pin1)[0].x;

    if (pin1 instanceof Array) this.AddLines([ {from: [pin1[0],0,pin1[1],0], pin: 'up', join: 1}, {from: [pin1[0],0], to: [pin1[1],0]} ]);
    else this.AddLines([ {from: [pin1,0], pin: 'up'} ]);

    if (pin2 instanceof Array) this.AddLines([ {from: [pin2[0],1,pin2[1],1], pin: 'dn', join: 1}, {from: [pin2[0],1], to: [pin2[1],1]} ]);
    else this.AddLines([ {from: [pin2,1], pin: 'dn'} ]);
  }
};

