'use strict';

function Solver()
{
  this.r1 = NewDrawRes(0,'R1');
  this.r2 = NewDrawRes(0,'R2');
}

Solver.prototype = {
  Run:  function()
  {
    if (!this.RunPrepare()) return false;
    while(this.RunStep()) ;
    return this.RunDone();
  },

  RunCheck: function ()
  {
    if (GlobSetup.SolverT == '') {alert("Can't run Solver: No Target specified!"); return false;}
    if ( (GlobSetup.Data[GlobSetup.SolverT+"_mode"] || 'Undefined') == 'Undefined')
    {
      alert("Solver: No restriction found for target '"+GlobSetup.SolverT+"'"); 
      return false;
    }
    if (GlobSetup.Data[GlobSetup.SolverT] == GlobSetup.Data[GlobSetup.SolverT+"_min"] && GlobSetup.Data[GlobSetup.SolverT] == GlobSetup.Data[GlobSetup.SolverT+"_max"])
    {
      alert("Zero tolerance for Target will never lead to any solution.\nTolerance set to " + GlobSetup.RPres + "%");
      let val = GlobSetup.Data[GlobSetup.SolverT];
      let pres = GlobSetup.RPres / 100;
      GlobSetup.Data[GlobSetup.SolverT+"_max"] = val * (1+pres);
      GlobSetup.Data[GlobSetup.SolverT+"_min"] = val * (1-pres);
      GlobSetup.Data[GlobSetup.SolverT+"_min_type"] = "%";
      GlobSetup.Data[GlobSetup.SolverT+"_max_type"] = "Same as Min";
    }

    this.K1K2 = this.new_tpl_solver('R2',GlobSetup.SolverT); // R1+R2 => Target
    if (this.K1K2 === null) return false;

    this.K1T = this.new_tpl_solver(GlobSetup.SolverT,'R2'); // R1+Target => R2
    if (this.K1T === null) return false;

    if ( GlobSetup.Data[GlobSetup.SolverT+"_mode"] == 'Base')
    {
      alert("Solver: Target should have 'Restricted' mode, not 'Base'. Mode changed");
      GlobSetup.Data[GlobSetup.SolverT+"_mode"] = 'Restricted';
    }

    return true;
  },

  RunPrepare:  function()
  {   
    this.res_set = SetupMgrInst.Get(GlobSetup.RModeIndex);

    this.Data_K1K2  = $.extend({}, GlobSetup.Data);
    this.Data_K1T   = $.extend({}, GlobSetup.Data);

    this.Data_K1K2[GlobSetup.SolverT+"_mode"]='Restricted';
    this.Data_K1K2.R1_mode = 'Base';
    this.Data_K1K2.R2_mode = 'Base';

    this.Data_K1T[GlobSetup.SolverT+"_mode"]='Base';
    this.Data_K1T.R1_mode = 'Base';
    this.Data_K1T.R2_mode = 'Derived';

    var acc=[];   // Fully valid results
    var acc2=[];  // Resuilts with one restriction violated
    var acc3=[];  // Results with multiple restriction violated
    var max_delta = Infinity;
    var acc_less_tgt = false;   // Last broken target that less than target (last resort)   Solution object
    var acc_greater_tgt = false; // Last broken target that more than target (last resort)  Solution object

    var r2_idx_upper=0;

    var cmp = function (a,b) {return Math.abs(a.Delta) - Math.abs(b.Delta);};

    var org_tgt = this.Data_K1K2[GlobSetup.SolverT];

    this.cur_item_index = 0;
    this.max_item_index = this.res_set.length;

    if ((GlobSetup.Data.R1_mode || '') == "Restricted")
    {
      var r1_limit_min = Math.min(GlobSetup.Data.R1_min,GlobSetup.Data.R1_max);
      var r1_limit_max = Math.max(GlobSetup.Data.R1_min,GlobSetup.Data.R1_max);
      while(this.cur_item_index<this.res_set.length && this.res_set[this.cur_item_index].R < r1_limit_min) ++this.cur_item_index;
      while(this.max_item_index>this.cur_item_index && this.res_set[this.max_item_index-1].R > r1_limit_max) --this.max_item_index;
      if (this.cur_item_index>=this.max_item_index)
      {
        alert("Solver: No valid values for R1 specified range");
        return false;
      }
    }

    var r2_limit_min =0;
    var r2_limit_max =Infinity;

    if ((GlobSetup.Data.R2_mode || '') == "Restricted")
    {
      r2_limit_min = Math.min(GlobSetup.Data.R2_min,GlobSetup.Data.R2_max);
      r2_limit_max = Math.max(GlobSetup.Data.R2_min,GlobSetup.Data.R2_max);
    }

    this.worker_func = function(r1)
    {
      this.set_rx(r1.R,'R1',this.Data_K1T);
      var dst = $.extend({}, this.Data_K1T);
      this.K1T.F(dst,dst);
      if (this.chk_sol(dst,'K1T') === false) return false;

      var r2_min = Math.max(r2_limit_min,Math.min(dst.R2_res_min,dst.R2_res_max));
      var r2_max = Math.min(r2_limit_max,Math.max(dst.R2_res_min,dst.R2_res_max));
      var r2_val = dst.R2_res;

      if (r2_min > r2_max) return false;
      if (r2_val<r2_min) r2_val=r2_min; else
      if (r2_val>r2_max) r2_val=r2_max;

      if (r2_idx_upper && r2_val < this.res_set[r2_idx_upper-1].R) // move to start
      {
        while(r2_idx_upper && r2_val < this.res_set[r2_idx_upper-1].R) --r2_idx_upper;
      }
      else // move to end
      {
        while(r2_idx_upper < this.res_set.length && r2_val >= this.res_set[r2_idx_upper].R) ++r2_idx_upper;
      }

      this.set_rx(r1.R,'R1',this.Data_K1K2);

      var best_c=10;

      var push_acc = function(acc,val)
      {
        acc.push(val);
        if (acc.length > 2*GlobSetup.MaxRows)
        {
          acc.sort(cmp);
          acc.length = GlobSetup.MaxRows;
          max_delta = Math.abs(acc[acc.length-1].Delta);
        }
      };

      var add_result = $.proxy(function(r1,r2)
      {
        var cur_c= r1.C+r2.C;
        if (cur_c>GlobSetup.MaxR) return false;
        this.set_rx(r2.R,'R2',this.Data_K1K2);
        var dst = $.extend({}, this.Data_K1K2);
        this.K1K2.F(dst,dst);
        var ctgt = dst[GlobSetup.SolverT+"_res"];
        var delta = ctgt-org_tgt;
        if (Math.abs(delta) > max_delta) return true;
        var res = this.chk_sol(dst,'K1K2');
        var sol = {R1: r1, R2: r2, RES: ctgt, Delta: delta, CHK: res};
        if (res === false)
        {
            var tgt_min = dst[GlobSetup.SolverT+"_res_min"];
            var tgt_max = dst[GlobSetup.SolverT+"_res_max"];
            if (tgt_min < org_tgt && (acc_less_tgt === false || tgt_min > acc_less_tgt.RES)) acc_less_tgt = sol; else
            if (tgt_max > org_tgt && (acc_greater_tgt === false || tgt_max < acc_greater_tgt.RES)) acc_greater_tgt = sol;
            return false;
        }
        if (res === true)
        {
          if (cur_c >= best_c) return false;
          best_c=cur_c;
          acc.push(sol);
          if (best_c==2) return true;
          return false;
        }
        if (acc.length) return false;
        if (!$.isNumeric(res)) acc2.push(sol);
        else if (acc2.length == 0) acc3.push(sol);
        return false;
      },this);

      // Scan to lower values
      for(var r2_idx = r2_idx_upper-1; r2_idx>=0; --r2_idx)
      {
        var r2 = this.res_set[r2_idx];
        if (r2.R < r2_min || add_result(r1,r2)) break;
      }

      // Scan to upper values
      best_c=10;
      for(var r2_idx = r2_idx_upper; r2_idx<this.res_set.length; ++r2_idx)
      {
        var r2 = this.res_set[r2_idx];
        if (r2.R > r2_max || add_result(r1,r2)) break;
      }

      if (!max_delta && acc.length >= GlobSetup.MaxRows) return true;
    };

    this.done_func = function()
    {
      if (acc.length)   this.solution = {S:acc,  M:0}; else
      if (acc2.length)  this.solution = {S:acc2, M:1, A:"broken restriction"}; else
      if (acc3.length)  this.solution = {S:acc3, M:2, A:"multiple restrictions broken"}; else
      if (acc_less_tgt !== false || acc_greater_tgt !== false)
      {
        var res = [];
        if (acc_less_tgt !== false) res.push(acc_less_tgt);
        if (acc_greater_tgt !== false) res.push(acc_greater_tgt);
        alert("No solution found!\nInput/output values and tolerances made a solution impossible.\nThere are best results with target restriction violation");
        this.solution = {S:res, M:3, A:"broken target"};
        return true;
      }
      else
      {
        alert("No solution found !");
        return false;
      }

      if (this.solution.M) alert("Sorry, only solution(s) with "+this.solution.A+" available");

      if (this.solution.S.length > GlobSetup.MaxRows) this.solution.S.length = GlobSetup.MaxRows;

      this.solution.S.sort(cmp);

      return true;
    };

    return true;
  },

  TotalSteps: function() {return this.max_item_index - this.cur_item_index;},

  RunStep: function(count)
  {
    if (!count) count=this.res_set.length;
    for(var i=0; this.cur_item_index < this.max_item_index && i < count; ++i, ++this.cur_item_index )
    {
      var r1 = this.res_set[this.cur_item_index];
      if (this.worker_func(r1)) return false;
    }
    return this.cur_item_index<this.max_item_index;
  },

  RunDone: function()
  {
    return this.done_func();
  },

  SetupSolution:  function(index)
  {
    if (GlobSetup.Data.R1_mode != 'Restricted') GlobSetup.Data.R1_mode = 'Undefined';
    if (GlobSetup.Data.R2_mode != 'Restricted') GlobSetup.Data.R2_mode = 'Undefined';
    var s = this.solution.S[index];
    for(var idx of [1,2])
    {
      var r = s['R'+idx].RSet;
      for(var nm in r)
      {
        var rnm = Utils.Repl(nm,idx);
        this.set_rx(r[nm],rnm,GlobSetup.Data);
        GlobSetup.Data[rnm+'_mode']='Base';
      }
      GlobSetup['R'+idx+'Mode'] = s['R'+idx].CFG;
    }
  },

  CreaTable: function()
  {
    var acc="<thead><tr><th>"+GlobSetup.SolverT+"<th>Delta of "+GlobSetup.SolverT+"<th>R1<th>R2";
    switch(this.solution.M)
    {
      case 1: acc+="<th>Violated Restriction"; break;
      case 2: acc+="<th>Total Restriction violated"; break;
    }
    acc+="</tr></thead><tbody>";
    for(var it of this.solution.S)
    {
      acc+="<tr><td>"+Utils.val2str(GlobSetup.SolverT,it.RES).T+"<td>"+
           Utils.val2str(GlobSetup.SolverT,it.Delta).T+"/"+Utils.prn(Math.abs(it.Delta)*100/this.Data_K1K2[GlobSetup.SolverT],2)+"%<td>"+it.R1.V+"<td>"+it.R2.V;
      switch(this.solution.M)
      {
        case 1: acc+="<td>"+it.CHK; break;
        case 2: acc+="<td>"+it.CHK.length; break;
      }
      acc+="</tr>";
    }
    return acc+"</tbody>";
  },

  set_rx: function(r,idx,tgt)
  {
    tgt[idx] = r;
    tgt[idx+'_min'] = r-(r*GlobSetup.RPres/100);
    tgt[idx+'_max'] = r+(r*GlobSetup.RPres/100);
    delete tgt[idx+"_res"];
    delete tgt[idx+"_res_min"];
    delete tgt[idx+"_res_max"];
  },

  new_tpl_solver: function(s2,t)
  {
    var obj = new TplNew(this.r1,this.r2);
    for(var nm in obj.TplObj)
    {
      var set_base = false;
      if (nm == 'R1' || nm == s2) set_base = true; else
      if (nm != t && nm+'_mode' in GlobSetup.Data && GlobSetup.Data[nm+'_mode'] == 'Base')
        set_base = true;
      if (set_base)
      {
        if (obj.GetVar(nm) == 'undef') obj.SetVar(nm); else
        {
          alert("Solver (R1+"+s2+"=>"+t+"): Can't set primary value of "+nm+" - already derived");
          return null;
        }
      }
    }
    if (obj.GetVar(t) == 'undef')
    {
      alert("Solver (R1+"+s2+"=>"+t+"): Can't deduce target value "+t+" from supplied data");
      return null;
    }
    return {O: obj, F: obj.GetFuncs()};
  },

  // Check cur solution in 'nm' for Restrictions. Return:
  //  true - All ok
  //  false - Target breaks Restriction
  //  <number>  - Multiple broken Restrictions
  //  'name' - One broken Restriction
  chk_sol: function(obj,src) 
  {
    var brk = [];
    for(var nm in this[src].O.TplObj)
      if (obj.is_invalid_tgt(nm))
      {
        if (nm == GlobSetup.SolverT) return false;
        brk.push(nm);
      }
    switch(brk.length)
    {
      case 0: return true;
      case 1: return brk[0];
      default: return brk.length;
    }
  }

};

