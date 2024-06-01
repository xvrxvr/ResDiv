'use strict';

var RTDscTemplates = {

  Full: [
    {Type: 'btn'},
    {Type: 'id'},
    {Type: 'mode',  Hdr: 'Mode'},
    {Type: 'val',   Hdr: ['Value', 3, 'Base']},
    {Type: 'min',   Hdr: 'Min'},
    {Type: 'max',   Hdr: 'Max'},
    {Type: 'res',   Hdr: ['Result', 3, 'Base']},
    {Type: 'res_min',  Hdr: 'Min'},
    {Type: 'res_max',  Hdr: 'Max'},
    {Type: 'desc',  Hdr: 'Description'}
  ],

  Compact: [
    {Type: 'btn'},
    {Type: 'id'},
    {Type: 'mode',  Hdr: 'Mode'},
    {Type: ['res'    ,'val'],   Hdr: ['Value/Target',3,'Base'], Pref: ['V: ','T: ']},
    {Type: ['res_min','min'],   Hdr: 'Min', Pref: ['V: ','T: ']},
    {Type: ['res_max','max'],   Hdr: 'Max', Pref: ['V: ','T: ']},
    {Type: 'desc',  Hdr: 'Description'}
  ]
};

var RTDscRows = {
  All: [
    'Vin','Rsrc',
    'R1', 'R1.1', 'R1.2', 'R1.3',
    'R2', 'R2.1', 'R2.2', 'R2.3',
    'Rdst','K','Vout','Rin','Rout','Isrc','Idst','Vsrc_drop','Vdiv',
    'Vr1', 'V1.1', 'V1.2', 'V1.3',
           'V2.1', 'V2.2', 'V2.3',
           'I1.1', 'I1.2', 'I1.3',
    'I2',  'I2.1', 'I2.2', 'I2.3',
    'P1',  'P1.1', 'P1.2', 'P1.3',
    'P2',  'P2.1', 'P2.2', 'P2.3',
    'Psrc','Pdst','Pdiv'
  ]
};

/*

Value modes:

  Undefined   - Value not specified and not derived                             (primary type)
  Base        - Value specified by user                                         (primary type)
  Restriction - User specifies restrictions for possible values                 (subset of Undefined or Derived)
  Derived     - Value derived by flow/back propagation through ResDiv equations (primary type)
*/


function ResDivTable(dsc, rows, values)
{
  this.dsc = RTDscTemplates[dsc];
  this.rows = RTDscRows[rows];
  this.values = values;
}

ResDivTable.prototype = {
  Table:  function ()
  {
    var rv="<table class='solv-tab'><thead><tr>";
    var hdr2nd = '';
    var cnt=0;
    for(var c of this.dsc)
    {
      if (!('Hdr' in c)) {rv+="<th rowspan=2>&nbsp;</th>"; continue;}
      var h = c.Hdr;
      if (h instanceof Array)
      {
        rv+="<th colspan="+h[1]+"><center>"+h[0]+"</center></th>";
        hdr2nd+="<th>"+h[2]+"</th>";
        cnt = h[1]-1;
      }
      else if (cnt)
      {
        --cnt;
        hdr2nd+="<th>"+h+"</th>";
      }
      else
      {
        rv+="<th rowspan=2>"+h+"</th>";
      }
    }
    rv+="</tr><tr>"+hdr2nd+"</tr></thead>";

    var tp2html = function(self, tp, id, pure)
    {
      var mode = id+'_mode' in self.values ? self.values[id+'_mode'] : 'Undefined';
      switch(tp)
      {
        case 'btn':   return "<input type='button' value='\u2026' title='Create or modify "+id+" value' onclick='ResDivChgType(\""+id+"\")'></input>";
        case 'id':    return id in self.values && self.values.is_invalid_tgt(id) ? "<span style='background-color: red'>" + id + "</span>": id;
        case 'mode':  
          var rv = mode == 'Undefined' ? '\u2219 \u2219 \u2219' : mode;
          if (GlobSetup.SolverT == id) rv+='/Target';
          return rv;
        case 'desc':  return self.values.t_get_desc(id);
      }
      if (mode == 'Undefined') return '';
      var eff = (tp!='val') ? id+'_'+tp : id;
      if (!(eff in self.values) && mode != 'Derived') 
      {
        if (pure || /res/.exec(tp) !== null) return '';
        eff = (tp!='val') ? id+'_res_'+tp : id+'_res';
        if (!(eff in self.values)) return '';
      }
      if (mode == 'Base' && /_res/.exec(eff) !== null) return '';
      if (mode == 'Derived' && /_res/.exec(eff) === null) return '';
      var rv = self.values.t_get_val(eff);
      if ((id+'_res') in self.values && mode != 'Base')
      {
        if (tp == 'min' && self.values.is_invalid_tgt_min(id) || tp == 'max' && self.values.is_invalid_tgt_max(id))
          rv = "<span style='background-color: red'>"+rv+"</span>";
      }
      return rv;
    };

    for(var row_id of this.rows)
    {
      if (!(row_id in GlobSetup.Solver.TplObj)) continue;
//      if (!(row_id in this.values)) continue;
      rv+="<tr>";
      for(var c of this.dsc)
      {
        if (c.Type instanceof Array)
        {
          rv+="<td>";
          var cnt = 0;
          var a = [];
          var a2 = [];
          var sc=0;
          for (var t of c.Type)
          {
            var l = tp2html(this,t,row_id,1);
            if (l == '') continue;
            a2.push(l);
            if ('Pref' in c) {sc|=1<<cnt; l=c.Pref[cnt++]+l;}
            a.push(l);
          }
          rv+=(sc==1 ? a2 :a).join("<br>")+"</td>";
        }
        else
        {
          rv+="<td>"+tp2html(this,c.Type,row_id)+"</td>";
        }
      }
      rv+="</tr>";
    }
    return rv+"</table>";
  }
};
///////////////////////////////////////////////////////////////////////

