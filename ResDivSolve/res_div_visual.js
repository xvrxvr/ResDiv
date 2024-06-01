'use strict';

function ResDiv(dr_lib, names, r1, r2)
{
  this.self   = dr_lib;
  this.names  = names;
  this.r1     = r1;
  this.r2     = r2;
  this._DY    = DrawDims.L_ARROW+1;
}

function E() {return {w:0,h:0,dx:0};}

ResDiv.prototype = {
  nm:   function(id) {return this.names.v_get_name(id);},

  Box:  function()
  {
    var Vin   = this.self.VBox    (this.nm('Vin'));
    var Rsrc  = this.self.ResBox  (this.nm('Rsrc'));
    var Rdst  = this.self.ResBox  (this.nm('Rdst'));
    var Vout  = this.self.VBox    (this.nm('Vout'),true);
    var Rin   = this.self.ResBox  (this.nm('Rin'),true);  Rin.arrow=3;
    var Rout  = this.self.ResBox  (this.nm('Rout'),true); Rout.arrow=3;
    var Vsrc_drop = this.self.VBox    (this.nm('Vsrc_drop'),true);
    var Vdiv  = this.self.VBox    (this.nm('Vdiv'),true); Vdiv.arrow=3;
    var Vr1   = this.self.VBox    (this.nm('Vr1'),true);  Vr1.arrow=1;
    var I2   = this.self.IVBox   (this.nm('I2'));
    
    // Spacers
    var Isrc  = this.self.IHBox   (this.nm('Isrc'));
    var Idst  = this.self.IHBox   (this.nm('Idst'));

    Vdiv.row_span=3; Rin .row_span=3; Vin .row_span=2; 
    Rout.row_span=2; Rdst.row_span=2; Vout.row_span=2;

    var box = new DrAlignBox(3,9,
      [
        [Vsrc_drop, Rsrc, Vdiv, Rin,  Vr1,  this.r1,  E(),  E(),  E()],
        [E(),       Vin,  E(),  E(),  E(),  this.r2,  Rout, Rdst, Vout],
        [E(),       E(),  E(),  E(),  E(),  I2,      E(),  E(),  E()]
      ], 
      {
        spacers:
          [
            {col: 1, obj: Isrc, pin: Rsrc,    pinidx: 0, ID: 'Isrc'},
            {col: 6, obj: Idst, pin: this.r1, pinidx: 1, ID: 'Idst'}
          ]
      }
    );

    box.AddLines( 
      [
        {from: [Vsrc_drop,0], to: [Rsrc,0],     dash:1, arrow:1},
        {from: [Vsrc_drop,1], to: [Rsrc,1],     dash:1, arrow:1},
        {from: [Rsrc,0],      to: [Isrc,0]},
        {from: [Isrc,1],      to: [this.r1,0]},
        {from: [Vin,1],       to: [Rdst,1]},
        {from: [I2,1],        join:1},
        {from: [Vr1,1],       to: [this.r1,1],  dash:1, arrow:1},
        {from: [this.r1,1],   to: [Idst,0],     join:1},
        {from: [Idst,1],      to: [Rdst,0]},
        {from: [Vout,0],      to: [Rdst,0],     dash:1, arrow:1},
        {from: [Vout,1],      to: [Rdst,1],     dash:1, arrow:1}
      ]
    );

    box.postprocess();

    if (this.self.Canvas.width <= box.w) this.self.Canvas.width = box.w+1;
    /*if (this.self.Canvas.height <= box.h+2*this._DY)*/ this.self.Canvas.height = box.h+2*this._DY+1;

    this.Box = box;

    return box;
  },

  Draw: function()
  {
    var box = this.Box();
    box.SetAnchor(0,this._DY);
    box.DrawObjs(this.self);
  }

};

/////////////////////////////////////////////////////////
function DrawAnyRes(dr_lib, refdes, names)
{
  this.self  = dr_lib;
  this.names = names;
  this.ref   = refdes;
}

