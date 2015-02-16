
steal(
        // List your Controller's dependencies here:
        'appdev',
        'opstools/FCFActivities/models/TeamActivity.js',
        'opstools/FCFActivities/models/TeamObjective.js',
        'opstools/FCFActivities/controllers/FilteredElements.js',
//        'opstools/FCFActivities/models/Projects.js',
//        'appdev/widgets/ad_delete_ios/ad_delete_ios.js',
        // '//opstools/FCFActivities/views/AddChooseActivity/AddChooseActivity.ejs',
function(){

    // Namespacing conventions:
    // AD.Control.extend('[application].[controller]', [{ static },] {instance} );
    AD.Control.extend('opstools.FCFActivities.AddChooseActivity', {  


        CONST: {
            NEXT: 'activity.selected',
            PREV: 'activity.previous'
        },

        init: function (element, options) {
            var self = this;
            options = AD.defaults({
//                    templateDOM: '//opstools/FCFActivities/views/AddChooseActivity/AddChooseActivity.ejs'
            }, options);
            this.options = options;

            // Call parent init
            this._super(element, options);


            this.selectedTeam = null;   // which team are we displaying results for?


            this.element.hide();

            this.initDOM();

            
            // listen for any FCF Assignment updates  and refresh our list  
            AD.comm.socket.subscribe('fcf_activity_new_external', function(key, data) {

                if (self.selectedTeam) {
                    if (self.selectedTeam.getID() == data.team) {

                        // this matches the list of activities we are currently viewing
                        var Model = AD.Model.get('opstools.FCFActivities.TeamActivity');
                        var newActivity =  new Model(data.activity);

                        self.listActivities.push(newActivity);
                    }
                }   
            })

            

        },



        /**
         *  @function initDom
         *
         *  This method attaches this controller to the relevant DOM objects, 
         *  and creates any templates it needs.
         *
         *  This method clears off any unnecessary DOM objects from the 
         *  template, but does not update the display with any live data.
         *  (see loadData() for that)
         */
        initDOM: function () {
            var self = this;

//            this.element.html(can.view(this.options.templateDOM, {} ));

            ////
            //// Create our table entry Template
            ////

            // pull the row template from the current table
            var rowTemplate = this.domToString( this.element.find('.template') ).replace("template", "");

            rowTemplate = AD.util.string.replaceAll(rowTemplate, '[[=', '<%= ');
            rowTemplate = AD.util.string.replaceAll(rowTemplate, ']]', '%>');

            // make sure the model instance gets returned for this <tr> element:
            // oh, and insert the IDMinistry as data-team-id attrib to the <tr> element
            rowTemplate = rowTemplate.replace('addata=""', '<%= (el) -> can.data(el, "activity", activity) %>  data-activity-id="<%= activity.attr(\'id\') %>"')

            // remove the existing <tr> in the table
            this.element.find('.fcf-activity-list tbody:last tr').remove();

            // now create the list template
            var templateString = [
                '<% activities.each(function(activity) { %>',
                rowTemplate,
                '<% }) %>'
            ].join('\n');

            // register template as :  'FCFActivities_AddChooseActivity'
            //  NOTE:  DON'T USE '.' as seperators here!!!  -> can.ejs thinks they are file names then... doh!
            can.view.ejs('FCFActivities_AddChooseActivity', templateString);



            ////
            //// Create our Objective entry Template
            ////
            var objectiveRow = this.domToString(this.element.find('.template-objectives')).replace("template-objectives", "");
            objectiveRow = AD.util.string.replaceAll(objectiveRow, '[[=', '<%= ');
            objectiveRow = AD.util.string.replaceAll(objectiveRow, ']]', '%>');

            // remove checkbox rows
            this.element.find('#fcf-modal-new-Activity .checkbox').remove();

            var objectivesTemplate = [
                '<% objectives.each(function(objective) { %>',
                objectiveRow,
                '<% }) %>'
            ].join('\n');

            can.view.ejs('FCFActivities_AddObjectives', objectivesTemplate);



            ////
            //// Attach to DOM elements
            ////

            // Ministry Title:
            this.titleMinistry = this.element.find('.fcf-activity-add-chooseActivity-teamName');


            // attach to the <table>
            this.tableTeamActivities = this.element.find('.fcf-activity-list');


            // attach to the [Next] button && disable it
            this.buttons = {};
            this.buttons.next = this.element.find('#fcf-activity-add-chooseAssignment-next');
            this.buttons.next.attr('disabled', 'disabled');
            this.buttons.next.addClass('disabled');


            // attach the FilteredElements Controller
            var Filter = AD.Control.get('opstools.FCFActivities.FilteredElements');
            this.Filter = new Filter(this.element, {
                tagFilter: '.fcf-activity-filter',
                tagEl: '.fcf-activity-list tbody:last tr',
classSelected:'el-selected',
                elSelected:function(el) {
                    if (el) {
                        self.selectRow(el);
                        self.buttons.next.click();
                    }
                },
                elToTerm: function(el) {  
                    var activity = el.data('activity');
                    if (activity) {
                        return activity.activityName+', '+ activity.createdBy;
                    } else {
                        console.error(' Ministry Activity Row not setup properly.');
                        return '';
                    }
                }
            });



            //// Add Activity Modal:
            this.modalAdd = this.element.find("#fcf-modal-new-Activity");

            var calendarOptions = {
                format: "mm/dd/yyyy",
                startDate: "01/01/1970"
            };
            this.modalAdd.find('#dateStart').datepicker(calendarOptions);
            this.modalAdd.find('#dateEnd').datepicker(calendarOptions);


        },


        loadData:function( team ) {
            var self = this;

            this.selectedTeam = team;

            // update our Team Title:
            this.titleMinistry.text(team.attr('MinistryDisplayName'));


            var modelTeamActivity = AD.Model.get('opstools.FCFActivities.TeamActivity');

            this.listActivities = null;
            // this.searchTerms = [];  // 'searchable text'
            // this.searchHash = {};   // term : $tr of matching row

            modelTeamActivity.findAll({team:team.getID()})
            .fail(function(err) {
                console.log(err);
            })
            .then(function(list){

                self.listActivities = list;

                self.element.find('.fcf-activity-list > tbody:last tr').remove();

                self.element.find('.fcf-activity-list > tbody:last').append(can.view('FCFActivities_AddChooseActivity', {activities:list}));

                // tell our Filter to scan the DOM and initialize
                self.Filter.refresh();

            });


            var modelTeamObjective = AD.Model.get('opstools.FCFActivities.TeamObjective');
            modelTeamObjective.findAll({team:team.getID()})
            .fail(function(err) { 
                console.log(err);
            })
            .then(function(list){
                self.modalAdd.find('.objectives-section .checkbox').remove();

                self.modalAdd.find('.objectives-section').append(can.view('FCFActivities_AddObjectives', {objectives:list}));
            })


        },


        selectRow:function($row) {

            this.tableTeamActivities.find('.selected').removeClass('selected');

            if ($row) {
                $row.addClass('selected');

                // once a Row is selected, we can
                // enable the [Next] button
                this.buttons.next.removeAttr('disabled');
                this.buttons.next.removeClass('disabled');
            } else {

                // if nothing is selected, then disable the next button
                this.buttons.next.attr('disabled', 'disabled');
                this.buttons.next.addClass('disabled');
            }
        },


        // return the value (IDMinistry) of the team selected by this page
        value: function() {

            var selectedModel = this.tableTeamActivities.find('.selected').data('activity');
            if (selectedModel) {
                return selectedModel;
            } else {
                return null;
            }
        },


        // when an entry is clicked on, mark it as selected.
        '.fcf-activity-list tbody tr click': function($el, ev) {

            this.selectRow($el);

            ev.preventDefault();
        },


        // when the [Next] button is clicked, then trigger our event:
        '#fcf-activity-add-chooseAssignment-next click': function($el, ev) {
            this.element.trigger(this.CONST.NEXT);
        },


        // when the [Previous] button is clicked, then trigger our event:
        '#fcf-activity-add-chooseAssignment-previous click': function($el, ev) {
            this.element.trigger(this.CONST.PREV);
        },




        '[name="name"] input':function($el, ev) {

            if ($el.val() == '') {
                $el.parent().removeClass('has-success').addClass('has-error');
            } else {
                $el.parent().removeClass('has-error').addClass('has-success');
            }
        },


        '[name="description"] input':function($el, ev) {

            if ($el.val() == '') {
                $el.parent().removeClass('has-success').addClass('has-error');
            } else {
                $el.parent().removeClass('has-error').addClass('has-success');
            }
        },





        // when the [Add Assignment] button is clicked, then trigger our event:
        '#add-assignment click': function($el, ev) {
            var self = this;
            var values = this.modalAdd.find(':input').serializeArray();
            var obj = {};
            obj.objective = [];

            values.forEach(function(val){
                if (val.name != 'objective'){
                    obj[val.name] = val.value;
                } else {
                    obj.objective.push(val.value);
                }
                
            })

            obj.team = this.selectedTeam.getID();

// console.log('form values : ', obj);

            // these fields are required:
            var validation = {
                name:['required'],
                description:['required'],
                objective:['required'],
                startDate:['required'],
                endDate:[{'>=':'startDate'}]
            }

            var isValid = true;

            // verify name:
            if ( (!obj.name)
                 || (obj.name == '')) {
                isValid = false;
            }

            

            var Model = AD.Model.get('opstools.FCFActivities.TeamActivity');
            
            Model.create(obj)
            .fail(function(err){
                console.error(err);
            })
            .then(function(data){
                data = data.data || data;

                console.log('returned Activity:', data);

                var model = new Model(data);

                self.listActivities.push(model);
                self.modalAdd.find(':input:not(:checkbox)').val('');
                self.modalAdd.find(':checkbox').prop('checked', false);
                self.modalAdd.modal('hide');
            })

        }


    });


});