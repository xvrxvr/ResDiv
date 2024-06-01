"use strict";

function TplVar()
{
  // this.my_name -            ID of variable
  this.out_nodes_flow = []; // Array with all Expr nodes connected to this var (flow direction)
  this.out_nodes_back = []; // Array with all Expr nodes connected to this var (back direction)
  this.in_node_flow   = null; // Flow expression that evaluates this Var
  this.in_nodes_back  = []; // Back expressions which evaluates this Var
  this.assign_mode    = 'undef'; // Assignment mode: undef/direct/flow/back
}

TplVar.prototype = {
//  TplLogOn : [''],

  SetName:    function (name) {this.my_name=name;},
  AddOutNode: function (node, is_direct) {(is_direct?this.out_nodes_flow:this.out_nodes_back).push(node); },
  AddInNode:  function (node, is_direct) {if (is_direct) this.in_node_flow=node; else this.in_nodes_back.push(node);},

  GetVarType: function () {return this.assign_mode;},

  SetVarType: function (type) 
  {
    var i;
    if (this.assign_mode == type) return;
    if (this.assign_mode != 'undef') 
    {
      var msg = "Can't change VarMode from '"+this.assign_mode+"' to '"+type+"' for var '"+this.my_name+"'";
      console.log(msg);
      throw msg;
    }
    if (this.TplLogOn) console.log(this.TplLogOn[0]+"Set type of Var '"+this.my_name+"' to "+type);
    this.assign_mode=type;
    if (type!='flow' && this.in_node_flow) this.in_node_flow.active=false; // Disable 'flow' mode expression evaluation for Back or Direct var assign
    if (this.TplLogOn)
    {
      var sv = this.TplLogOn[0];
      this.TplLogOn[0]+="-";
    }
    for(i of this.out_nodes_back) // Check for 'back' expression with all defined input vars
    {
      if (i.dst.assign_mode == 'undef' && i.IsInpDefined()) 
      {
        i.active=true;
        i.dst.SetVarType('back');
      }
    }
    for(i of this.out_nodes_flow) // Now the same for all 'flow' expression
    { 
      if (i.active && i.IsInpDefined()) 
      {
        i.dst.SetVarType('flow');
      }
    }
    if (this.TplLogOn) this.TplLogOn[0]=sv;
  },

  toStr:  function() 
  {
    return this.my_name+"<"+this.assign_mode+">";
  },

  dump: function() 
  {
    var rv="Var: "+this.toStr();
    rv+="\nOut (Flow):\n";
    for(var i of this.out_nodes_flow) rv+="  "+i.toStr()+"\n";
    rv+="Out (Back):\n";
    for(var i of this.out_nodes_back) rv+="  "+i.toStr()+"\n";
    if (this.in_node_flow) rv+="In (flow): "+this.in_node_flow.toStr()+"\n";
    rv+="In (Back):\n";
    for(var i of this.in_nodes_back) rv+="  "+i.toStr()+"\n";
    return rv+"\n";
  }

};


function TplExprObj(dst_var, opc, src_vars, is_direct)
{
  this.dst  = dst_var;
  this.args = src_vars;
  this.opc  = opc;
  this.direct = is_direct;
  this.active = is_direct; // All flow expression nodes are on by default
  dst_var.AddInNode(this,is_direct);
  for(var i of src_vars) i.AddOutNode(this,is_direct);
}

TplExprObj.prototype = {
  IsInpDefined: function () 
  {
    for(var i of this.args) 
    {
      if (i.assign_mode=='undef') return false;
    }
    return true;
  },

  IsInpDefined2: function (names) 
  {
    for(var i of this.args) 
    {
      if (!(i.my_name in names)) return false;
    }
    return true;
  },

  toStr:  function () 
  {
    var rv;
    if (this.args.length > 1) rv=this.dst.toStr()+" = "+this.args[0].toStr()+" "+this.opc+" "+this.args[1].toStr();
    else rv=this.dst.toStr()+" = "+this.opc+" "+this.args[0].toStr();
    if (!this.direct) rv+=" [back]";
    if (this.active) rv+=" [active]";
    return rv;
  },

  toCode: function (names, mode) 
  {
    var n0 = names[0];
    if (names.length>1) var n1 = names[1];

    if (mode)
    {
      if (mode != 'val')
      {
        var m2 = mode == 'min' ? '_max' : '_min';
        mode='_'+mode;
        switch(this.opc)
        {
          case '+': case '*': case '||':  n1+=mode; // FALL THROUGH
          case '1+': case '-1':           n0+=mode; break;
          case '-': case '/': case '|?':  n0+=mode; n1+=m2; break;
          case '1/':                      n0+=m2;   break;
        }
      }
      n0+="']";
      n1+="']";
    }


    switch(this.opc)
    {
      case '||': return "TplPAR("+n0+","+n1+")";
      case '|?': return "TplPARi("+n0+","+n1+")";
      case '-1': return "("+n0+") -1";
    }
    if (this.args.length > 1) return "("+n0+") "+this.opc+" ("+n1+")";
    return this.opc+"("+n0+")";
  }
};