DrawAnyRes.prototype = {
  nm:   function(id) {return this.names.v_get_name(this.ref,id);},
};

function DAR(obj)
{
  var rv = Object.create(DrawAnyRes.prototype);
  for(var nm in obj) rv[nm]=obj[nm];
  return rv;
}

function Draw1Res(dr_lib, refdes, names)
{
  DrawAnyRes.call(this,dr_lib, refdes, names);
}

Draw1Res.prototype = DAR({
  Box: function()
  {
    return this.self.ResBox(this.nm('R'));
  },

  get_tpl_fields: function()
  {
    return ['R?'];
  },

  get_r_formula: function()
  {
    return [];
  },

  get_rest_formula: function(V,I)
  {
    return [];
  }
});


// Parallel of 2 resistors
function Draw2Res1(dr_lib, refdes, names)
{
  DrawAnyRes.call(this,dr_lib, refdes, names);
}

Draw2Res1.prototype = DAR({
  Box:  function()
  {
    var r1 = this.self.ResBox(this.nm('R1'));
    var r2 = this.self.ResBox(this.nm('R2'));
    var i1 = this.self.IVBox(this.nm('I1'));
    var i2 = this.self.IVBox(this.nm('I2'));

    var rv = new DrAlignBox(2,2,[[r1,r2],[i1,i2]]);
    rv.AddPins([r1,r2],[i1,i2]);
    rv.postprocess();
    return rv;
  },

  get_tpl_fields: function()
  {
    return ['R?.1','R?.2'];
  },

  get_r_formula: function()
  {
    return ['R? = R?.1 || R?.2'];
  },

  get_rest_formula: function(V,I)
  {
    return [
      'I?.1 = '+V+' / R?.1',
      'I?.2 = '+V+' / R?.2',
      'P?.1 = I?.1 * '+V,
      'P?.2 = I?.2 * '+V
    ];
  }

});

// Series of 2 resistors
function Draw2Res2(dr_lib, refdes, names)
{
  DrawAnyRes.call(this,dr_lib, refdes, names);
}

Draw2Res2.prototype = DAR({
  Box:  function()
  {
    var r1 = this.self.ResBox(this.nm('R1'));
    var r2 = this.self.ResBox(this.nm('R2'));
    var v1 = this.self.VBox(this.nm('V1'),true);
    var v2 = this.self.VBox(this.nm('V2'),true);

    var rv = new DrAlignBox(2,2,[[r1,v1],[r2,v2]]);
    rv.AddPins(r1,r2);

    rv.AddLines( 
      [
        {from: [v1,0],  to: [r1,0], dash:1, arrow:1},
        {from: [v2,0],  to: [r2,0], dash:1, arrow:1},
        {from: [v2,1],  to: [r2,1], dash:1, arrow:1}
      ]
    );

    rv.postprocess();
    return rv;
  },

  get_tpl_fields: function()
  {
    return ['R?.1','R?.2'];
  },

  get_r_formula: function()
  {
    return ['R? = R?.1 + R?.2'];
  },

  get_rest_formula: function(V,I)
  {
    return [
      'V?.1 = '+I+' * R?.1',
      'V?.2 = '+I+' * R?.2',
      'P?.1 = V?.1 * '+I,
      'P?.2 = V?.2 * '+I
    ];
  }

});

// Parallel of 3 resistors
function Draw3Res1(dr_lib, refdes, names)
{
  DrawAnyRes.call(this,dr_lib, refdes, names);
}

