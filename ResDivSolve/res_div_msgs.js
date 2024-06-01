var Messages = {
  ENG: {
    dlg_msg_0: 
      "No value assigned for this component. Solver also can't derive component value. You should change Mode to 'Base' to assign some value. "+
      "Or you can assign value to some other component to derive value of this component.",
    dlg_msg_1:
      "Primary value assigned to this component. All other components value will be derived from this one.",
    dlg_msg_2:
      "Value will be derived from 'Derived' but some restriction to possible values will be applied. System will reject solutions with restriction violated",
    dlg_msg_3:
      "Value for this component automatically derived by Solver from another component. If you want to change these values you need move some other component into 'Undefined' state, "+
      "so value of this component no longer will be derived and became 'Undefined' too. So you will be able to move to 'Base' state and assign value.",
    
    tpl_var_Vin:  'Input voltage',
    tpl_var_Rsrc: 'Internal resistance of input voltage source',
    tpl_var_R1:   'Resistance of upper part of divider',
    'tpl_var_R1.1': 'Partial resistance of upper part of divider',
    'tpl_var_R1.2': 'Partial resistance of upper part of divider',
    'tpl_var_R1.3': 'Partial resistance of upper part of divider',
    tpl_var_R2:   'Resistance of lower part of divider',
    'tpl_var_R2.1':   'Partial resistance of lower part of divider',
    'tpl_var_R2.2':   'Partial resistance of lower part of divider',
    'tpl_var_R2.3':   'Partial resistance of lower part of divider',
    tpl_var_Rdst: 'Internal resistance of signal load',
    tpl_var_K:    'Divider coefficient',
    tpl_var_Vout: 'Output voltage',
    tpl_var_Rin:  'Effective input resistance of divider',
    tpl_var_Rout: 'Effective output resistance of divider',
    tpl_var_Isrc: 'Input current flown into divider',
    tpl_var_Idst: 'Output load current',
    tpl_var_Vsrc_drop:  'Voltage drop on internal resistance of signal source',
    tpl_var_Vdiv: 'Effective voltage on divider input',
    tpl_var_Vr1:  'Voltage over R1 of divider',
    'tpl_var_V1.1': 'Voltage drop on one of upper part of R1',
    'tpl_var_V1.2': 'Voltage drop on one of upper part of R1',
    'tpl_var_V1.3': 'Voltage drop on one of upper part of R1',
    'tpl_var_V2.1': 'Voltage drop on one of upper part of R2',
    'tpl_var_V2.2': 'Voltage drop on one of upper part of R2',
    'tpl_var_V2.3': 'Voltage drop on one of upper part of R2',
    'tpl_var_I1.1':   'Current flown through one of resistance of upper part of divider',
    'tpl_var_I1.2':   'Current flown through one of resistance of upper part of divider',
    'tpl_var_I1.3':   'Current flown through one of resistance of upper part of divider',
    tpl_var_I2:   'Current flown through R2 of divider',
    'tpl_var_I2.1':   'Current flown through one of resistance of lower part of divider',
    'tpl_var_I2.2':   'Current flown through one of resistance of lower part of divider',
    'tpl_var_I2.3':   'Current flown through one of resistance of lower part of divider',
    tpl_var_P1:   'Power dissipation in R1 of divider',
    'tpl_var_P1.1':  'Power dissipation in R1.1 of divider',
    'tpl_var_P1.2':  'Power dissipation in R1.2 of divider',
    'tpl_var_P1.3':  'Power dissipation in R1.3 of divider',
    tpl_var_P2:   'Power dissipation in R2 of divider',
    'tpl_var_P2.1':   'Power dissipation in R2.1 of divider',
    'tpl_var_P2.2':   'Power dissipation in R2.2 of divider',
    'tpl_var_P2.3':   'Power dissipation in R2.3 of divider',
    tpl_var_Psrc: 'Power dissipation in signal source',
    tpl_var_Pdst: 'Power dissipation in signal load',
    tpl_var_Pdiv: 'Total power dissipation in divider'
  },

  RUS: {
  }
};

function  get_msg(id) {return Messages.ENG[id] || id;}