function TplNew(inR1, inR2) // Create new Tpl manager object
{
  var TplObj = {
    Vin:  new TplVar(),
    Rsrc: new TplVar(),
//    R1:   new TplVar('Resistance of upper part of divider'),
//    R2:   new TplVar('Resistance of lower part of divider'),
    Rdst: new TplVar(),

    Aux1: new TplVar(),
    Aux2: new TplVar(),
    Aux3: new TplVar(),
    Aux4: new TplVar(),

    K:    new TplVar(),
    Vout: new TplVar(),
    Rin:  new TplVar(),
    Rout: new TplVar(),
    Isrc: new TplVar(),
    Idst: new TplVar(),
    Vsrc_drop:  new TplVar(),
    Vdiv: new TplVar(),
    Vr1:  new TplVar(),
    I2:  new TplVar(),
    P1:  new TplVar(),
    P2:  new TplVar(),
    Psrc: new TplVar(),
    Pdst: new TplVar(),
    Pdiv: new TplVar()
  };

  for(var fld of inR1.get_tpl_fields()) TplObj[Utils.Repl(fld,'1')] = new TplVar();
  for(var fld of inR2.get_tpl_fields()) TplObj[Utils.Repl(fld,'2')] = new TplVar();

  for(var nm in TplObj) TplObj[nm].SetName(nm);

  for(var it of inR1.get_r_formula()) TplAdd(TplObj,Utils.Repl(it,'1'));
  for(var it of inR2.get_r_formula()) TplAdd(TplObj,Utils.Repl(it,'2'));

  TplAdd(TplObj,"Aux1 = R1 + Rsrc");
  TplAdd(TplObj,"Aux2 = R2  || Rdst");
  TplAdd(TplObj,"Aux3 = Aux1 / Aux2");
  TplAdd(TplObj,"Aux4 = 1+ Aux3");

  TplAdd(TplObj,"K    = 1/ Aux4");
  TplAdd(TplObj,"Vout = Vin * K");
  TplAdd(TplObj,"Rin  = R1 + Aux2");
  TplAdd(TplObj,"Rout = R2 || Aux1");
  TplAdd(TplObj,"Isrc = Vin / Rin");
  TplAdd(TplObj,"Idst = Vout / Rdst");
  TplAdd(TplObj,"Vsrc_drop = Isrc * Rsrc");
  TplAdd(TplObj,"Vdiv = Vin  - Vsrc_drop");
  TplAdd(TplObj,"Vr1  = Vdiv - Vout");
  TplAdd(TplObj,"I2  = Isrc - Idst");
  TplAdd(TplObj,"P1  = Vr1 * Isrc");
  TplAdd(TplObj,"P2  = Vout * I2");
  TplAdd(TplObj,"Psrc = Isrc * Vsrc_drop");
  TplAdd(TplObj,"Pdst = Idst * Vout");
  TplAdd(TplObj,"Pdiv = P1 + P2");

  for(var it of inR1.get_rest_formula('Vr1','Isrc')) TplAdd(TplObj,Utils.Repl(it,'1'));
  for(var it of inR2.get_rest_formula('Vout','I2')) TplAdd(TplObj,Utils.Repl(it,'2'));

  this.TplObj = TplObj;
}