Draw3Res1.prototype = DAR({
  Box:  function()
  {
    var r1 = this.self.ResBox(this.nm('R1'));
    var r2 = this.self.ResBox(this.nm('R2'));
    var r3 = this.self.ResBox(this.nm('R3'));
    var i1 = this.self.IVBox(this.nm('I1'));
    var i2 = this.self.IVBox(this.nm('I2'));
    var i3 = this.self.IVBox(this.nm('I3'));

    var rv = new DrAlignBox(2,3,[[r1,r2,r3],[i1,i2,i3]]);
    rv.AddPins(r2,i2);
    rv.AddLines( 
      [
        {from: [r1,0], to: [r3,0]},
        {from: [i1,1], to: [i3,1]},
        {from: [r2,0], join:1},
        {from: [i2,1], join:1}
      ]
    );
    rv.postprocess();
    return rv;
  },

  get_tpl_fields: function()
  {
    return ['R?.1','R?.2','R?.3'];
  },

  get_r_formula: function()
  {
    return [
      'AuxR? = R?.1 || R?.2',
      'R? = AuxR? || R?.3'
    ];
  },

  get_rest_formula: function(V,I)
  {
    return [
      'I?.1 = '+V+' / R?.1',
      'I?.2 = '+V+' / R?.2',
      'I?.3 = '+V+' / R?.3',
      'P?.1 = I?.1 * '+V,
      'P?.2 = I?.2 * '+V,
      'P?.3 = I?.3 * '+V
    ];
  }

});

// Series of 3 resistors
function Draw3Res2(dr_lib, refdes, names)
{
  DrawAnyRes.call(this,dr_lib, refdes, names);
}

Draw3Res2.prototype = DAR({
  Box:  function()
  {
    var r1 = this.self.ResBox(this.nm('R1'));
    var r2 = this.self.ResBox(this.nm('R2'));
    var r3 = this.self.ResBox(this.nm('R3'));
    var v1 = this.self.VBox(this.nm('V1'),true);
    var v2 = this.self.VBox(this.nm('V2'),true);
    var v3 = this.self.VBox(this.nm('V3'),true);

    var rv = new DrAlignBox(3,2,[[r1,v1],[r2,v2],[r3,v3]]);
    rv.AddPins(r1,r3);

    rv.AddLines( 
      [
        {from: [v1,0], to: [r1,0], dash:1, arrow:1},
        {from: [v2,0], to: [r2,0], dash:1, arrow:1},
        {from: [v3,0], to: [r3,0], dash:1, arrow:1},
        {from: [v3,1], to: [r3,1], dash:1, arrow:1}
      ]
    );

    rv.postprocess();
    return rv;
  },

  get_tpl_fields: function()
  {
    return ['R?.1','R?.2','R?.3'];
  },

  get_r_formula: function()
  {
    return [
      'AuxR? = R?.1 + R?.2',
      'R? = AuxR? + R?.3'
    ];
  },

  get_rest_formula: function(V,I)
  {
    return [
      'V?.1 = '+I+' * R?.1',
      'V?.2 = '+I+' * R?.2',
      'V?.3 = '+I+' * R?.3',
      'P?.1 = V?.1 * '+I,
      'P?.2 = V?.2 * '+I,
      'P?.3 = V?.3 * '+I
    ];
  }

});

// 3 resistor: 1 + (2||3)
function Draw3Res3(dr_lib, refdes, names)
{
  DrawAnyRes.call(this,dr_lib, refdes, names);
}

Draw3Res3.prototype = DAR({
  Box:  function()
  {
    var r1 = this.self.ResBox(this.nm('R1')); r1.col_span=2;
    var r2 = this.self.ResBox(this.nm('R2'));
    var r3 = this.self.ResBox(this.nm('R3'));
    var i2 = this.self.IVBox(this.nm('I2'));
    var i3 = this.self.IVBox(this.nm('I3'));
    var v1 = this.self.VBox(this.nm('V1'),true);
    var v2 = this.self.VBox(this.nm('V2'),true); v2.row_span=2;

    var rv = new DrAlignBox(3,3,[[r1,E(),v1],[r2,r3,v2],[i2,i3,E()]]);
    rv.AddPins(r1,[i2,i3]);

    rv.AddLines( 
      [
        {from: [r2,0], to: [r1,1], join:2},
        {from: [r1,1], to: [r3,0]},
        {from: [v1,0], to: [r1,0], dash:1, arrow:1},
        {from: [v2,0], to: [r3,0], dash:1, arrow:1},
        {from: [v2,1], to: [i3,1], dash:1, arrow:1},
        {from: [v1,1], to: [v2,0], dash:1}
      ]
    );
    rv.postprocess();
    return rv;
  },

  get_tpl_fields: function()
  {
    return ['R?.1','R?.2','R?.3'];
  },

  get_r_formula: function()
  {
    return [
      'AuxR? = R?.2 || R?.3',
      'R? = AuxR? + R?.1'
    ];
  },

  get_rest_formula: function(V,I)
  {
    return [
      'V?.1 = '+I+' * R?.1',
      'V?.2 = '+I+' * AuxR?',
      'I?.2 = V?.2 / R?.2',
      'I?.3 = V?.2 / R?.3',
      'P?.1 = V?.1 * '+I,
      'P?.2 = V?.2 * I?.2',
      'P?.3 = V?.2 * I?.3'
    ];
  }

});