function ResDisValues(init_vals)
{
  if (typeof(init_vals) != 'undefined')
    for(var nm in init_vals)
      this[nm]=init_vals[nm];
}

ResDisValues.prototype = {
  t_get_desc: function(id) 
  {
    return get_msg('tpl_var_'+id);
  },
  get_real_fld: function(id, effective_val)
  {
    if (/_res/.exec(id) !== null) return id;
    var id_res = /min|max/.exec(id) === null ? id+'_res' : id.replace('_','_res_');
    switch((id in this ? 1:0) | (id_res in this ? 2:0))
    {
      default: return id;
      case 2:  return id_res;
      case 3:  return effective_val ? id_res : id;
    }
  },
  t_get_val:  function(id, effective_val) // Get value in string form (shorten as appropriate)
  {
    id = this.get_real_fld(id, effective_val);
    var pres = /^R(1|2)/.exec(id) === null ? 3 : GlobSetup.RPres == 5 ? 2 : 3;
    return Utils.val2str(id,this[id],pres).T;
  },
  v_get_name: function(ref,id) // Get full (1/2 lines) text for Visual
  {
    var real_id = typeof(id) == 'undefined' ? ref : id.length > 1 ? id[0]+ref[1]+'.'+id.substr(1) : id[0]+ref[1];
    var md = GlobSetup.SolverT == real_id;
    if (this.get_real_fld(real_id) in this && (this[real_id+'_mode'] || 'Undefined') != 'Undefined')
    {
      var val = this.get_value_tag(real_id)+this.t_get_val(real_id,true);
      if (real_id[0]=='R') // Add power value
      {
        var p_id = this.get_real_fld(real_id.replace(/^R/,'P'),true);
        if (p_id in this) 
        {
          real_id += ' ('+this.t_get_val(p_id,true)+')';
          real_id = this.get_value_tag(p_id)+real_id;
        }
      }
      real_id+="\n"+val;
    }
    if (md) real_id += "\n[G](Target)";
    return real_id;
  },
  is_invalid_tgt_min: function(id) // Return 'true' if Target value exists and out of bounds
  {
    if (!(id+'_mode' in this) || this[id+'_mode'] in {Undefined:1, Base: 1, Derived:1}) return false;

    if (!((id+'_res_min') in this)) return false;
    if (!((id+'_min') in this)) return false;
    return this[id+'_res_min'] < this[id+'_min'];
  },
  is_invalid_tgt_max: function(id) // Return 'true' if Target value exists and out of bounds
  {
    if (!(id+'_mode' in this) || this[id+'_mode'] in {Undefined:1, Base: 1, Derived:1}) return false;

    if (!((id+'_res_max') in this)) return false;
    if (!((id+'_max') in this)) return false;
    return this[id+'_res_max'] > this[id+'_max'];
  },
  is_invalid_tgt: function(id) {return this.is_invalid_tgt_min(id) || this.is_invalid_tgt_max(id);},
  get_value_tag:  function(id)
  {
    var rv='';
    if (!(id in this)) return '';
    if (((id+'_mode') in this) && this[id+'_mode'] != 'Undefined') rv=this[id+'_mode'][0];
    if (this.is_invalid_tgt(id)) rv+='a';
    return rv == '' ? '' : '['+rv+']';
  }
};
