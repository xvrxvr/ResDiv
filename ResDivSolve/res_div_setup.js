'use strict';


var SetupMgr = {
  init: function()
  {
     $("#setup-maxres").spinner({
       min: 2,
       max: 6,
       stop: function() {SetupMgr.on_change();}
     });

     $("#setup-maxrows").spinner({
       min: 10,
       max: 1000,
       stop: function() {SetupMgr.on_change();}
     });


     $("#accordeon").accordion({
      heightStyle: 'content'
     });

     $("#setup-view-mode , #setup-view-rows , #setup-res-mode , #setup-maxres , #setup-R1 , #setup-R2").change( function() {SetupMgr.on_change();});

     this.fill_sel("setup-view-mode",RTDscTemplates);
     this.fill_sel("setup-view-rows",RTDscRows);
     this.fill_sel2('1');
     this.fill_sel2('2');
  },

  on_change:  function()
  {
    GlobSetup.ViewMode = $("#setup-view-mode").val();
    GlobSetup.ViewRows = $("#setup-view-rows").val();
    GlobSetup.MaxRows  = Number($("#setup-maxrows").val());

    var idx = Number($("#setup-res-mode").val());
    var enc = [ [5,5], [1,1], [1,5] ] [idx];
    GlobSetup.RPres = enc[0];
    GlobSetup.RSet  = enc[1];
    GlobSetup.RModeIndex = idx;
    if (idx==2)
    {
      $("#setup-visible-1").show();
      GlobSetup.MaxR = $("#setup-maxres").val();
      if (GlobSetup.MaxR>2) {$("#setup-visible-2 , #setup-visible-3").show(); GlobSetup.R1Mode=Number($("#setup-R1").val()); GlobSetup.R2Mode = Number($("#setup-R2").val());}
      else {$("#setup-visible-2 , #setup-visible-3").hide(); GlobSetup.R1Mode=0; GlobSetup.R2Mode = 0;}
    }
    else
    {
      $("#setup-visible-1 , #setup-visible-2 , #setup-visible-3").hide();
      GlobSetup.R1Mode=0; GlobSetup.R2Mode = 0;
    }

    NewDataAvail();
  },

  fill_sel: function(sel_id, obj)
  {
    var acc='';
    for(var nm in obj) acc+="<option>"+nm+"</option>";
    $('#'+sel_id).html(acc);
  },

  fill_sel2: function(idx)
  {
    var acc='';
    var i=0;
    for(var nm of ResNetsNames)
    {
      var nm2 = Utils.Repl(nm,idx);
      acc += "<option value='"+i+"'>"+nm2+"</option>";
      ++i;
    }
    $("#setup-R"+idx).html(acc);
  }
};

function WaitDlg(max_steps, title, unk)
{
  this.cur_step = 0;

  $("#dlg-wait-progress").progressbar('option','max',max_steps);
  $("#dlg-wait-progress").progressbar('value',unk ? false : 0);
  $("#dialog-wait").dialog('option','title',title || 'Please wait');
  $("#dialog-wait").dialog('open');
}

WaitDlg.prototype= {
  Step: function(v)
  {
    $("#dlg-wait-progress").progressbar('value',v);
    this.cur_step=v;
  },

  Inc: function() {this.Step(this.cur_step+1);},

  Done: function()
  {
    $("#dialog-wait").dialog('close');
  },

  SetMax: function(max)
  {
    $("#dlg-wait-progress").progressbar('option','max',max);
    $("#dlg-wait-progress").progressbar('value',0);
  }
};

$("#dlg-wait-progress").progressbar();
$("#dialog-wait").dialog({
   width:    300,
   height:   100,
   autoOpen: false,
   modal:    true,
   dialogClass: "no-close",
   closeOnEscape: false
});
