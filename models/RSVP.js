var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * RSVPs Model
 * ===========
 */

var RSVP = new keystone.List('RSVP');

RSVP.add({
	meetup: { type: Types.Relationship, ref: 'Meetup', required: true, initial: true, index: true },
	who: { type: Types.Relationship, ref: 'User', required: true, initial: true, index: true },
	attending: { type: Types.Boolean, index: true },
	createdAt: { type: Date, noedit: true, collapse: true, default: Date.now },
	changedAt: { type: Date, noedit: true, collapse: true }
});


/**
 * Hooks
 * =====
 */

RSVP.schema.pre('save', function(next) {
	if (!this.isModified('changedAt')) {
		this.changedAt = Date.now();
	}
	next();
});

RSVP.schema.post('save', function() {
    console.log("--"+this.attending);
    var auxWho=this.who;
	keystone.list('Meetup').model.findById(this.meetup)
    .populate('group')
    .exec(function (err, meetup){
		if (meetup) {
            meetup.refreshRSVPs();
            keystone.list('Group').model.findOneAndUpdate(
                {key: meetup.group.key},
                {$push: {members: auxWho}},
                {safe: true, upsert: true},
                function(err, model) {
                    console.log(err);
                }
            );
        }
	});
});

RSVP.schema.post('remove', function() {
	keystone.list('Meetup').model.findById(this.meetup, function(err, meetup) {
		if (meetup) meetup.refreshRSVPs();
	});
})


/**
 * Registration
 * ============
 */

RSVP.defaultColumns = 'meetup, who, createdAt';
RSVP.defaultSort = '-createdAt';
RSVP.register();
