export interface WebhookOptions {

    /**
     * Github secret used to validate requests
     */
    secret: string;

    /**
     * Events to listen to
     */
    events?: string[];
    /**
     * Branches to handle
     */
    branches?: string[];
    /**
     * Whether to only react to tagged (push) events
     */
    onlyTags?: boolean;
    /**
     * Ignore users matching this pattern
     */
    pusherIgnoreRegex?: RegExp;
    /**
     * Ignore commit messages matching this pattern
     */
    commitIgnoreRegex?: RegExp;

}

export const DEFAULT_OPTIONS: WebhookOptions = {
    secret: "changemepls",
    events: ["push"],
    branches: ["main", "master"],
    onlyTags: false,
    pusherIgnoreRegex: /\[bot\]/i,
    commitIgnoreRegex: /\[nopull\]/i
};
