'use strict';

var RDDlg = {
  cur_obj: {},
  cur_comp_id: '',

  Open:   function(CompID)
  {
    $("#dialog-sel").dialog("destroy");
    $("#dlg-mode").tabs("destroy");
    $("#dlg-allR-value").menu("destroy");

    this.cur_obj = {};
    this.cur_comp_id = CompID;
    for(var nm in GlobSetup.Data)
      if (nm.startsWith(CompID)) this.cur_obj[nm.substr(CompID.length+1) || 'val']=GlobSetup.Data[nm];
    if (!('val' in this.cur_obj) && ('res' in this.cur_obj)) this.cur_obj.val=this.cur_obj.res;
    if (!('min' in this.cur_obj) && ('res_min' in this.cur_obj)) this.cur_obj.min=this.cur_obj.res_min;
    if (!('max' in this.cur_obj) && ('res_max' in this.cur_obj)) this.cur_obj.max=this.cur_obj.res_max;

    $("#dlg-solv-target").prop('checked',GlobSetup.SolverT == CompID);

    this.force_pc = false;
    if (!('val' in this.cur_obj))
    {
      if (CompID=='Rdst') this.cur_obj.val = this.cur_obj.min=this.cur_obj.max=Infinity; else 
      {
        this.cur_obj.val = this.cur_obj.min=this.cur_obj.max=0;
        if (/^R\d/.exec(CompID) !== null) this.force_pc = true;
      }
    }

    if (CompID[0]=='R')
    {
      $("#dlg-mode-base-ref-2").attr('href',"#dlg-allR");
      var d = GlobSetup.RPres == 5 ? [Utils.e24,2,4] : [Utils.e96,3,8];
      var spc;
      if (CompID == 'Rsrc') spc = 0;
      if (CompID == 'Rdst') spc = Infinity;
      $("#dlg-allR-tables").html(this.fill_res_sel(d[0],d[1],d[2],spc));
      this.set_units(['\u03A9','K','M'], CompID == 'Rdst');
    }
    else
    {
      $("#dlg-mode-base-ref-2").attr('href',"#dlg-all");
      switch(CompID[0])
      {
        case 'V': this.set_units(['V','mV','\u03BCV']); break;
        case 'I': this.set_units(['A','mA','\u03BCA']); break;
        case 'P': this.set_units(['W','mW','\u03BCW']); break;
        default:  this.set_units(); break;
      }
    }
    $("#dlg-all , #dlg-allR").hide();

    var tabs_opts = {
      active: 0,
      disabled: []
    };

    if ('mode' in this.cur_obj)
      switch(this.cur_obj.mode)
      {                                               // Undefined   - Value not specified and not derived                             (primary type)                  
       case 'Base':       tabs_opts.active=1; break;  // Base        - Value specified by user                                         (primary type)                  
       case 'Restricted': tabs_opts.active=2; break;  // Restriction - User specifies restrictions for possible values                 (subset of Undefined or Derived)
       case 'Derived':    tabs_opts.active=3; break;  // Derived     - Value derived by flow/back propagation through ResDiv equations (primary type)                  
      }

    switch(GlobSetup.Solver.GetVar(CompID))
    {
      case 'undef':   tabs_opts.disabled = [3]; break;
      case 'direct':  tabs_opts.disabled = [3]; break;
      default:        tabs_opts.disabled = [0,1]; break;
    };

    var self = this;
    $("#dlg-all-min-var , #dlg-all-max-var , #dlg-all-min-type , #dlg-all-max-type , #dlg-all-value-type").change(function() {self.pg_all_change();});
    $("#dlg-allR-min-var , #dlg-allR-max-var , #dlg-allR-min-type , #dlg-allR-max-type").change(function() {self.pg_allR_change();});

    this.create_dlg(tabs_opts);

    this.fill_tab_page(tabs_opts.active);

    $("#dlg-msg").text(GlobSetup.Data.t_get_desc(CompID));
    $("#dialog-sel").dialog( "option", "title", "Select value of "+CompID).dialog("open");
  },

  set_units:  function(units, add_inf)
  {
    for(var id of ['dlg-all-value-type','dlg-all-min-type','dlg-all-max-type','dlg-allR-min-type','dlg-allR-max-type'])
    {
      var jq = $('#'+id);
      if (typeof(units) == 'undefined')
      {
        jq.hide();
        continue;
      }
      jq.show();
      var acc = '';
      for(var u of units)
      {
        acc+="<option value='"+u+"'>"+u+"</option>";
      }
      if (add_inf && /-(min|max|value)-/.exec(id) !== null) acc+="<option value='\u221E'>\u221E</option>";
      jq.html(acc);
    }
  },

  create_dlg: function(tab_opts)
  {
    tab_opts.heightStyle ='content';
    tab_opts.activate = function( event, ui ) 
      {
        RDDlg.back_tab_page(RDDlg.jq2tab_idx(ui.oldTab));
        RDDlg.fill_tab_page(RDDlg.jq2tab_idx(ui.newTab));
      };
    $("#dlg-mode").tabs(tab_opts);
    $("#dlg-allR-value").menu({
//      select: function (event, ui) {debugger;}
    });
    $( "#dialog-sel" ).dialog({ 
      width:    900,
      height:   600,
      autoOpen: false,
      modal:    true,
      show:     'slide',
      hide:     'slide',
      buttons: [
        {
          text: "Ok",
          icons: {primary: "ui-icon-heart"},
          click: function() 
          {
            RDDlg.push_data();
            $( this ).dialog( "close" );
            NewDataAvail();
          }
        },
        {
          text: "Cancel",
          icons: {primary: "ui-icon-close"},
          click: function() {$( this ).dialog( "close" );}
        }
      ]
    });
  },

  reset_inf:  function(id)
  {
    if ($("#dlg-"+id+"-min-type").val() != '\u221E' && !isFinite(this.cur_obj.min)) this.cur_obj.min = 0;
    if ($("#dlg-"+id+"-max-type").val() != '\u221E' && !isFinite(this.cur_obj.max)) this.cur_obj.max = 0;
    if (id=="all" && $("#dlg-all-value-type").val() != '\u221E' && !isFinite(this.cur_obj.val)) this.cur_obj.val = 0;
  },

  pg_all_change:  function()
  {
    this.back_tab_page_all(1);
    this.reset_inf('all');
    this.fill_tab_page_all();
  },

  pg_allR_change:  function()
  {
    this.back_tab_page_allR(1);
    this.reset_inf('allR');
    this.fill_tab_page_allR();
  },

  fill_tab_page:  function (page_idx)
  {
    if (!('val' in this.cur_obj))
    {
      this.cur_obj.val = 0;
      this.cur_obj.min = 0;
      this.cur_obj.max = 0;
    }
    var msg = get_msg('dlg_msg_'+page_idx);
    if (('val' in this.cur_obj) && ('res' in this.cur_obj) && page_idx!=3)
    {
      msg += "<p>Evaluated value of "+this.cur_comp_id+" is "+Utils.val2str(this.cur_comp_id,this.cur_obj.res).T+" ("+Utils.val2str(this.cur_comp_id,this.cur_obj.res_min).T+" \u2026 " + Utils.val2str(this.cur_comp_id,this.cur_obj.res_max).T+")<br>";
      msg += "Target value of "+this.cur_comp_id+" is "+Utils.val2str(this.cur_comp_id,this.cur_obj.val).T+" ("+Utils.val2str(this.cur_comp_id,this.cur_obj.min).T+" \u2026 " + Utils.val2str(this.cur_comp_id,this.cur_obj.max).T+")<br>";
      if (this.cur_obj.res!=this.cur_obj.val)
      {
        var dif = Math.abs(this.cur_obj.res-this.cur_obj.val);
        msg += "Target deviation is "+Utils.val2str(this.cur_comp_id,dif).T;
        if (this.cur_obj.val) msg += " ("+Utils.prn(dif*100/this.cur_obj.val,3)+"%)";
        msg+="<br>";
      }
      if (this.cur_obj.min>this.cur_obj.res_min)
      {
        var dif = this.cur_obj.min-this.cur_obj.res_min;
        msg += "<span style='background-color: red'>Low limit violation by "+Utils.val2str(this.cur_comp_id,dif).T;
        if (this.cur_obj.val) msg += " ("+Utils.prn(dif*100/this.cur_obj.val,3)+"%)";
        msg+="</span><br>";
      }
      else
      {
        var dif = this.cur_obj.res_min-this.cur_obj.min;
        msg += "Low limit marging is "+Utils.val2str(this.cur_comp_id,dif).T;
        if (this.cur_obj.val) msg += " ("+Utils.prn(dif*100/this.cur_obj.val,3)+"%)";
        msg+="<br>";
      }
      if (this.cur_obj.max<this.cur_obj.res_max)
      {
        var dif = this.cur_obj.res_max-this.cur_obj.max;
        msg += "<span style='background-color: red'>High limit violation by "+Utils.val2str(this.cur_comp_id,dif).T;
        if (this.cur_obj.val) msg += " ("+Utils.prn(dif*100/this.cur_obj.val,3)+"%)";
        msg+="</span><br>";
      }
      else
      {
        var dif = this.cur_obj.max-this.cur_obj.res_max;
        msg += "High limit marging is "+Utils.val2str(this.cur_comp_id,dif).T;
        if (this.cur_obj.val) msg += " ("+Utils.prn(dif*100/this.cur_obj.val,3)+"%)";
        msg+="<br>";
      }

    }
    $("#dlg-message").html(msg);
    switch(page_idx)
    {
      case 1: if (this.cur_comp_id[0]=='R') this.fill_tab_page_allR();
              else this.fill_tab_page_all();
              break;
      case 2: this.fill_tab_page_all(); break;
      case 3: this.fill_tab_page_ro(); break;
    }
  },

  fill_tab_page_allR: function()
  {
    $("#dlg-allR-value-text").html(Utils.val2str(this.cur_comp_id,this.cur_obj.val).T);
    this.fill_vals_range("dlg-allR");
  },

  fill_tab_page_all:  function()
  {
    this.fill_val_with_suf(this.cur_obj.val,"dlg-all-value");
    this.fill_vals_range("dlg-all");
  },

  fill_tab_page_ro: function()
  {
    var min_val = 'min' in this.cur_obj ? Utils.val2str(this.cur_comp_id,this.cur_obj.res_min).T : 'Same as Val';
    var max_val = 'max' in this.cur_obj ? Utils.val2str(this.cur_comp_id,this.cur_obj.res_max).T : 'Same as Val';
    var val = Utils.val2str(this.cur_comp_id,this.cur_obj.res).T;
    $("#dlg-ro-value").text(val);
    $("#dlg-ro-min").text(min_val);
    $("#dlg-ro-max").text(max_val);
  },

  fill_val_with_suf:  function(val, id)
  {
    var dec = Utils.val2str(this.cur_comp_id,val);
    $("#"+id).prop('value',dec.V);
    $("#"+id).prop('disabled',!isFinite(val));
    if (this.cur_comp_id[0]=='K') return;
    var opts = $("#"+id+"-type option[value='"+dec.S+"']");
    if (opts.length == 0 && dec.S == '')
    {
      opts = $("#"+id+"-type option[value='\u03A9']");
    }
    if (opts.length == 0) alert("Can't find suffix '"+dec.S+"' in drop down box");
    else opts.prop('selected',"1");
  },

  fill_vals_range:  function(id)
  {
    var min_type = 'min_type' in this.cur_obj ? this.cur_obj.min_type : '%';
    var max_type = 'max_type' in this.cur_obj ? this.cur_obj.max_type : 'Same as Min';
    this.cur_obj.min_type = min_type;
    this.cur_obj.max_type = max_type;
    var min_val = 'min' in this.cur_obj ? this.cur_obj.min : this.cur_obj.val;
    var max_val = 'max' in this.cur_obj ? this.cur_obj.max : this.cur_obj.val;

    if (!isFinite(this.cur_obj.val))
    {
      max_type = 'abs';
      min_type = 'abs';
    }
    else if (max_type == 'Same as Min' && (min_val+max_val)!=this.cur_obj.val*2) max_type = min_type;

    $("#"+id+"-min-var option[value='"+min_type+"']").prop('selected','1');
    $("#"+id+"-max-var option[value='"+max_type+"']").prop('selected','1');

    if (max_type == 'Same as Min')
    {
      $("#"+id+"-max").attr('disabled',true);
      $("#"+id+"-max-type").attr('disabled',true);
      $("#"+id+"-max").prop('value','');
      $("#"+id+"-max-sgn").html('');
      $("#"+id+"-min-sgn").html('\u00B1');
    }
    else
    {
      $("#"+id+"-max").attr('disabled',false);
      $("#"+id+"-max-type").attr('disabled',false);
      $("#"+id+"-max-sgn").html(max_type == '%' || max_type=='delta' ? '+' : '');
      $("#"+id+"-min-sgn").html(min_type == '%' || min_type=='delta' ? '-' : '');
    }

    var func = function(self,val, mode, sgn, id)
    {
      switch(mode)
      {
        case 'delta': val=sgn*(val-self.cur_obj.val); break;
        case '%': 
          if (self.force_pc && val==0 && self.cur_obj.val==0) val=GlobSetup.RPres;
          else val = self.cur_obj.val ? Utils.prn(sgn*(val-self.cur_obj.val)*100/self.cur_obj.val,3) : self.cur_obj.val == val ? '0' : '?';
          $("#"+id+"-type").hide();
          $("#"+id).prop('value',val);
          $("#"+id).attr('disabled',false);
          return;
      }
      if (self.cur_comp_id[0]!='K') $("#"+id+"-type").show();
      self.fill_val_with_suf(val,id);
    };
    func(this,min_val, min_type, -1, id+'-min');
    if (max_type!='Same as Min') func(this,max_val, max_type, 1, id+'-max');
  },

  back_tab_page:  function (page_idx)
  {
    switch(page_idx)
    {
      case 1: if (this.cur_comp_id[0]=='R') this.back_tab_page_allR();
              else this.back_tab_page_all();
              break;
      case 2: this.back_tab_page_all(); break;
    }
  },

  get_val_with_suf:  function(id)
  {
    var val = $("#"+id).prop('value');
    if (this.cur_comp_id[0]=='K') return val;
    var opt = $("#"+id+"-type").val();
    return Utils.str2val(val,opt);
  },

  back_vals_range:  function(id, skp)
  {
    if (!skp)
    {
      this.cur_obj.min_type = $("#"+id+"-min-var").val();
      this.cur_obj.max_type = $("#"+id+"-max-var").val();
    }

    var func = function(self, mode, sgn, id)
    {
      switch(mode)
      {
        case 'delta': return self.cur_obj.val+sgn*self.get_val_with_suf(id);
        case '%': return self.cur_obj.val+sgn*self.cur_obj.val*Number($("#"+id).prop('value'))/100;
        case 'abs': return self.get_val_with_suf(id);
      }
    };
    this.cur_obj.min = func(this, this.cur_obj.min_type, -1, id+'-min');
    this.cur_obj.max = this.cur_obj.max_type == 'Same as Min' ? func(this, this.cur_obj.min_type, 1, id+'-min') : func(this, this.cur_obj.max_type, 1, id+'-max');

    if (skp)
    {
      this.cur_obj.min_type = $("#"+id+"-min-var").val();
      this.cur_obj.max_type = $("#"+id+"-max-var").val();
    }
  },

  postpr_back:  function()
  {
    if (!isFinite(this.cur_obj.val)) 
    {
      this.cur_obj.max = Infinity;
      $("#dlg-all-max-type , #dlg-allR-max-type").val('\u221E');
      this.cur_obj.min_type = 'abs';
      this.cur_obj.max_type = 'abs';
    }
  },

  back_tab_page_allR: function(skp)
  {
    this.cur_obj.val = Utils.str2val($("#dlg-allR-value-text").text());
    this.back_vals_range("dlg-allR",skp);
    this.postpr_back();
  },

  back_tab_page_all:  function(skp)
  {
    this.cur_obj.val = this.get_val_with_suf("dlg-all-value");
    this.back_vals_range("dlg-all",skp);
    this.postpr_back();
  },

  push_data: function()
  {
    var idx = $("#dlg-mode").tabs( "option", "active" );
    this.back_tab_page(idx);
    for(var nm in this.cur_obj)
      GlobSetup.Data[nm == 'val' ? this.cur_comp_id : this.cur_comp_id+'_'+nm] = this.cur_obj[nm];
    GlobSetup.Data[this.cur_comp_id+'_mode'] = ['Undefined','Base','Restricted','Derived'][idx];
    if (idx==1) // Base value - clear out _res* fields
    {
      delete GlobSetup.Data[this.cur_comp_id+'_res'];
      delete GlobSetup.Data[this.cur_comp_id+'_res_min'];
      delete GlobSetup.Data[this.cur_comp_id+'_res_max'];
    }
    var tgt = $("#dlg-solv-target").prop('checked');
    if (tgt) GlobSetup.SolverT = this.cur_comp_id; else
    if (GlobSetup.SolverT == this.cur_comp_id) GlobSetup.SolverT='';
  },

  fill_res_sel: function(rlist, pres, cols, special)
  {
    var rv='';

    var prn = function(v) {return Utils.prn(v,pres);};

    if (typeof(special)!='undefined')
    {
      if ( special === Infinity ) special = ' \u221E';
      rv+="<li onclick='SetDataVal(\""+special+"\",\"\")'>"+special;
    }

    for(var sec of [
      {T:'1-9.9',   M:1,  S:''},
      {T:'10-99',   M:10, S:''},
      {T:'100-999', M:100,S:''},
      {T:'1-9.9K',  M:1,  S:'K'},
      {T:'10-99K',  M:10, S:'K'},
      {T:'100-999K',M:100,S:'K'},
      {T:'1-9.9M',  M:1,  S:'M'}
    ])
    {
      rv+="<li>"+sec.T+"<ul><li><table border=0>";
      var idx=0;
      while(idx<rlist.length)
      {
        rv+="<tr>";
        for(var col = 0; col < cols && idx<rlist.length ; ++col, ++idx)
        {
          rv+="<td class='ui-menu-item' onclick='SetDataVal(\""+prn(rlist[idx]*sec.M)+"\",\""+sec.S+"\")'> "+prn(rlist[idx]*sec.M)+sec.S;
        }
        rv+="</tr>";
      }
      rv+="</table></li></ul></li>";
    }

    return rv;
  },

  jq2tab_idx: function (jq)
  {
    var id = jq.html(); // !!! Hack !!!
    var m = /dlg-mode-base-ref-(\d)/.exec(id);
    if (m === null) throw "Invalid ID in jq2tab_idx ("+id+")";
    return m[1]-1;
  }

};

function SetDataVal(val, suf)
{
  $("#dlg-allR-value-text").html(val+suf);
  $("#dlg-allR-value").menu('collapseAll');
  RDDlg.pg_allR_change();
}


RDDlg.create_dlg({});
