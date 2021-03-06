define([
        'backbone',
        'backbone.validation',
        'jquery',
        'underscore',
        'js/models/course_model',
        'js/models/course_run_model',
        'js/models/pagination_model',
        'js/models/program_model',
        'js/views/course_run_view',
        'text!templates/course_details.underscore',
        'gettext',
        'js/utils/validation_config'
    ],
    function( Backbone, BackboneValidation, $, _, CourseModel, CourseRunModel,
              ProgramsModel, ProgramModel, CourseRunView, ListTpl ) {
        'use strict';

        return Backbone.View.extend({
            parentEl: '.js-course-list',

            className: 'course-details',

            events: {
                'click .js-remove-course': 'destroy',
                'click .js-select-course': 'setCourse',
                'click .js-add-course-run': 'addCourseRun'
            },

            tpl: _.template( ListTpl ),

            initialize: function( options ) {
                this.model = new CourseModel();
                Backbone.Validation.bind( this );
                this.$parentEl = $( this.parentEl );

                // For managing subViews
                this.courseRunViews = [];
                this.courseRuns = options.courseRuns;
                this.programModel = options.programModel;
                
                if ( options.courseData ) {
                    this.model.set(options.courseData);
                } else {
                    this.model.set({run_modes: []});
                }

                // Need a unique value for field ids so using model cid
                this.model.set({cid: this.model.cid});
                this.model.on('change:run_modes', this.updateRuns, this);
                this.render();
            },

            render: function() {
                this.$el.html( this.tpl( this.formatData() ) );
                this.$parentEl.append( this.$el );
                this.postRender();
            },

            postRender: function() {
                var runs = this.model.get('run_modes');
                if ( runs && runs.length > 0 ) {
                    this.addCourseRuns();
                }
            },

            addCourseRun: function(event) {
                var $runsContainer = this.$el.find('.js-course-runs'),
                    runModel = new CourseRunModel(),
                    runView;

                event.preventDefault();

                runModel.set({course_key: undefined});

                runView = new CourseRunView({
                    model: runModel,
                    courseModel: this.model,
                    courseRuns: this.courseRuns,
                    programStatus: this.programModel.get('status'),
                    $parentEl: $runsContainer
                });

                this.courseRunViews.push( runView );
            },

            addCourseRuns: function() {
                // Create run views
                var runs = this.model.get('run_modes'),
                    $runsContainer = this.$el.find('.js-course-runs');

                _.each( runs, function( run ) {
                    var runModel = new CourseRunModel(),
                        runView;

                    runModel.set(run);

                    runView = new CourseRunView({
                        model: runModel,
                        courseModel: this.model,
                        courseRuns: this.courseRuns,
                        programStatus: this.programModel.get('status'),
                        $parentEl: $runsContainer
                    });

                    this.courseRunViews.push( runView );

                    return runView;
                }.bind(this) );
            },

            addCourseToProgram: function() {
                var courseCodes = this.programModel.get('course_codes'),
                    courseData = this.model.toJSON();

                if ( this.programModel.isValid( true ) ) {
                    // We don't want to save the cid so omit it
                    courseCodes.push( _.omit(courseData, 'cid') );
                    this.programModel.patch({ course_codes: courseCodes });
                }
            },
            // Delete this view
            destroy: function() {
                Backbone.Validation.unbind(this);
                this.destroyChildren();
                this.undelegateEvents();
                this.removeCourseFromProgram();
                this.remove();
            },

            destroyChildren: function() {
                var runs = this.courseRunViews;

                _.each( runs, function( run ) {
                    run.removeRun();
                });
            },

            // Format data to be passed to the template
            formatData: function() {
                var data = $.extend( {}, 
                    { courseRuns: this.courseRuns.models },
                    _.omit( this.programModel.toJSON(), 'run_modes'),
                    this.model.toJSON()
                );

                return data;
            },

            removeCourseFromProgram: function() {
                var courseCodes = this.programModel.get('course_codes'),
                    key = this.model.get('key'),
                    name = this.model.get('display_name'),
                    update = [];

                update = _.reject( courseCodes, function(course) {
                    return course.key === key && course.display_name === name;
                });

                this.programModel.patch({ course_codes: update });
            },

            setCourse: function( event ) {
                var $form = this.$('.js-course-form'),
                    title = $form.find('.display-name').val(),
                    key = $form.find('.course-key').val();

                event.preventDefault();

                this.model.set({
                    display_name: title,
                    key: key,
                    organization: this.programModel.get('organizations')[0]
                });

                if ( this.model.isValid(true) ) {
                    this.addCourseToProgram();
                    this.updateDOM();
                    this.addCourseRuns();
                }
            },

            updateDOM: function() {
                this.$el.html( this.tpl( this.formatData()  ) );
            },

            /**
             * This is a stripped-down backport of the findIndex function
             * in underscorejs >= 1.8.0.
             *
             * When this app runs within Studio, underscore 1.4.4 is loaded (as
             * of this writing), so the underscore implementation is not available.
             *
             * TODO: use underscore's implementation instead, once Studio has been
             * updated to use a new-enough version, or the version conflict has
             * otherwise been resolved.
             */
            _findIndex: function(array, predicate) {
                var length = array.length;
                var index = 0;
                for (; index >= 0 && index < length; index += 1) {
                    if (predicate(array[index], index, array)) {
                        return index;
                    }
                }
            },

            updateRuns: function() {
                var courseCodes = this.programModel.get('course_codes'),
                    key = this.model.get('key'),
                    name = this.model.get('display_name'),
                    index;

                if ( this.programModel.isValid( true ) ) {
                    index = this._findIndex( courseCodes, function(course) {
                        return course.key === key && course.display_name === name;
                    });
                    courseCodes[index] = this.model.toJSON();

                    this.programModel.patch({ course_codes: courseCodes });
                }
            }
        });
    }
);