function SetupMgr()
{
  this.modes = [null,null,null];
}

SetupMgr.prototype = {
  Get: function(idx)
  {
    if (this.modes[idx] === null) 
    {
      switch(idx)
      { 
        case 0: this.modes[0] = this.setup_res1(Utils.e24); break;
        case 1: this.modes[1] = this.setup_res1(Utils.e96); break;
        case 2: this.modes[2] = this.setup_res3(Utils.e24); break;
      }
    }
    return this.modes[idx];
  },

  frv: function(rval,rset,cfg) 
  {
    var text = Utils.val2str('R',rval,'+').T;
    var c=Object.keys(rset).length;
    if (c>1)
    {
      text += " ("+ResNetsNames[cfg].replace(/R\?\.\d/g,function (v) {return Utils.val2str('R',rset[v],'+').T;})+")";
    }
    return {R:rval, RSet: rset, C: c, CFG: cfg, V: text}; 
  },

  setup_res1:  function(res_set)
  {
    var acc=[];
    for(var mul of [1,10,100,1e3,1e4,1e5,1e6,1e7])
      for(var r of res_set)
      {
        var rval = mul*r;
        acc.push(this.frv(rval,{'R?': rval}, 0));
      }
    return this.res_set = acc;
  },

  setup_res3: function(res_set)
  {
//    var t1 = Date.now();

    var cmp = function(a,b) {return a.R - b.R;};
    this.used_res = {}; // Map <res value in text form> => <number of resistors>
    var range = res_set.length*2; // Scan resistors in range +/- 'range' (by indexes) from R?.1

    // Fill 1R network
    this.setup_res1(res_set); // form basic 1R net
    var max_res_0 = this.res_set.length; // This is where R1 configuration ends in output array
    for(var it of this.res_set)  this.used_res[Number(it.R).toPrecision(3)] = 1; // Fill map for 1R net

//    var t2 = Date.now();

    var res_set = this.res_set; this.res_set=[];
    // Fill 2R network: parallel
    for(var i = 0; i<max_res_0; ++i)
    {
      var l = Math.min(i+range,max_res_0);
      for(var j=i; j<l; ++j)
      {
        this.sr_add(TplPAR(res_set[i].R,res_set[j].R), {'R?.1': res_set[i].R, 'R?.2': res_set[j].R}, 1);
      }
    }
    var res_arr_1 = this.res_set.sort(cmp); this.res_set=[];

//    var t3 = Date.now();

    // 2R network: serial
    for(var i = 0; i<max_res_0; ++i)
    {
      var l = Math.min(i+range,max_res_0);
      for(var j=i; j<l; ++j)
      {
        this.sr_add(res_set[i].R+res_set[j].R, {'R?.1': res_set[i].R, 'R?.2': res_set[j].R}, 2);
      }
    }
    var res_arr_2 = this.res_set.sort(cmp); this.res_set=res_set;

//    var t4 = Date.now();
//    var t5 = t4;


//    if (GlobSetup.MaxR>3)
    {
      // Fill 3R network: parallel/serial
      for(var i = 0; i<max_res_0; ++i)
      {
        var l = Math.min(i+range,max_res_0);
        for(var j=i; j<l; ++j)
          for(var k=j; k<l; ++k)
          {
            var rset = {'R?.1': res_set[i].R, 'R?.2': res_set[j].R, 'R?.3': res_set[k].R};
            this.sr_add(TplPAR3(res_set[i].R,res_set[j].R,res_set[k].R), rset, 3);
            this.sr_add(res_set[i].R+res_set[j].R+res_set[k].R, rset, 4);
          }
      }
//      var t5 = Date.now();

/* Mixed 3R network didn't add anything new (except the time spend to evaluating it) :( So I turned it off.

      var var1_start=0;
      var var2_start=0;

      var mixed_start = this.res_set.length;

      // 3R network: mixed
      for(var i = 0; i<max_res_0; ++i)
      {
        var r1 = res_set[i].R;
        var r_min = r1/100;
        var r_max = r1*100;
        var j;

        // config 5: R?.1+(R?.2||R?.3)
        for(j=var1_start; j<res_arr_1.length;++j)
        {
          var r2 =res_arr_1[j];
          if (r2.R < r_min) {var1_start=j+1; continue;}
          if (r2.R > r_max) break;
          this.sr_add(r1+r2.R, {'R?.1': r1.R, 'R?.2': r2.RSet['R?.1'], 'R?.3': r2.RSet['R?.2']}, 5);
        }

        // config 6: R?.1||(R?.2+R?.3)
        for(j=var2_start; j<res_arr_2.length;++j)
        {
          var r2 = res_arr_2[j];
          if (r2.R < r_min) {var2_start=j+1; continue;}
          if (r2.R > r_max) break;
          this.sr_add(TplPAR(r1,r2.R), {'R?.1': r1.R, 'R?.2': r2.RSet['R?.1'], 'R?.3': r2.RSet['R?.2']}, 6);
        }
      }

//      alert("Mixed res found: "+(this.res_set.length-mixed_start));
*/
    }

//    var t6 = Date.now();

    this.res_set = this.res_set.concat(res_arr_1,res_arr_2).sort(cmp);

//    var t7 = Date.now();

//    alert("R1 - "+(t2-t1)+"\nR2 par - "+(t3-t2)+"\nR2 ser - "+(t4-t3)+"\nR3 par/ser - "+(t5-t4)+"\nR3 mixed - "+(t6-t5)+"\nJoin & sort - "+(t7-t6)+"\nTotal R - "+this.res_set.length);

    delete this.used_res;
    return this.res_set;
  },

  sr_add: function(rval,rset,cfg)
  {
    var C = Object.keys(rset).length;
    var id = Number(rval).toPrecision(3);
    if (id in this.used_res)
    {
//      if (this.used_res[id] < C) 
        return;
    }
    else
    {
      this.used_res[id]=C;
    }
    this.res_set.push(this.frv(rval,rset,cfg));
  }
  
};

var SetupMgrInst = new SetupMgr();
