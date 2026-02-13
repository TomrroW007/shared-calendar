import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
    nickname: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    avatar_color: { type: String, default: '#666' },
    created_at: { type: Date, default: Date.now },

    // Push Notifications (Multiple devices)
    push_subscriptions: [{
        endpoint: String,
        keys: {
            p256dh: String,
            auth: String
        },
        ua: String, // User Agent for debugging
        created_at: { type: Date, default: Date.now }
    }],

    // External Calendars (Read-Only)
    ics_urls: [{
        url: { type: String, required: true },
        name: { type: String, default: 'External Calendar' },
        color: { type: String, default: '#333' },
        last_synced: { type: Date }
    }],

    // Daily Vibe / Status (Social)
    // Map: { "YYYY-MM-DD": { emoji: "🏃", text: "开始减肥" } }
    daily_statuses: {
        type: Map,
        of: new mongoose.Schema({
            emoji: String,
            text: String,
            updated_at: { type: Date, default: Date.now }
        }, { _id: false }),
        default: {}
    }
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Space Schema
const SpaceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    invite_code: { type: String },
    memo: { type: String, default: '' }, // 空间公告/长期备忘
    settings: {
        default_privacy: { type: String, enum: ['busy_only', 'details'], default: 'busy_only' },
        allow_guest_vote: { type: Boolean, default: true }
    },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now },
});

// sparse: true allows multiple null values without violating uniqueness
SpaceSchema.index({ invite_code: 1 }, { unique: true, sparse: true });

// Prevent infinite loop by forcing model recompilation in dev
// (Otherwise cached model without invite_code schema treats findOne({invite_code}) as findOne({}))
if (mongoose.models.Space) {
    delete mongoose.models.Space;
}

export const Space = mongoose.model('Space', SpaceSchema);

// Space Member Schema
const SpaceMemberSchema = new mongoose.Schema({
    space_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'editor', 'viewer', 'guest'], default: 'viewer' },
    joined_at: { type: Date, default: Date.now },
});
// Compound index to prevent duplicate membership
SpaceMemberSchema.index({ space_id: 1, user_id: 1 }, { unique: true });

if (mongoose.models.SpaceMember) {
    delete mongoose.models.SpaceMember;
}

export const SpaceMember = mongoose.model('SpaceMember', SpaceMemberSchema);

// Event Schema
const ParticipantSchema = new mongoose.Schema({
    userId: { type: String },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'tentative'], default: 'pending' },
    comment: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const EventSchema = new mongoose.Schema({
    space_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    start_date: { type: String, required: true }, // 冗余用于快速索引日期
    end_date: { type: String, required: true },
    start_at: { type: Date }, // 精确开始时间 (UTC)
    end_at: { type: Date },   // 精确结束时间 (UTC)
    is_all_day: { type: Boolean, default: true },
    status: { type: String, enum: ['busy', 'vacation', 'available', 'tentative'], required: true },
    note: { type: String, default: '' },
    location: { type: String, default: '' },
    visibility: { type: String, enum: ['public', 'private', 'status_only'], default: 'public' },
    recurrence_rule: { type: String, default: null }, // RRule 字符串
    timezone: { type: String, default: 'UTC' },
    participants: [ParticipantSchema],
    created_at: { type: Date, default: Date.now },
});

export const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

// Comment Schema
const CommentSchema = new mongoose.Schema({
    related_id: { type: String, required: true, index: true }, // Event ID or Proposal ID
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    attachments: [{ type: String }],
    created_at: { type: Date, default: Date.now },
});

export const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

// Notification Schema
const NotificationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    space_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Space' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    from_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    related_id: { type: String }, // Can be Event ID or Proposal ID
    read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
});

export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// Proposal Schema (StateMachine)
const VoteSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guest_name: { type: String }, // For guests
    vote: { type: String, enum: ['available', 'unavailable', 'if_need_be', 'maybe'], required: true },
    updated_at: { type: Date, default: Date.now }
}, { _id: false });

const ProposalSchema = new mongoose.Schema({
    space_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },

    // Status Machine: draft -> voting -> confirmed (end) / cancelled / expired
    status: { type: String, enum: ['draft', 'voting', 'confirmed', 'cancelled', 'expired'], default: 'voting' },

    // Candidates: Array of slots
    slots: [{
        start_date: { type: Date, required: true },
        end_date: { type: Date, required: true },
        votes: [VoteSchema]
    }],

    settings: {
        anonymous_voting: { type: Boolean, default: false },
        hide_results: { type: Boolean, default: false },
        allow_guests: { type: Boolean, default: true }
    },

    final_event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // Linked event when confirmed
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date } // Auto-expire?
});

if (mongoose.models.Proposal) {
    delete mongoose.models.Proposal;
}

export const Proposal = mongoose.model('Proposal', ProposalSchema);
