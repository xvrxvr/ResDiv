'use strict';

var Utils = {

  prn:  function(v, pres)
  {
    if (typeof(pres) == 'undefined') pres = GlobSetup.RPres == 5 ? 1 : 2; else
    if (pres === '+') pres = GlobSetup.RPres == 5 ? 2 : 3;
    v=Number(v);
    var rv = v.toPrecision(pres);
    if (rv.search(/e\+/)==-1) return rv;
    return v.toFixed();
  },

  // Get value in string form (shorten as appropriate). Returns object with keys:
  //  T: <text representation>
  //  V: <value in string form>
  //  S: <suffix>
  val2str:  function(id,v,pres) 
  {
    if ( !isFinite(v) ) return {T:' \u221E', V: ' \u221E', S: '\u221E'};

    var neg = '';
    var n=1;
    if (v<0) {v=-v; neg='-'; n=-1;}
    
    var R = function(val, suf) {return {V: n*val, S: suf, T: neg+val+suf};};

    if (!pres) pres = 3;

    if (id[0]=='R')
    {
      if (v<1000) return R(this.prn(v,pres),'');
      v/=1000;
      if (v<1000) return R(this.prn(v,pres),"K");
      v/=1000;
      return R(this.prn(v,pres),"M");
    }
    if (id[0]=='K') return R(this.prn(v,pres),'');
    var s = id[0]=='I' ? 'A': id[0] == 'V' ? 'V' : 'W';
    if (!v) return R('0',s);
    if (v>=(id[0]=='P' ? 0.1 :1)) return R(this.prn(v,pres),s);
    v*=1000;
    if (v>=1) return R(this.prn(v,pres),'m'+s);
    v*=1000;
    return R(this.prn(v,pres),'\u03BC'+s);
  },

  // Convert string repr to value
  // val - Input string (with possible suffix)
  // suf - Optional suffix
  str2val:  function(val,suf)
  {
    if (typeof(suf) == 'undefined') suf='';
    suf=$.trim(suf);
    val=$.trim(val);

    if (suf=='\u03A9') suf=''; else
    if (suf=='\u221E') return Infinity;
    if (val=='\u221E') return Infinity;

    suf=suf.toLowerCase();

    var res;
    var suf2 = '';
    if ( (res=/^([\d.]+)\s*([^\d.]+)$/.exec(val)) !== null)
    {
      val  = res[1];
      suf2 = res[2].toLowerCase();
      switch(suf2)
      {
        case 'mka': case 'ua': suf2='\u03BCa'; break;
        case 'mkv': case 'uv': suf2='\u03BCv'; break;
        case 'mkw': case 'uw': suf2='\u03BCw'; break;
      }
    }

    if (suf!='' && suf2!='' && suf!=suf2) alert("Mismatched suffixes: '"+suf+"' and '"+suf2+"'\nFirst one is used"); else
    if (suf=='') suf=suf2;

    val=Number(val);
    if (suf.length==1)
      switch(suf)
      {
        case 'v': case 'a': case 'w': break;
        case 'k': val *= 1000; break;
        case 'm': val *= 1000000; break;
        default: alert("Unknown suffix '"+suf+"'"); break;
      }
    else if (suf.length>1)
      switch(suf[0])
      {
        case 'm': val /=1000; break;
        case '\u03BC': val /= 1000000; break;
        default: alert("Unknown suffix '"+suf+"'"); break;
      }
    return val;
  },

  Repl: function(tpl, val)
  {
    val = /(\d+)/.exec(val)[0];
    return tpl.replace(/\?/g,val);
  },

  e24 : [1, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2, 2.2, 2.4, 2.7, 3, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1],
  e96 : [1, 1.02, 1.05, 1.07, 1.1, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.3, 1.33, 1.37, 1.4, 1.43, 1.47, 1.5, 1.54, 1.58, 1.62, 1.65, 1.69, 1.74, 1.78, 1.82, 1.87, 1.91, 1.96,
         2, 2.05, 2.1, 2.15, 2.21, 2.26, 2.32, 2.37, 2.43, 2.49, 2.55, 2.61, 2.67, 2.74, 2.8, 2.87, 2.94, 3.01, 3.09, 3.16, 3.24, 3.32, 3.4, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92,
         4.02, 4.12, 4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23, 5.36, 5.49, 5.62, 5.76, 5.9, 6.04, 6.19, 6.34, 6.49, 6.65, 6.81, 6.98, 7.15, 7.32, 7.5, 7.68, 7.87,
         8.06, 8.25, 8.45, 8.66, 8.87, 9.09, 9.31, 9.53, 9.76]


};
