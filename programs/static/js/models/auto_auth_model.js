define([
        'backbone',
        'js/utils/auth_utils'
    ],
    function( Backbone, auth ) {
        'use strict';

        return Backbone.Model.extend(auth.autoSync);
    }
);