TplNew.prototype = {

  SetVar: function (nm,tp) 
  {
    try 
    {
      if (nm in this.TplObj) this.TplObj[nm].SetVarType(tp || 'direct');
    }
    catch(e)
    {
      console.log(this.dump());
      throw e;
    }
  },
  GetVar: function (nm) {return nm in this.TplObj ? this.TplObj[nm].GetVarType() : 'flow';},

  dump:   function() {var rv=''; for(var i in this.TplObj) rv+=this.TplObj[i].dump(); return rv;},

  GetFuncs: function() // Returns function to evaluate all defined Vars (in topology sorted order)
  {
    var rv=[];
    var defined_vars = {};
    var all_exprs = [];
    var new_exprs;
    for(var i in this.TplObj) 
    {
      var n = this.TplObj[i];
      if (n.assign_mode == 'direct') defined_vars[i]=true;
      if (n.in_node_flow !== null && n.in_node_flow.active) all_exprs.push(n.in_node_flow)
      for(var j of n.in_nodes_back)
        if (j.active) all_exprs.push(j);
    }
    while(all_exprs.length)
    {
      new_exprs=[];
      for(j of all_exprs)
        if (j.IsInpDefined2(defined_vars))
        {
          var args = [];
          for(var a of j.args)
          {
            if (a.assign_mode == 'direct') args.push("src['"+a.my_name);
            else args.push("dst['"+a.my_name+'_res');
          }
          rv.push("\tdst['"+j.dst.my_name+"_res'] = "+j.toCode(args,'val')+";");
          rv.push("\tdst['"+j.dst.my_name+"_res_min'] = "+j.toCode(args,'min')+";");
          rv.push("\tdst['"+j.dst.my_name+"_res_max'] = "+j.toCode(args,'max')+";");
          defined_vars[j.dst.my_name]=true;
        }
        else
        {
          new_exprs.push(j);
        }
      if (all_exprs.length == new_exprs.length) break;
      all_exprs=new_exprs;
    }
    return new Function("dst","src",rv.join("\n"));
  },

  GetFunc1: function(dst_name, const_vals) // Return evaluation function for 1 required Var
  {
    var TplObj = this.TplObj;

    var vars_acc={}; // Used vars will be coutered here
    var vars_ord = []; // Duplicated vars will be collected here

    if (!const_vals) const_vals = {};

    var sel = function (root_var)
    {
      var n = TplObj[root_var];
      if (n.assign_mode == 'direct' || n.assign_mode=='undef') return null;
      if (n.in_node_flow !== null && n.in_node_flow.active) return n.in_node_flow;
      for(var j of n.in_nodes_back)
        if (j.active) return j;
      return null;
    };
    var f1 = function (root_var) 
    {      
      var expr = sel(root_var);
      if (expr === null) return;
      if (root_var in vars_acc) {vars_acc[root_var]=2; vars_ord.push(root_var); return;}
      vars_acc[root_var] = 1;
      for(var c of expr.args) f1(c.my_name);
    };
    f1(dst_name);

    var f2 = function (root_var, used)
    {
      var expr = sel(root_var);
      if (expr === null) return root_var in const_vals ? const_vals[root_var] : "src."+root_var;
      var args = [];
      for(var i of expr.args)
      {
        if (vars_acc[i.my_name]>1) {args.push(i.my_name); used[i.my_name]=true;}
        else args.push(f2(i.my_name,used));
      }
      return expr.toCode(args);
    }

    var compiled = [];
    for(var v of vars_ord)
    {
      var used = {};
      compiled.push( {C: "\tvar "+v+" = "+f2(v,used)+";", U: used, V: v} );
    }

    var f3 = function (rdy, req)
    {
      for(var i in req) if (!(i in rdy)) return false;
      return true;
    }

    var rv=[];
    var rdy=[];
    while(compiled.length)
    {
      var new_compiled = [];
      for (var j of compiled)
      {
        if (f3(rdy,j.U))
        {
          rv.push(j.C);
          rdy[j.V]=true;
        }
        else
        {
          new_compiled.push(j);
        }
      }
      if (compiled.length==new_compiled.length) throw "Not all Vars defined!";
      compiled=new_compiled;
    }
    rv.push("\treturn "+f2(dst_name,{})+";");
    return new Function("src",rv.join("\n"));
  },

  InitFromData:  function(Data)
  {
    if (typeof(Data) == 'undefined') Data = GlobSetup.Data;
    for(var nm in Data)
      if (nm+'_mode' in Data && Data[nm+'_mode'] == 'Base')
        this.SetVar(nm);
  },

  PutBackToData:  function(with_vals,Data)
  {
    var flt;
    if (typeof(Data) == 'undefined') Data = GlobSetup.Data;
    for(var nm in this.TplObj)
    {
      switch(this.GetVar(nm))
      {
        case 'back': case 'flow': flt = {Restricted:1, Derived:1, _D: 'Derived'}; break;
        case 'undef':             flt = {Undefined:1, Restricted:1, _D: 'Undefined'}; break;
        case 'direct':            flt = {Base:1, _D: 'Base'}; break;
      }
      if (!((Data[nm+'_mode'] || 'Undefined') in flt)) Data[nm+'_mode'] = flt._D;
      if (!Data[nm+'_mode'] || Data[nm+'_mode'] == 'Undefined')
      {
        delete Data[nm];
        delete Data[nm+'_min'];
        delete Data[nm+'_max'];
      }
    }
    if (with_vals) this.GetFuncs()(Data,Data);
  }
};