// 3 resistor: 1 || (2+3)
function Draw3Res4(dr_lib, refdes, names)
{
  DrawAnyRes.call(this,dr_lib, refdes, names);
}

Draw3Res4.prototype = DAR({
  Box:  function()
  {
    var r1 = this.self.ResBox(this.nm('R1')); r1.row_span=2;
    var r2 = this.self.ResBox(this.nm('R2'));
    var r3 = this.self.ResBox(this.nm('R3'));
    var i1 = this.self.IVBox(this.nm('I1'));
    var i3 = this.self.IVBox(this.nm('I3'));
    var v1 = this.self.VBox(this.nm('V2'),true);
    var v2 = this.self.VBox(this.nm('V3'),true);

    var rv = new DrAlignBox(3,3,[[r1,r2,v1],[E(),r3,v2],[i1,i3,E()]]);
    rv.AddPins([r1,r2],[i1,i3]);

    rv.AddLines( 
      [
        {from: [v1,0], to: [r2,0], dash:1, arrow:1},
        {from: [v2,0], to: [r3,0], dash:1, arrow:1},
        {from: [v2,1], to: [r3,1], dash:1, arrow:1},
        {from: [v1,1], to: [v2,0], dash:1}
      ]
    );
    rv.postprocess();
    return rv;
  },

  get_tpl_fields: function()
  {
    return ['R?.1','R?.2','R?.3'];
  },

  get_r_formula: function()
  {
    return [
      'AuxR? = R?.2 + R?.3',
      'R? = AuxR? || R?.1'
    ];
  },

  get_rest_formula: function(V,I)
  {
    return [
      'I?.1 = '+V+' / R?.1',
      'I?.3 = '+V+' / AuxR?',
      'V?.2 = I?.3 * R?.2',
      'V?.3 = I?.3 * R?.3',
      'P?.1 = '+V+' * I?.1',
      'P?.2 = V?.2 * I?.3',
      'P?.3 = V?.3 * I?.3'
    ];
  }

});

function NewDrawRes(mode, refdes)
{
  switch(mode)
  {
    case 0: return new Draw1Res(GlobSetup.DrawLib,refdes,GlobSetup.Data);
    case 1: return new Draw2Res1(GlobSetup.DrawLib,refdes,GlobSetup.Data);
    case 2: return new Draw2Res2(GlobSetup.DrawLib,refdes,GlobSetup.Data);
    case 3: return new Draw3Res1(GlobSetup.DrawLib,refdes,GlobSetup.Data);
    case 4: return new Draw3Res2(GlobSetup.DrawLib,refdes,GlobSetup.Data);
    case 5: return new Draw3Res3(GlobSetup.DrawLib,refdes,GlobSetup.Data);
    case 6: return new Draw3Res4(GlobSetup.DrawLib,refdes,GlobSetup.Data);
  }
}

var ResNetsNames = [
'R?',
'R?.1||R?.2', 'R?.1+R?.2',
'R?.1||R?.2||R?.3', 'R?.1+R?.2+R?.3', 'R?.1+(R?.2||R?.3)','R?.1||(R?.2+R?.3)'
];
