
steal(
        // List your Controller's dependencies here:
        'appdev',
        // 'opstools/FCFActivities/models/TeamActivity.js',
        // 'opstools/FCFActivities/models/TeamObjective.js',
        'opstools/FCFActivities/controllers/FilteredElements.js',
        'opstools/FCFActivities/models/ActivityImage.js',

        'dropzone.js',
        'dropzone.css',
        'select3.js',
        'select3.css',
//        'appdev/widgets/ad_delete_ios/ad_delete_ios.js',
        // '//opstools/FCFActivities/views/ActivityReport/ActivityReport.ejs',
function(){



    // ActivityReport Controller
    //
    // This controller performs the main work of the adding an image to an 
    // activity.
    // 
    // It displays a list of activities for a given ministry team
    //  - activities whose endDate is null or within the past 90 days
    // 
    // It displays a list of images submitted for the currently selected
    // activity:
    //
    // It has a form for adding/ uploading a new image for an activity.
    //
    //  
    // For Actual Tagging:  http://goodies.pixabay.com/jquery/tag-editor/demo.html
    //




    // Namespacing conventions:
    // AD.Control.extend('[application].[controller]', [{ static },] {instance} );
    AD.Control.extend('opstools.FCFActivities.ActivityReport', {  


        CONST: {
            NEXT: 'activity_report.confirm',
            PREV: 'activity_report.previous',
            tags:{
                '.fcf-activity-team-name':'title string',
                '.fcf-activity-report-activities' : 'container for Activities',
                '.fcf-activity-activity-name': 'activity name container',
                '.fcf-activity-activity-project-name': 'activity -> project name',
                '.fcf-activity-activity-team-name': 'activity -> team name',
                '.fcf-activity-report-activity-images': 'image list',

                '#fcf-activity-image-upload' : 'dropzone element/object ',
                '.fcf-activity-image-form':'the image form',
                '#image-image' : 'form element: image reference',
                '#image-caption': 'form input: image caption',
                '#image-date'  :  'form input: date ',
                '#image-tags'  :  'form input: tags of people',
                '.fcf-activities-people-objects': "form input: objects of people"
            }
        },

        init: function (element, options) {
            var self = this;
            options = AD.defaults({
//                    templateDOM: '//opstools/FCFActivities/views/ActivityReport/ActivityReport.ejs'
            }, options);
            this.options = options;

            // Call parent init
            this._super(element, options);


            this.selectedTeam = null;       // which team are we displaying results for?
            this.selectedActivity = null;   // which Activity are we displaying details for?

            this.listActivities = null;     // the list of all Activities From the selectedTeam
            this.listImages = null;         // the list of all images related to the selectedActivity

            this.listTeammates = [];

            this.dom = {};                  // collects our references to the DOM objects
            this.obj = {};                  // collections of objects that are not DOM references (Dropzone)

            this.element.hide();

            this.initDOM();

            
            // // listen for any FCF Assignment updates  and refresh our list  
            // AD.comm.socket.subscribe('fcf_activity_new_external', function(key, data) {

            //     if (self.selectedTeam) {
            //         if (self.selectedTeam.getID() == data.team) {

            //             // this matches the list of activities we are currently viewing
            //             var Model = AD.Model.get('opstools.FCFActivities.TeamActivity');
            //             var newActivity =  new Model(data.activity);

            //             self.listActivities.push(newActivity);
            //         }
            //     }   
            // })

            

        },



        addActivity: function(activity) {

        },



        clearImageList: function() {
            this.element.find('.fcf-activity-report-activity-images').children().remove();
        },



        clearForm:function(){

            this.dom.dropzone.find('.dz-message').show();
            this.dom.dropzone.find('img').prop('src', '').hide();


            this.dom.inputImage.val('');
            this.dom.inputCaption.val('');
            this.dom.inputDate.val('');
            this.dom.inputTags.select3('value', []);
            this.dom.peopleObjects.find('div.fcf-activity-people-objects').show();
        },


        loadForm:function(image) {
            var self = this;
console.log('... loading Form with image:',image.getID())
            // this.clearForm();

            this.dom.dropzone.find('.dz-message').hide();
            this.dom.dropzone.find('img').prop('src', image.image).show();

            this.dom.inputImage.val(image.image);
            this.dom.inputCaption.val(image.caption);
            this.dom.inputDate.val(image.date);

            this.dom.inputTags.select3('value', []);
            this.dom.peopleObjects.find('div.fcf-activity-people-objects').show();

            image.taggedPeople.forEach(function(personID){
                self.dom.peopleObjects.find('[data-person-id="'+personID+'"]').click();
            });


            this.dom.inputActivity.val( this.selectedActivity.getID() );

        },


        formSubmit: function() {

            var values = this.dom.imageForm.serializeArray();
            var valuesObj = {};
            values.forEach(function(val){
                valuesObj[val.name] = val.value;
            });

            valuesObj.taggedPeople = [];
            var listTags = this.dom.inputTags.select3('data');

console.log('listTags:', listTags);
            listTags.forEach(function(tag) {
                valuesObj.taggedPeople.push( tag.id );
            })

            // if formValidate() is ok
            if (this.formValidate(valuesObj)) {

                var ActivityImage = AD.Model.get('opstools.FCFActivities.ActivityImage');

                ActivityImage.create(valuesObj)
                .fail(function(err){
                    console.error(err);
                })
                .then(function(obj){

                    self.clearForm();

                })
console.log('values:', valuesObj);





            } else {
console.log('... can\'t save the image yet.');
            }
        },

        formValidate: function( values ) {

return true;

            // image needs to be set:
            if (values.image == '') { 
console.log('... upload an image');
                return false;
            }

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

            ////
            //// Create our Activity List Template
            ////

//             // pull the row template from the current table
//             var rowTemplate = this.domToString( this.element.find('.fcf-activity-report-activities  .template') ).replace("template", "");

//             rowTemplate = AD.util.string.replaceAll(rowTemplate, '[[=', '<%= ');
//             rowTemplate = AD.util.string.replaceAll(rowTemplate, ']]', '%>');

//             // make sure the model instance gets returned for this <tr> element:
//             // oh, and insert the IDMinistry as data-team-id attrib to the <tr> element
//             rowTemplate = rowTemplate.replace('activity-id', '<%= (el) -> can.data(el, "activity", activity) %>  activity-id')

//             rowTemplate = rowTemplate.replace('src=""', 'src="<%= activity.attr(\'imageURL\') %>"');

//             // remove the existing <div> in the list
//             this.element.find('.fcf-activity-report-activities a.list-group-item').remove();

//             // now create the list template
//             var templateString = [
//                 '<% activities.each(function(activity) { %>',
//                 rowTemplate,
//                 '<% }) %>'
//             ].join('\n');
// console.warn(templateString);

            // register template as :  'FCFActivities_ActivityReport_ActivityList'
            //  NOTE:  DON'T USE '.' as seperators here!!!  -> can.ejs thinks they are file names then... doh!
            var activityListTemplate =  this.domToTemplate(this.element.find('.fcf-activity-report-activities'));
            activityListTemplate = AD.util.string.replaceAll(activityListTemplate, 'src="images/fcf_activities/img1.jpg"', 'src="<%= activity.attr("imageURL") %>"');
            activityListTemplate = AD.util.string.replaceAll(activityListTemplate, 'images/fcf_activities/tag.jpg', '/images/fcf_activities/tag.jpg');
            can.view.ejs('FCFActivities_ActivityReport_ActivityList', activityListTemplate);




            ////
            //// Create our Image List Template
            ////

            // pull the row template from the current table
//             rowTemplate = this.domToString( this.element.find('.fcf-activity-report-activity-images  .template') ).replace("template", "");

//             rowTemplate = AD.util.string.replaceAll(rowTemplate, '<!--', '<%');
//             rowTemplate = AD.util.string.replaceAll(rowTemplate, '-->', '%>');
//             rowTemplate = AD.util.string.replaceAll(rowTemplate, '[[=', '<%= ');
//             rowTemplate = AD.util.string.replaceAll(rowTemplate, ']]', '%>');

//             // make sure the model instance gets returned for this <tr> element:
//             // oh, and insert the IDMinistry as data-team-id attrib to the <tr> element
//             rowTemplate = rowTemplate.replace('image-id', '<%= (el) -> can.data(el, "image", image) %>  image-id')

//             rowTemplate = rowTemplate.replace('src=""', 'src="<%= image.attr(\'image\') %>"');

//             // remove the existing <a> in the list (but NOT the addImage row)
//             this.clearImageList();
//             // this.element.find('.fcf-activity-report-activity-images a.list-group-item:not(.addImage)').remove();

//             // now create the list template
//             var templateString = [
//                 '<% images.each(function(image) { %>',
//                 rowTemplate,
//                 '<% }) %>'
//             ].join('\n');
// // console.warn(templateString);

            // register template as :  'FCFActivities_ActivityReport_ImageList'
            //  NOTE:  DON'T USE '.' as seperators here!!!  -> can.ejs thinks they are file names then... doh!
            var imageListTemplate =  this.domToTemplate(this.element.find('.fcf-activity-report-activity-images'));
            imageListTemplate = AD.util.string.replaceAll(imageListTemplate, 'src="images/fcf_activities/img2.jpg"', 'src="<%= image.attr(\'image\') %>"');
            can.view.ejs('FCFActivities_ActivityReport_ImageList', imageListTemplate);

//             ////
//             //// Create our Objective entry Template
//             ////
//             var objectiveRow = this.domToString(this.element.find('.template-objectives')).replace("template-objectives", "");
//             objectiveRow = AD.util.string.replaceAll(objectiveRow, '[[=', '<%= ');
//             objectiveRow = AD.util.string.replaceAll(objectiveRow, ']]', '%>');

//             // remove checkbox rows
//             this.element.find('#fcf-modal-new-Activity .checkbox').remove();

//             var objectivesTemplate = [
//                 '<% objectives.each(function(objective) { %>',
//                 objectiveRow,
//                 '<% }) %>'
//             ].join('\n');

//             can.view.ejs('FCFActivities_AddObjectives', objectivesTemplate);


            var template = this.domToTemplate(this.element.find('.fcf-activitiy-people-list'));
            template = AD.util.string.replaceAll(template, 'src=""', 'src="<%= person.attr(\'avatar\') %>"');
            template = AD.util.string.replaceAll(template, '[INSERT_TR]', ['%>', '</tr>', '<tr>', '<% \n' ].join('\n'))
            can.view.ejs('FCFActivities_ActivityReport_PersonList', template);



            ////
            //// Attach to DOM elements
            ////

            // Activity List Column:
            this.dom.titleTeam = this.element.find('.fcf-activity-team-name');
            this.dom.listActivities = this.element.find('.fcf-activity-report-activities');
            this.dom.listActivities.children().remove();
            this.dom.listActivities.css("height",  "600px");


            // Image List Column:
            this.dom.titleActivity = this.element.find('.fcf-activity-activity-name');
            this.dom.titleActivityProject = this.element.find('.fcf-activity-activity-project-name');
            this.dom.titleActivityTeam    = this.element.find('.fcf-activity-activity-team-name');
            this.dom.listImages           = this.element.find('.fcf-activity-report-activity-images');
            this.dom.listImages.children().remove();
            this.dom.listImages.css('height', "400px");

            // Image Form
            this.dom.dropzone = this.element.find('#fcf-activity-image-upload');
            this.obj.dropzone = new Dropzone('#fcf-activity-image-upload', {
                url:'/fcf_activities/activityimageupload',
                paramName:'imageFile',      // param name on server
                maxFilesize:100,            // in MB
                uploadMultiple: false,      // upload >1 file per request?
                acceptedFiles:'.jpg, .jpeg, .psd, .gif, .png'
            })
            this.obj.dropzone.on('success', function(file, response) {

                console.log('response:', response);

                self.obj.dropzone.removeFile(file);
                self.dom.dropzone.find('.dz-message').hide();
                self.dom.dropzone.find('img').prop('src', response.data.path ).show();
                self.dom.inputImage.val(response.data.name);

            })
            this.dom.dropzone.find('img').prop('src', '' ).hide();


            
            this.dom.imageForm = this.element.find('.fcf-activity-image-form');

            this.dom.inputImage = this.dom.imageForm.find('#image-image');
            this.dom.inputActivity = this.dom.imageForm.find('#image-activity');
            this.dom.inputCaption = this.dom.imageForm.find('#image-caption');
            this.dom.inputDate  = this.dom.imageForm.find('#image-date');
            this.dom.inputTags  = this.dom.imageForm.find('#image-tags');
            this.dom.peopleObjects = this.dom.imageForm.find('.fcf-activitiy-people-objects');
            this.dom.peopleObjects.css('height', '200px');

            var calendarOptions = {
                format: "mm/dd/yyyy",
                startDate: "01/01/1970"
            };
            this.dom.inputDate.datepicker(calendarOptions);


            var labelKey = this.dom.inputTags.prop('app-label-key') || 'fcf.activity.image.form.tags';
            var label = AD.lang.label.getLabel(labelKey);
            if (!label) {
                console.warn('labelKey:'+ labelKey + ' :: no label returned.');
                label = '*people in photo';
            }
            this.dom.inputTags.select3({
                items: [ {id:0, text:'no items loaded' }],
                multiple: true,
                placeholder:label
            });
            this.dom.inputTags.on('change', function(obj, a, b) {
                self.personSelected(obj);
            })


            // var emptyList = new can.List([]);
            // this.dom.peopleObjects.html( can.view('FCFActivities_ActivityReport_PersonList', { people:emptyList } ));
            this.dom.peopleObjects.children().remove();


            // this.obj.dropzone.on("complete", function(file) {
            //     console.log(file);
                
            // });

//             // attach to the <table>
//             this.tableTeamActivities = this.element.find('.fcf-activity-list');


//             // attach to the [Next] button && disable it
//             this.buttons = {};
//             this.buttons.next = this.element.find('#fcf-activity-add-chooseAssignment-next');
//             this.buttons.next.attr('disabled', 'disabled');
//             this.buttons.next.addClass('disabled');


//             // attach the FilteredElements Controller
//             var Filter = AD.Control.get('opstools.FCFActivities.FilteredElements');
//             this.Filter = new Filter(this.element, {
//                 tagFilter: '.fcf-activity-filter',
//                 tagEl: '.fcf-activity-list tbody:last tr',
// classSelected:'el-selected',
//                 elSelected:function(el) {
//                     if (el) {
//                         self.selectRow(el);
//                         self.buttons.next.click();
//                     }
//                 },
//                 elToTerm: function(el) {  
//                     var activity = el.data('activity');
//                     if (activity) {
//                         return activity.activityName+', '+ activity.createdBy;
//                     } else {
//                         console.error(' Ministry Activity Row not setup properly.');
//                         return '';
//                     }
//                 }
//             });



//             //// Add Activity Modal:
//             this.modalAdd = this.element.find("#fcf-modal-new-Activity");

//             var calendarOptions = {
//                 format: "mm/dd/yyyy",
//                 startDate: "01/01/1970"
//             };
//             this.modalAdd.find('#dateStart').datepicker(calendarOptions);
//             this.modalAdd.find('#dateEnd').datepicker(calendarOptions);


        },

        setTeam: function(team) {
            var self = this;

            this.selectedTeam = team;

            // request the people associated with this team:
            AD.comm.service.get({url:'/fcf_activities/teammembers', params:{ teamID: team.getID() }})
            .fail(function(err){
                console.error('problem looking up teammembers: teamID:'+team.getID());
            })
            .then(function(res){
                var data = [];
                var list = res.data || res;
                list.forEach(function(person){

                    data.push({ 
                        id: person.IDPerson,
                        text: person.display_name
                    });
                })

                // // remove the previous entries
                // self.listTeammates.forEach(function(entry){
                //     self.dom.inputTags.select3('remove', entry);
                // })

                // update our list of teammates to this set
                self.listTeammates = new can.List(list);

                self.dom.inputTags.select3({
                    items: data,
                    multiple: true,
                    placeholder: 'people in photo'
                });

                self.dom.peopleObjects.children().remove();
                self.dom.peopleObjects.append( can.view('FCFActivities_ActivityReport_PersonList', { people:self.listTeammates } ));
            })
        },


        loadData:function( activity ) {
            var self = this;

            this.selectedActivity = activity;

            var isTeamOK = false;

            // load the team:
            AD.util.async.series([


                // make sure we have a valid team selected
                function(next) {

                    if (self.selectedTeam) {

                        if (activity.team == self.selectedTeam.getID()) {

                            isTeamOK = true;
                        }
                        
                    } 
                    next();
                },

                // if teamSelected !ok then lookup team:
                function(next) {

                    if (isTeamOK) {
                        next();
                    } else {


                        var modelUserTeam = AD.Model.get('opstools.FCFActivities.UserTeam');

                        modelUserTeam.findAll()
                        .fail(function(err) {
                            next(err);
                        })
                        .then(function(list){

                            list.each(function(team){
                                if (team.getID() == activity.team) {
                                    self.selectedTeam = team;
                                }
                            })

                            if (self.selectedTeam.getID == activity.team) {
                                next();
                            } else {
                                var err = new Error('can\'t find proper team!');
                                next(err);
                            }

                        })

                    }
                },


                // lookup all activities for team
                function(next) {

                    var teamID = self.selectedTeam.getID();

                    AD.comm.service.get({url:'/fcfactivities/activityreport/activities', params:{ team:teamID }})
                    .fail(function(err){
                        next(err);
                    })
                    .then(function(list){
                        var listActivities = new can.List(list);
                        self.listActivities = listActivities;
                        next();
                    })

                },

                // attach Activities to template:
                function(next) {

                    self.dom.titleTeam.text(self.selectedTeam.attr('MinistryDisplayName'));

                    // remove existing activity <div>
                    self.dom.listActivities.find('div.fcf-activity-list-item').remove();
                    self.dom.listActivities.append(can.view('FCFActivities_ActivityReport_ActivityList', {activities: self.listActivities }));


                    // find the current Activity in the List and mark it selected:
                    self.selectActivity( activity );
                    self.updateImageList();
                }


            ], function(err, results){


            })


            // // update our Team Title:
            // this.titleMinistry.text(team.attr('MinistryDisplayName'));


            // var modelTeamActivity = AD.Model.get('opstools.FCFActivities.TeamActivity');

            // this.listActivities = null;
            // // this.searchTerms = [];  // 'searchable text'
            // // this.searchHash = {};   // term : $tr of matching row

            // modelTeamActivity.findAll({team:team.getID()})
            // .fail(function(err) {
            //     console.log(err);
            // })
            // .then(function(list){

            //     self.listActivities = list;

            //     self.element.find('.fcf-activity-list > tbody:last tr').remove();

            //     self.element.find('.fcf-activity-list > tbody:last').append(can.view('FCFActivities_ActivityReport', {activities:list}));

            //     // tell our Filter to scan the DOM and initialize
            //     self.Filter.refresh();

            // });


            // var modelTeamObjective = AD.Model.get('opstools.FCFActivities.TeamObjective');
            // modelTeamObjective.findAll({team:team.getID()})
            // .fail(function(err) { 
            //     console.log(err);
            // })
            // .then(function(list){
            //     self.modalAdd.find('.objectives-section .checkbox').remove();

            //     self.modalAdd.find('.objectives-section').append(can.view('FCFActivities_AddObjectives', {objectives:list}));
            // })


        },





        selectActivity: function( activity) {

            this.selectActivityRow(this.dom.listActivities.find('[activity-id="'+activity.getID()+'"]'));
        },


        selectActivityRow:function($row) {

            this.dom.listActivities.find('.active').removeClass('active');

            if ($row) {
                $row.addClass('active');
            } 
        },


        selectImageRow: function($row) {

            this.dom.listImages.find('.active').removeClass('active');
            if ($row) {
                $row.addClass('active');
            }
        },


        /**
         * @function personSelected
         *
         * called everytime the select3 widget is updated.
         *
         * NOTE: will be called when a personObj is clicked and select3 widget is
         * programatically updated.  However that method doesn't produce .added, 
         * .removed  properties to the opt parameter.
         *
         * @param {obj} opt  An options obj that describes the changes made:
         *              opt.added  = the { id:'X', text:'XXX' } entry that was added 
         *              opt.removed = the { id:'X', text:'XXX' } entry that was removed
         *
         */
        personSelected: function(opt) {

            // if a person was added:
            if (opt.added) {

                // find the related person in the PeopleObject list and hide them.
                this.dom.peopleObjects.find('[data-person-id="'+ opt.added.id + '"]').hide();

            } else if ( opt.removed ){
                this.dom.peopleObjects.find('[data-person-id="'+ opt.removed.id + '"]').show();
            }

        },


        // refresh the Activity Image list based upon the current selectedActivity
        updateImageList:  function() {
            var self = this;

// console.log('updating activity image list now ... ');
            // is our activity a proper Model? use .getID(), else use .id 
            var activityID = this.selectedActivity.getID ? this.selectedActivity.getID() : this.selectedActivity.id;

            var ActivityImage = AD.Model.get('opstools.FCFActivities.ActivityImage');
            ActivityImage.findAll({ activity: activityID })
            .fail(function(err){
                console.error(err);
            })
            .then(function(list){
                var list = list.data || list;
                console.log('ImageList:');
                console.log(list);


                self.clearImageList();
                self.dom.listImages.append( can.view('FCFActivities_ActivityReport_ImageList', {images:list, teammates:self.listTeammates}));

                self.selectImageRow( self.dom.listImages.find('.addImage'));
                self.clearForm();
            })


            this.dom.titleActivity.text(this.selectedActivity.activity_name);
            this.dom.titleActivityProject.text(this.selectedActivity.ProjectOwner);
            this.dom.titleActivityTeam.text(this.selectedActivity.team_name);

            // load the images for this activity  
                // @resource  FCFImages, ActivityImages
                // @findAll, @find, @create, @update, @destroy

        },





        // When a new activity is selected in the Activity List
        'div.fcf-activity-list-item  click': function($el, ev) {

            this.selectActivityRow($el);
            this.selectedActivity = $el.data('activity');
            this.updateImageList();
            ev.preventDefault();
        },




        // when they click on the [Add New Image] entry:
        'div.fcf-activity-image-list-item.addImage click' : function($el, ev) {

            this.selectImageRow($el);
            this.clearForm();

        },


        // when they click on any other Image in the list:
        'div.fcf-activity-image-list-item:not(.addImage) click': function($el, ev) {

            this.selectImageRow($el);
            this.loadForm($el.data('image'));
        },


        // when they click on a person to add them to a TAG:
        '.fcf-activity-people-objects click': function($el, ev) {

            $el.hide();

            var person = $el.data('person');

            var currList = this.dom.inputTags.select3('data');
            var currListHash = {};
            currList.forEach(function(curr){
                currListHash[curr.id] = curr.text;
            })

            if (!currListHash[person.attr('IDPerson')]) {
                currList.push({id:person.attr('IDPerson'), text:person.attr('display_name')})
            }
            
            this.dom.inputTags.select3('data', currList);

            ev.preventDefault();
        },


        // when they click on the [save] button
        '#fcf-activity-image-form-save click': function($el, ev) {

            this.formSubmit();

            ev.preventDefault();
        }



/*
 * Refactoring:
 *
 * break things down into logical UI actions:
 * listActivitiesLoad()
 * listActivitySelectOne()
 * 
 * listImagesLoad()
 * listImagesSelectOne()
 * 
 * formClear()
 * formLoad(opt)
 * formSubmit()
 * formPersonTagAdd()
 * formPersonTagRemoved()
 * 
 *
 * Attach DOM events to call these UI Actions:
 * '.fcf-activity-people-objects click':  -> formPersonTagAdd({ el: $el });  
 *
 *
 */ 


/*

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

*/
    });


});