/*!
 * jQuery tableSelect plugin 1.3.0
 *
 * Copyright (c) 2010, 2014 Kjel Delaey
 * Released under the MIT license
 * https://raw.github.com/trimentor/jquery-tableSelect/master/LICENSE

 Added keyboard support by xvr @ 22.07.2016
*/

(function($) {
    $.extend($.fn, {
        tableSelect: function(options) {
            tableSelector = new $.tableSelector(options, this)
            return tableSelector;
        }
    });

    $.extend($.fn, {
        tableSelectOne: function(options) {
            var options   = $.extend({multiSelect: false}, options);
            tableSelector = new $.tableSelector(options, this)
            return tableSelector;
        }
    });

    $.extend($.fn, {
        tableSelectMany: function(options) {
            var options   = $.extend({multiSelect: true}, options);
            tableSelector = new $.tableSelector(options, this)
            return tableSelector;
        }
    });

    $.tableSelector = function(options, table) {
        this.options      = $.extend({}, $.tableSelector.defaults, options);
        this.currentTable = table;
        this.init();
    };

    $.extend($.tableSelector, {
        defaults: {
            tableClass:     "tableselect",
            rowSelectClass: "highlight-row",
            multiSelect:    false
        },

        prototype: {
            init: function() {
                this.selections = [];
                this.listeners  = this.options.listeners || {};
                this.collectRows();
                this.initRowEvents();

                $(this.currentTable).addClass(this.options.tableClass);
                if (!this.options.multiSelect) $(this.currentTable).keypress($.proxy(this.handleKeyPress,this));
            },

            allSelected: function() {
                return (this.selections.length == this.rows.length);
            },

            getSelections: function() {
                return this.selections;
            },

            getFocusedRow: function() {
                return this.rows[this.lastActiveRow];
            },

            getFocusedRowIndex: function() {
                return this.lastActiveRow;
            },

            isSelected: function(row) {
                var bool = false
                for(var i=0; i<this.selections.length; i++) {
                    if(this.selections[i] == row) {
                        bool = true;
                        break;
                    }
                }
                return bool;
            },

            collectRows: function() {
                var table = this;
                this.rows = this.currentTable[0].tBodies[0].rows;
                $(this.rows).each(function() {
                    this.parentThis = table;
                });
            },

            initRowEvents: function() {
                var table = this;
                $(this.rows).each(function() {
                    $(this).bind('click', table.handleMouseDown);
                    $(this).bind('rowselect', table.rowSelectClass);
                    $(this).bind('rowdeselect', table.rowSelectClass);
                    table.initListeners(table, this);
                });
            },
            
            initListeners: function(table, row) {             
                if(table.listeners) {
                    var listeners = table.listeners;
                    if(listeners.beforerowselect)   $(row).bind('beforerowselect',   listeners.beforerowselect);
                    if(listeners.afterrowselect)    $(row).bind('afterrowselect',    listeners.afterrowselect);
                    if(listeners.beforerowdeselect) $(row).bind('beforerowdeselect', listeners.beforerowdeselect);
                    if(listeners.afterrowdeselect)  $(row).bind('afterrowdeselect',  listeners.afterrowdeselect);
                }
            },

            handleMouseDown: function(event) {              
                var table = this.parentThis;
                table.storeEventTarget(event, this);
                
                if(table.options.multiSelect) {
                    table.handleKeyDown(event, this);
                }
                else {
                    table.handleSingleSelect(this);
                }

                table.resetEventTarget(this);
            },

            handleKeyPress: function(event) {
              var sel_idx = this.lastActiveRow || 0;
              var max_sel = this.rows.length-1;
              switch(event.originalEvent.key)
              {
                case 'ArrowUp': case 'PageUp': case 'ArrowLeft':       if (sel_idx) -- sel_idx; break;
                case 'ArrowDown': case 'PageDown': case 'ArrowRight':  if (sel_idx+1<=max_sel) ++ sel_idx; break;
                case 'Home': sel_idx=0; break;
                case 'End':  sel_idx=max_sel; break;
                default: return;
              }
              this.selectRow(sel_idx,false);
              event.preventDefault();
            },

            handleKeyDown: function(event, row) {
                var rowIndex = row.sectionRowIndex;

                if(event.shiftKey) {
                    if(typeof(this.lastActiveRow) == "undefined") this.focusRow(rowIndex);
                    this.lockedRow = this.lastActiveRow;
                    if(event.ctrlKey) {
                        this.selectRange(this.lastActiveRow, rowIndex, true);
                    }
                    else {
                        this.selectRange(this.lockedRow, rowIndex, false);
                        this.focusRow(this.lockedRow);
                    }
                }
                else {
                    this.handleSingleSelect(row);
                }
            },
            
            storeEventTarget: function(event, row) {
                var target = event.target && event.target.nodeName;
                row.target = target ? target.toLowerCase() : null;
            },

            resetEventTarget: function(row) {
                row.target = undefined;
            },

            handleSingleSelect: function(row) {
                var rowIndex = row.sectionRowIndex;

                if(this.isSelected(row)) {
                    this.deselectRow(rowIndex);
                }
                else {
                    this.selectRow(rowIndex, this.options.multiSelect);
                }
            },

            selectRow: function(rowIndex, keepSelections) {
                var row = this.rows[rowIndex];

                if(keepSelections == false) this.clearSelections();
                if(row && this.isSelected(row) == false && $(row).trigger('beforerowselect') !== false) {
                    if(row.preventChange !== true) {
                        this.selections.push(row);
                        this.focusRow(rowIndex);
                        $(row).trigger('rowselect',this);
                        $(row).trigger('afterrowselect', this);
                        $(document).trigger('rowchange', this);
                    }
                    row.preventChange = undefined;
                }
            },

            deselectRow: function(rowIndex) {
                var row = this.rows[rowIndex];

                if(row && this.isSelected(row) && $(row).trigger('beforerowdeselect',this) !== false) {
                    if(row.preventChange !== true) {
                        var index = $.inArray(row, this.selections);
                        if(-1 != index) {
                            this.selections.splice(index, 1);
                            this.focusRow(rowIndex);
                            $(row).trigger('rowdeselect',this);
                            $(row).trigger('afterrowdeselect',this);
                            $(document).trigger('rowchange', this);
                        }
                    }
                    row.preventChange = undefined;
                }
            },

            focusRow: function(rowIndex) {
                this.lastActiveRow = rowIndex;
            },

            rowSelectClass: function(event) {
                switch(event.type) {
                    case 'rowselect':
                        $(this).addClass(this.parentThis.options.rowSelectClass);
                        break;
                    case 'rowdeselect':
                        $(this).removeClass(this.parentThis.options.rowSelectClass);
                        break;
                    default: break;
                }
            },

            selectAll: function() {
                if(this.options.multiSelect) {
                    this.clearSelections();
                    $(this.rows).each(function() {
                        this.parentThis.selectRow(this.sectionRowIndex, true);
                    });
                }
            },

            clearSelections: function() {
                $(this.rows).each(function() {
                    this.parentThis.deselectRow(this.sectionRowIndex);
                });
            },

            selectRange: function(startIndex, endIndex, keepSelections) {
                if(keepSelections == false) this.clearSelections();
                if(startIndex <= endIndex) {
                    for(var i=startIndex; i<=endIndex; i++) {
                        this.selectRow(i, true);
                    }
                }
                else {
                    for(var i=startIndex; i>=endIndex; i--) {
                        this.selectRow(i, true);
                    }
                }
            }
        }
    });
})(jQuery);