/*
               direct back|flow  undef
Undefined        -        -        +       - Value not specified and not derived                             (primary type)
Base             +        -        -       - Value specified by user                                         (primary type)
Restriction      -        +        +       - User specifies restrictions for possible values                 (subset of Undefined or Derived)
Derived          -        +        -       - Value derived by flow/back propagation through ResDiv equations (primary type)

Def:           Base    Derived    Undefined
*/

function TplAdd(TplObj, func_text)
{
  var res, id, op1, op2='', opc;
  if ( (res=/([\w.]+)\s*=\s*(\S+)\s+(\S+)\s+(\S+)$/.exec(func_text)) !== null)  // id = var op var
  {
    id  = res[1];
    op1 = res[2];
    opc = res[3];
    op2 = res[4];
  }
  else if ((res=/([\w.]+)\s*=\s*(\S+)\s+(\S+)$/.exec(func_text)) !== null)  // id = op var
  {
    id  = res[1];
    opc = res[2];
    op1 = res[3];
  }
  else alert("Wrong Expr string '"+func_text+"'");

/* Binary ops: + - || / *
   Unary ops:  1+ 1/

Inverted only ops:
  Binary: |? ( op1 = res || op2)

  Unary: -1  ( res = op1 - 1)
*/
  if (!(id in TplObj))
  {
    if (id.startsWith('Aux')) TplObj[id] = new TplVar();
    else TplObj[id] = new TplVar(get_msg('tpl_var_'+id));
    TplObj[id].SetName(id);
  }
  var R   = TplObj[id];
  var A1  = TplObj[op1];
  var A2;

  var arg = [A1];
  if (op2 != '') arg.push(A2=TplObj[op2]);

  new TplExprObj(R,opc,arg,true);

  switch(opc)
  {
    case '+':  new TplExprObj(A1,'-', [R,A2]); new TplExprObj(A2,'-', [R,A1]); break;
    case '-':  new TplExprObj(A1,'+', [R,A2]); new TplExprObj(A2,'-', [A1,R]); break;
    case '||': new TplExprObj(A1,'|?',[R,A2]); new TplExprObj(A2,'|?',[R,A1]); break;
    case '/':  new TplExprObj(A1,'*', [R,A2]); new TplExprObj(A2,'/', [A1,R]); break;
    case '*':  new TplExprObj(A1,'/', [R,A2]); new TplExprObj(A2,'/', [R,A1]); break;
    case '1+': new TplExprObj(A1,'-1',[R]); break;
    case '1/': new TplExprObj(A1,'1/',[R]); break;
  }

}

function TplPAR(r1,r2) {return 1/(1/r1+1/r2);}
function TplPAR3(r1,r2,r3) {return TplPAR(TplPAR(r1,r2),r3);}
function TplPARi(r,r1) {return 1/(1/r-1/r1);}  // What to do if r>r1 ?
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*

var vv = new TplNew();

vv.SetVar('Vin');
vv.SetVar('Rsrc');
vv.SetVar('R1');
vv.SetVar('R2');
vv.SetVar('Rdst');
//vv.SetVar('Idst');
//vv.SetVar('K');

//console.log(vv.dump());

var arr = vv.GetFuncs();
console.log(arr.toSource());

var f = vv.GetFunc1('P2',{Vin:10, Rsrc:0, Rdst:10});

console.log(f.toSource());

console.log(f({Vin:10, Rsrc:0, R1:10, Rdst:Infinity, R2:10, K:0.5}));

console.log(TplPAR(1,Infinity));
console.log(TplPARi(1,0.5));
*/
