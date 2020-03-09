export interface SocialMediaMessageEvent {
    id: string;
    text: string;

    replyToMessageId?: string;
    replyToUserId?: string;

    user: {
        id: string;
        name: string;
        location?: string;
    };
}