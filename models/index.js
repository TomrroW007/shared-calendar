import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
    nickname: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    avatar_color: { type: String, default: '#666' },
    created_at: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Space Schema
const SpaceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    invite_code: { type: String, unique: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now },
});

export const Space = mongoose.models.Space || mongoose.model('Space', SpaceSchema);

// Space Member Schema
const SpaceMemberSchema = new mongoose.Schema({
    space_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joined_at: { type: Date, default: Date.now },
});
// Compound index to prevent duplicate membership
SpaceMemberSchema.index({ space_id: 1, user_id: 1 }, { unique: true });

export const SpaceMember = mongoose.models.SpaceMember || mongoose.model('SpaceMember', SpaceMemberSchema);

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
    start_date: { type: String, required: true }, // Format: YYYY-MM-DD
    end_date: { type: String, required: true },
    status: { type: String, enum: ['busy', 'vacation', 'available', 'tentative'], required: true },
    note: { type: String, default: '' },
    visibility: { type: String, enum: ['public', 'private', 'status_only'], default: 'public' },
    participants: [ParticipantSchema],
    created_at: { type: Date, default: Date.now },
});

export const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

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

// Proposal Schema (Simplified)
const ProposalSchema = new mongoose.Schema({
    space_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    candidates: [{
        date: String,
        votes: [{
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            vote: { type: String, enum: ['available', 'unavailable', 'maybe'] }
        }]
    }],
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, default: 'active' }, // active, confirmed, cancelled
    final_date: { type: String },
    created_at: { type: Date, default: Date.now },
});

export const Proposal = mongoose.models.Proposal || mongoose.model('Proposal', ProposalSchema);
